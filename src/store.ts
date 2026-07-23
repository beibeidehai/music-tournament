import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Singer, Song, Round, GameStage } from './types'

interface Store extends GameState {
  setSinger: (singer: Singer) => void
  setSongs: (songs: Song[]) => void
  setRounds: (rounds: Round[]) => void
  setRoundsAndSkip: (rounds: Round[], skipToRound: number) => void
  nextMatch: () => void
  prevMatch: () => void
  setStage: (stage: GameStage) => void
  recordChoice: (roundIdx: number, matchIdx: number, choice: GameState['rounds'][0]['matches'][0]['choice'], decisionMs: number) => void
  reset: () => void
  resetGame: () => void
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
      setRoundsAndSkip: (rounds, skipToRound) => set({ rounds, currentRound: skipToRound, currentMatch: 0, stage: 'playing' }),

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
            const target = round.matches.length
            if (selected > target) return { stage: 'trimming' as GameStage }
            if (selected < target) return { stage: 'reviving' as GameStage }
            return { currentRound: s.currentRound + 1, currentMatch: 0 }
          }
          return { currentRound: s.currentRound + 1, currentMatch: 0 }
        }),

      prevMatch: () =>
        set((s) => {
          if (s.currentMatch <= 0) return s
          const rounds = [...s.rounds]
          const round = { ...rounds[s.currentRound], matches: [...rounds[s.currentRound].matches] }
          // clear the choice of the match we're going back to
          round.matches[s.currentMatch - 1] = { ...round.matches[s.currentMatch - 1], choice: null, decisionMs: 0 }
          rounds[s.currentRound] = round
          return { rounds, currentMatch: s.currentMatch - 1 }
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

      resetGame: () => set(s => ({
        rounds: [], allSongs: [], currentRound: 0, currentMatch: 0,
        stage: 'playing' as GameStage, startedAt: Date.now(),
        singer: s.singer, // keep singer
      })),
    }),
    { name: 'music-tournament', version: 2 }
  )
)
