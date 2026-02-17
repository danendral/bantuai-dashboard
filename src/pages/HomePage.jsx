import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/formatters'
import {
  Bot,
  ShoppingBag,
  MessageCircle,
  Shield,
  ArrowRight,
  Smartphone,
  Laptop,
  Headphones,
  X,
  Package,
  Loader2,
} from 'lucide-react'

const features = [
  {
    icon: ShoppingBag,
    title: 'Product Catalog',
    desc: 'Browse our collection of smartphones, laptops, and earbuds from top brands.',
    color: 'text-primary',
    bg: 'bg-blue-50',
  },
  {
    icon: MessageCircle,
    title: 'AI Customer Support',
    desc: 'Get instant help with our AI-powered customer service, available 24/7.',
    color: 'text-success',
    bg: 'bg-emerald-50',
  },
  {
    icon: Shield,
    title: 'Trusted Service',
    desc: 'Reliable after-sales support, warranty management, and hassle-free returns.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
]

const SEGMENT_COLORS = {
  budget: 'bg-gray-100 text-gray-600',
  'mid-range': 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  gaming: 'bg-red-100 text-red-700',
}

const CATEGORY_CONFIG = {
  smartphone: { icon: Smartphone, label: 'Smartphones', order: 0 },
  laptop: { icon: Laptop, label: 'Laptops', order: 1 },
  earbuds: { icon: Headphones, label: 'Earbuds', order: 2 },
}

const N8N_CHAT_URL =
  'https://n8n-vug6t4symkyp.caca.sumopod.my.id/webhook/28b8b63b-297e-433a-9898-ea82d106dfdb/chat'

function SegmentBadge({ segment }) {
  if (!segment) return null
  const classes = SEGMENT_COLORS[segment] || 'bg-gray-100 text-gray-600'
  const label = segment.charAt(0).toUpperCase() + segment.slice(1)
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}

function StockBadge({ inStock }) {
  return inStock ? (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      In Stock
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Out of Stock
    </span>
  )
}

function ProductCard({ product }) {
  const categoryConfig = CATEGORY_CONFIG[product.category]
  const PlaceholderIcon = categoryConfig?.icon || Package

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image area */}
      <div className="bg-gray-50 h-48 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderIcon className="w-16 h-16 text-gray-300" />
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <StockBadge inStock={product.in_stock} />
        </div>

        <p className="text-xs text-gray-500">{product.brand}</p>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          <SegmentBadge segment={product.segment} />
        </div>

        <p className="text-[11px] text-gray-400 font-mono">{product.sku}</p>
      </div>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-48" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()

  // Product state
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)

  // Chat widget state
  const [chatOpen, setChatOpen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

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
        setProductsError(err.message || 'Failed to load products')
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Group products by category, sorted by CATEGORY_CONFIG order
  const groupedProducts = useMemo(() => {
    const groups = {}
    for (const product of products) {
      const cat = product.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(product)
    }
    return Object.entries(groups).sort(([a], [b]) => {
      const orderA = CATEGORY_CONFIG[a]?.order ?? 99
      const orderB = CATEGORY_CONFIG[b]?.order ?? 99
      return orderA - orderB
    })
  }, [products])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-7 h-7 text-primary" />
            <div>
              <span className="text-lg font-bold text-gray-900">GadgetNusa</span>
              <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">
                by BantuAI
              </span>
            </div>
          </div>
          {!loading && (
            <div>
              {user ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin Login
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="bg-sidebar text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-20 md:py-28 text-center">
          <Bot className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Welcome to <span className="text-primary">GadgetNusa</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-8">
            Your trusted Indonesian online electronics retailer. Powered by BantuAI Customer
            Intelligence Engine.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#products"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </a>
            <a
              href="#support"
              className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Catalog */}
      <section id="products" className="py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Our Products</h2>
          <p className="text-sm text-gray-400 text-center mb-10">
            Browse our collection of smartphones, laptops, and earbuds from top brands.
          </p>

          {productsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center mb-8">
              {productsError}
            </div>
          )}

          {productsLoading ? (
            <div className="space-y-12">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[0, 1, 2, 3].map((j) => (
                      <ProductCardSkeleton key={j} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groupedProducts.length === 0 && !productsError ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-400">No products available yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back soon for our latest offerings!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedProducts.map(([category, categoryProducts]) => {
                const config = CATEGORY_CONFIG[category]
                const CategoryIcon = config?.icon || Package
                const categoryLabel =
                  config?.label ||
                  category.charAt(0).toUpperCase() + category.slice(1)

                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {categoryLabel}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {categoryProducts.length} product
                          {categoryProducts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Product grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {/* Chat Widget */}
      <div id="support" className="fixed bottom-6 right-6 z-50">
        {/* Chat panel */}
        {chatOpen && (
          <div className="mb-3 w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Chat header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">GadgetNusa Support</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading indicator */}
            {!iframeLoaded && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500">Loading chat...</p>
              </div>
            )}

            {/* Chat iframe */}
            <iframe
              src={N8N_CHAT_URL}
              title="GadgetNusa Support Chat"
              className={`flex-1 w-full border-0 ${!iframeLoaded ? 'hidden' : ''}`}
              allow="microphone"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => {
            if (chatOpen) {
              setChatOpen(false)
              setIframeLoaded(false)
            } else {
              setChatOpen(true)
            }
          }}
          className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ml-auto"
          title="Chat with us"
        >
          {chatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-sidebar text-white mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-8 text-center">
          <Bot className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            Powered by <span className="text-slate-300">BantuAI</span> — Customer Intelligence
            Engine
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            &copy; {new Date().getFullYear()} GadgetNusa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
