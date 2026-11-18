<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'price',
        'variants',
        'image',
        'stock',
        'expired_days',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'variants' => 'array',
            'stock' => 'integer',
            'expired_days' => 'integer',
            'is_available' => 'boolean',
        ];
    }

    public function toFrontendArray(): array
    {
        $variants = is_array($this->variants) && count($this->variants) > 0
            ? array_values($this->variants)
            : ['Original'];

        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'category' => (string) $this->category,
            'description' => (string) $this->description,
            'price' => (int) $this->price,
            'variants' => $variants,
            'image' => (string) $this->image,
            'stock' => (int) ($this->stock ?? 0),
            'expired_days' => max(1, (int) ($this->expired_days ?? 3)),
            'is_available' => (bool) $this->is_available,
        ];
    }
}
