import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import TierRow from './TierRow'

export default function TierList({ tierDefs, tiers, animeMap, mode, dispatch }) {
  const visibleTiers = mode === 'custom'
    ? tierDefs.filter((d) => d.id !== 'UNRANKED' && d.id !== 'POOL')
    : tierDefs

  const poolIds = mode === 'custom' ? (tiers['POOL'] || []) : []
  const tierRowsRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  function handleDeleteTier(tierId) {
    dispatch({ type: 'REMOVE_TIER', tierId })
  }

  async function handleExport() {
    if (!tierRowsRef.current) return
    setExporting(true)
    setExportError(null)
    try {
      const isDark = document.documentElement.classList.contains('dark')
      const canvas = await html2canvas(tierRowsRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        logging: false,
      })
      canvas.toBlob((blob) => {
        if (!blob) { setExportError('Canvas boş döndü.'); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'tierlist.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Export hatası:', err)
      setExportError(err.message || 'Bilinmeyen hata')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Mode switcher + export */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'auto' })}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            mode === 'auto'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Otomatik Tierlist
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'custom' })}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Özel Tierlist
        </button>
        <div className="ml-auto flex gap-2">
          {mode === 'custom' && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: true })}
              className="px-4 py-1.5 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              + Tier Düzenle
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 rounded text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Hazırlanıyor...' : '↓ PNG İndir'}
          </button>
        </div>
      </div>

      {exportError && (
        <p className="text-red-500 text-xs mb-2">Export hatası: {exportError}</p>
      )}

      {/* Tier rows — this area is captured for PNG export */}
      <div ref={tierRowsRef} className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        {visibleTiers.map((def) => (
          <TierRow
            key={def.id}
            tierId={def.id}
            label={def.label}
            color={def.color}
            malIds={tiers[def.id] || []}
            animeMap={animeMap}
            canDelete={mode === 'custom'}
            onDelete={handleDeleteTier}
          />
        ))}
      </div>

      {/* Unassigned pool (custom mode) */}
      {mode === 'custom' && (
        <div className="mt-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            Atanmamış Animeler ({poolIds.length})
          </p>
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
            <TierRow
              tierId="POOL"
              label="?"
              color="#9ca3af"
              malIds={poolIds}
              animeMap={animeMap}
              canDelete={false}
              onDelete={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  )
}
