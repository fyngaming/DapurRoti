import { ArrowLeft, CheckCircle2, Clock, ExternalLink, PackageCheck, XCircle } from 'lucide-react';
import type { Order, OrderStatus, User } from '../types/bakery';
import { formatEventDateTime, formatRupiah } from '../utils/orderLogic';

interface MyOrdersPageProps {
  user: User | null;
  orders: Order[];
  isLoading: boolean;
  onBackToCatalog: () => void;
  onOpenAuth: () => void;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending_wa: {
    label: 'Menunggu Konfirmasi WA',
    className: 'text-amber-800 bg-amber-50 border-amber-200',
    Icon: Clock,
  },
  confirmed: {
    label: 'Dikonfirmasi Dapur',
    className: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    Icon: CheckCircle2,
  },
  completed: {
    label: 'Selesai',
    className: 'text-slate-700 bg-slate-100 border-slate-200',
    Icon: PackageCheck,
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'text-red-800 bg-red-50 border-red-200',
    Icon: XCircle,
  },
};

export function MyOrdersPage({
  user,
  orders,
  isLoading,
  onBackToCatalog,
  onOpenAuth,
}: MyOrdersPageProps) {
  return (
    <section className="py-10 sm:py-14 min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C604C] hover:text-[#5C3A21] mb-2"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke Katalog</span>
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#5C3A21]">
              Riwayat Pesanan Saya
            </h1>
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center">
            <p className="text-base font-semibold text-[#5C3A21]">
              Silakan masuk untuk melihat riwayat pesanan Anda.
            </p>
            <p className="mt-1.5 text-sm text-[#6E5644]">
              Semua pesanan yang tersimpan dengan akun email atau Google Anda akan tampil di sini.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors min-h-[44px]"
            >
              Masuk / Daftar
            </button>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center text-sm text-[#6E5644]">
            Memuat daftar pesanan Anda...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#5C3A21]/10 p-8 text-center">
            <p className="text-base font-semibold text-[#5C3A21]">
              Belum ada pesanan tercatat.
            </p>
            <p className="mt-1.5 text-sm text-[#6E5644]">
              Pilih roti atau paket snack box dari katalog untuk mulai memesan.
            </p>
            <button
              type="button"
              onClick={onBackToCatalog}
              className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors min-h-[44px]"
            >
              Lihat Katalog Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="orders-list">
            {orders.map((order) => {
              const statusInfo = STATUS_META[order.status] ?? STATUS_META.pending_wa;
              const StatusIcon = statusInfo.Icon;

              return (
                <article
                  key={order.id}
                  data-testid={`order-card-${order.order_code}`}
                  className="bg-white rounded-2xl border border-[#5C3A21]/12 overflow-hidden"
                >
                  <div className="px-5 py-4 bg-[#FAF5EC] border-b border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#5C3A21]">
                        {order.order_code}
                      </p>
                      <p className="text-xs text-[#7C604C] mt-0.5">
                        Acara: {formatEventDateTime(order.event_datetime)}
                        {order.store_name ? ` · ${order.store_name}` : ''}
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${statusInfo.className}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#6E5644]">
                      <div>
                        <span className="font-semibold text-[#5C3A21]">Pemesan: </span>
                        {order.customer_name} ({order.customer_phone})
                      </div>
                      <div>
                        <span className="font-semibold text-[#5C3A21]">Metode: </span>
                        {order.order_type === 'po'
                          ? 'Pre-Order (PO) - DP 50%'
                          : 'Pesan Langsung / Lunas'}{' '}
                        ·{' '}
                        {order.payment_method === 'transfer'
                          ? 'Transfer Bank Manual'
                          : 'Tunai / COD'}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-[#5C3A21]">Alamat: </span>
                        {order.delivery_address}
                      </div>
                    </div>

                    <div className="border-t border-[#5C3A21]/10 pt-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-[#7C604C] border-b border-[#5C3A21]/10">
                            <th className="py-1.5 pr-2 font-medium">Menu</th>
                            <th className="py-1.5 px-2 font-medium text-right">Qty</th>
                            <th className="py-1.5 px-2 font-medium text-right">Harga</th>
                            <th className="py-1.5 pl-2 font-medium text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#5C3A21]/5">
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 pr-2 font-medium text-[#5C3A21]">
                                {item.product_name}
                                {item.variant ? (
                                  <span className="text-[#7C604C] font-normal">
                                    {' '}
                                    ({item.variant})
                                  </span>
                                ) : null}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums">{item.quantity}</td>
                              <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap">
                                {formatRupiah(item.price)}
                              </td>
                              <td className="py-2 pl-2 text-right font-semibold text-[#5C3A21] tabular-nums whitespace-nowrap">
                                {formatRupiah(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-3 border-t border-[#5C3A21]/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs space-y-0.5">
                        {order.discount_amount > 0 && (
                          <p className="text-emerald-700 font-semibold tabular-nums">
                            Diskon ({order.promo_code}): -{formatRupiah(order.discount_amount)}
                          </p>
                        )}
                        <p className="text-[#6E5644]">
                          Total Pesanan:{' '}
                          <span className="font-bold text-sm text-[#5C3A21] tabular-nums">
                            {formatRupiah(order.total_amount)}
                          </span>
                        </p>
                        {order.order_type === 'po' && (
                          <p className="text-[#D97706] font-semibold tabular-nums">
                            Nominal DP 50%: {formatRupiah(order.dp_amount)}
                          </p>
                        )}
                      </div>

                      {order.whatsapp_url && (
                        <a
                          href={order.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                        >
                          <span>Konfirmasi Ulang via WA</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
