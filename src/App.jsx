import { useReducer, useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { buildTiersFromScores } from './utils/scoresToTiers'
import { parseMALXml } from './utils/parseMALXml'
import { useMALData } from './hooks/useMALData'
import { useImageFetcher } from './hooks/useImageFetcher'
import ProfileLoader from './components/ProfileLoader'
import TierList from './components/TierList'
import AnimeCardDisplay from './components/AnimeCardDisplay'
import CustomTierModal from './components/CustomTierModal'

const DEFAULT_TIER_DEFS = [
  { id: 'S',        label: 'S',        color: '#ff7f7f' },
  { id: 'A',        label: 'A',        color: '#ffbf7f' },
  { id: 'B',        label: 'B',        color: '#ffdf7f' },
  { id: 'C',        label: 'C',        color: '#ffff7f' },
  { id: 'D',        label: 'D',        color: '#bfff7f' },
  { id: 'F',        label: 'F',        color: '#7fbfff' },
  { id: 'UNRANKED', label: 'Puansız',  color: '#6b7280' },
]

function makeEmptyTiers(tierDefs) {
  const t = {}
  for (const d of tierDefs) t[d.id] = []
  return t
}

const initialState = {
  username: '',
  isLoading: false,
  error: null,
  fetchProgress: { current: 0 },
  allAnime: [],
  mode: 'auto',
  tierDefs: DEFAULT_TIER_DEFS,
  tiers: makeEmptyTiers(DEFAULT_TIER_DEFS),
  isCustomModalOpen: false,
  theme: 'dark',
}

function collisionDetection(args) {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  return rectIntersection(args)
}

function findTierForCard(tiers, malId) {
  return Object.keys(tiers).find((tid) => tiers[tid].includes(malId))
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.value }

    case 'FETCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        allAnime: [],
        tiers: makeEmptyTiers(state.tierDefs),
        fetchProgress: { current: 0 },
        username: action.username,
      }

    case 'FETCH_PAGE_DONE':
      return { ...state, fetchProgress: { current: action.current } }

    case 'FETCH_COMPLETE': {
      const allAnime = action.allEntries
      const tiers =
        state.mode === 'auto'
          ? buildTiersFromScores(allAnime, state.tierDefs)
          : { ...makeEmptyTiers(state.tierDefs), POOL: allAnime.map((a) => a.mal_id) }
      return { ...state, isLoading: false, error: null, allAnime, tiers }
    }

    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.error }

    case 'LOAD_XML': {
      const allAnime = action.allAnime
      const tiers =
        state.mode === 'auto'
          ? buildTiersFromScores(allAnime, state.tierDefs)
          : { ...makeEmptyTiers(state.tierDefs), POOL: allAnime.map((a) => a.mal_id) }
      return { ...state, isLoading: false, error: null, allAnime, tiers }
    }

    case 'UPDATE_IMAGE': {
      const allAnime = state.allAnime.map((a) =>
        a.mal_id === action.mal_id ? { ...a, image_url: action.image_url } : a
      )
      return { ...state, allAnime }
    }

    case 'MOVE_CARD': {
      const { activeId, overId } = action
      const fromTierId = Object.keys(state.tiers).find((tid) =>
        state.tiers[tid].includes(activeId)
      )
      let toTierId
      if (state.tiers[overId] !== undefined) {
        toTierId = String(overId)
      } else {
        toTierId = Object.keys(state.tiers).find((tid) => state.tiers[tid].includes(overId))
      }
      if (!fromTierId || !toTierId) return state
      if (fromTierId === toTierId) {
        const arr = [...state.tiers[fromTierId]]
        const oldIndex = arr.indexOf(activeId)
        const newIndex = arr.indexOf(overId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state
        return { ...state, tiers: { ...state.tiers, [fromTierId]: arrayMove(arr, oldIndex, newIndex) } }
      }
      const fromArr = state.tiers[fromTierId].filter((id) => id !== activeId)
      const toArr = [...state.tiers[toTierId]]
      const insertAt = toArr.indexOf(overId) >= 0 ? toArr.indexOf(overId) : toArr.length
      toArr.splice(insertAt, 0, activeId)
      return { ...state, tiers: { ...state.tiers, [fromTierId]: fromArr, [toTierId]: toArr } }
    }

    case 'REMOVE_TIER': {
      const { tierId } = action
      const displaced = state.tiers[tierId] || []
      const newTiers = { ...state.tiers }
      delete newTiers[tierId]
      newTiers['POOL'] = [...(newTiers['POOL'] || []), ...displaced]
      const newTierDefs = state.tierDefs.filter((d) => d.id !== tierId)
      return { ...state, tierDefs: newTierDefs, tiers: newTiers }
    }

    case 'SET_MODE': {
      if (action.mode === state.mode) return state
      if (action.mode === 'custom') {
        return {
          ...state,
          mode: 'custom',
          isCustomModalOpen: true,
          tiers: {
            ...makeEmptyTiers(state.tierDefs),
            POOL: state.allAnime.map((a) => a.mal_id),
          },
        }
      }
      return {
        ...state,
        mode: 'auto',
        tierDefs: DEFAULT_TIER_DEFS,
        tiers: buildTiersFromScores(state.allAnime, DEFAULT_TIER_DEFS),
      }
    }

    case 'SET_CUSTOM_TIERS': {
      const tierDefs = [...action.tierDefs, { id: 'POOL', label: '?', color: '#374151' }]
      const tiers = makeEmptyTiers(tierDefs)
      tiers['POOL'] = state.allAnime.map((a) => a.mal_id)
      return { ...state, tierDefs, tiers, isCustomModalOpen: false }
    }

    case 'TOGGLE_MODAL':
      return { ...state, isCustomModalOpen: action.open }

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
        fetchProgress: { current: 0 },
      }

    case 'RESET':
      return { ...initialState, theme: state.theme }

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [activeId, setActiveId] = useState(null)
  const { fetchAnimeList, cancelFetch } = useMALData(dispatch)
  const { fetchImages, cancelImageFetch } = useImageFetcher(dispatch)

  const animeMap = useMemo(
    () => Object.fromEntries(state.allAnime.map((a) => [a.mal_id, a])),
    [state.allAnime]
  )

  const imageFetchCount = useMemo(
    () => state.allAnime.filter((a) => a.image_url).length,
    [state.allAnime]
  )

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [state.theme])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mal-tierlist-state')
    if (saved) {
      try {
        const payload = JSON.parse(saved)
        dispatch({ type: 'LOAD_FROM_STORAGE', payload })
        if (payload.allAnime?.length > 0) {
          const missing = payload.allAnime
            .filter((a) => !a.image_url)
            .sort((a, b) => b.score - a.score)
          if (missing.length > 0) fetchImages(missing.map((a) => a.mal_id))
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When a new batch of anime loads, fetch any missing images
  const prevAnimeCount = useRef(0)
  useEffect(() => {
    const count = state.allAnime.length
    if (count > 0 && count !== prevAnimeCount.current && !state.isLoading) {
      prevAnimeCount.current = count
      const missing = state.allAnime
        .filter((a) => !a.image_url)
        .sort((a, b) => b.score - a.score)
      if (missing.length > 0) fetchImages(missing.map((a) => a.mal_id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.allAnime.length, state.isLoading])

  // Persist to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const { username, allAnime, tierDefs, tiers, mode, theme } = state
      localStorage.setItem(
        'mal-tierlist-state',
        JSON.stringify({ username, allAnime, tierDefs, tiers, mode, theme })
      )
    }, 500)
    return () => clearTimeout(timer)
  }, [state])

  function handleXmlUpload(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const animeList = parseMALXml(e.target.result)
        if (animeList.length === 0) {
          dispatch({ type: 'FETCH_ERROR', error: 'Tamamlanmış anime bulunamadı.' })
          return
        }
        dispatch({ type: 'LOAD_XML', allAnime: animeList })
      } catch (err) {
        dispatch({ type: 'FETCH_ERROR', error: err.message })
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    dispatch({ type: 'MOVE_CARD', activeId: active.id, overId: over.id })
  }, [])

  const activeAnime = activeId ? animeMap[activeId] : null

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">MAL Tierlist Maker</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              MyAnimeList profilinden tierlist oluştur
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {state.theme === 'dark' ? '☀ Açık Tema' : '☾ Koyu Tema'}
          </button>
        </div>

        <ProfileLoader
          username={state.username}
          isLoading={state.isLoading}
          error={state.error}
          fetchProgress={state.fetchProgress}
          animeCount={state.allAnime.length}
          imageFetchCount={imageFetchCount}
          onUsernameChange={(v) => dispatch({ type: 'SET_USERNAME', value: v })}
          onLoad={() => fetchAnimeList(state.username.trim())}
          onCancel={() => { cancelFetch(); cancelImageFetch() }}
          onReset={() => { cancelImageFetch(); dispatch({ type: 'RESET' }) }}
          onXmlUpload={handleXmlUpload}
        />

        {state.allAnime.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <TierList
              tierDefs={state.tierDefs}
              tiers={state.tiers}
              animeMap={animeMap}
              mode={state.mode}
              dispatch={dispatch}
            />
            <DragOverlay>
              {activeAnime && (
                <div className="opacity-90 scale-105 rotate-1 drop-shadow-2xl">
                  <AnimeCardDisplay anime={activeAnime} isDragging={false} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {state.allAnime.length === 0 && !state.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <svg className="w-16 h-16 mb-4 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
            <p className="text-lg text-gray-500 dark:text-gray-400">MAL anime listeni yükleyerek başla</p>
            <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">XML yükle sekmesini kullan — en güvenilir yöntem</p>
          </div>
        )}
      </div>

      <CustomTierModal
        isOpen={state.isCustomModalOpen}
        onApply={(tierDefs) => dispatch({ type: 'SET_CUSTOM_TIERS', tierDefs })}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', open: false })}
      />
    </div>
  )
}
