import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/formatters'
import ChatWidget from '../components/chat/ChatWidget'
import {
  ShoppingBag,
  MessageCircle,
  Shield,
  ArrowRight,
  Smartphone,
  Laptop,
  Headphones,
  Package,
  Truck,
  BadgeCheck,
  RefreshCw,
  Star,
  ChevronRight,
  Zap,
  Search,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SEGMENT_COLORS = {
  budget: 'bg-stone-100 text-stone-600',
  'mid-range': 'bg-sky-100 text-sky-700',
  premium: 'bg-amber-100 text-amber-700',
  gaming: 'bg-red-100 text-red-700',
}

const CATEGORY_CONFIG = {
  smartphone: { icon: Smartphone, label: 'Smartphones', order: 0, tagline: 'Flagship & mid-range terbaik' },
  laptop: { icon: Laptop, label: 'Laptops', order: 1, tagline: 'Untuk kerja, kuliah, & gaming' },
  earbuds: { icon: Headphones, label: 'Earbuds', order: 2, tagline: 'Audio berkualitas tinggi' },
}

const TRUST_BADGES = [
  { icon: BadgeCheck, label: 'Produk Original', desc: '100% resmi bergaransi' },
  { icon: Truck, label: 'Gratis Ongkir', desc: 'Ke seluruh Indonesia' },
  { icon: RefreshCw, label: '7 Hari Retur', desc: 'Tukar tanpa ribet' },
  { icon: Shield, label: 'Pembayaran Aman', desc: 'Transaksi terenkripsi' },
]

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SegmentBadge({ segment }) {
  if (!segment) return null
  const classes = SEGMENT_COLORS[segment] || 'bg-stone-100 text-stone-600'
  const label = segment.charAt(0).toUpperCase() + segment.slice(1)
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${classes}`}>
      {label}
    </span>
  )
}

function StockBadge({ inStock }) {
  return inStock ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-fresh-green">
      <span className="w-1.5 h-1.5 bg-fresh-green rounded-full" />
      Ready
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500">
      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
      Habis
    </span>
  )
}

function ProductCard({ product }) {
  const categoryConfig = CATEGORY_CONFIG[product.category]
  const PlaceholderIcon = categoryConfig?.icon || Package

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-lg hover:border-nusa-orange/30 transition-all duration-300">
      {/* Image */}
      <div className="bg-warm-gray h-52 flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <PlaceholderIcon className="w-16 h-16 text-stone-300" />
        )}
        <div className="absolute top-3 right-3">
          <StockBadge inStock={product.in_stock} />
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        <p className="text-[11px] text-medium-gray font-medium uppercase tracking-wide">
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold text-dark-gray line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < 4 ? 'text-warm-yellow fill-warm-yellow' : 'text-stone-200 fill-stone-200'}`}
            />
          ))}
          <span className="text-[10px] text-medium-gray ml-1">4.0</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-nusa-orange">
            {formatCurrency(product.price)}
          </span>
          <SegmentBadge segment={product.segment} />
        </div>

        <p className="text-[10px] text-stone-400 font-mono">{product.sku}</p>
      </div>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden animate-pulse">
      <div className="bg-stone-200 h-52" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-stone-200 rounded w-1/4" />
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-200 rounded w-1/2" />
        <div className="h-5 bg-stone-200 rounded w-2/5" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { user, loading } = useAuth()

  // Product state
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true)
      setProductsError(null)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Products fetch error:', err)
        setProductsError(err.message || 'Gagal memuat produk')
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Filter + group products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  const groupedProducts = useMemo(() => {
    const groups = {}
    for (const product of filteredProducts) {
      const cat = product.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(product)
    }
    return Object.entries(groups).sort(([a], [b]) => {
      const orderA = CATEGORY_CONFIG[a]?.order ?? 99
      const orderB = CATEGORY_CONFIG[b]?.order ?? 99
      return orderA - orderB
    })
  }, [filteredProducts])

  const totalProducts = products.length
  const brandCount = useMemo(
    () => new Set(products.map((p) => p.brand).filter(Boolean)).size,
    [products]
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ============================================================ */}
      {/*  HEADER / NAV BAR                                            */}
      {/* ============================================================ */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-nusa-orange rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-dark-gray tracking-tight">
                  Gadget<span className="text-nusa-orange">Nusa</span>
                </span>
              </div>
            </Link>

            {/* Search bar — desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari smartphone, laptop, earbuds..."
                  className="w-full pl-10 pr-4 py-2.5 bg-warm-gray border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {!loading && (
                <>
                  {user ? (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 bg-nusa-dark hover:bg-dark-gray text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 text-medium-gray hover:text-dark-gray text-sm font-medium transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search bar — mobile */}
          <div className="md:hidden pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-10 pr-4 py-2.5 bg-warm-gray border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  HERO BANNER                                                 */}
      {/* ============================================================ */}
      <section className="bg-nusa-dark relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-nusa-orange/10 via-transparent to-tech-blue/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-nusa-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-nusa-orange/10 border border-nusa-orange/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-nusa-orange" />
              <span className="text-xs font-semibold text-nusa-orange">Toko Elektronik Online Terpercaya</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
              Gadget Terbaik untuk{' '}
              <span className="text-nusa-orange">Nusantara</span>
            </h1>

            <p className="text-stone-400 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Temukan smartphone, laptop, dan earbuds dari brand ternama dengan harga terbaik. Produk original, garansi resmi.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center gap-2 bg-nusa-orange hover:bg-nusa-orange-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Lihat Produk
              </a>
              <button
                onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 border border-stone-600 text-stone-300 hover:bg-stone-800 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Tanya AI Assistant
              </button>
            </div>

            {/* Quick stats */}
            {!productsLoading && (
              <div className="flex gap-8 mt-10 pt-8 border-t border-stone-700/50">
                <div>
                  <p className="text-2xl font-bold text-white">{totalProducts}+</p>
                  <p className="text-xs text-stone-500">Produk</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{brandCount}+</p>
                  <p className="text-xs text-stone-500">Brand</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-xs text-stone-500">AI Support</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TRUST BADGES                                                */}
      {/* ============================================================ */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nusa-orange-light flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-nusa-orange" />
                </div>
                <div>
                  <p className="text-xs font-bold text-dark-gray">{label}</p>
                  <p className="text-[10px] text-medium-gray">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRODUCT CATALOG                                             */}
      {/* ============================================================ */}
      <section id="products" className="py-12 md:py-16 bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-dark-gray">Katalog Produk</h2>
              <p className="text-sm text-medium-gray mt-1">
                {searchQuery
                  ? `${filteredProducts.length} hasil untuk "${searchQuery}"`
                  : `${totalProducts} produk dari ${brandCount} brand terpercaya`}
              </p>
            </div>
          </div>

          {productsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center mb-8">
              {productsError}
            </div>
          )}

          {productsLoading ? (
            <div className="space-y-12">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-6 bg-stone-200 rounded w-40 mb-6 animate-pulse" />
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[0, 1, 2, 3].map((j) => (
                      <ProductCardSkeleton key={j} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groupedProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-stone-400">
                {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
              </p>
              <p className="text-sm text-stone-400 mt-1">
                {searchQuery
                  ? 'Coba kata kunci lain atau hapus pencarian'
                  : 'Nantikan koleksi terbaru kami!'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm text-nusa-orange hover:text-nusa-orange-dark font-medium"
                >
                  Hapus pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {groupedProducts.map(([category, categoryProducts]) => {
                const config = CATEGORY_CONFIG[category]
                const CategoryIcon = config?.icon || Package
                const categoryLabel =
                  config?.label || category.charAt(0).toUpperCase() + category.slice(1)
                const tagline = config?.tagline || ''

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center shadow-sm">
                          <CategoryIcon className="w-5 h-5 text-nusa-orange" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-dark-gray">{categoryLabel}</h3>
                          <p className="text-[11px] text-medium-gray">
                            {tagline} &middot; {categoryProducts.length} produk
                          </p>
                        </div>
                      </div>
                      <button className="hidden sm:flex items-center gap-1 text-xs font-semibold text-nusa-orange hover:text-nusa-orange-dark transition-colors">
                        Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Product grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  AI SUPPORT CTA                                              */}
      {/* ============================================================ */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="bg-nusa-dark rounded-3xl px-6 sm:px-12 py-12 md:py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-nusa-orange/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-nusa-orange/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />

            <div className="relative max-w-lg">
              <div className="w-12 h-12 bg-nusa-orange/15 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-nusa-orange" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Butuh Bantuan?
              </h2>
              <p className="text-stone-400 text-sm md:text-base leading-relaxed mb-6">
                AI Assistant kami siap membantu 24/7. Tanyakan tentang produk, harga, stok, pengiriman, atau garansi. Dalam Bahasa Indonesia!
              </p>
              <p className="text-[11px] text-stone-500">
                Powered by <span className="text-stone-400 font-medium">BantuAI</span> &middot; Customer Intelligence Engine
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CHAT WIDGET                                                 */}
      {/* ============================================================ */}
      <ChatWidget />

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="bg-nusa-dark mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-nusa-orange rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-extrabold text-white tracking-tight">
                  Gadget<span className="text-nusa-orange">Nusa</span>
                </span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                Toko elektronik online terpercaya di Indonesia. Produk original, harga terbaik, garansi resmi.
              </p>
            </div>

            {/* Kategori */}
            <div>
              <h4 className="text-sm font-bold text-stone-300 mb-3">Kategori</h4>
              <ul className="space-y-2">
                {Object.values(CATEGORY_CONFIG).map(({ label }) => (
                  <li key={label}>
                    <a href="#products" className="text-sm text-stone-500 hover:text-nusa-orange transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bantuan */}
            <div>
              <h4 className="text-sm font-bold text-stone-300 mb-3">Bantuan</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm text-stone-500 hover:text-nusa-orange transition-colors"
                  >
                    AI Customer Support
                  </button>
                </li>
                <li>
                  <span className="text-sm text-stone-500">Kebijakan Pengembalian</span>
                </li>
                <li>
                  <span className="text-sm text-stone-500">Syarat & Ketentuan</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-stone-600">
              &copy; {new Date().getFullYear()} GadgetNusa. All rights reserved.
            </p>
            <p className="text-[11px] text-stone-600">
              Powered by <span className="text-stone-500 font-medium">BantuAI</span> &mdash; Customer Intelligence Engine
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
