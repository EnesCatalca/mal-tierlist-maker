import { useRef } from 'react'
import axios from 'axios'

const PAGE_SIZE = 300

function mapEntry(e) {
  return {
    mal_id:    String(e.anime_id ?? ''),
    title:     e.anime_title_eng || e.anime_title || 'Unknown',
    image_url: e.anime_image_path || '',
    score:     e.score ?? 0,
  }
}

export function useMALData(dispatch) {
  const abortRef = useRef(null)

  async function fetchAnimeList(username) {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    dispatch({ type: 'FETCH_START', username })

    let offset = 0
    let page   = 1
    let allEntries = []

    try {
      while (true) {
        const res = await axios.get('/api/mal', {
          params:  { username, status: 2, offset },
          signal:  controller.signal,
        })

        const data = res.data
        if (!Array.isArray(data)) {
          dispatch({
            type: 'FETCH_ERROR',
            error: `"${username}" bulunamadı ya da liste gizli. MAL → Settings → List Settings → Privacy: Public yap.`,
          })
          return
        }

        allEntries = [...allEntries, ...data.map(mapEntry).filter((e) => e.mal_id)]
        dispatch({ type: 'FETCH_PAGE_DONE', current: page })

        if (data.length < PAGE_SIZE) break
        offset += PAGE_SIZE
        page++
      }

      if (allEntries.length === 0) {
        dispatch({
          type: 'FETCH_ERROR',
          error: 'Tamamlanmış anime bulunamadı. Listenin herkese açık olduğundan emin ol.',
        })
        return
      }

      dispatch({ type: 'FETCH_COMPLETE', allEntries })
    } catch (err) {
      if (axios.isCancel(err) || err?.name === 'AbortError') return
      const status = err.response?.status
      if (status === 404 || status === 400) {
        dispatch({
          type: 'FETCH_ERROR',
          error: `"${username}" bulunamadı. Kullanıcı adını kontrol et.`,
        })
      } else {
        dispatch({
          type: 'FETCH_ERROR',
          error: `Bağlantı hatası (${status ?? err.message}).`,
        })
      }
    }
  }

  function cancelFetch() {
    abortRef.current?.abort()
  }

  return { fetchAnimeList, cancelFetch }
}
