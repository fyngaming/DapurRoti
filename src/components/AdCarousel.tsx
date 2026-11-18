import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdBanner } from '../types/bakery';

interface AdCarouselProps {
  ads: AdBanner[];
  onActionClick: () => void;
  isMobileMode?: boolean;
}

export function AdCarousel({ ads, onActionClick, isMobileMode = false }: AdCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = ads.length > 0 ? activeIndex % ads.length : 0;

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const current = ads[safeIndex];

  return (
    <section aria-label="Promosi & Iklan Dapur" className={isMobileMode ? 'pt-5' : 'pt-8 sm:pt-10'}>
      <div className={`max-w-6xl mx-auto ${isMobileMode ? 'px-4' : 'px-4 sm:px-6'}`}>
        <div
          data-testid="ad-carousel"
          className={`relative rounded-2xl overflow-hidden border border-[#5C3A21]/12 bg-[#5C3A21] ${
            isMobileMode ? 'h-48' : 'h-56 sm:h-64 md:h-72'
          }`}
        >
          <img
            src={current.image}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2D1A0E]/90 via-[#2D1A0E]/65 to-transparent" />

          <div
            className={`absolute inset-0 ${
              isMobileMode ? 'p-4' : 'p-6 sm:p-8 md:p-10'
            } flex flex-col justify-between`}
          >
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FDE68A]">
                Sorotan Promo Dapur
              </p>
              <h2
                className={`mt-1 font-display ${
                  isMobileMode ? 'text-base line-clamp-2' : 'text-lg sm:text-2xl'
                } font-bold text-white leading-snug text-balance`}
              >
                {current.title}
              </h2>
              {current.subtitle && (
                <p
                  className={`mt-1.5 ${
                    isMobileMode ? 'text-[11px] line-clamp-2' : 'text-xs sm:text-sm line-clamp-2'
                  } text-[#F5EBE0]`}
                >
                  {current.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onActionClick}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors whitespace-nowrap"
              >
                {current.cta_label || 'Lihat Menu'}
              </button>

              {ads.length > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-1">
                    {ads.map((ad, idx) => (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Tampilkan iklan ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          idx === safeIndex ? 'w-6 bg-[#FBBF24]' : 'w-2 bg-white/45 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev - 1 + ads.length) % ads.length)
                    }
                    aria-label="Iklan sebelumnya"
                    className="w-8 h-8 rounded-lg bg-black/35 hover:bg-black/55 text-white inline-flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((prev) => (prev + 1) % ads.length)}
                    aria-label="Iklan berikutnya"
                    className="w-8 h-8 rounded-lg bg-black/35 hover:bg-black/55 text-white inline-flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
