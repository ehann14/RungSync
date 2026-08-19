<?php
namespace Database\Seeders;

use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name' => 'Admin Kurikulum', 'email' => 'admin@rungsync.sch.id', 'password' => 'password', 'role' => 'admin']);

        $classes = collect(['10 PPLG 1', '10 PPLG 2', '11 PPLG 1', '10 TJKT 1'])
            ->map(fn ($n) => SchoolClass::create(['name' => $n]));

        $subjects = collect(['Pemrograman Web', 'Basis Data', 'PPLG', 'Jaringan Komputer', 'Matematika'])
            ->map(fn ($n) => Subject::create(['name' => $n]));

        $rooms = collect(['Ruang 1', 'Ruang 2', 'Ruang 3', 'Ruang 4', 'Lab Komputer 1'])
            ->map(fn ($n) => Room::create(['name' => $n]));

        $teacherData = [
            ['Budi', 'budi@rungsync.sch.id', 'Produktif PPLG'],
            ['Andi', 'andi@rungsync.sch.id', 'Produktif PPLG'],
            ['Siti', 'siti@rungsync.sch.id', 'Matematika'],
            ['Dewi', 'dewi@rungsync.sch.id', 'Produktif TJKT'],
        ];
        $teachers = collect($teacherData)->map(fn ($t) => Teacher::create([
            'user_id' => User::create(['name' => $t[0], 'email' => $t[1], 'password' => 'password', 'role' => 'guru'])->id,
            'field'   => $t[2],
        ]));

        foreach ($classes as $i => $class) {
            Student::create([
                'user_id'  => User::create(['name' => 'Siswa ' . $class->name, 'email' => 'siswa' . ($i + 1) . '@rungsync.sch.id', 'password' => 'password', 'role' => 'siswa'])->id,
                'class_id' => $class->id,
            ]);
        }

        $mk = fn ($d, $s, $e, $c, $m, $g, $r) => Schedule::create([
            'day' => $d, 'start_time' => $s, 'end_time' => $e,
            'class_id' => $classes[$c]->id, 'subject_id' => $subjects[$m]->id,
            'teacher_id' => $teachers[$g]->id, 'room_id' => $rooms[$r]->id,
        ]);

        $mk('Senin', '07:00:00', '09:00:00', 0, 0, 0, 0);
        $mk('Senin', '07:00:00', '09:00:00', 1, 1, 1, 1);
        $mk('Senin', '09:00:00', '10:00:00', 0, 1, 1, 1);
        $mk('Senin', '10:00:00', '12:00:00', 2, 2, 2, 0);
        $mk('Senin', '10:00:00', '12:00:00', 3, 3, 3, 2);
        $mk('Selasa', '07:00:00', '09:00:00', 0, 4, 2, 0);
        $mk('Selasa', '07:00:00', '09:00:00', 3, 3, 3, 4);
        $mk('Jumat', '07:00:00', '09:00:00', 0, 0, 0, 0);
        $mk('Jumat', '07:00:00', '09:00:00', 1, 1, 1, 1);
        $mk('Jumat', '09:00:00', '10:00:00', 3, 3, 3, 4);
        $mk('Jumat', '10:00:00', '12:00:00', 2, 2, 2, 2);
    }
}