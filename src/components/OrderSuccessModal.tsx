import { CheckCircle2, ExternalLink, History, X } from 'lucide-react';
import type { Order } from '../types/bakery';
import { formatRupiah } from '../utils/orderLogic';

interface OrderSuccessModalProps {
  order: Order | null;
  whatsappUrl: string;
  onClose: () => void;
  onViewHistory: () => void;
}

export function OrderSuccessModal({
  order,
  whatsappUrl,
  onClose,
  onViewHistory,
}: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C3A21]/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl border border-[#5C3A21]/15 shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi sukses"
          className="absolute top-4 right-4 p-1.5 text-[#7C604C] hover:text-[#5C3A21] rounded-lg hover:bg-[#FAF5EC]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="order-success-title"
              className="font-display text-xl font-bold text-[#5C3A21]"
            >
              Pesanan Berhasil Disimpan
            </h2>
            <p className="text-xs text-[#6E5644]">
              Kode Pesanan:{' '}
              <span data-testid="created-order-code" className="font-mono font-bold text-[#5C3A21]">
                {order.order_code}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-[#FAF5EC] border border-[#5C3A21]/10 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#7C604C]">Total Harga</span>
            <span className="font-bold text-[#5C3A21] tabular-nums">
              {formatRupiah(order.total_amount)}
            </span>
          </div>
          {order.order_type === 'po' && (
            <div className="flex justify-between">
              <span className="text-[#7C604C]">DP 50% (Pre-Order)</span>
              <span className="font-bold text-[#D97706] tabular-nums">
                {formatRupiah(order.dp_amount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#7C604C]">Metode Pembayaran</span>
            <span className="font-semibold text-[#5C3A21]">
              {order.payment_method === 'transfer' ? 'Transfer Bank Manual' : 'Bayar Tunai / COD'}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-[#6E5644] leading-relaxed">
          Klik tombol di bawah ini untuk mengirim rincian pesanan ke WhatsApp Admin agar jadwal
          pemanggangan segera dikonfirmasi.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-whatsapp-link"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors min-h-[44px]"
          >
            <span>Kirim ke WhatsApp Admin</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onViewHistory}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#5C3A21] bg-[#FAF5EC] hover:bg-[#F3E9D8] border border-[#5C3A21]/15 rounded-xl transition-colors min-h-[44px]"
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Riwayat Pesanan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
