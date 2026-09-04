<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Schedule;
use App\Services\ScheduleService;
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RoomController extends Controller
{
    public function index()  
    { 
        return response()->json(ScheduleService::roomsStatus()); 
    }
    
    public function status() 
    { 
        return response()->json(ScheduleService::roomsStatus()); 
    }

    public function available(Request $request)
    {
        $request->validate(['schedule_id' => 'required|exists:schedules,id']);
        $s    = Schedule::findOrFail($request->query('schedule_id'));
        $date = $request->filled('date')
            ? Carbon::parse($request->query('date'))->format('Y-m-d')
            : now()->format('Y-m-d');

        return response()->json(
            ScheduleService::availableRoomsForDate($date, $s->start_time, $s->end_time, $s->room_id)
        );
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:rooms,name']);
        
        $room = Room::create($request->only('name'));
        
        // AUDIT LOG: Created
        AuditLogService::log('created', 'Room', $room->id);
        
        return response()->json($room, 201);
    }

    public function update(Request $request, $id)
    {
        $room = Room::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:rooms,name,' . $room->id]);
        
        // AUDIT LOG: Updated (Simpan state sebelum update)
        $before = $room->only(['name']);
        
        $room->update($request->only('name'));
        
        $after = $room->only(['name']);
        $changes = [];
        foreach ($before as $key => $value) {
            if ((string)$value !== (string)$after[$key]) {
                $changes[$key] = ['old' => $value, 'new' => $after[$key]];
            }
        }

        if (!empty($changes)) {
            AuditLogService::log('updated', 'Room', $room->id, $changes);
        }
        
        return response()->json($room);
    }

    public function destroy($id)
    {
        $room = Room::findOrFail($id);
        if (Schedule::where('room_id', $room->id)->exists()) {
            return response()->json(['message' => 'Ruangan masih dipakai jadwal, tidak bisa dihapus.'], 422);
        }
        
        // AUDIT LOG: Deleted (Simpan state sebelum dihapus)
        AuditLogService::log('deleted', 'Room', $room->id, $room->only(['name']));
        
        $room->delete();
        return response()->json(['message' => 'Ruangan dihapus.']);
    }
}