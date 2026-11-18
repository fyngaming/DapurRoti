<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class AdminDashboardController extends Controller
{
    public function index(): View
    {
        $orders = Order::with('items')->latest()->get();
        $categories = Category::withCount('products')->orderBy('name')->get();
        $products = Product::with('category')->latest()->get();

        return view('admin.dashboard', compact('orders', 'categories', 'products'));
    }

    public function updateOrderStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending_wa,confirmed,completed,cancelled'],
        ]);

        $order->update(['status' => $validated['status']]);

        return back()->with('success', "Status pesanan {$order->order_code} diperbarui.");
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        Category::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Kategori baru ditambahkan.');
    }

    public function destroyCategory(Category $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            return back()->withErrors(['category' => 'Kategori masih memiliki produk aktif.']);
        }
        $category->delete();

        return back()->with('success', 'Kategori dihapus.');
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'integer', 'min:500'],
            'description' => ['required', 'string'],
            'image' => ['required', 'url'],
        ]);

        Product::create([
            ...$validated,
            'slug' => Str::slug($validated['name']) . '-' . Str::lower(Str::random(4)),
            'is_available' => $request->boolean('is_available', true),
        ]);

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function destroyProduct(Product $product): RedirectResponse
    {
        $product->delete();
        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
