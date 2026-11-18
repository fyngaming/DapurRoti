import { useState } from 'react';
import { Minus, Plus, Utensils } from 'lucide-react';
import type { CartItem, Category, Product, ProductCategory } from '../types/bakery';
import { formatRupiah } from '../utils/orderLogic';

interface ProductCatalogProps {
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  activeCategory: ProductCategory;
  onCategoryChange: (cat: ProductCategory) => void;
  onAddToCart: (product: Product, variant: string) => void;
  onUpdateQuantity: (productId: number, variant: string, delta: number) => void;
}

export function ProductCatalog({
  categories,
  products,
  cart,
  activeCategory,
  onCategoryChange,
  onAddToCart,
  onUpdateQuantity,
}: ProductCatalogProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const getActiveVariant = (product: Product): string => {
    const chosen = selectedVariants[product.id];
    if (chosen && product.variants.includes(chosen)) return chosen;
    return product.variants[0] ?? 'Original';
  };

  const getCartQuantity = (productId: number, variant: string): number => {
    return (
      cart.find((item) => item.product_id === productId && item.variant === variant)?.quantity ??
      0
    );
  };

  const getCategoryName = (slug: string): string => {
    return categories.find((c) => c.slug === slug)?.name ?? 'Menu Dapur';
  };

  return (
    <section id="katalog" className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mode-stack-col flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97706]">
              Menu Pilihan Dapur
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#5C3A21] text-balance">
              Katalog Roti &amp; Paket Hajatan
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter kategori menu"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#FAF5EC] border border-[#5C3A21]/10 rounded-xl self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              onClick={() => onCategoryChange('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                activeCategory === 'all'
                  ? 'bg-[#5C3A21] text-white'
                  : 'text-[#6E5644] hover:text-[#5C3A21]'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onCategoryChange(cat.slug)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    isActive
                      ? 'bg-[#5C3A21] text-white'
                      : 'text-[#6E5644] hover:text-[#5C3A21]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mode-grid-catalog grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const activeVariant = getActiveVariant(product);
            const qty = getCartQuantity(product.id, activeVariant);
            const totalQtyInCartForProduct = cart
              .filter((c) => c.product_id === product.id)
              .reduce((sum, c) => sum + c.quantity, 0);
            const currentStock = Number(product.stock ?? 0);
            const expiredDays = Math.max(1, Number(product.expired_days ?? 3));
            const isOutOfStock = !product.is_available || currentStock <= 0;
            const isAtMaxStock = totalQtyInCartForProduct >= currentStock;
            const categoryLabel = getCategoryName(product.category);

            return (
              <article
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="group bg-white rounded-2xl border border-[#5C3A21]/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] w-full bg-[#FAF5EC] overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isOutOfStock ? 'grayscale-[45%] opacity-80' : 'group-hover:scale-[1.03]'
                    }`}
                  />
                  {/* Stock & Shelf-life badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs backdrop-blur-xs tabular-nums ${
                        currentStock <= 0
                          ? 'bg-red-600/90 text-white'
                          : currentStock <= 5
                            ? 'bg-amber-500/95 text-white'
                            : 'bg-[#FFFDF9]/92 text-[#5C3A21] border border-[#5C3A21]/15'
                      }`}
                    >
                      {currentStock <= 0 ? 'Stok Habis' : `Stok: ${currentStock} pcs`}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#5C3A21]/85 text-[#FDE68A] backdrop-blur-xs">
                      Exp: {expiredDays} hari
                    </span>
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="px-3.5 py-1.5 rounded-xl bg-white/95 border border-red-200 text-xs font-bold text-red-700 shadow-xs">
                        Stok Habis Sementara
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-medium text-[#7C604C] flex flex-wrap items-center gap-1.5">
                    <span>{categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Masa simpan {expiredDays} hari</span>
                  </div>

                  <h3 className="mt-1.5 font-display text-lg font-bold text-[#5C3A21] leading-snug">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-sm text-[#6E5644] leading-relaxed flex-1">
                    {product.description}
                  </p>

                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-4">
                      <label
                        htmlFor={`variant-${product.id}`}
                        className="block text-[11px] font-semibold text-[#7C604C] mb-1"
                      >
                        Pilih Varian
                      </label>
                      <select
                        id={`variant-${product.id}`}
                        value={activeVariant}
                        onChange={(e) =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs font-medium text-[#5C3A21] bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl focus:outline-none focus:border-[#D97706]"
                      >
                        {product.variants.map((variant) => (
                          <option key={variant} value={variant}>
                            {variant}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#5C3A21]/10 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-[#7C604C]">
                        Harga per porsi
                      </span>
                      <span className="text-base font-bold text-[#5C3A21] tabular-nums">
                        {formatRupiah(product.price)}
                      </span>
                    </div>

                    {isOutOfStock ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 text-xs font-semibold text-[#7C604C] bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl cursor-not-allowed whitespace-nowrap shrink-0 min-h-[42px]"
                      >
                        Habis
                      </button>
                    ) : qty === 0 ? (
                      <button
                        type="button"
                        disabled={isAtMaxStock}
                        onClick={() => onAddToCart(product, activeVariant)}
                        aria-label={`Tambah ${product.name} ke keranjang`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>{isAtMaxStock ? 'Maks. Stok' : 'Tambah'}</span>
                      </button>
                    ) : (
                      <div
                        className="inline-flex items-center gap-1 bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-xl p-1"
                        aria-label={`Jumlah ${product.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, activeVariant, -1)}
                          aria-label={`Kurangi jumlah ${product.name}`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#5C3A21] hover:bg-white transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <span
                          data-testid={`product-qty-${product.id}`}
                          className="min-w-[28px] text-center text-sm font-bold text-[#5C3A21] tabular-nums"
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={isAtMaxStock}
                          onClick={() => onUpdateQuantity(product.id, activeVariant, 1)}
                          aria-label={`Tambah jumlah ${product.name}`}
                          title={isAtMaxStock ? `Maksimal stok ${currentStock} pcs` : undefined}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#5C3A21] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center bg-[#FAF5EC] rounded-2xl border border-[#5C3A21]/10">
            <Utensils className="w-8 h-8 text-[#D97706] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-[#5C3A21]">
              Belum ada produk pada kategori ini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
