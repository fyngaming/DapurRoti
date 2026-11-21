<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private function normalizeVariants(mixed $raw): array
    {
        if (is_array($raw)) {
            $cleaned = array_values(array_filter(array_map(fn ($v) => trim((string) $v), $raw)));

            return count($cleaned) > 0 ? $cleaned : ['Original'];
        }
        if (is_string($raw)) {
            $trimmed = trim($raw);
            $splitter = str_contains($trimmed, '|') ? '|' : (str_contains($trimmed, ';') ? ';' : ',');
            $cleaned = array_values(array_filter(array_map('trim', explode($splitter, $trimmed))));

            return count($cleaned) > 0 ? $cleaned : ['Original'];
        }

        return ['Original'];
    }

    public function login(Request $request): JsonResponse
    {
        $loginInput = strtolower(trim((string) $request->input('email', $request->input('username', ''))));
        $cleanPassword = (string) $request->input('password', '');

        $user = User::query()
            ->where('role', 'admin')
            ->where(function ($q) use ($loginInput) {
                $q->whereRaw('LOWER(email) = ?', [$loginInput])
                    ->orWhereRaw('LOWER(name) = ?', [$loginInput]);
                if ($loginInput === 'admin') {
                    $q->orWhere('role', 'admin');
                }
            })
            ->first();

        if (! $user || ! $user->password || ! Hash::check($cleanPassword, $user->password)) {
            return response()->json(['message' => 'Kredensial admin tidak valid.'], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json(['user' => $user->toFrontendArray()]);
    }

    public function overview(): JsonResponse
    {
        $settings = SiteSetting::current();
        $stores = Store::query()->orderBy('id')->get();
        $storesById = $stores->keyBy('id');

        $orders = Order::query()
            ->with('items')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Order $o) => $o->toFrontendArray(
                $settings,
                $o->store_id ? $storesById->get($o->store_id) : null
            ))
            ->values();

        return response()->json([
            'orders' => $orders,
            'categories' => Category::query()->orderBy('id')->get()->map->toFrontendArray()->values(),
            'products' => Product::query()->orderBy('id')->get()->map->toFrontendArray()->values(),
            'stores' => $stores->map->toFrontendArray()->values(),
            'customers' => User::query()->where('role', 'customer')->orderByDesc('id')->get()->map->toFrontendArray()->values(),
            'promos' => Promo::query()->orderBy('id')->get()->map->toFrontendArray()->values(),
            'ads' => Ad::query()->orderBy('id')->get()->map->toFrontendArray()->values(),
            'settings' => $settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $brandName = trim((string) $request->input('brandName', ''));
        if (mb_strlen($brandName) < 2) {
            return response()->json(['message' => 'Nama toko minimal 2 karakter.'], 422);
        }

        $current = SiteSetting::current();
        $defaults = SiteSetting::defaults();

        $waDigits = preg_replace('/[^0-9]/', '', (string) $request->input('adminWhatsapp', ''));

        $row = SiteSetting::updateOrCreate(
            ['id' => 1],
            [
                'brand_name' => $brandName,
                'tagline' => trim((string) $request->input('tagline', '')),
                'footer_service_text' => trim((string) $request->input('footerServiceText', '')) ?: $defaults['footerServiceText'],
                'operating_hours' => trim((string) $request->input('operatingHours', '')) ?: $defaults['operatingHours'],
                'footer_address' => trim((string) $request->input('footerAddress', '')),
                'footer_copyright' => trim((string) $request->input('footerCopyright', '')) ?: $defaults['footerCopyright'],
                'admin_whatsapp' => $waDigits !== '' ? $waDigits : $current['adminWhatsapp'],
                'bank_name' => trim((string) $request->input('bankName', '')) ?: $current['bankName'],
                'bank_account_number' => trim((string) $request->input('bankAccountNumber', '')) ?: $current['bankAccountNumber'],
                'bank_account_holder' => trim((string) $request->input('bankAccountHolder', '')) ?: $brandName,
            ]
        );

        return response()->json(['settings' => SiteSetting::current()]);
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $nextStatus = (string) $request->input('status', '');
        if (! in_array($nextStatus, ['pending_wa', 'confirmed', 'completed', 'cancelled'], true)) {
            return response()->json(['message' => 'Status pesanan tidak valid.'], 422);
        }

        $order = Order::query()->with('items')->find($id);
        if (! $order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $prevStatus = $order->status;

        try {
            DB::transaction(function () use ($order, $prevStatus, $nextStatus) {
                if ($prevStatus !== 'cancelled' && $nextStatus === 'cancelled') {
                    foreach ($order->items as $item) {
                        Product::query()->where('id', $item->product_id)->increment('stock', (int) $item->quantity);
                    }
                } elseif ($prevStatus === 'cancelled' && $nextStatus !== 'cancelled') {
                    $qtyByProduct = [];
                    foreach ($order->items as $item) {
                        $qtyByProduct[$item->product_id] = ($qtyByProduct[$item->product_id] ?? 0) + (int) $item->quantity;
                    }
                    foreach ($qtyByProduct as $pid => $qty) {
                        $prod = Product::query()->where('id', $pid)->lockForUpdate()->first();
                        if ($prod) {
                            if ((int) $prod->stock < $qty) {
                                abort(422, "Tidak dapat mengaktifkan kembali pesanan: stok \"{$prod->name}\" tersisa {$prod->stock} pcs.");
                            }
                            $prod->decrement('stock', $qty);
                        }
                    }
                }

                $order->update(['status' => $nextStatus]);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        $order->refresh()->load('items');
        $settings = SiteSetting::current();
        $store = $order->store_id ? Store::query()->find($order->store_id) : null;

        return response()->json(['order' => $order->toFrontendArray($settings, $store)]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $dataUrl = trim((string) $request->input('dataUrl', ''));
        if (! preg_match('/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/', $dataUrl, $matches)) {
            return response()->json([
                'message' => 'Format gambar tidak valid. Gunakan JPG, PNG, atau WebP.',
            ], 422);
        }

        $mimeType = $matches[1];
        $binary = base64_decode($matches[2], true);
        if ($binary === false || strlen($binary) === 0 || strlen($binary) > 8 * 1024 * 1024) {
            return response()->json(['message' => 'Ukuran gambar maksimal 8 MB.'], 422);
        }

        $ext = match ($mimeType) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };

        $uploadsDir = public_path('uploads');
        if (! is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        $filename = 'img-'.time().'-'.Str::lower(Str::random(10)).'.'.$ext;
        file_put_contents($uploadsDir.DIRECTORY_SEPARATOR.$filename, $binary);

        return response()->json(['url' => '/uploads/'.$filename], 201);
    }

    // --- 1. CATEGORIES ---
    public function storeCategory(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $slug = Str::slug((string) ($request->input('slug') ?: $name));

        if (mb_strlen($name) < 2) {
            return response()->json(['message' => 'Nama kelompok barang minimal 2 karakter.'], 422);
        }
        if ($slug === '') {
            return response()->json(['message' => 'Slug kategori tidak valid.'], 422);
        }
        if (Category::query()->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'Kelompok barang tersebut sudah ada.'], 422);
        }

        $cat = Category::create(['name' => $name, 'slug' => $slug]);

        return response()->json(['category' => $cat->toFrontendArray()], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $cat = Category::query()->find($id);
        if (! $cat) {
            return response()->json(['message' => 'Kelompok barang tidak ditemukan.'], 404);
        }

        $name = trim((string) $request->input('name', ''));
        if (mb_strlen($name) < 2) {
            return response()->json(['message' => 'Nama kelompok barang minimal 2 karakter.'], 422);
        }

        $newSlug = Str::slug((string) ($request->input('slug') ?: $name));
        if ($newSlug !== $cat->slug && Category::query()->where('slug', $newSlug)->where('id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Slug kategori sudah digunakan.'], 422);
        }

        $oldSlug = $cat->slug;
        $cat->update(['name' => $name, 'slug' => $newSlug]);
        if ($oldSlug !== $newSlug) {
            Product::query()->where('category', $oldSlug)->update(['category' => $newSlug]);
        }

        return response()->json(['category' => $cat->toFrontendArray()]);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $cat = Category::query()->find($id);
        if (! $cat) {
            return response()->json(['message' => 'Kelompok barang tidak ditemukan.'], 404);
        }

        $usedCount = Product::query()->where('category', $cat->slug)->count();
        if ($usedCount > 0) {
            return response()->json([
                'message' => "Kelompok masih dipakai oleh {$usedCount} barang. Pindahkan atau hapus barang terlebih dahulu.",
            ], 422);
        }

        $cat->delete();

        return response()->json(['ok' => true]);
    }

    // --- 2. PRODUCTS + CSV IMPORT ---
    public function importProductsCsv(Request $request): JsonResponse
    {
        $csvText = ltrim((string) $request->input('csvText', ''), "\xEF\xBB\xBF");
        $csvText = trim($csvText);
        if ($csvText === '') {
            return response()->json(['message' => 'Isi file CSV kosong.'], 422);
        }

        $firstLine = strtok($csvText, "\r\n") ?: '';
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $csvText);
        rewind($stream);

        $matrix = [];
        while (($row = fgetcsv($stream, 0, $delimiter)) !== false) {
            if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) > 0) {
                $matrix[] = array_map(fn ($v) => trim((string) $v), $row);
            }
        }
        fclose($stream);

        if (count($matrix) < 2) {
            return response()->json([
                'message' => 'File CSV kosong atau hanya berisi header. Pastikan minimal ada 1 baris data produk.',
            ], 422);
        }

        $headers = array_map(fn ($h) => strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $h)), $matrix[0]);
        $findCol = function (array $aliases) use ($headers): int {
            foreach ($aliases as $alias) {
                $idx = array_search($alias, $headers, true);
                if ($idx !== false) {
                    return (int) $idx;
                }
            }

            return -1;
        };

        $nameIdx = $findCol(['nama', 'namabarang', 'namaproduk', 'name', 'produk', 'product']);
        $catIdx = $findCol(['kategori', 'kelompok', 'kelompokbarang', 'category']);
        $priceIdx = $findCol(['harga', 'price']);
        $stockIdx = $findCol(['stok', 'stock', 'qty', 'jumlah']);
        $expiredIdx = $findCol(['expired_hari', 'expiredhari', 'expired_days', 'expireddays', 'expired', 'kadaluarsa', 'masasimpan', 'masa_simpan', 'tahanhari']);
        $variantsIdx = $findCol(['varian', 'variants', 'rasa']);
        $descIdx = $findCol(['deskripsi', 'description', 'keterangan']);
        $imageIdx = $findCol(['foto', 'gambar', 'image', 'imageurl', 'urlfoto']);
        $availIdx = $findCol(['tersedia', 'aktif', 'status', 'is_available', 'isavailable', 'available']);

        if ($nameIdx === -1 || $priceIdx === -1) {
            return response()->json([
                'message' => 'Kolom wajib "nama" dan "harga" tidak ditemukan di baris header CSV.',
            ], 422);
        }

        $validRows = [];
        $rowErrors = [];
        for ($i = 1; $i < count($matrix); $i++) {
            $cells = $matrix[$i];
            $rowNum = $i + 1;
            $name = $cells[$nameIdx] ?? '';
            $priceDigits = preg_replace('/[^0-9]/', '', $cells[$priceIdx] ?? '');
            $price = $priceDigits !== '' ? (int) $priceDigits : 0;

            if (mb_strlen($name) < 2) {
                $rowErrors[] = "Baris {$rowNum}: Nama produk minimal 2 karakter.";
                continue;
            }
            if ($price < 500) {
                $rowErrors[] = "Baris {$rowNum}: Harga tidak valid (minimal Rp 500).";
                continue;
            }

            $stockRaw = $stockIdx >= 0 ? preg_replace('/[^0-9]/', '', $cells[$stockIdx] ?? '') : '';
            $stock = $stockRaw !== '' ? max(0, (int) $stockRaw) : 20;

            $expRaw = $expiredIdx >= 0 ? preg_replace('/[^0-9]/', '', $cells[$expiredIdx] ?? '') : '';
            $expiredDays = ($expRaw !== '' && (int) $expRaw >= 1) ? (int) $expRaw : 3;

            $rawDesc = $descIdx >= 0 ? ($cells[$descIdx] ?? '') : '';
            $desc = mb_strlen($rawDesc) >= 5
                ? $rawDesc
                : "{$name} dipanggang segar dari dapur kami untuk kebutuhan acara dan keluarga.";

            $image = ($imageIdx >= 0 ? ($cells[$imageIdx] ?? '') : '')
                ?: '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg';

            $availStr = strtolower($availIdx >= 0 ? ($cells[$availIdx] ?? 'ya') : 'ya');
            $isAvailable = ! in_array($availStr, ['0', 'false', 'tidak', 'no', 'nonaktif', 'habis'], true);

            $validRows[] = [
                'name' => $name,
                'category' => ($catIdx >= 0 && ($cells[$catIdx] ?? '') !== '') ? $cells[$catIdx] : 'roti',
                'price' => $price,
                'stock' => $stock,
                'expired_days' => $expiredDays,
                'variants' => $this->normalizeVariants($variantsIdx >= 0 ? ($cells[$variantsIdx] ?? '') : ''),
                'description' => $desc,
                'image' => $image,
                'is_available' => $isAvailable,
            ];
        }

        if (count($validRows) === 0) {
            return response()->json([
                'message' => 'Tidak ada baris produk yang valid untuk diimpor.',
                'errors' => $rowErrors,
            ], 422);
        }

        $imported = [];
        $createdCategoriesCount = 0;

        DB::transaction(function () use ($validRows, &$imported, &$createdCategoriesCount) {
            $categories = Category::query()->get();
            $usedSlugs = Product::query()->pluck('slug')->flip()->all();

            foreach ($validRows as $row) {
                $rawCat = trim($row['category']);
                $rawCatLower = strtolower($rawCat);
                $rawCatSlug = Str::slug($rawCat) ?: 'roti';

                $matched = $categories->first(fn (Category $c) => strtolower($c->slug) === $rawCatLower
                    || strtolower($c->name) === $rawCatLower
                    || strtolower($c->slug) === $rawCatSlug);

                if (! $matched) {
                    $newName = mb_strlen($rawCat) >= 2 ? $rawCat : 'Roti & Kue';
                    $matched = Category::create(['name' => $newName, 'slug' => $rawCatSlug]);
                    $categories->push($matched);
                    $createdCategoriesCount++;
                }

                $baseSlug = Str::slug($row['name']) ?: 'produk-'.time();
                $slug = $baseSlug;
                $counter = 2;
                while (isset($usedSlugs[$slug])) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $usedSlugs[$slug] = true;

                $product = Product::create([
                    'name' => $row['name'],
                    'slug' => $slug,
                    'category' => $matched->slug,
                    'description' => $row['description'],
                    'price' => $row['price'],
                    'variants' => $row['variants'],
                    'image' => $row['image'],
                    'stock' => $row['stock'],
                    'expired_days' => $row['expired_days'],
                    'is_available' => $row['is_available'],
                ]);

                $imported[] = $product->toFrontendArray();
            }
        });

        return response()->json([
            'importedCount' => count($imported),
            'skippedCount' => count($rowErrors),
            'createdCategoriesCount' => $createdCategoriesCount,
            'errors' => $rowErrors,
            'products' => $imported,
        ], 201);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $category = trim((string) $request->input('category', ''));
        $description = trim((string) $request->input('description', ''));
        $price = (int) floor((float) $request->input('price', 0));
        $stock = $request->has('stock') ? (int) floor((float) $request->input('stock')) : 20;
        $expiredDays = $request->has('expired_days') ? (int) floor((float) $request->input('expired_days')) : 3;
        $variants = $this->normalizeVariants($request->input('variants'));
        $image = trim((string) $request->input('image', '')) ?: '/src/assets/images/roti_sobek_cokelat_keju_1794924156747.jpg';
        $isAvailable = $request->input('is_available', true) !== false;

        if (mb_strlen($name) < 2) {
            return response()->json(['message' => 'Nama barang/roti wajib diisi.'], 422);
        }
        if (! Category::query()->where('slug', $category)->exists()) {
            return response()->json(['message' => 'Kelompok barang tidak valid.'], 422);
        }
        if ($price < 500) {
            return response()->json(['message' => 'Harga minimal Rp 500.'], 422);
        }
        if ($stock < 0) {
            return response()->json(['message' => 'Stok tidak boleh negatif.'], 422);
        }
        if ($expiredDays < 1) {
            return response()->json(['message' => 'Masa simpan (expired) minimal 1 hari.'], 422);
        }
        if (mb_strlen($description) < 5) {
            return response()->json(['message' => 'Deskripsi produk minimal 5 karakter.'], 422);
        }

        $baseSlug = Str::slug($name) ?: 'produk-'.time();
        $slug = $baseSlug;
        $counter = 2;
        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $product = Product::create([
            'name' => $name,
            'slug' => $slug,
            'category' => $category,
            'description' => $description,
            'price' => $price,
            'variants' => $variants,
            'image' => $image,
            'stock' => $stock,
            'expired_days' => $expiredDays,
            'is_available' => $isAvailable,
        ]);

        return response()->json(['product' => $product->toFrontendArray()], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->find($id);
        if (! $product) {
            return response()->json(['message' => 'Barang tidak ditemukan.'], 404);
        }

        if ($request->has('name')) {
            $name = trim((string) $request->input('name'));
            if (mb_strlen($name) < 2) {
                return response()->json(['message' => 'Nama barang minimal 2 karakter.'], 422);
            }
            $product->name = $name;
        }
        if ($request->has('category')) {
            $cat = trim((string) $request->input('category'));
            if (! Category::query()->where('slug', $cat)->exists()) {
                return response()->json(['message' => 'Kelompok barang tidak ditemukan.'], 422);
            }
            $product->category = $cat;
        }
        if ($request->has('description')) {
            $desc = trim((string) $request->input('description'));
            if (mb_strlen($desc) < 5) {
                return response()->json(['message' => 'Deskripsi produk minimal 5 karakter.'], 422);
            }
            $product->description = $desc;
        }
        if ($request->has('price')) {
            $price = (int) floor((float) $request->input('price'));
            if ($price < 500) {
                return response()->json(['message' => 'Harga minimal Rp 500.'], 422);
            }
            $product->price = $price;
        }
        if ($request->has('variants')) {
            $product->variants = $this->normalizeVariants($request->input('variants'));
        }
        if ($request->has('image') && trim((string) $request->input('image')) !== '') {
            $product->image = trim((string) $request->input('image'));
        }
        if ($request->has('stock')) {
            $stock = (int) floor((float) $request->input('stock'));
            if ($stock < 0) {
                return response()->json(['message' => 'Stok tidak boleh negatif.'], 422);
            }
            $product->stock = $stock;
        }
        if ($request->has('expired_days')) {
            $exp = (int) floor((float) $request->input('expired_days'));
            if ($exp < 1) {
                return response()->json(['message' => 'Masa simpan (expired) minimal 1 hari.'], 422);
            }
            $product->expired_days = $exp;
        }
        if ($request->has('is_available')) {
            $product->is_available = (bool) $request->input('is_available');
        }

        $product->save();

        return response()->json(['product' => $product->toFrontendArray()]);
    }

    public function destroyProduct(int $id): JsonResponse
    {
        $product = Product::query()->find($id);
        if (! $product) {
            return response()->json(['message' => 'Barang tidak ditemukan.'], 404);
        }
        $product->delete();

        return response()->json(['ok' => true]);
    }

    // --- 3. STORES ---
    public function storeBranch(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $address = trim((string) $request->input('address', ''));
        $phone = trim((string) $request->input('phone', ''));
        $hours = trim((string) $request->input('hours', '')) ?: '06.00 – 19.00 WIB';
        $mapsUrl = trim((string) $request->input('maps_url', '')) ?: null;
        $isActive = $request->input('is_active', true) !== false;

        if (mb_strlen($name) < 3) {
            return response()->json(['message' => 'Nama cabang toko minimal 3 karakter.'], 422);
        }
        if (mb_strlen($address) < 5) {
            return response()->json(['message' => 'Alamat toko wajib diisi.'], 422);
        }
        if ($phone === '') {
            return response()->json(['message' => 'Nomor telepon / WhatsApp toko wajib diisi.'], 422);
        }

        $store = Store::create([
            'name' => $name,
            'address' => $address,
            'phone' => $phone,
            'hours' => $hours,
            'maps_url' => $mapsUrl,
            'is_active' => $isActive,
        ]);

        return response()->json(['store' => $store->toFrontendArray()], 201);
    }

    public function updateBranch(Request $request, int $id): JsonResponse
    {
        $store = Store::query()->find($id);
        if (! $store) {
            return response()->json(['message' => 'Toko tidak ditemukan.'], 404);
        }

        if ($request->has('name')) {
            $name = trim((string) $request->input('name'));
            if ($name === '') {
                return response()->json(['message' => 'Nama toko wajib diisi.'], 422);
            }
            $store->name = $name;
        }
        if ($request->has('address')) {
            $addr = trim((string) $request->input('address'));
            if ($addr === '') {
                return response()->json(['message' => 'Alamat toko wajib diisi.'], 422);
            }
            $store->address = $addr;
        }
        if ($request->has('phone')) {
            $store->phone = trim((string) $request->input('phone'));
        }
        if ($request->has('hours')) {
            $store->hours = trim((string) $request->input('hours'));
        }
        if ($request->has('maps_url')) {
            $store->maps_url = trim((string) $request->input('maps_url')) ?: null;
        }
        if ($request->has('is_active')) {
            $store->is_active = (bool) $request->input('is_active');
        }

        $store->save();

        return response()->json(['store' => $store->toFrontendArray()]);
    }

    public function destroyBranch(int $id): JsonResponse
    {
        if (Store::query()->count() <= 1) {
            return response()->json(['message' => 'Minimal harus ada 1 toko aktif.'], 422);
        }
        Store::query()->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    // --- 4. CUSTOMERS ---
    public function storeCustomer(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $email = strtolower(trim((string) $request->input('email', '')));
        $phone = trim((string) $request->input('phone', ''));
        $address = trim((string) $request->input('default_address', ''));

        if (mb_strlen($name) < 2) {
            return response()->json(['message' => 'Nama pelanggan minimal 2 karakter.'], 422);
        }

        $resolvedEmail = $email !== '' ? $email : 'pelanggan.'.time().'@rotihajatan.id';
        if (User::query()->whereRaw('LOWER(email) = ?', [$resolvedEmail])->exists()) {
            return response()->json(['message' => 'Email pelanggan sudah terdaftar.'], 422);
        }

        $customer = User::create([
            'name' => $name,
            'email' => $resolvedEmail,
            'role' => 'customer',
            'phone' => $phone !== '' ? $phone : null,
            'default_address' => $address !== '' ? $address : null,
            'password' => Hash::make('password123'),
        ]);

        return response()->json(['customer' => $customer->toFrontendArray()], 201);
    }

    public function updateCustomer(Request $request, int $id): JsonResponse
    {
        $customer = User::query()->where('id', $id)->where('role', 'customer')->first();
        if (! $customer) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan.'], 404);
        }

        if ($request->has('name')) {
            $name = trim((string) $request->input('name'));
            if ($name === '') {
                return response()->json(['message' => 'Nama pelanggan wajib diisi.'], 422);
            }
            $customer->name = $name;
        }
        if ($request->has('phone')) {
            $customer->phone = trim((string) $request->input('phone')) ?: null;
        }
        if ($request->has('default_address')) {
            $customer->default_address = trim((string) $request->input('default_address')) ?: null;
        }

        $customer->save();

        return response()->json(['customer' => $customer->toFrontendArray()]);
    }

    public function destroyCustomer(int $id): JsonResponse
    {
        User::query()->where('id', $id)->where('role', 'customer')->delete();

        return response()->json(['ok' => true]);
    }

    // --- 5. PROMOS ---
    public function storePromo(Request $request): JsonResponse
    {
        $code = strtoupper(preg_replace('/\s+/', '', trim((string) $request->input('code', ''))));
        $title = trim((string) $request->input('title', ''));
        $discountType = $request->input('discount_type') === 'fixed' ? 'fixed' : 'percent';
        $discountValue = max(0, (int) floor((float) $request->input('discount_value', 0)));
        $minOrder = max(0, (int) floor((float) $request->input('min_order', 0)));
        $isActive = $request->input('is_active', true) !== false;

        if (strlen($code) < 3) {
            return response()->json(['message' => 'Kode promo minimal 3 karakter.'], 422);
        }
        if ($title === '') {
            return response()->json(['message' => 'Judul promo wajib diisi.'], 422);
        }
        if ($discountValue <= 0) {
            return response()->json(['message' => 'Nilai diskon harus lebih dari 0.'], 422);
        }
        if (Promo::query()->whereRaw('UPPER(code) = ?', [$code])->exists()) {
            return response()->json(['message' => 'Kode promo sudah digunakan.'], 422);
        }

        $promo = Promo::create([
            'code' => $code,
            'title' => $title,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'min_order' => $minOrder,
            'is_active' => $isActive,
        ]);

        return response()->json(['promo' => $promo->toFrontendArray()], 201);
    }

    public function updatePromo(Request $request, int $id): JsonResponse
    {
        $promo = Promo::query()->find($id);
        if (! $promo) {
            return response()->json(['message' => 'Promo tidak ditemukan.'], 404);
        }

        if ($request->has('code')) {
            $code = strtoupper(preg_replace('/\s+/', '', trim((string) $request->input('code'))));
            if (strlen($code) < 3) {
                return response()->json(['message' => 'Kode promo minimal 3 karakter.'], 422);
            }
            $promo->code = $code;
        }
        if ($request->has('title')) {
            $promo->title = trim((string) $request->input('title'));
        }
        if ($request->has('discount_type')) {
            $promo->discount_type = $request->input('discount_type') === 'fixed' ? 'fixed' : 'percent';
        }
        if ($request->has('discount_value')) {
            $promo->discount_value = max(1, (int) floor((float) $request->input('discount_value')));
        }
        if ($request->has('min_order')) {
            $promo->min_order = max(0, (int) floor((float) $request->input('min_order')));
        }
        if ($request->has('is_active')) {
            $promo->is_active = (bool) $request->input('is_active');
        }

        $promo->save();

        return response()->json(['promo' => $promo->toFrontendArray()]);
    }

    public function destroyPromo(int $id): JsonResponse
    {
        Promo::query()->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    // --- 6. ADS ---
    public function storeAd(Request $request): JsonResponse
    {
        $title = trim((string) $request->input('title', ''));
        $subtitle = trim((string) $request->input('subtitle', ''));
        $image = trim((string) $request->input('image', '')) ?: '/src/assets/images/hero_bakery_spread_1794924158422.jpg';
        $ctaLabel = trim((string) $request->input('cta_label', '')) ?: 'Lihat Menu';
        $isActive = $request->input('is_active', true) !== false;

        if (mb_strlen($title) < 3) {
            return response()->json(['message' => 'Judul iklan minimal 3 karakter.'], 422);
        }

        $ad = Ad::create([
            'title' => $title,
            'subtitle' => $subtitle,
            'image' => $image,
            'cta_label' => $ctaLabel,
            'is_active' => $isActive,
        ]);

        return response()->json(['ad' => $ad->toFrontendArray()], 201);
    }

    public function updateAd(Request $request, int $id): JsonResponse
    {
        $ad = Ad::query()->find($id);
        if (! $ad) {
            return response()->json(['message' => 'Iklan tidak ditemukan.'], 404);
        }

        if ($request->has('title')) {
            $ad->title = trim((string) $request->input('title'));
        }
        if ($request->has('subtitle')) {
            $ad->subtitle = trim((string) $request->input('subtitle'));
        }
        if ($request->has('image') && trim((string) $request->input('image')) !== '') {
            $ad->image = trim((string) $request->input('image'));
        }
        if ($request->has('cta_label')) {
            $ad->cta_label = trim((string) $request->input('cta_label')) ?: 'Lihat Menu';
        }
        if ($request->has('is_active')) {
            $ad->is_active = (bool) $request->input('is_active');
        }

        $ad->save();

        return response()->json(['ad' => $ad->toFrontendArray()]);
    }

    public function destroyAd(int $id): JsonResponse
    {
        Ad::query()->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }
}
