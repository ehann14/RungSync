<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('room_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('to_room_id')->constrained('rooms')->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->string('status')->default('berhasil');
            $table->timestamp('transferred_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('room_transfers'); }
};