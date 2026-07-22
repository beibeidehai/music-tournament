export interface Singer {
  id: string
  name: string
  avatar: string
  songCount: number
  platform: string
}

export interface Song {
  id: string
  name: string
  artist: string
  album: string
  year: number
  cover: string
  platform: string
  playUrl?: string
}

export type Choice = 'a' | 'b' | 'both' | 'neither'

export interface Match {
  songA: Song
  songB: Song
  choice: Choice | null
  decisionMs: number
}

export interface Round {
  name: string
  matches: Match[]
}

export type GameStage = 'playing' | 'trimming' | 'reviving' | 'finished'

export interface GameState {
  singer: Singer | null
  allSongs: Song[]
  rounds: Round[]
  currentRound: number
  currentMatch: number
  stage: GameStage
  startedAt: number
}
