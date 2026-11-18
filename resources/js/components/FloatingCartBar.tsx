import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartItem } from '../types/bakery';
import { formatRupiah } from '../utils/orderLogic';

interface FloatingCartBarProps {
  cart: CartItem[];
  totalItems: number;
  totalAmount: number;
  isMobileMode?: boolean;
  onUpdateQuantity: (productId: number, variant: string, delta: number) => void;
  onProceedToCheckout: () => void;
  onClearCart: () => void;
}

export function FloatingCartBar({
  cart,
  totalItems,
  totalAmount,
  isMobileMode = false,
  onUpdateQuantity,
  onProceedToCheckout,
  onClearCart,
}: FloatingCartBarProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobileMode);

  if (totalItems <= 0 || cart.length === 0) return null;

  return (
    <div
      data-testid="floating-cart-bar"
      role="region"
      aria-label="Ringkasan keranjang belanja"
      className={`fixed inset-x-0 z-40 pointer-events-none ${
        isMobileMode
          ? 'bottom-[70px] px-2.5'
          : 'bottom-0 px-3 pb-3 sm:px-6 sm:pb-4'
      }`}
    >
      <div
        className={`${
          isMobileMode ? 'max-w-[410px]' : 'max-w-3xl'
        } mx-auto bg-[#5C3A21] text-[#FFFDF9] rounded-2xl shadow-xl pointer-events-auto border border-[#D97706]/35 overflow-hidden`}
      >
        {/* Top Header + Toggle */}
        <div className="px-4 pt-3 pb-2 sm:px-6 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FDE68A]">
              Pesanan Dipilih ({cart.length} item)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#E8DDD0] hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/10"
          >
            <span>{isExpanded ? 'Sembunyikan' : 'Lihat Rincian'}</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Expanded Selected Items List inside the Brown Container */}
        {isExpanded && (
          <div
            data-testid="floating-cart-items"
            className="px-4 py-2.5 sm:px-6 space-y-2 max-h-44 overflow-y-auto divide-y divide-white/10"
          >
            {cart.map((item) => (
              <div
                key={`${item.product_id}-${item.variant}`}
                className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">
                    {item.name}{' '}
                    <span className="font-normal text-[#FDE68A]">({item.variant})</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#E8DDD0] tabular-nums">
                    {item.quantity}x @ {formatRupiah(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="inline-flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product_id, item.variant, -1)}
                      aria-label={`Kurangi ${item.name} (${item.variant}) dari ringkasan`}
                      className="w-6 h-6 inline-flex items-center justify-center rounded-md text-white hover:bg-white/15 transition-colors"
                    >
                      <Minus className="w-3 h-3" aria-hidden="true" />
                    </button>
                    <span className="min-w-[20px] text-center text-xs font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product_id, item.variant, 1)}
                      aria-label={`Tambah ${item.name} (${item.variant}) dari ringkasan`}
                      className="w-6 h-6 inline-flex items-center justify-center rounded-md text-white hover:bg-white/15 transition-colors"
                    >
                      <Plus className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>

                  <span className="min-w-[82px] text-right font-bold text-[#FDE68A] tabular-nums text-xs sm:text-sm">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Total & Primary CTA Row */}
        <div className="px-4 py-3 sm:px-6 bg-[#4B2E19] border-t border-white/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/25 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-[#FBBF24]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#E8DDD0] tabular-nums truncate">
                Total Biaya ({totalItems} porsi)
              </p>
              <p
                data-testid="floating-cart-total"
                className="text-base sm:text-lg font-bold text-white tabular-nums"
              >
                {formatRupiah(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClearCart}
              aria-label="Kosongkan keranjang"
              className="p-2 text-[#E8DDD0] hover:text-white rounded-lg hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
            >
              <span>Lanjut Pesan</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
