import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/admin', { replace: true })
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const result = login(email, password)
    if (result.success) {
      navigate('/admin', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-nusa-dark flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-nusa-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-tech-blue/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-nusa-orange rounded-2xl mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Gadget<span className="text-nusa-orange">Nusa</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-dark-gray mb-1">Selamat datang</h2>
          <p className="text-sm text-medium-gray mb-5">Masuk ke dashboard admin</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-gray mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange"
                placeholder="admin@gadgetnusa.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-gray mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-nusa-orange hover:bg-nusa-orange-dark text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-nusa-orange text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>
          <p className="text-[11px] text-stone-600">
            Powered by <span className="text-stone-500 font-medium">BantuAI</span>
          </p>
        </div>
      </div>
    </div>
  )
}
