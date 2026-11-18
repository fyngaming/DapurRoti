@extends('layouts.app')

@section('content')
<div x-data="bakeryShop({
    isLoggedIn: {{ auth()->check() ? 'true' : 'false' }},
    userName: @js(auth()->user()->name ?? ''),
    userEmail: @js(auth()->user()->email ?? ''),
    userPhone: @js(auth()->user()->phone ?? ''),
    userAddress: @js(auth()->user()->default_address ?? ''),
    storeName: @js(config('services.bakery.store_name')),
    bankInfo: @js(config('services.bakery.bank_info')),
    orderStoreUrl: @js(route('orders.store')),
    loginUrl: @js(route('login')),
    googleUrl: @js(route('auth.google'))
})">
    {{-- Hero Section --}}
    <section class="pt-10 pb-12 border-b border-[#5C3A21]/10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-6">
                <p class="text-xs font-semibold uppercase tracking-widest text-[#D97706] mb-3">
                    Roti Hajatan &amp; Snack Box · Fresh Setiap Pagi
                </p>
                <h1 class="font-['Fraunces'] text-3xl sm:text-5xl font-bold text-[#5C3A21] leading-tight">
                    Roti Hangat &amp; Snack Box untuk Setiap Momen Hajatan
                </h1>
                <p class="mt-4 text-base text-[#6E5644] leading-relaxed">
                    Dipanggang segar dengan mentega pilihan untuk pengajian, tasyakuran, rapat kantor, dan hantaran keluarga. Bisa Pre-Order DP 50% dengan konfirmasi langsung ke WhatsApp Admin.
                </p>
                <div class="mt-7 flex flex-wrap gap-4">
                    <a href="#katalog" class="px-6 py-3 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors">
                        Lihat Menu &amp; Pesan
                    </a>
                </div>
            </div>
            <div class="lg:col-span-6">
                <img
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80"
                    alt="Roti Hajatan Segar"
                    class="w-full h-72 sm:h-96 object-cover rounded-2xl border border-[#5C3A21]/10"
                >
            </div>
        </div>
    </section>

    {{-- Katalog Produk --}}
    <section id="katalog" class="py-12 sm:py-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">
            <div class="mb-8">
                <p class="text-xs font-semibold uppercase tracking-widest text-[#D97706]">Menu Pilihan Dapur</p>
                <h2 class="mt-1 font-['Fraunces'] text-2xl sm:text-3xl font-bold text-[#5C3A21]">
                    Katalog Roti &amp; Paket Hajatan
                </h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach ($products as $product)
                    <article class="bg-white rounded-2xl border border-[#5C3A21]/10 overflow-hidden flex flex-col">
                        <img src="{{ $product->image }}" alt="{{ $product->name }}" class="aspect-[4/3] w-full object-cover bg-[#FAF5EC]">
                        <div class="p-5 flex-1 flex flex-col">
                            <h3 class="font-['Fraunces'] text-lg font-bold text-[#5C3A21]">{{ $product->name }}</h3>
                            <p class="mt-2 text-sm text-[#6E5644] flex-1">{{ $product->description }}</p>

                            <div class="mt-5 pt-4 border-t border-[#5C3A21]/10 flex items-center justify-between gap-3">
                                <span class="text-base font-bold text-[#5C3A21]">
                                    Rp {{ number_format($product->price, 0, ',', '.') }}
                                </span>

                                <template x-if="getQty({{ $product->id }}) === 0">
                                    <button
                                        type="button"
                                        @click="addItem({ id: {{ $product->id }}, name: @js($product->name), price: {{ $product->price }} })"
                                        class="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
                                    >
                                        + Tambah
                                    </button>
                                </template>

                                <template x-if="getQty({{ $product->id }}) > 0">
                                    <div class="inline-flex items-center gap-2 bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl p-1">
                                        <button type="button" @click="updateQty({{ $product->id }}, -1)" class="w-8 h-8 rounded-lg hover:bg-white font-bold">-</button>
                                        <span class="min-w-[24px] text-center text-sm font-bold" x-text="getQty({{ $product->id }})"></span>
                                        <button type="button" @click="updateQty({{ $product->id }}, 1)" class="w-8 h-8 rounded-lg hover:bg-white font-bold">+</button>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Floating Cart Bar --}}
    <div x-show="cart.length > 0" x-cloak class="fixed bottom-0 inset-x-0 z-40 px-4 pb-4">
        <div class="max-w-3xl mx-auto bg-[#5C3A21] text-white rounded-2xl shadow-lg px-5 py-3 flex items-center justify-between gap-4">
            <div>
                <p class="text-xs text-[#E8DDD0]" x-text="`${totalItems} item dipilih`"></p>
                <p class="text-base font-bold" x-text="formatRupiah(totalAmount)"></p>
            </div>
            <button
                type="button"
                @click="handleProceedCheckout()"
                class="px-5 py-2.5 text-sm font-semibold bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors"
            >
                Lanjut Pesan &rarr;
            </button>
        </div>
    </div>

    {{-- Modal Prompt Login untuk Guest --}}
    <div x-show="showGuestModal" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C3A21]/50">
        <div class="w-full max-w-md bg-[#FFFDF9] rounded-2xl p-6 border border-[#5C3A21]/15 shadow-xl space-y-4">
            <h3 class="font-['Fraunces'] text-xl font-bold text-[#5C3A21]">Masuk Sebelum Melanjutkan</h3>
            <p class="text-sm text-[#6E5644]">
                Keranjang Anda sudah tersimpan otomatis di browser. Silakan masuk dengan Google atau Email untuk mengisi detail acara.
            </p>
            <div class="space-y-2.5 pt-2">
                <a :href="googleUrl" class="block w-full text-center py-2.5 px-4 text-sm font-semibold bg-white border border-[#5C3A21]/20 rounded-xl hover:bg-[#FAF5EC]">
                    Masuk dengan Google
                </a>
                <a :href="loginUrl" class="block w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-[#D97706] rounded-xl hover:bg-[#B45309]">
                    Masuk / Daftar dengan Email
                </a>
                <button type="button" @click="showGuestModal = false" class="w-full py-2 text-xs text-[#7C604C]">
                    Tutup
                </button>
            </div>
        </div>
    </div>

    {{-- Modal Checkout + Live Preview WhatsApp --}}
    <div x-show="showCheckoutModal" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C3A21]/50">
        <div class="w-full max-w-5xl bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="px-6 py-4 bg-white border-b border-[#5C3A21]/10 flex justify-between items-center">
                <h3 class="font-['Fraunces'] text-xl font-bold text-[#5C3A21]">Formulir Pemesanan &amp; Preview WhatsApp</h3>
                <button type="button" @click="showCheckoutModal = false" class="text-sm text-[#7C604C]">Tutup</button>
            </div>

            <form @submit.prevent="submitOrder()" class="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
                <div class="lg:col-span-7 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#5C3A21]/10">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold mb-1">Nama Pemesan *</label>
                            <input type="text" x-model="form.customer_name" required class="w-full px-3.5 py-2 text-sm border border-[#5C3A21]/20 rounded-xl">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1">Email Pemesan</label>
                            <input type="email" x-model="form.customer_email" readonly class="w-full px-3.5 py-2 text-sm bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold mb-1">Nomor WhatsApp *</label>
                            <input type="tel" x-model="form.customer_phone" required placeholder="081234567890" class="w-full px-3.5 py-2 text-sm border border-[#5C3A21]/20 rounded-xl">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold mb-1">Tanggal &amp; Jam Acara *</label>
                            <input type="datetime-local" x-model="form.event_datetime" required class="w-full px-3.5 py-2 text-sm border border-[#5C3A21]/20 rounded-xl">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold mb-1">Alamat Lengkap Pengiriman / Pengambilan *</label>
                        <textarea rows="2" x-model="form.delivery_address" required class="w-full px-3.5 py-2 text-sm border border-[#5C3A21]/20 rounded-xl"></textarea>
                    </div>

                    <div>
                        <span class="block text-xs font-semibold mb-2">Jenis Pesanan</span>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label class="flex items-start gap-2 p-3 rounded-xl border cursor-pointer" :class="form.order_type === 'po' ? 'bg-[#FAF5EC] border-[#D97706]' : 'bg-white border-[#5C3A21]/15'">
                                <input type="radio" value="po" x-model="form.order_type" class="mt-1">
                                <span class="text-xs">
                                    <strong class="block">Pre-Order (PO) - DP 50%</strong>
                                    <span x-text="`DP: ${formatRupiah(dpAmount)} · Sisa: ${formatRupiah(totalAmount - dpAmount)}`"></span>
                                </span>
                            </label>
                            <label class="flex items-start gap-2 p-3 rounded-xl border cursor-pointer" :class="form.order_type === 'direct' ? 'bg-[#FAF5EC] border-[#D97706]' : 'bg-white border-[#5C3A21]/15'">
                                <input type="radio" value="direct" x-model="form.order_type" class="mt-1">
                                <span class="text-xs">
                                    <strong class="block">Pesan Langsung / Lunas</strong>
                                    <span x-text="`Bayar penuh: ${formatRupiah(totalAmount)}`"></span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <span class="block text-xs font-semibold mb-2">Metode Pembayaran</span>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label class="flex items-start gap-2 p-3 rounded-xl border cursor-pointer" :class="form.payment_method === 'cash' ? 'bg-[#FAF5EC] border-[#D97706]' : 'bg-white border-[#5C3A21]/15'">
                                <input type="radio" value="cash" x-model="form.payment_method" class="mt-1">
                                <span class="text-xs"><strong class="block">Bayar Tunai / COD</strong>Saat barang diambil/diantar</span>
                            </label>
                            <label class="flex items-start gap-2 p-3 rounded-xl border cursor-pointer" :class="form.payment_method === 'transfer' ? 'bg-[#FAF5EC] border-[#D97706]' : 'bg-white border-[#5C3A21]/15'">
                                <input type="radio" value="transfer" x-model="form.payment_method" class="mt-1">
                                <span class="text-xs"><strong class="block">Transfer Bank Manual</strong>Kirim bukti di WA</span>
                            </label>
                        </div>
                        <div x-show="form.payment_method === 'transfer'" class="mt-2 p-3 rounded-xl bg-[#FAF5EC] border border-[#D97706]/30 text-xs">
                            <strong>Rekening Transfer:</strong> <span x-text="bankInfo"></span>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-5 p-6 bg-[#FAF5EC] flex flex-col justify-between gap-4">
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-[#5C3A21] mb-2">Live Preview Chat WhatsApp</h4>
                        <div class="p-3.5 rounded-2xl bg-[#EFEAE2] border border-[#5C3A21]/10">
                            <pre class="bg-[#E7FFDB] p-3.5 rounded-xl text-xs whitespace-pre-wrap font-sans leading-relaxed" x-text="whatsappPreview"></pre>
                        </div>
                    </div>

                    <button type="submit" :disabled="isSubmitting" class="w-full py-3 px-4 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors">
                        <span x-text="isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim Pesanan ke WhatsApp Admin'"></span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function bakeryShop(config) {
    return {
        cart: JSON.parse(localStorage.getItem('roti_hajatan_cart') || '[]'),
        showGuestModal: false,
        showCheckoutModal: false,
        isSubmitting: false,
        form: {
            customer_name: config.userName,
            customer_email: config.userEmail,
            customer_phone: config.userPhone,
            delivery_address: config.userAddress,
            event_datetime: '',
            order_type: 'po',
            payment_method: 'transfer',
        },
        saveCart() {
            localStorage.setItem('roti_hajatan_cart', JSON.stringify(this.cart));
        },
        getQty(id) {
            const found = this.cart.find(i => i.product_id === id);
            return found ? found.quantity : 0;
        },
        addItem(product) {
            const found = this.cart.find(i => i.product_id === product.id);
            if (found) found.quantity++;
            else this.cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
            this.saveCart();
        },
        updateQty(id, delta) {
            this.cart = this.cart
                .map(i => i.product_id === id ? { ...i, quantity: i.quantity + delta } : i)
                .filter(i => i.quantity > 0);
            this.saveCart();
        },
        get totalItems() {
            return this.cart.reduce((sum, i) => sum + i.quantity, 0);
        },
        get totalAmount() {
            return this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        },
        get dpAmount() {
            return this.form.order_type === 'po' ? Math.round(this.totalAmount * 0.5) : 0;
        },
        formatRupiah(n) {
            return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
        },
        get whatsappPreview() {
            const lines = [
                `Halo Admin *${config.storeName}*, saya ingin memesan roti/snack box untuk acara.`,
                '',
                '*DATA PEMESAN*',
                `- Nama: ${this.form.customer_name || '-'}`,
                `- Email: ${this.form.customer_email || '-'}`,
                `- No. WhatsApp: ${this.form.customer_phone || '-'}`,
                `- Alamat: ${this.form.delivery_address || '-'}`,
                `- Tanggal & Jam Acara: ${this.form.event_datetime || '-'}`,
                '',
                '*RINCIAN PESANAN*',
                ...this.cart.map((i, idx) => `${idx + 1}. ${i.name} (${i.quantity}x @ ${this.formatRupiah(i.price)}) = ${this.formatRupiah(i.price * i.quantity)}`),
                '',
                '*RINGKASAN PEMBAYARAN*',
                `- Total Harga: *${this.formatRupiah(this.totalAmount)}*`,
                this.form.order_type === 'po'
                    ? `- Jenis Pesanan: Pre-Order (PO) - DP 50%\n- Nominal DP 50%: *${this.formatRupiah(this.dpAmount)}*\n- Sisa Pelunasan: ${this.formatRupiah(this.totalAmount - this.dpAmount)}`
                    : '- Jenis Pesanan: Pesan Langsung / Lunas',
                `- Metode Pembayaran: ${this.form.payment_method === 'transfer' ? 'Transfer Bank Manual (' + config.bankInfo + ')' : 'Bayar Tunai / COD'}`,
                '',
                'Mohon konfirmasi ketersediaan jadwal & total tagihan. Terima kasih!'
            ];
            return lines.join('\n');
        },
        handleProceedCheckout() {
            if (!config.isLoggedIn) {
                this.showGuestModal = true;
                return;
            }
            this.showCheckoutModal = true;
        },
        async submitOrder() {
            this.isSubmitting = true;
            try {
                const res = await fetch(config.orderStoreUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({
                        ...this.form,
                        items: this.cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.message || 'Gagal menyimpan pesanan.');
                    return;
                }
                this.cart = [];
                this.saveCart();
                window.open(data.whatsapp_url, '_blank');
                window.location.href = data.redirect_url;
            } finally {
                this.isSubmitting = false;
            }
        }
    };
}
</script>
@endsection
