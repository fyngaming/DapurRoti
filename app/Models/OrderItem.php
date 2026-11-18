<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'variant',
        'price',
        'quantity',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'quantity' => 'integer',
            'subtotal' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => (int) $this->id,
            'order_id' => (int) $this->order_id,
            'product_id' => (int) $this->product_id,
            'product_name' => (string) $this->product_name,
            'variant' => (string) ($this->variant ?: 'Original'),
            'price' => (int) $this->price,
            'quantity' => (int) $this->quantity,
            'subtotal' => (int) $this->subtotal,
        ];
    }
}
