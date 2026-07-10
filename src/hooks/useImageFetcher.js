import { useRef, useCallback } from 'react'
import axios from 'axios'

const ANILIST_URL = 'https://graphql.anilist.co'
const JIKAN_BASE = 'https://api.jikan.moe/v4'
const ANILIST_BATCH = 50
const ANILIST_DELAY = 800
const JIKAN_DELAY = 400

const QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(idMal_in: $ids, type: ANIME) {
      idMal
      coverImage { large medium }
    }
  }
}
`

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchAniListBatch(malIds, signal) {
  const res = await axios.post(
    ANILIST_URL,
    { query: QUERY, variables: { ids: malIds.map(Number) } },
    { signal, headers: { 'Content-Type': 'application/json' } }
  )
  const media = res.data?.data?.Page?.media || []
  const map = {}
  for (const item of media) {
    if (item.idMal) {
      map[String(item.idMal)] = item.coverImage?.large || item.coverImage?.medium || ''
    }
  }
  return map
}

async function fetchJikanSingle(malId, signal) {
  const res = await axios.get(`${JIKAN_BASE}/anime/${malId}`, { signal })
  return (
    res.data?.data?.images?.jpg?.large_image_url ||
    res.data?.data?.images?.jpg?.image_url ||
    ''
  )
}

export function useImageFetcher(dispatch) {
  const controllerRef = useRef(null)

  const fetchImages = useCallback(
    async (malIds) => {
      if (controllerRef.current) controllerRef.current.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      const missing = new Set(malIds.map(String))

      // Phase 1: AniList batch (fast — 50 per request)
      try {
        const ids = [...missing]
        for (let i = 0; i < ids.length; i += ANILIST_BATCH) {
          if (controller.signal.aborted) return
          const batch = ids.slice(i, i + ANILIST_BATCH)
          try {
            const imageMap = await fetchAniListBatch(batch, controller.signal)
            for (const [mal_id, image_url] of Object.entries(imageMap)) {
              if (image_url) {
                dispatch({ type: 'UPDATE_IMAGE', mal_id, image_url })
                missing.delete(mal_id)
              }
            }
          } catch (err) {
            if (axios.isCancel(err) || err?.name === 'AbortError') return
          }
          if (i + ANILIST_BATCH < ids.length) await sleep(ANILIST_DELAY)
        }
      } catch {}

      // Phase 2: Jikan fallback for anything AniList didn't have
      if (missing.size === 0 || controller.signal.aborted) return

      for (const malId of missing) {
        if (controller.signal.aborted) break
        try {
          await sleep(JIKAN_DELAY)
          const image_url = await fetchJikanSingle(malId, controller.signal)
          if (image_url) dispatch({ type: 'UPDATE_IMAGE', mal_id: malId, image_url })
        } catch (err) {
          if (axios.isCancel(err) || err?.name === 'AbortError') break
        }
      }
    },
    [dispatch]
  )

  const cancelImageFetch = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  return { fetchImages, cancelImageFetch }
}
