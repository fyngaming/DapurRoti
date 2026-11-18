<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StorefrontController;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

// ==========================================================
// PUBLIC & CUSTOMER API ROUTES (Session-backed in web group)
// ==========================================================
Route::prefix('api')->group(function () {
    // Storefront Catalog, Branches, Promos, Ads & Site Settings
    Route::get('/products', [StorefrontController::class, 'catalog']);

    // Email & Password Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Google OAuth 2.0
    Route::get('/auth/google/status', [GoogleAuthController::class, 'status']);
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

    // Customer Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Private Admin API
    Route::post('/dapur-admin/login', [AdminController::class, 'login']);

    Route::prefix('dapur-admin')
        ->middleware(EnsureUserIsAdmin::class)
        ->group(function () {
            Route::get('/overview', [AdminController::class, 'overview']);
            Route::put('/settings', [AdminController::class, 'updateSettings']);
            Route::patch('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
            Route::post('/upload-image', [AdminController::class, 'uploadImage']);

            // Categories
            Route::post('/categories', [AdminController::class, 'storeCategory']);
            Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [AdminController::class, 'destroyCategory']);

            // Products + CSV Bulk Import
            Route::post('/products/import-csv', [AdminController::class, 'importProductsCsv']);
            Route::post('/products', [AdminController::class, 'storeProduct']);
            Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
            Route::delete('/products/{id}', [AdminController::class, 'destroyProduct']);

            // Store Branches
            Route::post('/stores', [AdminController::class, 'storeBranch']);
            Route::put('/stores/{id}', [AdminController::class, 'updateBranch']);
            Route::delete('/stores/{id}', [AdminController::class, 'destroyBranch']);

            // Customers
            Route::post('/customers', [AdminController::class, 'storeCustomer']);
            Route::put('/customers/{id}', [AdminController::class, 'updateCustomer']);
            Route::delete('/customers/{id}', [AdminController::class, 'destroyCustomer']);

            // Promos
            Route::post('/promos', [AdminController::class, 'storePromo']);
            Route::put('/promos/{id}', [AdminController::class, 'updatePromo']);
            Route::delete('/promos/{id}', [AdminController::class, 'destroyPromo']);

            // Ads Carousel
            Route::post('/ads', [AdminController::class, 'storeAd']);
            Route::put('/ads/{id}', [AdminController::class, 'updateAd']);
            Route::delete('/ads/{id}', [AdminController::class, 'destroyAd']);
        });
});

// ==========================================================
// REACT PWA SPA ENTRY (Home, /my-orders, /dapur-admin)
// ==========================================================
Route::view('/{any?}', 'app')
    ->where('any', '^(?!api/|uploads/|build/|src/|icons/).*$');
