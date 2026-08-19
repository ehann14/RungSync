<?php
namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\RoomTransfer;
use App\Services\ScheduleService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $today = ScheduleService::todayName();
        $date  = now()->format('Y-m-d');

        $withToday = ['class', 'subject', 'teacher.user', 'room',
            'transfers' => fn ($q) => $q->where('date', $date)->with('toRoom')];

        if ($user->role === 'admin') {
            return response()->json([
                'stats' => [
                    'classes'         => SchoolClass::count(),
                    'teachers'        => Teacher::count(),
                    'students'        => Student::count(),
                    'rooms'           => Room::count(),
                    'subjects'        => Subject::count(),
                    'schedules_today' => Schedule::where('day', $today)->count(),
                ],
                'rooms_status' => ScheduleService::roomsStatus(),
                'today_schedules' => ScheduleService::applyEffectiveRoom(
                    Schedule::with($withToday)->where('day', $today)->orderBy('start_time')->get(), $date),
                'recent_transfers' => RoomTransfer::with('teacher.user', 'schedule.class', 'fromRoom', 'toRoom')
                    ->latest()->take(8)->get(),
            ]);
        }

        if ($user->role === 'guru') {
            $teacherId = $user->teacher?->id;
            return response()->json([
                'today_schedules' => ScheduleService::applyEffectiveRoom(
                    Schedule::with($withToday)->where('day', $today)->where('teacher_id', $teacherId)
                        ->orderBy('start_time')->get(), $date),
                'rooms_status' => ScheduleService::roomsStatus(),
                'recent_transfers' => RoomTransfer::with('fromRoom', 'toRoom', 'schedule.class')
                    ->where('teacher_id', $teacherId)->latest()->take(8)->get(),
            ]);
        }

        $classId = $user->student?->class_id;
        return response()->json([
            'class' => $user->student?->class,
            'today_schedules' => ScheduleService::applyEffectiveRoom(
                Schedule::with($withToday)->where('day', $today)->where('class_id', $classId)
                    ->orderBy('start_time')->get(), $date),
            'transfers' => RoomTransfer::with('fromRoom', 'toRoom', 'schedule.subject')
                ->whereHas('schedule', fn ($q) => $q->where('class_id', $classId))
                ->latest()->take(5)->get(),
        ]);
    }
}