<?php

namespace App\Http\Controllers;

use App\Models\AcademicPeriod;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicPeriodController extends Controller
{
    public function index()
    {
        return response()->json(AcademicPeriod::orderBy('year_start', 'desc')->orderBy('semester', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'year_start' => 'required|integer|min:2000',
            'year_end' => 'required|integer|gte:year_start',
            'semester' => 'required|in:ganjil,genap',
        ]);

        $validated['is_active'] = false; // Selalu dibuat non-aktif dulu
        $period = AcademicPeriod::create($validated);

        return response()->json($period, 201);
    }

    public function activate($id)
    {
        $period = AcademicPeriod::findOrFail($id);

        DB::transaction(function () use ($period) {
            // Set semua periode jadi false
            AcademicPeriod::where('is_active', true)->update(['is_active' => false]);
            // Set periode ini jadi true
            $period->update(['is_active' => true]);
        });

        return response()->json(['message' => 'Periode berhasil diaktifkan.', 'data' => $period]);
    }

    public function copyFromPrevious($id, $sourceId)
    {
        $targetPeriod = AcademicPeriod::findOrFail($id);
        $sourcePeriod = AcademicPeriod::findOrFail($sourceId);

        $schedulesToCopy = Schedule::where('academic_period_id', $sourcePeriod->id)->get();

        if ($schedulesToCopy->isEmpty()) {
            return response()->json(['message' => 'Tidak ada jadwal di periode sumber.'], 404);
        }

        $copiedCount = 0;
        foreach ($schedulesToCopy as $schedule) {
            Schedule::create([
                'class_id' => $schedule->class_id,
                'subject_id' => $schedule->subject_id,
                'teacher_id' => $schedule->teacher_id,
                'room_id' => $schedule->room_id,
                'day' => $schedule->day,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'academic_period_id' => $targetPeriod->id,
            ]);
            $copiedCount++;
        }

        return response()->json(['message' => "Berhasil menyalin {$copiedCount} jadwal.", 'count' => $copiedCount]);
    }
}