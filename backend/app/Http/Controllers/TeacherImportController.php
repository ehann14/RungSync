<?php

namespace App\Http\Controllers;

use App\Services\ExcelKit;
use App\Services\TeacherImportService;
use Illuminate\Http\Request;

class TeacherImportController extends Controller
{
    public function __construct(private TeacherImportService $svc) {}

    public function template()
    {
        return ExcelKit::unduh($this->svc->buatTemplate(), 'template-guru.xlsx');
    }

    public function export()
    {
        return ExcelKit::unduh($this->svc->buatEkspor(), 'ekspor-guru-' . now()->format('Ymd') . '.xlsx');
    }

    public function preview(Request $request)
    {
        $file = $this->validasi($request);
        return response()->json($this->svc->untukPratinjau($this->svc->analisis($file)));
    }

    public function commit(Request $request)
    {
        $file = $this->validasi($request);
        $request->validate(['mode' => 'required|in:valid_only,all_valid']);

        try {
            return response()->json($this->svc->simpan($file, $request->input('mode')));
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Import dibatalkan, tidak ada data tersimpan. Terjadi benturan data (mis. email/NIP ganda). Cek ulang file.'], 422);
        }
    }

    private function validasi(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx|max:2048',
        ], [
            'file.required' => 'Pilih file .xlsx terlebih dahulu.',
            'file.mimes'    => 'File harus berformat .xlsx.',
            'file.max'      => 'Ukuran file maksimal 2 MB.',
        ]);
        return $request->file('file');
    }
}