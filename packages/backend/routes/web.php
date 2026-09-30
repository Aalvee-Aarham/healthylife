<?php

use Illuminate\Support\Facades\Route;

// SPA fallback: the built frontend lives in public/ (see root Dockerfile)
Route::get('/{any?}', fn () => response()->file(public_path('index.html')))
    ->where('any', '^(?!api/).*$');
