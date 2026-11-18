<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    public $incrementing = false;

    protected $fillable = [
        'id',
        'brand_name',
        'tagline',
        'footer_service_text',
        'operating_hours',
        'footer_address',
        'footer_copyright',
        'admin_whatsapp',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
    ];

    public static function defaults(): array
    {
        return [
            'brandName' => 'Dapur Roti Hajatan',
            'tagline' => 'Roti Hajatan & Snack Box Segar dari Oven',
            'footerServiceText' => 'Layanan Roti Hajatan & Snack Box',
            'operatingHours' => 'Setiap hari 06.00 – 19.00 WIB',
            'footerAddress' => '',
            'footerCopyright' => 'Seluruh hak cipta dilindungi.',
            'adminWhatsapp' => '6281234567890',
            'bankName' => 'BCA',
            'bankAccountNumber' => '1234567890',
            'bankAccountHolder' => 'Dapur Roti Hajatan',
        ];
    }

    public static function current(): array
    {
        $row = static::query()->find(1);
        if (! $row) {
            return static::defaults();
        }

        return [
            'brandName' => (string) ($row->brand_name ?: 'Dapur Roti Hajatan'),
            'tagline' => (string) ($row->tagline ?? ''),
            'footerServiceText' => (string) ($row->footer_service_text ?: 'Layanan Roti Hajatan & Snack Box'),
            'operatingHours' => (string) ($row->operating_hours ?: 'Setiap hari 06.00 – 19.00 WIB'),
            'footerAddress' => (string) ($row->footer_address ?? ''),
            'footerCopyright' => (string) ($row->footer_copyright ?: 'Seluruh hak cipta dilindungi.'),
            'adminWhatsapp' => (string) ($row->admin_whatsapp ?: '6281234567890'),
            'bankName' => (string) ($row->bank_name ?: 'BCA'),
            'bankAccountNumber' => (string) ($row->bank_account_number ?: '1234567890'),
            'bankAccountHolder' => (string) ($row->bank_account_holder ?: 'Dapur Roti Hajatan'),
        ];
    }
}
