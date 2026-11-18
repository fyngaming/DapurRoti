<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('services.bakery.store_name', 'Dapur Roti Hajatan') }} — Roti Hajatan & Snack Box</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-[#FFFDF9] text-[#5C3A21] antialiased font-['Plus_Jakarta_Sans']">
    <header class="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-sm border-b border-[#5C3A21]/10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
            <a href="{{ route('home') }}" class="font-['Fraunces'] text-lg sm:text-xl font-bold text-[#5C3A21] whitespace-nowrap">
                {{ config('services.bakery.store_name', 'Dapur Roti Hajatan') }}
            </a>

            <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-[#7C604C]">
                <a href="{{ route('home') }}#katalog" class="hover:text-[#5C3A21]">Katalog Roti</a>
                <a href="{{ route('home') }}#cara-pesan" class="hover:text-[#5C3A21]">Cara Pesan</a>
                @auth
                    <a href="{{ route('orders.index') }}" class="hover:text-[#5C3A21] {{ request()->routeIs('orders.index') ? 'text-[#5C3A21] font-semibold underline underline-offset-4' : '' }}">
                        Riwayat Pesanan
                    </a>
                @endauth
            </nav>

            <div class="flex items-center gap-3">
                @guest
                    <a href="{{ route('login') }}" class="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors whitespace-nowrap">
                        Masuk / Daftar
                    </a>
                @else
                    <span class="hidden sm:inline text-sm font-medium text-[#5C3A21]">{{ auth()->user()->name }}</span>
                    <a href="{{ route('orders.index') }}" class="md:hidden text-xs font-semibold text-[#5C3A21] underline">Pesanan</a>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="px-3.5 py-2 text-xs font-semibold text-[#5C3A21] border border-[#5C3A21]/20 hover:bg-[#FAF5EC] rounded-lg transition-colors">
                            Logout
                        </button>
                    </form>
                @endguest
            </div>
        </div>
    </header>

    <main>
        @yield('content')
    </main>

    <footer class="border-t border-[#5C3A21]/10 bg-[#FFFDF9] py-10 pb-24 mt-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-[#6E5644]">
            <div>
                <p class="font-['Fraunces'] text-base font-bold text-[#5C3A21]">
                    {{ config('services.bakery.store_name', 'Dapur Roti Hajatan') }}
                </p>
                <p class="mt-1">Roti Hajatan & Snack Box · Fresh Setiap Pagi</p>
            </div>
            <div class="sm:text-right">
                <p>Rekening Resmi: {{ config('services.bakery.bank_info') }}</p>
                <p class="mt-1">&copy; {{ date('Y') }} {{ config('services.bakery.store_name') }}</p>
            </div>
        </div>
    </footer>
</body>
</html>
