<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Services\ScheduleService;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $q = Schedule::with('class', 'subject', 'teacher.user', 'room');

        foreach (['day', 'class_id', 'teacher_id', 'room_id', 'subject_id'] as $f) {
            if ($request->filled($f)) $q->where($f, $request->query($f));
        }

        return $q->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
                 ->orderBy('start_time')->get();
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $this->ensureNoConflict($data);
        return response()->json(Schedule::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);
        $data = $this->validateData($request);
        $this->ensureNoConflict($data, $schedule->id);
        $schedule->update($data);
        return response()->json($schedule);
    }

    public function destroy($id)
    {
        Schedule::findOrFail($id)->delete();
        return response()->json(['message' => 'Jadwal dihapus.']);
    }

    private function validateData(Request $request): array
    {
        $v = $request->validate([
            'class_id'   => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'room_id'    => 'required|exists:rooms,id',
            'day'        => 'required|in:' . implode(',', ScheduleService::DAYS),
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
        ]);
        $v['start_time'] .= ':00';
        $v['end_time']   .= ':00';
        if ($v['start_time'] >= $v['end_time']) {
            response()->json(['message' => 'Jam selesai harus setelah jam mulai.'], 422)->throwResponse();
        }
        return $v;
    }

    private function ensureNoConflict(array $data, ?int $ignore = null): void
    {
        // ✅ Samakan key: conflictMessages memakai 'start' & 'end'
        $msgs = ScheduleService::conflictMessages([
            'day'        => $data['day'],
            'start'      => $data['start_time'],
            'end'        => $data['end_time'],
            'room_id'    => $data['room_id'],
            'teacher_id' => $data['teacher_id'],
            'class_id'   => $data['class_id'],
        ], $ignore);

        if ($msgs) {
            response()->json(['message' => implode(' ', $msgs)], 422)->throwResponse();
        }
    }

    // ===== TAMBAHAN: Jadwal untuk Guru (GET /api/teacher/schedule) =====
    public function teacherSchedule(Request $request)
    {
        $teacherId = optional($request->user()->teacher)->id;

        return Schedule::with(['class', 'subject', 'room', 'teacher.user'])
            ->where('teacher_id', $teacherId)
            ->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
            ->orderBy('start_time')
            ->get();
    }

    // ===== TAMBAHAN: Jadwal untuk Siswa (GET /api/student/schedule) =====
    public function studentSchedule(Request $request)
    {
        $classId = optional($request->user()->student)->class_id;

        return Schedule::with(['class', 'subject', 'room', 'teacher.user'])
            ->where('class_id', $classId)
            ->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
            ->orderBy('start_time')
            ->get();
    }
}