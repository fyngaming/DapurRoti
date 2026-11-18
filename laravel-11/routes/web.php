<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

// Google Socialite Auth Routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// Authenticated Customer Order Routes
Route::middleware('auth')->group(function () {
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/my-orders', [OrderController::class, 'index'])->name('orders.index');
});

// Private Admin Routes (custom secret URL prefix from .env + 404 for non-admin)
$adminPrefix = config('services.bakery.admin_prefix', env('ADMIN_ROUTE_PREFIX', 'panel-dapur-rahasia'));
Route::prefix($adminPrefix)
    ->middleware(['auth', EnsureUserIsAdmin::class])
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::patch('/orders/{order}/status', [AdminDashboardController::class, 'updateOrderStatus'])->name('orders.status');
        Route::post('/categories', [AdminDashboardController::class, 'storeCategory'])->name('categories.store');
        Route::delete('/categories/{category}', [AdminDashboardController::class, 'destroyCategory'])->name('categories.destroy');
        Route::post('/products', [AdminDashboardController::class, 'storeProduct'])->name('products.store');
        Route::delete('/products/{product}', [AdminDashboardController::class, 'destroyProduct'])->name('products.destroy');
    });

require __DIR__ . '/auth.php';
