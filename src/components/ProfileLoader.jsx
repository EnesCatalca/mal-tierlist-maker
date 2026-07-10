import { useRef, useState } from 'react'

// Injected by vite.standalone.config.js; false in normal builds
const IS_STANDALONE = typeof __STANDALONE__ !== 'undefined' && __STANDALONE__

function extractUsername(input) {
  const urlMatch = input.match(/myanimelist\.net\/(?:profile|animelist)\/([^/?#\s]+)/i)
  if (urlMatch) return urlMatch[1]
  return input.trim()
}

export default function ProfileLoader({
  username,
  isLoading,
  error,
  fetchProgress,
  animeCount,
  imageFetchCount,
  onUsernameChange,
  onLoad,
  onCancel,
  onReset,
  onXmlUpload,
}) {
  const [tab, setTab] = useState('xml')
  const fileRef = useRef(null)

  function handleUsernameChange(e) {
    const parsed = extractUsername(e.target.value)
    onUsernameChange(parsed || e.target.value)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !isLoading) onLoad()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onXmlUpload(file)
    e.target.value = ''
  }

  const tabBase = 'px-3 py-1 rounded text-sm transition-colors'
  const tabActive = 'bg-indigo-600 text-white'
  const tabInactive = 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'

  return (
    <div className="mb-6">
      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-200 dark:bg-gray-800 rounded p-1 w-fit">
        <button onClick={() => setTab('xml')} className={`${tabBase} ${tab === 'xml' ? tabActive : tabInactive}`}>
          XML Yükle (Önerilen)
        </button>
        {!IS_STANDALONE && (
          <button onClick={() => setTab('username')} className={`${tabBase} ${tab === 'username' ? tabActive : tabInactive}`}>
            Kullanıcı Adı
          </button>
        )}
      </div>

      {tab === 'xml' ? (
        <div>
          <div className="flex gap-2 items-center">
            <input ref={fileRef} type="file" accept=".xml" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              XML Dosyası Seç
            </button>
            {animeCount > 0 && !isLoading && (
              <button onClick={onReset} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm">
                Sıfırla
              </button>
            )}
          </div>
          <p className="mt-2 text-gray-400 dark:text-gray-500 text-xs">
            MAL → Profil → <strong className="text-gray-500 dark:text-gray-400">Export Data</strong> → "Export Anime List" → indirilen XML dosyasını seç
          </p>
        </div>
      ) : (
        <div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleKeyDown}
              placeholder="Kullanıcı adı veya profil URL'si"
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            {!isLoading ? (
              <button
                onClick={onLoad}
                disabled={!username.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Yükle
              </button>
            ) : (
              <button onClick={onCancel} className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-500 transition-colors">
                İptal
              </button>
            )}
            {animeCount > 0 && !isLoading && (
              <button onClick={onReset} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm">
                Sıfırla
              </button>
            )}
          </div>
          <p className="mt-1.5 text-gray-400 dark:text-gray-500 text-xs">
            Not: Listenin MAL'da herkese açık olması gerekiyor (Settings → List Privacy → Public)
          </p>
        </div>
      )}

      {isLoading && (
        <div className="mt-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Yükleniyor... (sayfa {fetchProgress.current})</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full animate-pulse w-1/3" />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-red-500 dark:text-red-400 text-sm">{error}</p>}

      {animeCount > 0 && !isLoading && !error && (
        <p className="mt-2 text-emerald-600 dark:text-emerald-400 text-sm">
          {animeCount} anime yüklendi.
          {imageFetchCount < animeCount && (
            <span className="text-gray-400 dark:text-gray-500 ml-2">
              Görseller yükleniyor... ({imageFetchCount}/{animeCount})
            </span>
          )}
        </p>
      )}
    </div>
  )
}
