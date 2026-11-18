@extends('layouts.app')

@section('content')
<section class="py-10 sm:py-14">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <a href="{{ route('home') }}" class="text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21]">&larr; Kembali ke Katalog</a>
        <h1 class="mt-2 font-['Fraunces'] text-2xl sm:text-3xl font-bold text-[#5C3A21]">
            Riwayat Pesanan Saya
        </h1>

        @if ($orders->isEmpty())
            <div class="mt-6 bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center">
                <p class="font-semibold text-[#5C3A21]">Belum ada pesanan tercatat.</p>
                <a href="{{ route('home') }}" class="inline-block mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-[#D97706] rounded-xl">
                    Pesan Roti Sekarang
                </a>
            </div>
        @else
            <div class="mt-6 space-y-6">
                @foreach ($orders as $order)
                    <article class="bg-white rounded-2xl border border-[#5C3A21]/15 overflow-hidden">
                        <div class="px-5 py-4 bg-[#FAF5EC] border-b border-[#5C3A21]/10 flex flex-wrap justify-between items-center gap-3">
                            <div>
                                <p class="font-mono text-sm font-bold text-[#5C3A21]">{{ $order->order_code }}</p>
                                <p class="text-xs text-[#7C604C]">Acara: {{ $order->event_datetime->translatedFormat('l, d F Y H:i') }}</p>
                            </div>
                            <span class="px-3 py-1 text-xs font-semibold rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                                {{ strtoupper(str_replace('_', ' ', $order->status)) }}
                            </span>
                        </div>

                        <div class="p-5 space-y-4 text-xs">
                            <p><strong>Alamat:</strong> {{ $order->delivery_address }}</p>

                            <table class="w-full">
                                <thead>
                                    <tr class="text-left text-[#7C604C] border-b border-[#5C3A21]/10">
                                        <th class="py-1.5">Menu</th>
                                        <th class="py-1.5 text-right">Qty</th>
                                        <th class="py-1.5 text-right">Harga</th>
                                        <th class="py-1.5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[#5C3A21]/5">
                                    @foreach ($order->items as $item)
                                        <tr>
                                            <td class="py-2 font-medium">{{ $item->product_name }}</td>
                                            <td class="py-2 text-right">{{ $item->quantity }}</td>
                                            <td class="py-2 text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                                            <td class="py-2 text-right font-semibold">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>

                            <div class="pt-3 border-t border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p>Total: <strong class="text-sm">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</strong></p>
                                    @if ($order->order_type === 'po')
                                        <p class="text-[#D97706] font-semibold">DP 50%: Rp {{ number_format($order->dp_amount, 0, ',', '.') }}</p>
                                    @endif
                                </div>
                                <a href="{{ $order->whatsapp_url }}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl">
                                    Konfirmasi Ulang via WA
                                </a>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        @endif
    </div>
</section>
@endsection
