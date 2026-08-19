<?php
namespace App\Http\Controllers;

use App\Models\RoomTransfer;
use App\Models\Schedule;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RoomTransferController extends Controller
{
    public function index(Request $request)
    {
        $q = RoomTransfer::with('teacher.user', 'schedule.class', 'schedule.subject', 'fromRoom', 'toRoom');

        if ($request->user()->role === 'guru') {
            $q->where('teacher_id', $request->user()->teacher?->id);
        }
        return $q->latest()->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'to_room_id'  => 'required|exists:rooms,id',
            'date'        => 'required|date',
            'reason'      => 'nullable|string',
        ]);

        $user     = $request->user();
        $schedule = Schedule::findOrFail($request->schedule_id);
        $date     = Carbon::parse($request->date)->format('Y-m-d');

        if ($user->role === 'guru') {
            if (! $user->teacher || $schedule->teacher_id !== $user->teacher->id) {
                return response()->json(['message' => 'Bukan jadwal Anda.'], 403);
            }
        }

        if ($date < now()->format('Y-m-d')) {
            return response()->json(['message' => 'Tanggal perpindahan tidak boleh di masa lalu.'], 422);
        }

        if (ScheduleService::dayNameFromDate($date) !== $schedule->day) {
            return response()->json(['message' => "Tanggal tersebut bukan hari {$schedule->day}."], 422);
        }

        if ($schedule->room_id === (int) $request->to_room_id) {
            return response()->json(['message' => 'Ruangan tujuan sama dengan ruangan saat ini.'], 422);
        }

        if (RoomTransfer::where('schedule_id', $schedule->id)->where('date', $date)->exists()) {
            return response()->json(['message' => 'Jadwal ini sudah dipindah pada tanggal tersebut (perpindahan hanya 1 kali per tanggal).'], 422);
        }

        // Validasi bentrok pada tanggal tsb (ruangan tujuan tidak boleh dipakai)
        $msgs = ScheduleService::dateConflictMessages([
            'date'    => $date,
            'start'   => $schedule->start_time,
            'end'     => $schedule->end_time,
            'room_id' => $request->to_room_id,
        ], $schedule->id);

        if ($msgs) {
            return response()->json(['message' => implode(' ', $msgs)], 422);
        }

        // ✅ TIDAK mengubah schedules.room_id → minggu depan otomatis kembali ke ruangan awal
        $transfer = RoomTransfer::create([
            'schedule_id'    => $schedule->id,
            'teacher_id'     => $schedule->teacher_id,
            'from_room_id'   => $schedule->room_id,
            'to_room_id'     => $request->to_room_id,
            'reason'         => $request->reason,
            'status'         => 'berhasil',
            'transferred_at' => now(),
            'date'           => $date,
        ]);

        return response()->json($transfer->load('fromRoom', 'toRoom', 'schedule'), 201);
    }
}