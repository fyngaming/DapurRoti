<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    protected $fillable = [
        'name',
        'address',
        'phone',
        'hours',
        'maps_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'address' => (string) $this->address,
            'phone' => (string) $this->phone,
            'hours' => (string) $this->hours,
            'maps_url' => $this->maps_url,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
