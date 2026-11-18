<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'image',
        'cta_label',
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
            'title' => (string) $this->title,
            'subtitle' => (string) ($this->subtitle ?? ''),
            'image' => (string) $this->image,
            'cta_label' => (string) ($this->cta_label ?? 'Lihat Menu'),
            'is_active' => (bool) $this->is_active,
        ];
    }
}
