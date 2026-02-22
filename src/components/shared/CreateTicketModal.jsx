import { useState } from 'react'
import { X, Loader2, Ticket } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const CATEGORY_OPTIONS = [
  'product_defect',
  'wrong_item',
  'shipping_delay',
  'payment_issue',
  'return_request',
  'general_inquiry',
  'other',
]

const PRIORITY_OPTIONS = ['low', 'medium', 'high']

function formatOption(val) {
  return val.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function CreateTicketModal({ conversationId, customerEmail, onClose, onTicketCreated }) {
  const [category, setCategory] = useState('general_inquiry')
  const [priority, setPriority] = useState('medium')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!subject.trim()) return

    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('tickets').insert({
        conversation_id: conversationId,
        customer_email: customerEmail,
        category,
        priority,
        subject: subject.trim(),
        description: description.trim() || null,
        status: 'open',
        created_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      if (onTicketCreated) onTicketCreated()
      onClose()
    } catch (err) {
      console.error('Create ticket error:', err)
      setError(err.message || 'Gagal membuat tiket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-nusa-orange" />
            <h3 className="text-base font-bold text-dark-gray">Buat Tiket Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100 text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange"
              placeholder="Ringkasan masalah..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{formatOption(opt)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{formatOption(opt)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 resize-none"
              placeholder="Detail masalah pelanggan..."
            />
          </div>

          <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500">
            <p>Customer: <strong className="text-stone-700">{customerEmail}</strong></p>
            {conversationId && <p>Conversation ID: <span className="font-mono">{conversationId}</span></p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !subject.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-nusa-orange hover:bg-nusa-orange-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Buat Tiket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
