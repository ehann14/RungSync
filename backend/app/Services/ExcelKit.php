<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/** Helper bersama untuk template, ekspor, dan pembacaan file Excel. */
class ExcelKit
{
    public const MAKS_BARIS = 2000;

    /** Normalisasi untuk pencocokan nama: trim, rapikan spasi, huruf kecil. */
    public static function norm($s): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', (string) $s)));
    }

    /** Nilai sel -> teks. Angka panjang (NIP) tidak jadi notasi ilmiah. */
    public static function teks($v): string
    {
        if ($v === null) return '';
        if (is_bool($v)) return $v ? '1' : '0';
        if (is_int($v) || is_float($v)) {
            return $v == floor($v)
                ? number_format($v, 0, '', '')
                : rtrim(rtrim(number_format($v, 6, '.', ''), '0'), '.');
        }
        return trim((string) $v);
    }

    /** Nilai sel -> "HH:MM" atau null. Menerima teks "07:00", "7.00", atau pecahan hari Excel. */
    public static function jam($v): ?string
    {
        if (is_int($v) || is_float($v)) {
            if ($v < 0 || $v >= 1) return null;
            $m = (int) round($v * 1440);
            return sprintf('%02d:%02d', intdiv($m, 60) % 24, $m % 60);
        }
        $s = str_replace('.', ':', trim((string) $v));
        if (!preg_match('/^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/', $s, $m)) return null;
        return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
    }

    public static function tolak(string $pesan): never
    {
        response()->json(['message' => $pesan], 422)->throwResponse();
    }

    /** Tulis satu baris sebagai TEKS (mencegah rumus/notasi ilmiah). */
    public static function tulisBaris(Worksheet $ws, int $baris, array $nilai): void
    {
        foreach (array_values($nilai) as $i => $v) {
            $ws->setCellValueExplicit(
                Coordinate::stringFromColumnIndex($i + 1) . $baris,
                (string) ($v ?? ''),
                DataType::TYPE_STRING
            );
        }
    }

    public static function header(Worksheet $ws, array $judul): void
    {
        self::tulisBaris($ws, 1, $judul);
        $akhir = Coordinate::stringFromColumnIndex(count($judul));
        $ws->getStyle("A1:{$akhir}1")->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
        ]);
        for ($i = 1; $i <= count($judul); $i++) {
            $ws->getColumnDimensionByColumn($i)->setAutoSize(true);
        }
        $ws->freezePane('A2');
    }

    /** Format kolom = teks, supaya "07:00" dan NIP panjang tidak diubah Excel. */
    public static function kolomTeks(Worksheet $ws, array $huruf, int $sampai = 500): void
    {
        foreach ($huruf as $h) {
            $ws->getStyle("{$h}1:{$h}{$sampai}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
        }
    }

    /** Dropdown. $rumus: '"A,B,C"' untuk daftar tetap, atau 'Referensi!$A$2:$A$9' untuk rentang. */
    public static function dropdown(Worksheet $ws, string $kolom, string $rumus, int $dari = 2, int $sampai = 500): void
    {
        for ($r = $dari; $r <= $sampai; $r++) {
            $ws->getCell("{$kolom}{$r}")->getDataValidation()
                ->setType(DataValidation::TYPE_LIST)
                ->setErrorStyle(DataValidation::STYLE_STOP)
                ->setAllowBlank(true)
                ->setShowDropDown(false) // false = panah dropdown tampil
                ->setShowErrorMessage(true)
                ->setErrorTitle('Nilai tidak valid')
                ->setError('Pilih salah satu nilai dari daftar.')
                ->setFormula1($rumus);
        }
    }

    public static function lembarPetunjuk(Spreadsheet $xl, array $baris): void
    {
        $ws = $xl->createSheet();
        $ws->setTitle('Petunjuk');
        foreach ($baris as $i => $b) {
            $ws->setCellValueExplicit('A' . ($i + 1), $b, DataType::TYPE_STRING);
        }
        $ws->getColumnDimension('A')->setWidth(110);
        $ws->getStyle('A1:A' . count($baris))->getAlignment()->setWrapText(true);
        $ws->getStyle('A1')->getFont()->setBold(true)->setSize(14);
    }

    /** Lembar "Referensi". Mengembalikan peta judul => rentang rumus untuk dropdown. */
    public static function lembarReferensi(Spreadsheet $xl, array $kolom): array
    {
        $ws = $xl->createSheet();
        $ws->setTitle('Referensi');
        $peta = [];
        $i = 1;
        foreach ($kolom as $judul => $daftar) {
            $h = Coordinate::stringFromColumnIndex($i);
            $ws->setCellValueExplicit($h . '1', $judul, DataType::TYPE_STRING);
            $ws->getStyle($h . '1')->getFont()->setBold(true);
            foreach (array_values($daftar) as $j => $v) {
                $ws->setCellValueExplicit($h . ($j + 2), (string) $v, DataType::TYPE_STRING);
            }
            $ws->getColumnDimension($h)->setAutoSize(true);
            if ($daftar) {
                $peta[$judul] = 'Referensi!$' . $h . '$2:$' . $h . '$' . (count($daftar) + 1);
            }
            $i++;
        }
        return $peta;
    }

    public static function unduh(Spreadsheet $xl, string $namaFile)
    {
        $xl->setActiveSheetIndex(0);
        return response()->streamDownload(function () use ($xl) {
            IOFactory::createWriter($xl, 'Xlsx')->save('php://output');
        }, $namaFile, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Baca sheet jadi [nomorBarisExcel => [kunci => nilaiMentah]].
     * Kolom dicari lewat judul di baris 1 (urutan kolom bebas).
     * $kolom = [kunci => label], $wajib = daftar kunci yang harus ada.
     */
    public static function baca(UploadedFile $file, string $namaSheet, array $kolom, array $wajib): array
    {
        if (strtolower($file->getClientOriginalExtension()) !== 'xlsx') {
            self::tolak('File harus berformat .xlsx.');
        }

        try {
            $reader = IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);
            $xl = $reader->load($file->getRealPath());
        } catch (\Throwable $e) {
            self::tolak('File tidak bisa dibaca. Pastikan file .xlsx valid dan tidak rusak.');
        }

        $ws = $xl->getSheetByName($namaSheet) ?? $xl->getSheet(0);
        $barisMaks = $ws->getHighestDataRow();
        if ($barisMaks - 1 > self::MAKS_BARIS) {
            self::tolak('Maksimal ' . self::MAKS_BARIS . ' baris data per file.');
        }
        $kolomMaks = Coordinate::columnIndexFromString($ws->getHighestDataColumn());

        $peta = [];
        foreach ($kolom as $kunci => $label) $peta[self::norm($label)] = $kunci;

        $indeks = [];
        for ($c = 1; $c <= $kolomMaks; $c++) {
            $judul = self::norm(self::teks($ws->getCell(Coordinate::stringFromColumnIndex($c) . '1')->getValue()));
            if (isset($peta[$judul]) && !isset($indeks[$peta[$judul]])) $indeks[$peta[$judul]] = $c;
        }

        $hilang = array_map(fn ($k) => $kolom[$k], array_diff($wajib, array_keys($indeks)));
        if ($hilang) {
            self::tolak('Kolom wajib tidak ditemukan di baris pertama: ' . implode(', ', $hilang)
                . '. Gunakan template dari aplikasi.');
        }

        $hasil = [];
        for ($r = 2; $r <= $barisMaks; $r++) {
            $baris = [];
            $kosong = true;
            foreach ($kolom as $kunci => $label) {
                $v = isset($indeks[$kunci])
                    ? $ws->getCell(Coordinate::stringFromColumnIndex($indeks[$kunci]) . $r)->getValue()
                    : null;
                if ($v !== null && trim((string) $v) !== '') $kosong = false;
                $baris[$kunci] = $v;
            }
            if (!$kosong) $hasil[$r] = $baris;
        }
        return $hasil;
    }
}