<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'message' => 'Silakan masuk terlebih dahulu untuk melihat riwayat pesanan.',
            ], 401);
        }

        $settings = SiteSetting::current();
        $storesById = Store::query()->get()->keyBy('id');
        $orders = Order::query()
            ->with('items')
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (Order $order) => $order->toFrontendArray(
                $settings,
                $order->store_id ? $storesById->get($order->store_id) : null
            ))
            ->values();

        return response()->json(['orders' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'message' => 'Silakan masuk terlebih dahulu sebelum memesan.',
            ], 401);
        }

        $customerName = trim((string) $request->input('customer_name', ''));
        $customerPhone = trim((string) $request->input('customer_phone', ''));
        $deliveryAddress = trim((string) $request->input('delivery_address', ''));
        $eventDatetime = trim((string) $request->input('event_datetime', ''));
        $orderType = $request->input('order_type') === 'direct' ? 'direct' : 'po';
        $paymentMethod = $request->input('payment_method') === 'cash' ? 'cash' : 'transfer';
        $promoCodeInput = strtoupper(trim((string) $request->input('promo_code', '')));
        $rawItems = $request->input('items', []);

        $errors = [];
        if (mb_strlen($customerName) < 2) {
            $errors['customer_name'] = 'Nama pemesan minimal 2 karakter.';
        }
        $phoneDigits = preg_replace('/[^0-9]/', '', $customerPhone);
        if (strlen($phoneDigits) < 9 || strlen($phoneDigits) > 16) {
            $errors['customer_phone'] = 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
        }
        if (mb_strlen($deliveryAddress) < 8) {
            $errors['delivery_address'] = 'Mohon isi alamat pengiriman/pengambilan yang lengkap.';
        }
        if ($eventDatetime === '') {
            $errors['event_datetime'] = 'Tanggal dan jam acara wajib diisi.';
        }

        if (count($errors) > 0) {
            return response()->json([
                'message' => 'Mohon periksa kembali data pemesanan Anda.',
                'errors' => $errors,
            ], 422);
        }

        if (! is_array($rawItems) || count($rawItems) === 0) {
            return response()->json(['message' => 'Keranjang belanja masih kosong.'], 422);
        }

        $settings = SiteSetting::current();
        $requestedStoreId = (int) $request->input('store_id', 0);
        $store = Store::query()->where('id', $requestedStoreId)->where('is_active', true)->first()
            ?? Store::query()->where('is_active', true)->orderBy('id')->first()
            ?? Store::query()->orderBy('id')->first();

        try {
            $order = DB::transaction(function () use (
                $user,
                $rawItems,
                $promoCodeInput,
                $orderType,
                $paymentMethod,
                $store,
                $settings,
                $customerName,
                $customerPhone,
                $deliveryAddress,
                $eventDatetime
            ) {
                $qtyByProduct = [];
                $prepared = [];

                foreach ($rawItems as $rawItem) {
                    $pid = (int) ($rawItem['product_id'] ?? 0);
                    $qty = (int) ($rawItem['quantity'] ?? 0);
                    if ($pid <= 0 || $qty < 1) {
                        abort(422, 'Item keranjang tidak valid.');
                    }
                    $qtyByProduct[$pid] = ($qtyByProduct[$pid] ?? 0) + $qty;
                }

                // Lock product rows FOR UPDATE & verify stock atomically
                $lockedProducts = [];
                foreach ($qtyByProduct as $pid => $totalQty) {
                    $product = Product::query()->where('id', $pid)->lockForUpdate()->first();
                    if (! $product || ! $product->is_available) {
                        abort(422, "Produk dengan ID {$pid} tidak tersedia.");
                    }
                    if ((int) $product->stock < $totalQty) {
                        $msg = (int) $product->stock <= 0
                            ? "Stok \"{$product->name}\" sedang habis."
                            : "Stok \"{$product->name}\" hanya tersisa {$product->stock} pcs (Anda memesan {$totalQty} pcs).";
                        abort(422, $msg);
                    }
                    $lockedProducts[$pid] = $product;
                }

                // Deduct stock
                foreach ($qtyByProduct as $pid => $totalQty) {
                    $lockedProducts[$pid]->decrement('stock', $totalQty);
                }

                $subtotalAmount = 0;
                foreach ($rawItems as $rawItem) {
                    $pid = (int) $rawItem['product_id'];
                    $qty = (int) $rawItem['quantity'];
                    $product = $lockedProducts[$pid];
                    $variants = is_array($product->variants) ? $product->variants : ['Original'];
                    $variant = trim((string) ($rawItem['variant'] ?? '')) ?: ($variants[0] ?? 'Original');
                    $lineSub = (int) $product->price * $qty;
                    $subtotalAmount += $lineSub;

                    $prepared[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'variant' => $variant,
                        'price' => (int) $product->price,
                        'quantity' => $qty,
                        'subtotal' => $lineSub,
                    ];
                }

                $matchedPromo = $promoCodeInput !== ''
                    ? Promo::query()->where('is_active', true)->whereRaw('UPPER(code) = ?', [$promoCodeInput])->first()
                    : null;

                $discountAmount = 0;
                if ($matchedPromo && $subtotalAmount >= (int) $matchedPromo->min_order) {
                    if ($matchedPromo->discount_type === 'percent') {
                        $discountAmount = (int) round(($subtotalAmount * (int) $matchedPromo->discount_value) / 100);
                    } else {
                        $discountAmount = min($subtotalAmount, (int) $matchedPromo->discount_value);
                    }
                }

                $totalAmount = max(0, $subtotalAmount - $discountAmount);
                $dpAmount = $orderType === 'po' ? (int) ceil($totalAmount * 0.5) : $totalAmount;

                $orderCode = 'RH-'.now()->format('Ymd').'-'.strtoupper(Str::random(4));

                $newOrder = Order::create([
                    'order_code' => $orderCode,
                    'user_id' => $user->id,
                    'store_id' => $store?->id,
                    'store_name' => $store?->name ?? ($settings['brandName'] ?? 'Dapur Roti Hajatan'),
                    'customer_name' => $customerName,
                    'customer_email' => $user->email,
                    'customer_phone' => $customerPhone,
                    'delivery_address' => $deliveryAddress,
                    'event_datetime' => $eventDatetime,
                    'order_type' => $orderType,
                    'payment_method' => $paymentMethod,
                    'promo_code' => $discountAmount > 0 && $matchedPromo ? $matchedPromo->code : null,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $totalAmount,
                    'dp_amount' => $dpAmount,
                    'status' => 'pending_wa',
                ]);

                foreach ($prepared as $itemData) {
                    OrderItem::create([
                        'order_id' => $newOrder->id,
                        ...$itemData,
                    ]);
                }

                $user->update([
                    'phone' => $customerPhone,
                    'default_address' => $deliveryAddress,
                ]);

                return $newOrder->load('items');
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        $payload = $order->toFrontendArray($settings, $store);

        return response()->json([
            'order' => $payload,
            'whatsapp_url' => $payload['whatsapp_url'],
        ], 201);
    }
}
