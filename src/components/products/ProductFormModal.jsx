import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = ['smartphone', 'laptop', 'earbuds']
const SEGMENTS = ['budget', 'mid-range', 'premium', 'gaming']

const EMPTY_FORM = {
  sku: '',
  name: '',
  category: '',
  brand: '',
  price: '',
  segment: '',
  in_stock: true,
}

export default function ProductFormModal({ product, onSave, onClose, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const isEdit = !!product

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        price: product.price || '',
        segment: product.segment || '',
        in_stock: product.in_stock ?? true,
      })
    }
  }, [product])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      price: Number(form.price),
      segment: form.segment || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-400">*</span>
              </label>
              <input
                name="sku"
                type="text"
                required
                value={form.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="e.g. SM-S24-256"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand <span className="text-red-400">*</span>
              </label>
              <input
                name="brand"
                type="text"
                required
                value={form.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="e.g. Samsung"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                required
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
              <select
                name="segment"
                value={form.segment}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Select segment</option>
                {SEGMENTS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (IDR) <span className="text-red-400">*</span>
            </label>
            <input
              name="price"
              type="number"
              required
              min="0"
              value={form.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="e.g. 4899000"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              name="in_stock"
              type="checkbox"
              checked={form.in_stock}
              onChange={handleChange}
              id="in_stock"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50"
            />
            <label htmlFor="in_stock" className="text-sm text-gray-700">
              In Stock
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
