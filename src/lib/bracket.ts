import type { Song, Round } from '../types'

export function getTournamentConfig(totalSongs: number): { pick: number; rounds: string[] } | null {
  if (totalSongs >= 64) return { pick: 64, rounds: ['64进32', '32进16', '16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 32) return { pick: 32, rounds: ['32进16', '16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 16) return { pick: 16, rounds: ['16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 8) return { pick: 8, rounds: ['8进4', '4进2', '2选1'] }
  return null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateRounds(songs: Song[]): Round[] {
  const shuffled = shuffle(songs)
  const config = getTournamentConfig(songs.length)
  if (!config) return []

  const pool = config.pick === 64 ? shuffled.slice(0, 64) : shuffled.slice(0, config.pick)
  const rounds: Round[] = []
  const firstRoundMatches: Round['matches'] = []
  for (let i = 0; i < pool.length; i += 2) {
    firstRoundMatches.push({
      songA: pool[i],
      songB: pool[i + 1] || pool[i],
      choice: null,
      decisionMs: 0,
    })
  }
  rounds.push({ name: config.rounds[0], matches: firstRoundMatches })

  // 后续轮次先填空壳
  for (let r = 1; r < config.rounds.length; r++) {
    rounds.push({ name: config.rounds[r], matches: [] })
  }
  return rounds
}

export function buildNextRound(prevRound: Round, roundName: string): Round {
  const winners: Song[] = []
  for (const m of prevRound.matches) {
    if (m.choice === 'both') { winners.push(m.songA, m.songB) }
    else if (m.choice === 'a') { winners.push(m.songA) }
    else if (m.choice === 'b') { winners.push(m.songB) }
  }
  const matches: Round['matches'] = []
  for (let i = 0; i < winners.length; i += 2) {
    matches.push({
      songA: winners[i],
      songB: winners[i + 1] || winners[i],
      choice: null,
      decisionMs: 0,
    })
  }
  return { name: roundName, matches }
}

export function getSelectedSongs(firstRound: Round): Song[] {
  const selected: Song[] = []
  for (const m of firstRound.matches) {
    if (m.choice === 'both') { selected.push(m.songA, m.songB) }
    else if (m.choice === 'a') { selected.push(m.songA) }
    else if (m.choice === 'b') { selected.push(m.songB) }
  }
  return selected
}

export function getEliminatedSongs(firstRound: Round): Song[] {
  const selected = new Set(getSelectedSongs(firstRound).map(s => s.id))
  const eliminated: Song[] = []
  for (const m of firstRound.matches) {
    if (!selected.has(m.songA.id)) eliminated.push(m.songA)
    if (!selected.has(m.songB.id)) eliminated.push(m.songB)
  }
  return eliminated
}
