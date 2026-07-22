import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Singer, Song, Round, GameStage } from './types'

interface Store extends GameState {
  setSinger: (singer: Singer) => void
  setSongs: (songs: Song[]) => void
  setRounds: (rounds: Round[]) => void
  nextMatch: () => void
  setStage: (stage: GameStage) => void
  recordChoice: (roundIdx: number, matchIdx: number, choice: GameState['rounds'][0]['matches'][0]['choice'], decisionMs: number) => void
  reset: () => void
}

const initialState: GameState = {
  singer: null,
  allSongs: [],
  rounds: [],
  currentRound: 0,
  currentMatch: 0,
  stage: 'playing',
  startedAt: 0,
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      setSinger: (singer) => set({ singer, startedAt: Date.now() }),

      setSongs: (songs) => set({ allSongs: songs }),

      setRounds: (rounds) => set({ rounds, currentRound: 0, currentMatch: 0, stage: 'playing' }),

      nextMatch: () =>
        set((s) => {
          const round = s.rounds[s.currentRound]
          if (!round) return s
          if (s.currentMatch + 1 < round.matches.length) {
            return { currentMatch: s.currentMatch + 1 }
          }
          if (s.currentRound === 0) {
            const selected = round.matches.reduce<number>((acc, m) => {
              if (m.choice === 'both') return acc + 2
              if (m.choice === 'a' || m.choice === 'b') return acc + 1
              return acc
            }, 0)
            if (selected > 32) return { stage: 'trimming' as GameStage }
            if (selected < 32) return { stage: 'reviving' as GameStage }
            return { currentRound: s.currentRound + 1, currentMatch: 0 }
          }
          return { currentRound: s.currentRound + 1, currentMatch: 0 }
        }),

      setStage: (stage) => set({ stage }),

      recordChoice: (roundIdx, matchIdx, choice, decisionMs) =>
        set((s) => {
          const rounds = [...s.rounds]
          rounds[roundIdx] = { ...rounds[roundIdx], matches: [...rounds[roundIdx].matches] }
          rounds[roundIdx].matches[matchIdx] = { ...rounds[roundIdx].matches[matchIdx], choice, decisionMs }
          return { rounds }
        }),

      reset: () => set({ ...initialState }),
    }),
    { name: 'music-tournament' }
  )
)
