<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController; // ➕ BARU
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomTransferController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Middleware\EnsureRole;
use Illuminate\Support\Facades\Route;

// ============ PUBLIC ============
Route::post('/login', [AuthController::class, 'login']);

// ============ AUTH (semua role) ============
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ➕ TAMBAHKAN 2 BARIS INI (untuk admin, guru, siswa)
    Route::put('/profile', [ProfileController::class, 'updateName']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
});

// ============ ADMIN ============
Route::middleware(['auth:sanctum', EnsureRole::class . ':admin'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    $adminRoutes = function () {
        // Jadwal
        Route::get('schedules', [ScheduleController::class, 'index']);
        Route::post('schedules', [ScheduleController::class, 'store']);
        Route::put('schedules/{id}', [ScheduleController::class, 'update']);
        Route::delete('schedules/{id}', [ScheduleController::class, 'destroy']);

        // Ruangan
        Route::get('rooms', [RoomController::class, 'index']);
        Route::get('rooms/status', [RoomController::class, 'status']);
        Route::get('rooms/available', [RoomController::class, 'available']);
        Route::post('rooms', [RoomController::class, 'store']);
        Route::put('rooms/{id}', [RoomController::class, 'update']);
        Route::delete('rooms/{id}', [RoomController::class, 'destroy']);

        // Guru
        Route::get('teachers', [TeacherController::class, 'index']);
        Route::post('teachers', [TeacherController::class, 'store']);
        Route::put('teachers/{teacher}', [TeacherController::class, 'update']);
        Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy']);
        Route::post('teachers/{teacher}/reset-password', [TeacherController::class, 'resetPassword']);

        // Siswa (CRUD lengkap + reset password)
        Route::get('students', [StudentController::class, 'index']);
        Route::post('students', [StudentController::class, 'store']);
        Route::put('students/{student}', [StudentController::class, 'update']);
        Route::delete('students/{student}', [StudentController::class, 'destroy']);
        Route::post('students/{student}/reset-password', [StudentController::class, 'resetPassword']);

        // Kelas
        Route::get('classes', [ClassController::class, 'index']);
        Route::post('classes', [ClassController::class, 'store']);
        Route::put('classes/{id}', [ClassController::class, 'update']);
        Route::delete('classes/{id}', [ClassController::class, 'destroy']);

        // Mata Pelajaran
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::post('subjects', [SubjectController::class, 'store']);
        Route::put('subjects/{id}', [SubjectController::class, 'update']);
        Route::delete('subjects/{id}', [SubjectController::class, 'destroy']);

        // Perpindahan ruangan
        Route::get('room-transfers', [RoomTransferController::class, 'index']);
    };

    $adminRoutes();
    Route::prefix('admin')->group($adminRoutes);
});

// ============ GURU ============
Route::middleware(['auth:sanctum', EnsureRole::class . ':teacher'])->prefix('teacher')->group(function () {
    Route::get('/schedule', [ScheduleController::class, 'teacherSchedule']);
    Route::get('/rooms', [RoomController::class, 'available']);
    Route::post('/room-transfer', [RoomTransferController::class, 'store']);
    Route::get('/room-transfers', [RoomTransferController::class, 'index']);
});

// ============ SISWA ============
Route::middleware(['auth:sanctum', EnsureRole::class . ':student'])->prefix('student')->group(function () {
    Route::get('/schedule', [ScheduleController::class, 'studentSchedule']);
});