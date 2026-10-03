<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class DbHelper
{
    /**
     * Executes an INSERT statement with RETURNING id on Postgres, or using lastInsertId() on MySQL.
     */
    public static function insertReturningId(string $sql, array $bindings = []): int
    {
        if (DB::getDriverName() === 'pgsql') {
            $rows = DB::select($sql, $bindings);
            return (int) $rows[0]->id;
        }

        $cleanSql = preg_replace('/\s+RETURNING\s+.*$/is', '', $sql);
        DB::insert($cleanSql, $bindings);
        return (int) DB::getPdo()->lastInsertId();
    }

    /**
     * Executes an INSERT statement with RETURNING * on Postgres, or selects the inserted row on MySQL.
     */
    public static function insertReturningOne(string $sql, array $bindings = [], ?string $table = null): object
    {
        if (DB::getDriverName() === 'pgsql') {
            $rows = DB::select($sql, $bindings);
            return $rows[0];
        }

        $cleanSql = preg_replace('/\s+RETURNING\s+.*$/is', '', $sql);
        DB::insert($cleanSql, $bindings);
        $id = DB::getPdo()->lastInsertId();

        if (! $table) {
            if (preg_match('/INSERT\s+INTO\s+([`"\w]+)/i', $sql, $matches)) {
                $table = trim($matches[1], '`" ');
            }
        }

        return DB::selectOne("SELECT * FROM {$table} WHERE id = ?", [$id]);
    }
}
