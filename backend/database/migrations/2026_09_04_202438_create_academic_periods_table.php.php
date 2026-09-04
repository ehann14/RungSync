<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: "2026/2027 Ganjil"
            $table->integer('year_start'); // Contoh: 2026
            $table->integer('year_end'); // Contoh: 2027
            $table->enum('semester', ['ganjil', 'genap']);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_periods');
    }
};