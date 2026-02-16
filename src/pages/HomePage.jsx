import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Bot,
  ShoppingBag,
  MessageCircle,
  Shield,
  ArrowRight,
  Smartphone,
  Laptop,
  Headphones,
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

const productCategories = [
  { icon: Smartphone, label: 'Smartphones', count: 'Coming Soon' },
  { icon: Laptop, label: 'Laptops', count: 'Coming Soon' },
  { icon: Headphones, label: 'Earbuds', count: 'Coming Soon' },
]

export default function HomePage() {
  const { user, loading } = useAuth()

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

      {/* Products Placeholder */}
      <section id="products" className="py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Featured Products</h2>
          <p className="text-sm text-gray-400 text-center mb-10">
            Our product catalog is coming soon. Stay tuned!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productCategories.map(({ icon: Icon, label, count }) => (
              <div
                key={label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center"
              >
                <div className="bg-gray-100 rounded-xl h-36 flex items-center justify-center mb-4">
                  <Icon className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{label}</h3>
                <p className="text-xs text-gray-400">{count}</p>
              </div>
            ))}
          </div>
          {/* TODO: Replace with real product listing from Supabase */}
        </div>
      </section>

      {/* Chat Widget Placeholder */}
      <div id="support" className="fixed bottom-6 right-6 z-50">
        <button
          className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Chat with us"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        {/* TODO: Connect to BantuAI chat widget */}
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
