<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Store;
use Illuminate\Http\JsonResponse;

class StorefrontController extends Controller
{
    public function catalog(): JsonResponse
    {
        return response()->json([
            'categories' => Category::query()->orderBy('id')->get()->map->toFrontendArray()->values(),
            'products' => Product::query()->where('is_available', true)->orderBy('id')->get()->map->toFrontendArray()->values(),
            'stores' => Store::query()->where('is_active', true)->orderBy('id')->get()->map->toFrontendArray()->values(),
            'promos' => Promo::query()->where('is_active', true)->orderBy('id')->get()->map->toFrontendArray()->values(),
            'ads' => Ad::query()->where('is_active', true)->orderBy('id')->get()->map->toFrontendArray()->values(),
            'settings' => SiteSetting::current(),
        ]);
    }
}
