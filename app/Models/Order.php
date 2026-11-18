<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_code',
        'user_id',
        'store_id',
        'store_name',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_address',
        'event_datetime',
        'order_type',
        'payment_method',
        'promo_code',
        'discount_amount',
        'total_amount',
        'dp_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'discount_amount' => 'integer',
            'total_amount' => 'integer',
            'dp_amount' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function buildWhatsappUrl(array $settings, ?Store $store = null): string
    {
        $rawWa = $store?->phone ?: ($settings['adminWhatsapp'] ?? '6281234567890');
        $cleanWa = preg_replace('/[^0-9]/', '', (string) $rawWa);
        if (str_starts_with($cleanWa, '0')) {
            $cleanWa = '62'.substr($cleanWa, 1);
        }

        $brandName = $settings['brandName'] ?? 'Dapur Roti Hajatan';
        $bankDetails = ($settings['bankName'] ?? 'BCA').' - '.($settings['bankAccountNumber'] ?? '1234567890').' a.n. '.($settings['bankAccountHolder'] ?? $brandName);
        $storeName = $this->store_name ?: ($store?->name ?? $brandName);

        $lines = [
            "Halo Admin *{$brandName}*, saya ingin konfirmasi pesanan roti/snack box.",
            "Kode Pesanan: *{$this->order_code}*",
            "Cabang Toko: *{$storeName}*",
            '',
            '*DATA PEMESAN*',
            "- Nama: {$this->customer_name}",
            "- Email: {$this->customer_email}",
            "- No. WhatsApp: {$this->customer_phone}",
            "- Alamat: {$this->delivery_address}",
            "- Tanggal & Jam Acara: {$this->event_datetime}",
            '',
            '*RINCIAN PESANAN*',
        ];

        $subtotalSum = 0;
        foreach ($this->items as $idx => $item) {
            $num = $idx + 1;
            $priceFmt = number_format((int) $item->price, 0, ',', '.');
            $subFmt = number_format((int) $item->subtotal, 0, ',', '.');
            $subtotalSum += (int) $item->subtotal;
            $variant = $item->variant ?: 'Original';
            $lines[] = "{$num}. {$item->product_name} [{$variant}] ({$item->quantity}x @ Rp {$priceFmt}) = Rp {$subFmt}";
        }

        $lines[] = '';
        $lines[] = '*RINGKASAN PEMBAYARAN*';
        if ((int) $this->discount_amount > 0) {
            $subAllFmt = number_format($subtotalSum, 0, ',', '.');
            $discFmt = number_format((int) $this->discount_amount, 0, ',', '.');
            $codeLabel = $this->promo_code ? " ({$this->promo_code})" : '';
            $lines[] = "- Subtotal: Rp {$subAllFmt}";
            $lines[] = "- Diskon Promo{$codeLabel}: -Rp {$discFmt}";
        }

        $totalFmt = number_format((int) $this->total_amount, 0, ',', '.');
        $lines[] = "- Total Harga: *Rp {$totalFmt}*";

        if ($this->order_type === 'po') {
            $dpFmt = number_format((int) $this->dp_amount, 0, ',', '.');
            $sisaFmt = number_format(max(0, (int) $this->total_amount - (int) $this->dp_amount), 0, ',', '.');
            $lines[] = '- Jenis Pesanan: Pre-Order (PO) - DP 50%';
            $lines[] = "- Nominal DP 50%: *Rp {$dpFmt}*";
            $lines[] = "- Sisa Pelunasan: Rp {$sisaFmt}";
        } else {
            $lines[] = '- Jenis Pesanan: Pesan Langsung / Lunas';
        }

        $paymentLabel = $this->payment_method === 'transfer'
            ? "Transfer Bank Manual ({$bankDetails})"
            : 'Bayar Tunai / COD';
        $lines[] = "- Metode Pembayaran: {$paymentLabel}";
        $lines[] = '';
        $lines[] = 'Mohon konfirmasi ketersediaan jadwal & total tagihan. Terima kasih!';

        return "https://wa.me/{$cleanWa}?text=".rawurlencode(implode("\n", $lines));
    }

    public function toFrontendArray(array $settings, ?Store $store = null): array
    {
        return [
            'id' => (int) $this->id,
            'order_code' => (string) $this->order_code,
            'user_id' => (int) $this->user_id,
            'store_id' => $this->store_id !== null ? (int) $this->store_id : null,
            'store_name' => $this->store_name,
            'customer_name' => (string) $this->customer_name,
            'customer_email' => (string) $this->customer_email,
            'customer_phone' => (string) $this->customer_phone,
            'delivery_address' => (string) $this->delivery_address,
            'event_datetime' => (string) $this->event_datetime,
            'order_type' => $this->order_type === 'direct' ? 'direct' : 'po',
            'payment_method' => $this->payment_method === 'cash' ? 'cash' : 'transfer',
            'promo_code' => $this->promo_code,
            'discount_amount' => (int) ($this->discount_amount ?? 0),
            'total_amount' => (int) $this->total_amount,
            'dp_amount' => (int) $this->dp_amount,
            'status' => (string) $this->status,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : now()->toIso8601String(),
            'items' => $this->items->map(fn (OrderItem $it) => $it->toFrontendArray())->values()->all(),
            'whatsapp_url' => $this->buildWhatsappUrl($settings, $store),
        ];
    }
}
