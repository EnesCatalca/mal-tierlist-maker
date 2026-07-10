export function scoreToTierId(score) {
  if (score === 10) return 'S'
  if (score === 9) return 'A'
  if (score === 8) return 'B'
  if (score === 7) return 'C'
  if (score === 6) return 'D'
  if (score >= 1 && score <= 5) return 'F'
  return 'UNRANKED'
}

export function buildTiersFromScores(allAnime, tierDefs) {
  const tiers = {}
  for (const def of tierDefs) {
    tiers[def.id] = []
  }
  for (const anime of allAnime) {
    const tierId = scoreToTierId(anime.score)
    if (tiers[tierId] !== undefined) {
      tiers[tierId].push(String(anime.mal_id))
    }
  }
  return tiers
}
