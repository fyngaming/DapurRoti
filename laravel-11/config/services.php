<?php

return [
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'bakery' => [
        'store_name' => env('STORE_NAME', 'Dapur Roti Hajatan'),
        'admin_whatsapp' => env('ADMIN_WHATSAPP_NUMBER', '6281234567890'),
        'bank_info' => env('STORE_BANK_INFO', 'BCA - 1234567890 - a.n. Dapur Roti Hajatan'),
    ],
];
