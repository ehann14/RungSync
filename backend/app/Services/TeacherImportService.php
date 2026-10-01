<?php

namespace App\Services;

use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class TeacherImportService
{
    private const KOLOM = [
        'nama' => 'Nama', 'email' => 'Email', 'nip' => 'NIP',
        'mapel1' => 'Mata Pelajaran 1', 'mapel2' => 'Mata Pelajaran 2', 'mapel3' => 'Mata Pelajaran 3',
        'password' => 'Password (opsional)',
    ];
    private const PASSWORD_DEFAULT = 'guru12345';

    /** Port dari generateEmailFromName di Teachers.jsx. */
    public static function emailDariNama(string $nama): string
    {
        $kata = preg_split('/\s+/', trim($nama), -1, PREG_SPLIT_NO_EMPTY);
        $depan = ['dr.', 'dr', 'prof.', 'prof', 'ir.', 'ir', 'h.', 'h', 'hj.', 'hj', 'sdr.', 'sdri.', 'drg.', 'drg'];
        $belakang = ['s.pd', 's.pd.', 'm.pd', 'm.pd.', 's.kom', 's.kom.', 'm.kom', 'm.kom.', 's.t', 's.t.',
                     'm.t', 'm.t.', 's.e', 's.e.', 'm.m', 'm.m.', 'dr.', 'ph.d', 'ph.d.'];
        while ($kata && in_array(mb_strtolower($kata[0]), $depan, true)) array_shift($kata);
        while ($kata && in_array(mb_strtolower(end($kata)), $belakang, true)) array_pop($kata);

        $lokal = collect(array_slice($kata, 0, 2))
            ->map(fn ($k) => preg_replace('/[^a-zA-Z0-9]/', '', $k))->implode('');

        return $lokal === '' ? '' : mb_strtolower($lokal) . '@rungsync.sch.id';
    }

    /** Nilai role guru yang benar-benar ada di enum database ('guru' atau 'teacher'). */
    private static function peranGuru(): string
    {
        static $peran = null;
        if ($peran) return $peran;
        try {
            $tipe = strtolower(DB::selectOne("SHOW COLUMNS FROM users LIKE 'role'")->Type ?? '');
        } catch (\Throwable $e) {
            $tipe = '';
        }
        return $peran = (str_contains($tipe, "'teacher'") && !str_contains($tipe, "'guru'")) ? 'teacher' : 'guru';
    }

    /* ===================== TEMPLATE & EKSPOR ===================== */

    public function buatTemplate(): Spreadsheet
    {
        $mapel = Subject::orderBy('name')->pluck('name')->all();

        $xl = new Spreadsheet();
        $ws = $xl->getActiveSheet();
        $ws->setTitle('Guru');

        ExcelKit::lembarPetunjuk($xl, [
            'Petunjuk Template Guru',
            '1. Isi data mulai baris 2 pada sheet "Guru". Baris abu-abu bertanda "(contoh)" akan diabaikan saat import.',
            '2. Nama wajib diisi. Email boleh kosong: akan dibuat otomatis dari nama (dua kata pertama + @rungsync.sch.id).',
            '3. NIP berformat teks (angka panjang tidak berubah). NIP tidak boleh sama dengan guru lain.',
            '4. Mata Pelajaran 1-3: maksimal 3, pilih dari dropdown (daftar ada di sheet "Referensi"). Mapel pertama menjadi mapel utama.',
            '5. Password boleh kosong. Guru baru dengan password kosong memakai "' . self::PASSWORD_DEFAULT . '".',
            '6. UPSERT: jika NIP atau email sudah ada, data guru tersebut DIPERBARUI (tidak dibuat ganda).',
            '7. Pada guru yang diperbarui, sel kosong = tidak diubah (email, NIP, mapel, password). Nama selalu wajib.',
            '8. Setelah upload klik "Cek Data". Tidak ada data yang tersimpan sebelum Anda menekan "Simpan".',
            '9. Format .xlsx, maksimal 2 MB dan 2000 baris data.',
        ]);
        $ref = ExcelKit::lembarReferensi($xl, ['Mata Pelajaran' => $mapel]);

        ExcelKit::header($ws, array_values(self::KOLOM));
        ExcelKit::kolomTeks($ws, ['B', 'C', 'G']);
        if (isset($ref['Mata Pelajaran'])) {
            foreach (['D', 'E', 'F'] as $h) ExcelKit::dropdown($ws, $h, $ref['Mata Pelajaran']);
        }
        ExcelKit::tulisBaris($ws, 2, ['(contoh) Budi Santoso', '', '198501012010011001', $mapel[0] ?? '', $mapel[1] ?? '', '', '']);
        ExcelKit::tulisBaris($ws, 3, ['(contoh) Siti Aminah, S.Pd', 'sitiaminah@rungsync.sch.id', '', $mapel[0] ?? '', '', '', 'password123']);
        $ws->getStyle('A2:G3')->getFont()->setItalic(true)->getColor()->setRGB('94A3B8');

        return $xl;
    }

    /** Ekspor: format sama dengan template (tanpa kolom password), siap diimport lagi. */
    public function buatEkspor(): Spreadsheet
    {
        $guru = Teacher::with(['user', 'subject', 'subjects'])->get()
            ->sortBy(fn ($t) => mb_strtolower($t->user?->name ?? ''))->values();

        $xl = new Spreadsheet();
        $ws = $xl->getActiveSheet();
        $ws->setTitle('Guru');
        ExcelKit::header($ws, array_slice(array_values(self::KOLOM), 0, 6));
        ExcelKit::kolomTeks($ws, ['B', 'C', 'D', 'E', 'F'], max(500, $guru->count() + 1));

        foreach ($guru as $i => $t) {
            $mapel = $t->subjects->sortBy(fn ($s) => $s->id === $t->subject_id ? 0 : 1)
                ->pluck('name')->values()->all();
            if (!$mapel && $t->subject) $mapel = [$t->subject->name];

            ExcelKit::tulisBaris($ws, $i + 2, [
                $t->user?->name, $t->user?->email, $t->nip,
                $mapel[0] ?? '', $mapel[1] ?? '', $mapel[2] ?? '',
            ]);
        }
        return $xl;
    }

    /* ===================== ANALISIS (dry-run) ===================== */

    public function analisis(UploadedFile $file): array
    {
        $data = ExcelKit::baca($file, 'Guru', self::KOLOM, ['nama', 'email', 'nip', 'mapel1']);
        $data = array_filter($data, fn ($r) => !str_starts_with(ExcelKit::norm(ExcelKit::teks($r['nama'])), '(contoh)'));
        if (!$data) ExcelKit::tolak('File tidak berisi data guru.');

        $mapel   = Subject::all()->keyBy(fn ($m) => ExcelKit::norm($m->name));
        $guru    = Teacher::with(['user', 'subjects'])->get();
        $perNip  = $guru->filter(fn ($t) => filled($t->nip))->groupBy(fn ($t) => ExcelKit::norm($t->nip));
        $perUser = $guru->keyBy('user_id');
        $akun    = User::all(['id', 'email'])->keyBy(fn ($u) => ExcelKit::norm($u->email));

        $valid = [];
        $error = [];
        $nipFile = $emailFile = $targetFile = [];

        foreach ($data as $no => $r) {
            $e = [];
            $tambah = function (string $kolom, string $pesan) use (&$e) {
                $e[] = ['kolom' => $kolom, 'pesan' => $pesan];
            };

            $nama = ExcelKit::teks($r['nama']);
            $nip  = ExcelKit::teks($r['nip']);
            $pw   = ExcelKit::teks($r['password']);
            if ($nama === '') $tambah('Nama', 'Nama wajib diisi.');
            elseif (mb_strlen($nama) > 255) $tambah('Nama', 'Nama maksimal 255 karakter.');
            if (mb_strlen($nip) > 50) $tambah('NIP', 'NIP maksimal 50 karakter.');
            if ($pw !== '' && mb_strlen($pw) < 8) $tambah('Password (opsional)', 'Password minimal 8 karakter.');

            // Cocokkan guru lama berdasarkan NIP
            $cocokNip = null;
            if ($nip !== '') {
                $kand = $perNip->get(ExcelKit::norm($nip));
                if ($kand && $kand->count() > 1) $tambah('NIP', 'NIP ini dipakai lebih dari satu guru di database.');
                else $cocokNip = $kand?->first();
            }

            // Email: isi manual, pakai email lama (update via NIP), atau generate
            $email = mb_strtolower(ExcelKit::teks($r['email']));
            $otomatis = false;
            if ($email === '') {
                if ($cocokNip) {
                    $email = mb_strtolower($cocokNip->user->email);
                } elseif ($nama !== '') {
                    $email = self::emailDariNama($nama);
                    $otomatis = true;
                    if ($email === '') $tambah('Email', 'Email tidak bisa dibuat otomatis dari nama. Isi kolom Email.');
                }
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
                $tambah('Email', 'Format email tidak valid.');
                $email = '';
            }

            $cocokEmail = null;
            if ($email !== '' && ($u = $akun->get(ExcelKit::norm($email)))) {
                $cocokEmail = $perUser->get($u->id);
                if (!$cocokEmail) {
                    $tambah('Email', 'Email sudah dipakai akun lain yang bukan guru.');
                } elseif ($otomatis) {
                    // Email hasil generate tidak boleh menimpa guru lain secara diam-diam
                    $tambah('Email', "Email otomatis \"{$email}\" sudah dipakai guru lain. Isi kolom Email secara manual.");
                    $cocokEmail = null;
                }
            }
            if ($cocokNip && $cocokEmail && $cocokNip->id !== $cocokEmail->id) {
                $tambah('NIP', "NIP milik {$cocokNip->user->name}, tetapi email milik {$cocokEmail->user->name}. Samakan datanya.");
            }
            $target = $cocokNip ?? $cocokEmail;

            // Duplikat di dalam file
            if ($nip !== '' && isset($nipFile[ExcelKit::norm($nip)])) {
                $tambah('NIP', 'NIP sama dengan baris ' . $nipFile[ExcelKit::norm($nip)] . ' di file ini.');
            }
            if ($email !== '' && isset($emailFile[ExcelKit::norm($email)])) {
                $tambah('Email', 'Email sama dengan baris ' . $emailFile[ExcelKit::norm($email)] . ' di file ini.'
                    . ($otomatis ? ' Isi kolom Email secara manual.' : ''));
            }
            if ($target && isset($targetFile[$target->id])) {
                $tambah('NIP', 'Guru yang sama sudah muncul di baris ' . $targetFile[$target->id] . '.');
            }

            // Mata pelajaran (maksimal 3 kolom, harus ada di tabel subjects)
            $idMapel = $namaMapel = [];
            foreach (['mapel1', 'mapel2', 'mapel3'] as $kunci) {
                $v = ExcelKit::teks($r[$kunci]);
                if ($v === '') continue;
                $m = $mapel->get(ExcelKit::norm($v));
                if (!$m) $tambah(self::KOLOM[$kunci], "Mata pelajaran \"{$v}\" tidak ditemukan.");
                elseif (!in_array($m->id, $idMapel, true)) { $idMapel[] = $m->id; $namaMapel[] = $m->name; }
            }

            if ($e) {
                $error[] = ['baris' => $no, 'pesan' => $e];
                continue;
            }

            if ($nip !== '') $nipFile[ExcelKit::norm($nip)] = $no;
            $emailFile[ExcelKit::norm($email)] = $no;
            if ($target) $targetFile[$target->id] = $no;

            $mapelTetap = $target && !$idMapel;
            $valid[] = [
                'baris' => $no, 'status' => $target ? 'update' : 'baru', 'target_id' => $target?->id,
                'nama' => $nama, 'email' => $email, 'nip' => $nip !== '' ? $nip : ($target->nip ?? ''),
                'mapel_id' => $idMapel,
                'mapel' => $mapelTetap ? $target->subjects->pluck('name')->all() : $namaMapel,
                'mapel_tetap' => $mapelTetap, 'password' => $pw, 'ganti_password' => $pw !== '',
            ];
        }

        return [
            'total' => count($data), 'jumlah_valid' => count($valid), 'jumlah_error' => count($error),
            'valid' => $valid, 'error' => $error,
        ];
    }

    /** Versi aman untuk dikirim ke frontend (tanpa password). */
    public function untukPratinjau(array $hasil): array
    {
        $hasil['valid'] = array_map(fn ($v) => array_diff_key($v, ['password' => 1]), $hasil['valid']);
        return $hasil;
    }

    /* ===================== SIMPAN ===================== */

    public function simpan(UploadedFile $file, string $mode): array
    {
        $hasil = $this->analisis($file);

        if ($mode === 'all_valid' && $hasil['jumlah_error'] > 0) {
            ExcelKit::tolak('Masih ada ' . $hasil['jumlah_error'] . ' baris error. Perbaiki file atau pilih "Simpan hanya baris valid".');
        }
        if ($hasil['jumlah_valid'] === 0) ExcelKit::tolak('Tidak ada baris valid untuk disimpan.');

        $baru = $diperbarui = 0;

        DB::transaction(function () use ($hasil, &$baru, &$diperbarui) {
            foreach ($hasil['valid'] as $v) {
                if ($v['status'] === 'baru') {
                    $user = User::create([
                        'name' => $v['nama'], 'email' => $v['email'],
                        'password' => Hash::make($v['password'] !== '' ? $v['password'] : self::PASSWORD_DEFAULT),
                        'role' => self::peranGuru(),
                    ]);
                    $guru = Teacher::create([
                        'user_id' => $user->id, 'nip' => $v['nip'] !== '' ? $v['nip'] : null,
                        'subject_id' => $v['mapel_id'][0] ?? null,
                    ]);
                    $guru->subjects()->sync($v['mapel_id']);
                    AuditLogService::log('created', 'Teacher', $guru->id);
                    $baru++;
                    continue;
                }

                $guru = Teacher::with('user')->findOrFail($v['target_id']);
                $sebelum = ['name' => $guru->user->name, 'email' => $guru->user->email,
                            'nip' => $guru->nip, 'subject_id' => $guru->subject_id];

                $guru->user->name = $v['nama'];
                $guru->user->email = $v['email'];
                if ($v['password'] !== '') $guru->user->password = Hash::make($v['password']);
                $guru->user->save();

                if ($v['nip'] !== '') $guru->nip = $v['nip'];
                if ($v['mapel_id']) {
                    $guru->subject_id = $v['mapel_id'][0];
                    $guru->subjects()->sync($v['mapel_id']);
                }
                $guru->save();

                $sesudah = ['name' => $guru->user->name, 'email' => $guru->user->email,
                            'nip' => $guru->nip, 'subject_id' => $guru->subject_id];
                $perubahan = [];
                foreach ($sebelum as $kunci => $nilai) {
                    if ((string) $nilai !== (string) $sesudah[$kunci]) {
                        $perubahan[$kunci] = ['old' => $nilai, 'new' => $sesudah[$kunci]];
                    }
                }
                if ($perubahan) AuditLogService::log('updated', 'Teacher', $guru->id, $perubahan);
                $diperbarui++;
            }
        });

        return [
            'message' => "{$baru} guru baru ditambahkan, {$diperbarui} guru diperbarui."
                . ($hasil['jumlah_error'] ? " {$hasil['jumlah_error']} baris error dilewati." : ''),
            'baru' => $baru, 'diperbarui' => $diperbarui, 'dilewati' => $hasil['jumlah_error'],
        ];
    }
}