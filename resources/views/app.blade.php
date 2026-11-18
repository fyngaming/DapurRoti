<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#5C3A21" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Dapur Roti" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>{{ config('app.name', 'Dapur Roti Hajatan') }} — Segar dari Oven untuk Acara Anda</title>
    <meta
      name="description"
      content="Pesan Roti Hajatan dan Snack Box fresh from the oven untuk pengajian, syukuran, rapat, dan acara keluarga. Bisa Pre-Order DP 50% dengan konfirmasi langsung ke WhatsApp Admin."
    />
    <meta property="og:title" content="Dapur Roti Hajatan & Snack Box" />
    <meta
      property="og:description"
      content="Pesan Roti Hajatan dan Snack Box fresh from the oven untuk pengajian, syukuran, rapat, dan acara keluarga."
    />
    <meta property="og:type" content="website" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    @viteReactRefresh
    @vite(['resources/js/main.tsx'])
  </head>
  <body class="bg-[#FFFDF9] text-[#5C3A21] antialiased selection:bg-[#D97706]/20 selection:text-[#5C3A21]">
    <div id="root"></div>
  </body>
</html>
