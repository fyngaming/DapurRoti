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
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                      <span className="text-xs font-semibold text-[#5C3A21]">
                        Stok Habis Sementara
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-medium text-[#7C604C] flex items-center gap-1.5">
                    <span>{categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Siap Antar / Ambil</span>
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

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product, activeVariant)}
                        aria-label={`Tambah ${product.name} ke keranjang`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Tambah</span>
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
                          onClick={() => onUpdateQuantity(product.id, activeVariant, 1)}
                          aria-label={`Tambah jumlah ${product.name}`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#5C3A21] hover:bg-white transition-colors"
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
