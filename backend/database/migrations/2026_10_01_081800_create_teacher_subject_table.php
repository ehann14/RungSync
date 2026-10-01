<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Pengaman: tabel mungkin sudah ada (dari rungsync.sql)
        if (Schema::hasTable('teacher_subject')) return;

        Schema::create('teacher_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['teacher_id', 'subject_id']);
        });
    }

    public function down(): void { Schema::dropIfExists('teacher_subject'); }
};