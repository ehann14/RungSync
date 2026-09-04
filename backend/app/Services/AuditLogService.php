<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogService
{
    public static function log(string $action, string $modelType, int $modelId, ?array $changes = null): void
    {
        $user = auth()->user();
        
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'changes' => $changes,
            'created_at' => now(),
        ]);
    }
}