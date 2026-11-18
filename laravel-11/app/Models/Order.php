<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Order
 *
 * @property int $id
 * @property string $order_code
 * @property int|null $user_id
 * @property string $customer_name
 * @property string $customer_email
 * @property string $customer_phone
 * @property string $delivery_address
 * @property \Illuminate\Support\Carbon|null $event_datetime
 * @property string $order_type
 * @property string $payment_method
 * @property int $total_amount
 * @property int $dp_amount
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\OrderItem>|\App\Models\OrderItem[] $items
 * @property-read string $whatsapp_url
 */
class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_address',
        'event_datetime',
        'order_type',
        'payment_method',
        'total_amount',
        'dp_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'event_datetime' => 'datetime',
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

    public function getWhatsappUrlAttribute(): string
    {
        $adminWa = preg_replace('/[^0-9]/', '', (string) config('services.bakery.admin_whatsapp', env('ADMIN_WHATSAPP_NUMBER', '6281234567890')));
        $storeName = (string) config('services.bakery.store_name', env('STORE_NAME', 'Dapur Roti Hajatan'));
        $bankInfo = (string) config('services.bakery.bank_info', env('STORE_BANK_INFO', 'BCA - 1234567890 - a.n. Dapur Roti Hajatan'));
        $eventDateStr = $this->event_datetime ? $this->event_datetime->translatedFormat('l, d F Y H:i') : '-';

        $lines = [
            "Halo Admin *{$storeName}*, saya ingin konfirmasi pesanan roti/snack box.",
            "Kode Pesanan: *{$this->order_code}*",
            '',
            '*DATA PEMESAN*',
            "- Nama: {$this->customer_name}",
            "- Email: {$this->customer_email}",
            "- No. WhatsApp: {$this->customer_phone}",
            "- Alamat: {$this->delivery_address}",
            '- Tanggal & Jam Acara: ' . $eventDateStr,
            '',
            '*RINCIAN PESANAN*',
        ];

        /** @var \App\Models\OrderItem $item */
        foreach ($this->items as $idx => $item) {
            $num = $idx + 1;
            $priceFmt = number_format($item->price, 0, ',', '.');
            $subFmt = number_format($item->subtotal, 0, ',', '.');
            $lines[] = "{$num}. {$item->product_name} ({$item->quantity}x @ Rp {$priceFmt}) = Rp {$subFmt}";
        }

        $totalFmt = number_format($this->total_amount, 0, ',', '.');
        $lines[] = '';
        $lines[] = '*RINGKASAN PEMBAYARAN*';
        $lines[] = "- Total Harga: *Rp {$totalFmt}*";

        if ($this->order_type === 'po') {
            $dpFmt = number_format($this->dp_amount, 0, ',', '.');
            $sisaFmt = number_format($this->total_amount - $this->dp_amount, 0, ',', '.');
            $lines[] = '- Jenis Pesanan: Pre-Order (PO) - DP 50%';
            $lines[] = "- Nominal DP 50%: *Rp {$dpFmt}*";
            $lines[] = "- Sisa Pelunasan: Rp {$sisaFmt}";
        } else {
            $lines[] = '- Jenis Pesanan: Pesan Langsung / Lunas';
        }

        $paymentLabel = $this->payment_method === 'transfer'
            ? "Transfer Bank Manual ({$bankInfo})"
            : 'Bayar Tunai / COD';
        $lines[] = "- Metode Pembayaran: {$paymentLabel}";
        $lines[] = '';
        $lines[] = 'Mohon konfirmasi ketersediaan jadwal & total tagihan. Terima kasih!';

        return "https://wa.me/{$adminWa}?text=" . rawurlencode(implode("\n", $lines));
    }
}
