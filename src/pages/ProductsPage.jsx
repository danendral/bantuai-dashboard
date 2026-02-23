import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/formatters'
import ProductFormModal from '../components/products/ProductFormModal'
import DeleteConfirmDialog from '../components/products/DeleteConfirmDialog'
import Toast from '../components/ui/Toast'

const CATEGORY_COLORS = {
  smartphone: 'bg-blue-100 text-blue-700',
  laptop: 'bg-purple-100 text-purple-700',
  earbuds: 'bg-green-100 text-green-700',
}

const SEGMENT_COLORS = {
  budget: 'bg-gray-100 text-gray-600',
  'mid-range': 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
  gaming: 'bg-red-100 text-red-700',
}

function Badge({ value, colorMap }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>
  const classes = colorMap[value] || 'bg-gray-100 text-gray-600'
  const label = value.charAt(0).toUpperCase() + value.slice(1)
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

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setProducts(data || [])
    } catch (err) {
      console.error('Products fetch error:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort
  const filtered = useMemo(() => {
    let list = products
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
    return list
  }, [products, search, sortField, sortAsc])

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Add product
  function openAddModal() {
    setEditingProduct(null)
    setShowFormModal(true)
  }

  // Edit product
  function openEditModal(product) {
    setEditingProduct(product)
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingProduct(null)
  }

  async function handleSave(formData) {
    setSaving(true)
    try {
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id)
        if (updateError) throw updateError
        showToast('Product updated successfully')
      } else {
        const { error: insertError } = await supabase.from('products').insert(formData)
        if (insertError) throw insertError
        showToast('Product added successfully')
      }
      closeFormModal()
      fetchProducts()
    } catch (err) {
      console.error('Save error:', err)
      showToast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Delete product
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id)
      if (deleteError) throw deleteError
      showToast('Product deleted successfully')
      setDeleteTarget(null)
      fetchProducts()
    } catch (err) {
      console.error('Delete error:', err)
      showToast(err.message || 'Failed to delete product', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Toggle stock
  async function toggleStock(product) {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ in_stock: !product.in_stock })
        .eq('id', product.id)
      if (updateError) throw updateError
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, in_stock: !p.in_stock } : p))
      )
    } catch (err) {
      console.error('Toggle stock error:', err)
      showToast(err.message || 'Failed to update stock status', 'error')
    }
  }

  function SortHeader({ field, children }) {
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-gray-700"
      >
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : ''}`} />
      </button>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Search + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">
              {search ? 'No products match your search' : 'No products found'}
            </p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term' : 'Click "Add Product" to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">
                    <SortHeader field="name">Name</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">SKU</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">
                    <SortHeader field="category">Category</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Brand</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">
                    <SortHeader field="price">Price</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">
                    <SortHeader field="weight">Weight</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Segment</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Stock</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-gray-900 max-w-[220px] truncate" title={product.name}>
                      {product.name}
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-mono text-xs">
                      {product.sku}
                    </td>
                    <td className="py-3 px-3">
                      <Badge value={product.category} colorMap={CATEGORY_COLORS} />
                    </td>
                    <td className="py-3 px-3 text-gray-600">{product.brand}</td>
                    <td className="py-3 px-3 text-gray-900 whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                      {product.weight ? `${product.weight} kg` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge value={product.segment} colorMap={SEGMENT_COLORS} />
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={() => toggleStock(product)} title="Toggle stock status">
                        <StockBadge inStock={product.in_stock} />
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSave}
          onClose={closeFormModal}
          loading={saving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          productName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={saving}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
