export function parseMALXml(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  if (doc.querySelector('parsererror')) {
    throw new Error('Geçersiz XML dosyası.')
  }

  const animeNodes = doc.querySelectorAll('anime')
  if (animeNodes.length === 0) {
    throw new Error('Anime bulunamadı. Doğru MAL export XML dosyasını yüklediğinizden emin olun.')
  }

  const result = []
  for (const node of animeNodes) {
    const status = node.querySelector('my_status')?.textContent?.trim()
    if (status !== 'Completed') continue

    const mal_id = node.querySelector('series_animedb_id')?.textContent?.trim()
    const title = node.querySelector('series_title')?.textContent?.trim()
    const score = parseInt(node.querySelector('my_score')?.textContent || '0', 10)

    if (!mal_id) continue
    result.push({ mal_id: String(mal_id), title: title || 'Unknown', image_url: '', score })
  }

  return result
}
