import { CheckCircle2, Clock, ExternalLink, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import type { StoreBranch } from '../types/bakery';

interface StoreBranchesSectionProps {
  stores: StoreBranch[];
  selectedStoreId: number | null;
  brandName: string;
  isMobileMode?: boolean;
  onSelectStore: (storeId: number, scrollToCatalog?: boolean) => void;
}

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

function formatDisplayPhone(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.startsWith('62') && digits.length >= 10) {
    const local = digits.slice(2);
    return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }
  return phone;
}

export function getStoreGoogleMapsUrl(store: StoreBranch): string {
  if (store.maps_url && store.maps_url.trim()) {
    return store.maps_url.trim();
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${store.name} ${store.address}`
  )}`;
}

function getStoreEmbedMapUrl(store: StoreBranch): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(
    store.address
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function StoreBranchesSection({
  stores,
  selectedStoreId,
  brandName,
  isMobileMode = false,
  onSelectStore,
}: StoreBranchesSectionProps) {
  if (stores.length === 0) return null;

  const activeStore = stores.find((s) => s.id === selectedStoreId) ?? stores[0];
  const activeMapUrl = getStoreGoogleMapsUrl(activeStore);
  const activeEmbedUrl = getStoreEmbedMapUrl(activeStore);

  return (
    <section
      id="cabang"
      aria-labelledby="cabang-heading"
      className={`${
        isMobileMode ? 'py-8' : 'py-12 sm:py-16'
      } bg-[#FFFDF9] border-t border-[#5C3A21]/10`}
    >
      <div className={`max-w-6xl mx-auto ${isMobileMode ? 'px-4' : 'px-4 sm:px-6'}`}>
        <div className="mode-stack-col flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97706]">
              Jaringan Dapur &amp; Outlet Resmi
            </p>
            <h2
              id="cabang-heading"
              className={`mt-1 font-display ${
                isMobileMode ? 'text-xl' : 'text-2xl sm:text-3xl'
              } font-bold text-[#5C3A21] text-balance`}
            >
              Lokasi Cabang Toko ({stores.length} Outlet)
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#6E5644] max-w-2xl">
              Pilih cabang terdekat untuk melihat lokasi di Google Maps, menghubungi nomor cabang,
              atau langsung memesan roti dari dapur terdekat.
            </p>
          </div>
        </div>

        {/* Interactive Google Maps Card for Active Branch */}
        <div className="mb-6 bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden shadow-xs">
          <div className="px-4 py-3 sm:px-5 bg-[#FAF5EC] border-b border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#D97706]/15 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#5C3A21] truncate">
                  Peta Lokasi: {activeStore.name}
                </p>
                <p className="text-[11px] sm:text-xs text-[#6E5644] truncate">
                  {activeStore.address}
                </p>
              </div>
            </div>

            <a
              href={activeMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#5C3A21] hover:bg-[#462B17] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Buka Google Maps</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          <div className={`w-full bg-[#FAF5EC] ${isMobileMode ? 'h-52' : 'h-64 sm:h-80'}`}>
            <iframe
              key={activeStore.id}
              title={`Peta Google Maps ${activeStore.name}`}
              src={activeEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div
          className={`${
            isMobileMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          } mode-grid-catalog grid gap-4 sm:gap-5`}
        >
          {stores.map((store) => {
            const isSelected = store.id === activeStore.id;
            const phoneDigits = normalizePhoneDigits(store.phone);
            const displayPhone = formatDisplayPhone(store.phone);
            const mapsUrl = getStoreGoogleMapsUrl(store);
            const waUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
              `Halo Admin *${brandName} - ${store.name}*, saya ingin bertanya mengenai ketersediaan roti & snack box.`
            )}`;

            return (
              <article
                key={store.id}
                data-testid={`store-branch-card-${store.id}`}
                onClick={() => onSelectStore(store.id, false)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#FAF5EC]/80 border-[#D97706] shadow-sm ring-1 ring-[#D97706]/30'
                    : 'bg-white border-[#5C3A21]/12 hover:border-[#D97706]/50'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#5C3A21] leading-snug">
                      {store.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D97706] text-white whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Dipilih</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm text-[#6E5644]">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{store.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#7C604C] shrink-0" aria-hidden="true" />
                      <span>Jam buka: {store.hours}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#7C604C] shrink-0" aria-hidden="true" />
                      <a
                        href={`tel:+${phoneDigits}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono font-semibold text-[#5C3A21] hover:text-[#D97706] hover:underline"
                      >
                        {displayPhone}
                      </a>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#5C3A21]/10 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStore(store.id, true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#5C3A21] text-white hover:bg-[#462B17]'
                        : 'bg-[#D97706] text-white hover:bg-[#B45309]'
                    }`}
                  >
                    <span>{isSelected ? 'Lanjut Pilih Menu' : 'Pesan di Cabang Ini'}</span>
                  </button>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#5C3A21] bg-white hover:bg-[#FAF5EC] border border-[#5C3A21]/20 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                    <span>Maps</span>
                  </a>

                  <a
                    href={`tel:+${phoneDigits}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#5C3A21] bg-white hover:bg-[#FAF5EC] border border-[#5C3A21]/20 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#5C3A21]" aria-hidden="true" />
                    <span>Telepon</span>
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
