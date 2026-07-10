import { useState } from 'react'

const PRESET_COLORS = [
  '#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f',
  '#bfff7f', '#7fbfff', '#bf7fff', '#ff7fbf',
]

function makeDraft() {
  return [
    { id: crypto.randomUUID(), label: 'S', color: '#ff7f7f' },
    { id: crypto.randomUUID(), label: 'A', color: '#ffbf7f' },
    { id: crypto.randomUUID(), label: 'B', color: '#ffdf7f' },
    { id: crypto.randomUUID(), label: 'C', color: '#ffff7f' },
    { id: crypto.randomUUID(), label: 'D', color: '#bfff7f' },
    { id: crypto.randomUUID(), label: 'F', color: '#7fbfff' },
  ]
}

export default function CustomTierModal({ isOpen, onApply, onClose }) {
  const [draft, setDraft] = useState(makeDraft)

  if (!isOpen) return null

  function addTier() {
    setDraft((d) => [
      ...d,
      { id: crypto.randomUUID(), label: 'Yeni', color: PRESET_COLORS[d.length % PRESET_COLORS.length] },
    ])
  }

  function removeTier(id) {
    setDraft((d) => d.filter((t) => t.id !== id))
  }

  function updateLabel(id, label) {
    setDraft((d) => d.map((t) => (t.id === id ? { ...t, label } : t)))
  }

  function updateColor(id, color) {
    setDraft((d) => d.map((t) => (t.id === id ? { ...t, color } : t)))
  }

  function handleApply() {
    const tierDefs = draft.filter((t) => t.label.trim()).map((t) => ({
      id: t.id,
      label: t.label.trim(),
      color: t.color,
    }))
    if (tierDefs.length === 0) return
    onApply(tierDefs)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-4">Tier Adlarını Belirle</h2>

        <div className="space-y-2 mb-4">
          {draft.map((tier) => (
            <div key={tier.id} className="flex items-center gap-2">
              <input
                type="text"
                value={tier.label}
                onChange={(e) => updateLabel(tier.id, e.target.value)}
                maxLength={20}
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateColor(tier.id, c)}
                    className={`w-5 h-5 rounded-sm border-2 transition-transform ${
                      tier.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="w-6 h-6 rounded shrink-0" style={{ backgroundColor: tier.color }} />
              <button
                onClick={() => removeTier(tier.id)}
                className="text-gray-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addTier}
          className="w-full py-1.5 border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded text-sm hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6"
        >
          + Tier Ekle
        </button>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm font-medium transition-colors"
          >
            Uygula
          </button>
        </div>
      </div>
    </div>
  )
}
