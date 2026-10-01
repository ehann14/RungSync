<?php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class ScheduleImportService
{
    private const KOLOM = [
        'hari' => 'Hari', 'mulai' => 'Jam Mulai', 'selesai' => 'Jam Selesai',
        'kelas' => 'Kelas', 'mapel' => 'Mata Pelajaran', 'nip' => 'NIP Guru', 'ruangan' => 'Ruangan',
    ];

    // Urutan kolom di template. Keduanya masuk ke tabel schedules dengan logika yang sama.
    private const URUTAN = [
        'class'   => ['hari', 'mulai', 'selesai', 'kelas', 'mapel', 'nip', 'ruangan'],
        'teacher' => ['hari', 'mulai', 'selesai', 'nip', 'mapel', 'kelas', 'ruangan'],
    ];

    /* ===================== TEMPLATE ===================== */

    public function buatTemplate(string $tipe): Spreadsheet
    {
        $urutan = self::URUTAN[$tipe];
        $kelas = SchoolClass::orderBy('name')->pluck('name')->all();
        $mapel = Subject::orderBy('name')->pluck('name')->all();
        $ruang = Room::orderBy('name')->pluck('name')->all();
        $guru  = Teacher::with(['user', 'subjects'])->whereNotNull('nip')->get()
            ->sortBy(fn ($t) => $t->user?->name)->values();

        $xl = new Spreadsheet();
        $ws = $xl->getActiveSheet();
        $ws->setTitle('Jadwal');

        ExcelKit::lembarPetunjuk($xl, $this->petunjuk($tipe));
        $ref = ExcelKit::lembarReferensi($xl, [
            'Kelas'          => $kelas,
            'Mata Pelajaran' => $mapel,
            'Ruangan'        => $ruang,
        ]);

        // Halaman khusus daftar NIP guru (sheet ke-4)
        $rumusNip = $this->lembarNipGuru($xl, $guru);

        ExcelKit::header($ws, array_map(fn ($k) => self::KOLOM[$k], $urutan));
        $huruf = fn (string $k) => Coordinate::stringFromColumnIndex(array_search($k, $urutan) + 1);

        ExcelKit::kolomTeks($ws, [$huruf('mulai'), $huruf('selesai'), $huruf('nip')]);
        ExcelKit::dropdown($ws, $huruf('hari'), '"' . implode(',', ScheduleService::DAYS) . '"');
        foreach (['kelas' => 'Kelas', 'mapel' => 'Mata Pelajaran', 'ruangan' => 'Ruangan'] as $k => $judul) {
            if (isset($ref[$judul])) ExcelKit::dropdown($ws, $huruf($k), $ref[$judul]);
        }
        if ($rumusNip) ExcelKit::dropdown($ws, $huruf('nip'), $rumusNip);

        // Baris contoh (abu-abu) dari data master. HAPUS sebelum import.
        if ($kelas && $mapel && $ruang && $guru->isNotEmpty()) {
            foreach ([['07:00', '08:30'], ['08:30', '10:00']] as $i => [$m, $s]) {
                $nilai = ['hari' => 'Senin', 'mulai' => $m, 'selesai' => $s, 'kelas' => $kelas[0],
                          'mapel' => $mapel[0], 'nip' => $guru[0]->nip, 'ruangan' => $ruang[0]];
                ExcelKit::tulisBaris($ws, $i + 2, array_map(fn ($k) => $nilai[$k], $urutan));
            }
            $ws->getStyle('A2:G3')->getFont()->setItalic(true)->getColor()->setRGB('94A3B8');
        }

        return $xl;
    }

    /** Sheet "NIP Guru": NIP (teks), nama, dan mapel. Mengembalikan rumus rentang NIP untuk dropdown. */
    private function lembarNipGuru(Spreadsheet $xl, $guru): ?string
    {
        $ws = $xl->createSheet();
        $ws->setTitle('NIP Guru');

        ExcelKit::header($ws, ['NIP Guru', 'Nama Guru', 'Mata Pelajaran']);
        ExcelKit::kolomTeks($ws, ['A'], max(500, $guru->count() + 1));

        foreach ($guru as $i => $t) {
            ExcelKit::tulisBaris($ws, $i + 2, [
                $t->nip,
                $t->user?->name,
                $t->subjects->pluck('name')->implode(', '),
            ]);
        }

        return $guru->isEmpty() ? null : "'NIP Guru'!\$A\$2:\$A\$" . ($guru->count() + 1);
    }

    private function petunjuk(string $tipe): array
    {
        $judul = $tipe === 'class' ? 'Petunjuk Template Jadwal Kelas' : 'Petunjuk Template Jadwal Guru';
        return [
            $judul,
            '1. Isi data mulai baris 2 pada sheet "Jadwal". Baris abu-abu adalah CONTOH, hapus sebelum import.',
            '2. Hari harus salah satu dari: ' . implode(', ', ScheduleService::DAYS) . '.',
            '3. Jam Mulai dan Jam Selesai memakai format HH:MM (24 jam), contoh 07:00 atau 13:30. Jam selesai harus setelah jam mulai.',
            '4. Kelas, Mata Pelajaran, dan Ruangan harus sama persis dengan data master (huruf besar/kecil dan spasi berlebih diabaikan). Gunakan dropdown.',
            '5. NIP Guru harus NIP yang terdaftar (lihat sheet "NIP Guru", atau pilih dari dropdown). Kolom NIP berformat teks, jangan diubah jadi angka.',
            '6. Jadwal akan disimpan ke periode ajaran yang sedang AKTIF.',
            '7. Baris yang bentrok (ruangan, guru, atau kelas) dengan jadwal yang sudah ada atau dengan baris lain di file ini akan ditolak.',
            '8. Setelah upload, klik "Cek Data". Tidak ada data yang tersimpan sebelum Anda menekan "Simpan".',
            '9. Format .xlsx, maksimal 2 MB dan 2000 baris data.',
        ];
    }

    /* ===================== ANALISIS (dry-run) ===================== */

    public function analisis(UploadedFile $file, string $tipe): array
    {
        $data = ExcelKit::baca($file, 'Jadwal', self::KOLOM, array_keys(self::KOLOM));
        if (!$data) ExcelKit::tolak('File tidak berisi data jadwal.');

        $kelas = SchoolClass::all()->keyBy(fn ($m) => ExcelKit::norm($m->name));
        $mapel = Subject::all()->keyBy(fn ($m) => ExcelKit::norm($m->name));
        $ruang = Room::all()->keyBy(fn ($m) => ExcelKit::norm($m->name));
        $guru  = Teacher::with('user')->whereNotNull('nip')->get()
            ->groupBy(fn ($t) => ExcelKit::norm($t->nip));

        $valid = [];
        $error = [];
        $diterima = []; // baris tanpa error, dipakai untuk cek bentrok antar baris

        foreach ($data as $no => $r) {
            $e = [];
            $tambah = function (string $kolom, string $pesan) use (&$e) {
                $e[] = ['kolom' => $kolom, 'pesan' => $pesan];
            };

            $hari = collect(ScheduleService::DAYS)
                ->first(fn ($h) => ExcelKit::norm($h) === ExcelKit::norm(ExcelKit::teks($r['hari'])));
            if (!$hari) $tambah('Hari', 'Hari harus Senin sampai Sabtu.');

            $mulai = ExcelKit::jam($r['mulai']);
            $selesai = ExcelKit::jam($r['selesai']);
            if (!$mulai) $tambah('Jam Mulai', 'Format jam harus HH:MM, contoh 07:00.');
            if (!$selesai) $tambah('Jam Selesai', 'Format jam harus HH:MM, contoh 08:30.');
            if ($mulai && $selesai && $mulai >= $selesai) $tambah('Jam Selesai', 'Jam selesai harus setelah jam mulai.');

            $k = $kelas->get(ExcelKit::norm(ExcelKit::teks($r['kelas'])));
            if (!$k) $tambah('Kelas', 'Kelas "' . ExcelKit::teks($r['kelas']) . '" tidak ditemukan.');
            $m = $mapel->get(ExcelKit::norm(ExcelKit::teks($r['mapel'])));
            if (!$m) $tambah('Mata Pelajaran', 'Mata pelajaran "' . ExcelKit::teks($r['mapel']) . '" tidak ditemukan.');
            $ru = $ruang->get(ExcelKit::norm(ExcelKit::teks($r['ruangan'])));
            if (!$ru) $tambah('Ruangan', 'Ruangan "' . ExcelKit::teks($r['ruangan']) . '" tidak ditemukan.');

            $nip = ExcelKit::teks($r['nip']);
            $g = null;
            if ($nip === '') {
                $tambah('NIP Guru', 'NIP guru wajib diisi.');
            } else {
                $kand = $guru->get(ExcelKit::norm($nip));
                if (!$kand) $tambah('NIP Guru', 'NIP "' . $nip . '" tidak ditemukan di data guru.');
                elseif ($kand->count() > 1) $tambah('NIP Guru', 'NIP "' . $nip . '" dipakai lebih dari satu guru.');
                else $g = $kand->first();
            }

            // Bentrok dengan jadwal yang sudah tersimpan
            if (!$e) {
                $msgs = ScheduleService::conflictMessages([
                    'day' => $hari, 'start' => $mulai . ':00', 'end' => $selesai . ':00',
                    'room_id' => $ru->id, 'teacher_id' => $g->id, 'class_id' => $k->id,
                ]);
                foreach ($msgs as $msg) {
                    $tambah(self::kolomBentrok($msg), $msg . ' (bentrok dengan jadwal tersimpan)');
                }
            }

            // Bentrok antar baris di dalam file
            if (!$e) {
                foreach ($diterima as $p) {
                    if ($p['hari'] !== $hari || !($mulai < $p['selesai'] && $selesai > $p['mulai'])) continue;
                    if ($p['room_id'] === $ru->id) $tambah('Ruangan', "Ruangan bentrok dengan baris {$p['baris']} di file ini.");
                    if ($p['teacher_id'] === $g->id) $tambah('NIP Guru', "Guru bentrok dengan baris {$p['baris']} di file ini.");
                    if ($p['class_id'] === $k->id) $tambah('Kelas', "Kelas bentrok dengan baris {$p['baris']} di file ini.");
                }
            }

            if ($e) {
                $error[] = ['baris' => $no, 'pesan' => $e];
                continue;
            }

            $item = [
                'baris' => $no, 'hari' => $hari, 'mulai' => $mulai, 'selesai' => $selesai,
                'class_id' => $k->id, 'subject_id' => $m->id, 'teacher_id' => $g->id, 'room_id' => $ru->id,
                'kelas' => $k->name, 'mapel' => $m->name, 'guru' => $g->user?->name, 'nip' => $g->nip, 'ruangan' => $ru->name,
            ];
            $diterima[] = $item;
            $valid[] = $item;
        }

        return [
            'total' => count($data), 'jumlah_valid' => count($valid), 'jumlah_error' => count($error),
            'valid' => $valid, 'error' => $error,
        ];
    }

    private static function kolomBentrok(string $msg): string
    {
        return str_contains($msg, 'Ruangan') ? 'Ruangan' : (str_contains($msg, 'Guru') ? 'NIP Guru' : 'Kelas');
    }

    /* ===================== SIMPAN ===================== */

    public function simpan(UploadedFile $file, string $tipe, string $mode): array
    {
        $periode = AcademicPeriod::active();
        if (!$periode) {
            ExcelKit::tolak('Belum ada periode ajaran aktif. Buat dan aktifkan periode terlebih dahulu.');
        }

        $hasil = $this->analisis($file, $tipe);

        if ($mode === 'all_valid' && $hasil['jumlah_error'] > 0) {
            ExcelKit::tolak('Masih ada ' . $hasil['jumlah_error'] . ' baris error. Perbaiki file atau pilih "Simpan hanya baris valid".');
        }
        if ($hasil['jumlah_valid'] === 0) {
            ExcelKit::tolak('Tidak ada baris valid untuk disimpan.');
        }

        DB::transaction(function () use ($hasil, $periode) {
            foreach ($hasil['valid'] as $v) {
                // Cek ulang di dalam transaksi (menangkap perubahan di antara pratinjau dan simpan)
                $msgs = ScheduleService::conflictMessages([
                    'day' => $v['hari'], 'start' => $v['mulai'] . ':00', 'end' => $v['selesai'] . ':00',
                    'room_id' => $v['room_id'], 'teacher_id' => $v['teacher_id'], 'class_id' => $v['class_id'],
                ]);
                if ($msgs) throw new \RuntimeException("Baris {$v['baris']}: " . implode(' ', $msgs));

                $s = Schedule::create([
                    'class_id' => $v['class_id'], 'subject_id' => $v['subject_id'],
                    'teacher_id' => $v['teacher_id'], 'room_id' => $v['room_id'],
                    'day' => $v['hari'], 'start_time' => $v['mulai'] . ':00', 'end_time' => $v['selesai'] . ':00',
                    'academic_period_id' => $periode->id,
                ]);
                AuditLogService::log('created', 'Schedule', $s->id);
            }
        });

        return [
            'message' => $hasil['jumlah_valid'] . ' jadwal berhasil diimport'
                . ($hasil['jumlah_error'] ? ' (' . $hasil['jumlah_error'] . ' baris error dilewati).' : '.'),
            'disimpan' => $hasil['jumlah_valid'], 'dilewati' => $hasil['jumlah_error'],
        ];
    }
}