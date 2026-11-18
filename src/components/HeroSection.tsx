import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExploreCatalog: () => void;
  isMobileMode?: boolean;
}

export function HeroSection({ onExploreCatalog, isMobileMode = false }: HeroSectionProps) {
  return (
    <section
      className={`${
        isMobileMode ? 'pt-5 pb-7' : 'pt-8 pb-10 sm:pt-12 sm:pb-14'
      } border-b border-[#5C3A21]/10`}
    >
      <div className={`max-w-6xl mx-auto ${isMobileMode ? 'px-4' : 'px-4 sm:px-6'}`}>
        <div className="mode-grid-hero grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97706] mb-2.5">
              Roti Hajatan &amp; Snack Box · Fresh Setiap Pagi
            </p>
            <h1
              className={`font-display ${
                isMobileMode ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-[46px]'
              } font-bold text-[#5C3A21] leading-[1.15] tracking-tight text-balance`}
            >
              Roti Hangat &amp; Snack Box untuk Setiap Momen Hajatan
            </h1>
            <p
              className={`mt-3 ${
                isMobileMode ? 'text-sm' : 'text-base'
              } text-[#6E5644] leading-relaxed max-w-xl`}
            >
              Dipanggang segar dengan mentega pilihan dan isian melimpah untuk pengajian,
              tasyakuran, rapat kantor, maupun hantaran keluarga. Tersedia Pre-Order dengan DP 50%
              dan konfirmasi langsung via WhatsApp.
            </p>

            <div className={`${isMobileMode ? 'mt-5' : 'mt-7'} flex flex-wrap items-center gap-3`}>
              <button
                type="button"
                onClick={onExploreCatalog}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <span>Lihat Menu &amp; Pesan</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="#cara-pesan"
                className="inline-flex items-center px-3 py-2.5 text-sm font-semibold text-[#5C3A21] hover:text-[#D97706] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                Cara Pemesanan
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div
              className={`relative ${
                isMobileMode ? 'h-52' : 'h-64 sm:h-80 lg:h-full min-h-[300px]'
              } rounded-2xl overflow-hidden bg-[#FAF5EC] border border-[#5C3A21]/10`}
            >
              <img
                src="/src/assets/images/hero_bakery_spread_1794924158422.jpg"
                alt="Aneka roti sobek hangat, roti manis, dan paket snack box hajatan di atas meja kayu"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width service strip below hero split */}
        <div
          className={`mode-grid-services ${
            isMobileMode ? 'mt-6 pt-5' : 'mt-10 pt-8'
          } border-t border-[#5C3A21]/10 grid grid-cols-2 lg:grid-cols-4 gap-6`}
        >
          <div>
            <p className="text-sm font-semibold text-[#5C3A21]">Panggang Sesuai Jadwal</p>
            <p className="mt-1 text-xs text-[#7C604C] leading-relaxed">
              Dibuat segar beberapa jam sebelum jam acara dimulai.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#5C3A21]">Pre-Order DP 50%</p>
            <p className="mt-1 text-xs text-[#7C604C] leading-relaxed">
              Kunci tanggal acara dengan DP ringan 50%, pelunasan saat siap kirim.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#5C3A21]">Kemasan Rapi &amp; Higienis</p>
            <p className="mt-1 text-xs text-[#7C604C] leading-relaxed">
              Dus kraft eksklusif siap dibagikan untuk tamu pengajian atau rapat.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#5C3A21]">Konfirmasi WhatsApp Cepat</p>
            <p className="mt-1 text-xs text-[#7C604C] leading-relaxed">
              Rincian pesanan otomatis tersusun rapi menuju WhatsApp Admin.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
