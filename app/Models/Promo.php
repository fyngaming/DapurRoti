<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $fillable = [
        'code',
        'title',
        'discount_type',
        'discount_value',
        'min_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'integer',
            'min_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => (int) $this->id,
            'code' => (string) $this->code,
            'title' => (string) $this->title,
            'discount_type' => $this->discount_type === 'fixed' ? 'fixed' : 'percent',
            'discount_value' => (int) $this->discount_value,
            'min_order' => (int) $this->min_order,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
