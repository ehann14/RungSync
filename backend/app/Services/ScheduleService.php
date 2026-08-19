<?php
namespace App\Services;

use App\Models\Room;
use App\Models\Schedule;
use Illuminate\Support\Carbon;

class ScheduleService
{
    public const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public static function todayName(): string
    {
        return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][(int) now()->format('w')];
    }

    public static function dayNameFromDate(string $date): string
    {
        return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][(int) Carbon::parse($date)->format('w')];
    }

    /** Bentrok level template mingguan (untuk admin buat/edit jadwal). */
    public static function conflictMessages(array $a, ?int $ignoreScheduleId = null): array
    {
        $base = Schedule::where('day', $a['day'])
            ->where('start_time', '<', $a['end'])
            ->where('end_time', '>', $a['start'])
            ->when($ignoreScheduleId, fn ($q) => $q->where('id', '!=', $ignoreScheduleId));

        $msgs = [];
        if (!empty($a['room_id']) && (clone $base)->where('room_id', $a['room_id'])->exists())
            $msgs[] = 'Ruangan sudah digunakan pada hari & jam tersebut.';
        if (!empty($a['teacher_id']) && (clone $base)->where('teacher_id', $a['teacher_id'])->exists())
            $msgs[] = 'Guru sudah memiliki jadwal pada hari & jam tersebut.';
        if (!empty($a['class_id']) && (clone $base)->where('class_id', $a['class_id'])->exists())
            $msgs[] = 'Kelas sudah memiliki pelajaran pada hari & jam tersebut.';
        return $msgs;
    }

    /** Ruangan efektif sebuah jadwal pada tanggal tertentu (menghormati perpindahan sekali pakai). */
    public static function effectiveRoomForDate(Schedule $s, string $date): int
    {
        $t = $s->relationLoaded('transfers')
            ? $s->transfers->firstWhere('date', $date)
            : $s->transfers()->where('date', $date)->first();
        return $t ? (int) $t->to_room_id : (int) $s->room_id;
    }

    /** Bentrok level tanggal (untuk pindah ruangan). */
    public static function dateConflictMessages(array $a, ?int $ignoreScheduleId = null): array
    {
        $day = self::dayNameFromDate($a['date']);
        $schedules = Schedule::where('day', $day)
            ->where('start_time', '<', $a['end'])
            ->where('end_time', '>', $a['start'])
            ->where('id', '!=', $ignoreScheduleId)
            ->get();

        $msgs = [];
        foreach ($schedules as $s) {
            if (!empty($a['room_id']) && self::effectiveRoomForDate($s, $a['date']) === (int) $a['room_id'])
                $msgs[] = 'Ruangan sudah digunakan pada tanggal & jam tersebut.';
            if (!empty($a['teacher_id']) && $s->teacher_id === (int) $a['teacher_id'])
                $msgs[] = 'Guru sudah memiliki jadwal pada hari & jam tersebut.';
            if (!empty($a['class_id']) && $s->class_id === (int) $a['class_id'])
                $msgs[] = 'Kelas sudah memiliki pelajaran pada hari & jam tersebut.';
        }
        return array_values(array_unique($msgs));
    }

    /** Ruangan tersedia pada tanggal & rentang jam tertentu. */
    public static function availableRoomsForDate(string $date, string $start, string $end, ?int $excludeRoomId = null)
    {
        $day = self::dayNameFromDate($date);
        $busy = Schedule::where('day', $day)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->get()
            ->map(fn ($s) => self::effectiveRoomForDate($s, $date))
            ->unique();

        return Room::whereNotIn('id', $busy)
            ->where('id', '!=', $excludeRoomId)
            ->orderBy('name')->get();
    }

    /** Status semua ruangan saat ini (memperhitungkan perpindahan hari ini). */
    public static function roomsStatus()
    {
        $date = now()->format('Y-m-d');
        $day  = self::todayName();
        $time = now()->format('H:i:s');

        $active = Schedule::with(['class', 'subject', 'teacher.user',
            'transfers' => fn ($q) => $q->where('date', $date)->with('toRoom')])
            ->where('day', $day)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>', $time)
            ->get();

        return Room::orderBy('name')->get()->map(function (Room $room) use ($active, $date) {
            $occ = $active->first(fn ($s) => self::effectiveRoomForDate($s, $date) === $room->id);
            return [
                'id'     => $room->id,
                'name'   => $room->name,
                'status' => $occ ? 'digunakan' : 'kosong',
                'active_schedule' => $occ,
            ];
        });
    }

    /** Timpa relasi "room" dengan ruangan efektif pada tanggal tsb (tampilan hari ini). */
    public static function applyEffectiveRoom($schedules, string $date)
    {
        foreach ($schedules as $s) {
            if ($t = $s->transfers->first()) {
                $s->setRelation('room', $t->toRoom ?? $s->room);
            }
        }
        return $schedules;
    }
}