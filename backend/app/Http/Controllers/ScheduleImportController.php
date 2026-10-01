<?php

namespace App\Http\Controllers;

use App\Services\ExcelKit;
use App\Services\ScheduleImportService;
use Illuminate\Http\Request;

class ScheduleImportController extends Controller
{
    public function __construct(private ScheduleImportService $svc) {}

    public function template(Request $request)
    {
        $request->validate(['type' => 'required|in:class,teacher']);
        $tipe = $request->query('type');
        $nama = $tipe === 'class' ? 'template-jadwal-kelas.xlsx' : 'template-jadwal-guru.xlsx';

        return ExcelKit::unduh($this->svc->buatTemplate($tipe), $nama);
    }

    public function preview(Request $request)
    {
        $file = $this->validasi($request);
        return response()->json($this->svc->analisis($file, $request->input('type')));
    }

    public function commit(Request $request)
    {
        $file = $this->validasi($request);
        $request->validate(['mode' => 'required|in:valid_only,all_valid']);

        try {
            return response()->json($this->svc->simpan($file, $request->input('type'), $request->input('mode')));
        } catch (\RuntimeException $e) {
            return response()->json(['message' => 'Import dibatalkan, tidak ada data tersimpan. ' . $e->getMessage()], 422);
        }
    }

    private function validasi(Request $request)
    {
        $request->validate([
            'type' => 'required|in:class,teacher',
            'file' => 'required|file|mimes:xlsx|max:2048',
        ], [
            'file.required' => 'Pilih file .xlsx terlebih dahulu.',
            'file.mimes'    => 'File harus berformat .xlsx.',
            'file.max'      => 'Ukuran file maksimal 2 MB.',
        ]);
        return $request->file('file');
    }
}