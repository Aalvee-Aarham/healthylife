<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class DbProcedure
{
    /**
     * Call a stored procedure with an OUT/INOUT parameter portably across MySQL and PostgreSQL.
     */
    public static function call(string $procedure, array $inParams, string $outParamName)
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            $placeholders = implode(', ', array_fill(0, count($inParams), '?'));
            $sql = $placeholders
                ? "CALL {$procedure}({$placeholders}, @{$outParamName})"
                : "CALL {$procedure}(@{$outParamName})";
            DB::statement($sql, $inParams);
            $row = DB::selectOne("SELECT @{$outParamName} AS {$outParamName}");
            return $row ? $row->{$outParamName} : null;
        }

        $placeholders = implode(', ', array_fill(0, count($inParams), '?'));
        $sql = $placeholders
            ? "CALL {$procedure}({$placeholders}, NULL)"
            : "CALL {$procedure}(NULL)";
        $row = DB::selectOne($sql, $inParams);
        return $row ? ($row->{$outParamName} ?? null) : null;
    }
}
