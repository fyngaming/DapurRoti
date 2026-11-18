<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class OrderController extends Controller
{
    public function index(Request $request): View
    {
        $orders = $request->user()
            ->orders()
            ->with('items')
            ->latest()
            ->get();

        return view('my-orders', compact('orders'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:25'],
            'delivery_address' => ['required', 'string', 'min:8'],
            'event_datetime' => ['required', 'date', 'after:now'],
            'order_type' => ['required', 'in:po,direct'],
            'payment_method' => ['required', 'in:cash,transfer'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $user = $request->user();

        $order = DB::transaction(function () use ($validated, $user) {
            $productIds = collect($validated['items'])->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)
                ->where('is_available', true)
                ->get()
                ->keyBy('id');

            $totalAmount = 0;
            $preparedItems = [];

            foreach ($validated['items'] as $entry) {
                $product = $products->get($entry['product_id']);
                if (! $product) {
                    abort(422, 'Salah satu produk tidak tersedia.');
                }

                $qty = (int) $entry['quantity'];
                $subtotal = $product->price * $qty;
                $totalAmount += $subtotal;

                $preparedItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                ];
            }

            $dpAmount = $validated['order_type'] === 'po'
                ? (int) round($totalAmount * 0.5)
                : 0;

            $orderCode = 'ORD-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));

            $order = Order::create([
                'order_code' => $orderCode,
                'user_id' => $user->id,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $user->email,
                'customer_phone' => $validated['customer_phone'],
                'delivery_address' => $validated['delivery_address'],
                'event_datetime' => $validated['event_datetime'],
                'order_type' => $validated['order_type'],
                'payment_method' => $validated['payment_method'],
                'total_amount' => $totalAmount,
                'dp_amount' => $dpAmount,
                'status' => 'pending_wa',
            ]);

            foreach ($preparedItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    ...$item,
                ]);
            }

            $user->update([
                'phone' => $validated['customer_phone'],
                'default_address' => $validated['delivery_address'],
            ]);

            return $order->load('items');
        });

        return response()->json([
            'message' => 'Pesanan berhasil disimpan.',
            'order_code' => $order->order_code,
            'whatsapp_url' => $order->whatsapp_url,
            'redirect_url' => route('orders.index'),
        ], 201);
    }
}
