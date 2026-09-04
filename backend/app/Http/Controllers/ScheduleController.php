<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Services\ScheduleService;
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $q = Schedule::with('class', 'subject', 'teacher.user', 'room');

        foreach (['day', 'class_id', 'teacher_id', 'room_id', 'subject_id'] as $f) {
            if ($request->filled($f)) $q->where($f, $request->query($f));
        }

        return response()->json(
            $q->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
              ->orderBy('start_time')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $this->ensureNoConflict($data);
        
        $schedule = Schedule::create($data);
        
        // AUDIT LOG: Created
        AuditLogService::log('created', 'Schedule', $schedule->id);
        
        return response()->json($schedule, 201);
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);
        $data = $this->validateData($request);
        $this->ensureNoConflict($data, $schedule->id);
        
        // 1. AUDIT LOG: Simpan state SEBELUM update
        $cols = ['class_id', 'subject_id', 'teacher_id', 'room_id', 'day', 'start_time', 'end_time'];
        $before = $schedule->only($cols);
        
        $schedule->update($data);
        
        // 2. AUDIT LOG: Bandingkan dengan state SETELAH update
        $schedule->refresh();
        $after = $schedule->only($cols);
        $changes = [];
        
        foreach ($before as $key => $value) {
            if ((string)$value !== (string)$after[$key]) {
                $changes[$key] = ['old' => $value, 'new' => $after[$key]];
            }
        }

        if (!empty($changes)) {
            AuditLogService::log('updated', 'Schedule', $schedule->id, $changes);
        }
        
        return response()->json($schedule);
    }

    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        
        // AUDIT LOG: Deleted (Simpan state sebelum dihapus)
        $cols = ['class_id', 'subject_id', 'teacher_id', 'room_id', 'day', 'start_time', 'end_time'];
        AuditLogService::log('deleted', 'Schedule', $schedule->id, $schedule->only($cols));
        
        $schedule->delete();
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

        return response()->json(
            Schedule::with(['class', 'subject', 'room', 'teacher.user'])
                ->where('teacher_id', $teacherId)
                ->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
                ->orderBy('start_time')
                ->get()
        );
    }

    // ===== TAMBAHAN: Jadwal untuk Siswa (GET /api/student/schedule) =====
    public function studentSchedule(Request $request)
    {
        $classId = optional($request->user()->student)->class_id;

        return response()->json(
            Schedule::with(['class', 'subject', 'room', 'teacher.user'])
                ->where('class_id', $classId)
                ->orderByRaw("FIELD(day,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')")
                ->orderBy('start_time')
                ->get()
        );
    }
}