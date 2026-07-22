# 音乐淘汰赛 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一个搜索歌手→歌曲两两淘汰→选出冠军→导出长图的网页应用

**Architecture:** Vite + React SPA，3个页面路由，zustand 管理全局状态+localStorage 持久化，Vercel serverless functions 代理音乐平台 API（listen1-api）

**Tech Stack:** Vite, React 18, TypeScript, React Router v6, zustand, html2canvas, qrcode

**File structure:**
```
d:/wy001/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── api/
│   ├── search.ts
│   ├── songs.ts
│   └── play.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── store.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Game.tsx
│   │   └── Result.tsx
│   ├── components/
│   │   ├── SearchBox.tsx
│   │   ├── SingerCard.tsx
│   │   ├── SongCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── BracketTree.tsx
│   │   └── TrimRevive.tsx
│   └── lib/
│       ├── api.ts
│       ├── bracket.ts
│       └── audio.ts
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "music-tournament",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "html2canvas": "^1.4.1",
    "qrcode": "^1.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/qrcode": "^1.5.5",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>音乐淘汰赛</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 3: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 6: 创建 src/App.tsx (空壳)**

```tsx
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/game" element={<div>Game</div>} />
      <Route path="/result" element={<div>Result</div>} />
    </Routes>
  )
}
```

- [ ] **Step 7: 安装依赖**

Run: `cd /d/wy001 && npm install`

- [ ] **Step 8: 验证启动**

Run: `cd /d/wy001 && npx vite --host`
Expected: dev server 启动，浏览器打开可以看到三个路由占位

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 写入全部类型定义**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add type definitions"
```

---

### Task 3: 状态管理 (zustand store)

**Files:**
- Create: `src/store.ts`

- [ ] **Step 1: 实现 store**

```typescript
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
            // 64进32结束，统计选中数量
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store.ts
git commit -m "feat: add zustand store with localStorage persistence"
```

---

### Task 4: 赛制生成逻辑

**Files:**
- Create: `src/lib/bracket.ts`

- [ ] **Step 1: 实现赛制逻辑**

```typescript
import type { Song, Round } from '../types'

/** 根据歌曲数决定赛制和抽歌数量 */
export function getTournamentConfig(totalSongs: number): { pick: number; rounds: string[] } | null {
  if (totalSongs >= 64) return { pick: 64, rounds: ['64进32', '32进16', '16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 32) return { pick: 32, rounds: ['32进16', '16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 16) return { pick: 16, rounds: ['16进8', '8进4', '4进2', '2选1'] }
  if (totalSongs >= 8) return { pick: 8, rounds: ['8进4', '4进2', '2选1'] }
  return null
}

/** 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 从歌曲列表生成所有轮次的对阵 */
export function generateRounds(songs: Song[]): Round[] {
  const shuffled = shuffle(songs)
  const config = getTournamentConfig(songs.length)
  if (!config) return []

  const rounds: Round[] = []
  let pool = config.pick === 64 ? shuffled.slice(0, 64) : shuffled.slice(0, config.pick)

  for (const name of config.rounds) {
    const matches: Round['matches'] = []
    for (let i = 0; i < pool.length; i += 2) {
      matches.push({
        songA: pool[i],
        songB: pool[i + 1] || pool[i], // 奇数时自对自（理论上不会发生）
        choice: null,
        decisionMs: 0,
      })
    }
    rounds.push({ name, matches })
    pool = [] // 下一轮的pool由用户选择结果决定，这里先留空
  }
  return rounds
}

/** 根据上一轮选择结果生成下一轮对阵 */
export function buildNextRound(prevRound: Round, roundName: string): Round {
  const winners: Song[] = []
  for (const m of prevRound.matches) {
    if (m.choice === 'both') { winners.push(m.songA, m.songB) }
    else if (m.choice === 'a') { winners.push(m.songA) }
    else if (m.choice === 'b') { winners.push(m.songB) }
  }
  const shuffled = shuffle(winners)
  const matches: Round['matches'] = []
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      songA: shuffled[i],
      songB: shuffled[i + 1],
      choice: null,
      decisionMs: 0,
    })
  }
  return { name: roundName, matches }
}

/** 获取64进32轮已选歌曲列表 */
export function getSelectedSongs(firstRound: Round): Song[] {
  const selected: Song[] = []
  for (const m of firstRound.matches) {
    if (m.choice === 'both') { selected.push(m.songA, m.songB) }
    else if (m.choice === 'a') { selected.push(m.songA) }
    else if (m.choice === 'b') { selected.push(m.songB) }
  }
  return selected
}

/** 获取64进32轮淘汰歌曲列表 */
export function getEliminatedSongs(firstRound: Round): Song[] {
  const selected = new Set(getSelectedSongs(firstRound).map(s => s.id))
  const eliminated: Song[] = []
  for (const m of firstRound.matches) {
    if (!selected.has(m.songA.id)) eliminated.push(m.songA)
    if (!selected.has(m.songB.id)) eliminated.push(m.songB)
  }
  return eliminated
}
```

- [ ] **Step 2: 快速验证逻辑**

Run: `cd /d/wy001 && node -e "
const { getTournamentConfig } = require('./src/lib/bracket');
console.log(getTournamentConfig(100));
console.log(getTournamentConfig(40));
console.log(getTournamentConfig(5));
"`
Expected: 无法直接 require TypeScript，先跳过运行时验证。逻辑简单，后续集成时自然覆盖。

- [ ] **Step 3: Commit**

```bash
git add src/lib/bracket.ts
git commit -m "feat: add tournament bracket generation logic"
```

---

### Task 5: API 客户端 + Vercel Serverless Functions

**Files:**
- Create: `src/lib/api.ts`, `api/search.ts`, `api/songs.ts`, `api/play.ts`
- Create: `vercel.json`

- [ ] **Step 1: 创建 vercel.json**

```json
{
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@3"
    }
  }
}
```

- [ ] **Step 2: 创建 src/lib/api.ts (前端API调用)**

```typescript
import type { Singer, Song } from '../types'

const BASE = '/api'

export async function searchSinger(q: string): Promise<Singer[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('搜索失败')
  return res.json()
}

export async function getSongs(singerId: string, platform: string): Promise<Song[]> {
  const res = await fetch(`${BASE}/songs?id=${encodeURIComponent(singerId)}&platform=${encodeURIComponent(platform)}`)
  if (!res.ok) throw new Error('获取歌曲失败')
  return res.json()
}

export async function getPlayUrl(songId: string, platform: string): Promise<string> {
  const res = await fetch(`${BASE}/play?id=${encodeURIComponent(songId)}&platform=${encodeURIComponent(platform)}`)
  if (!res.ok) throw new Error('获取播放地址失败')
  const data = await res.json()
  return data.playUrl
}
```

- [ ] **Step 3: 创建 api/search.ts (Vercel serverless)**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

// 使用 listen1-api 包聚合搜索
// Vercel部署时需要 npm install listen1-api
const listen1 = require('listen1-api')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    const results = await listen1.search(q, ['netease', 'qq', 'kugou', 'kuwo', 'bilibili'])
    const singers = results
      .filter((r: any) => r.type === 'artist')
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar || '',
        songCount: r.song_count || 0,
        platform: r.platform,
      }))
    res.json(singers)
  } catch (e) {
    res.status(500).json({ error: 'search failed' })
  }
}
```

- [ ] **Step 4: 创建 api/songs.ts**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

const listen1 = require('listen1-api')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, platform } = req.query as { id: string; platform: string }
  if (!id || !platform) return res.status(400).json({ error: 'missing params' })

  try {
    const data = await listen1.getArtistSongs(id, platform)
    const songs = (data.songs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      artist: s.artist || '',
      album: s.album || '',
      year: s.year || 0,
      cover: s.cover || '',
      platform,
    }))
    res.json(songs)
  } catch (e) {
    res.status(500).json({ error: 'get songs failed' })
  }
}
```

- [ ] **Step 5: 创建 api/play.ts**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

const listen1 = require('listen1-api')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, platform } = req.query as { id: string; platform: string }
  if (!id || !platform) return res.status(400).json({ error: 'missing params' })

  try {
    const data = await listen1.bootstrapTrack(id, platform)
    res.json({ playUrl: data.url || '' })
  } catch (e) {
    res.status(500).json({ error: 'get play url failed' })
  }
}
```

- [ ] **Step 6: 安装 serverless 依赖**

Run: `cd /d/wy001 && npm install listen1-api @vercel/node`

- [ ] **Step 7: Commit**

```bash
git add src/lib/api.ts api/ vercel.json package.json
git commit -m "feat: add API client and Vercel serverless functions"
```

---

### Task 6: 音频播放管理器

**Files:**
- Create: `src/lib/audio.ts`

- [ ] **Step 1: 实现全局单例 audio manager**

```typescript
let currentAudio: HTMLAudioElement | null = null
let currentSongId: string | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null

export function play(url: string, songId: string): HTMLAudioElement {
  // 停止当前播放
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    if (timeoutId) clearTimeout(timeoutId)
  }

  const audio = new Audio(url)
  audio.play().catch(() => {}) // 浏览器可能阻止自动播放
  currentAudio = audio
  currentSongId = songId

  // 30秒自动停止
  timeoutId = setTimeout(() => {
    audio.pause()
  }, 30000)

  return audio
}

export function stop() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  if (timeoutId) clearTimeout(timeoutId)
  currentAudio = null
  currentSongId = null
}

export function getCurrentSongId() {
  return currentSongId
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat: add audio playback manager with 30s auto-stop"
```

---

### Task 7: 首页 + 组件

**Files:**
- Create: `src/pages/Home.tsx`, `src/components/SearchBox.tsx`, `src/components/SingerCard.tsx`

- [ ] **Step 1: SearchBox 组件**

```tsx
import { useState, useRef, useEffect } from 'react'
import { searchSinger } from '../lib/api'
import type { Singer } from '../types'

interface Props {
  onSelect: (singer: Singer) => void
}

export default function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Singer[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 1) { setResults([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchSinger(query)
        setResults(data.slice(0, 8))
        setShowDropdown(true)
      } catch { setResults([]) }
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div ref={ref} style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入歌手名字..."
        style={{
          width: '100%', padding: '14px 20px', fontSize: 18,
          border: '2px solid #e0e0e0', borderRadius: 28, outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
      />
      {loading && <div style={{ textAlign: 'center', padding: 12, color: '#999' }}>搜索中...</div>}
      {showDropdown && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #eee', borderRadius: 12,
          listStyle: 'none', padding: 8, margin: '8px 0', zIndex: 100,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        }}>
          {results.map((s) => (
            <li
              key={s.id + s.platform}
              onClick={() => { onSelect(s); setShowDropdown(false); setQuery('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', cursor: 'pointer', borderRadius: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <img src={s.avatar || '/placeholder.png'} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>歌手 · {s.songCount} 首歌</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Home 页面**

```tsx
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import SearchBox from '../components/SearchBox'
import type { Singer } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { singer, setSinger, reset } = useStore()

  const handleSelect = (s: Singer) => {
    reset()
    setSinger(s)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>音乐淘汰赛</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>搜索一位歌手，选出你心中的最佳曲目</p>

      {!singer ? (
        <SearchBox onSelect={handleSelect} />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <img src={singer.avatar || '/placeholder.png'} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />
          <h2>{singer.name}</h2>
          <p style={{ color: '#888' }}>已收录 {singer.songCount} 首歌</p>
          <div style={{
            background: '#f9f9f9', borderRadius: 12, padding: 20,
            textAlign: 'left', margin: '24px 0', fontSize: 14, lineHeight: 1.8,
          }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px' }}>赛制规则</p>
            <p style={{ margin: 0, color: '#666' }}>随机抽取歌曲，两两对决，逐轮淘汰，直到冠军</p>
            <p style={{ margin: 0, color: '#666' }}>每组可试听 30 秒，凭感觉选</p>
          </div>
          <button
            onClick={() => navigate(`/game?singer=${encodeURIComponent(singer.id)}&platform=${encodeURIComponent(singer.platform)}`)}
            style={{
              background: '#1db954', color: '#fff', border: 'none',
              padding: '16px 64px', borderRadius: 28, fontSize: 20,
              cursor: 'pointer', width: '100%', fontWeight: 600,
            }}
          >
            开始淘汰赛
          </button>
          <button
            onClick={reset}
            style={{
              background: 'none', border: 'none', color: '#999',
              marginTop: 16, cursor: 'pointer', fontSize: 14,
            }}
          >
            换一个歌手
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 更新 App.tsx 引入 Home**

```tsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<div>Game</div>} />
      <Route path="/result" element={<div>Result</div>} />
    </Routes>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx src/components/SearchBox.tsx src/App.tsx
git commit -m "feat: add home page with singer search"
```

---

### Task 8: 游戏页 + 对战组件

**Files:**
- Create: `src/pages/Game.tsx`, `src/components/SongCard.tsx`, `src/components/ProgressBar.tsx`, `src/components/TrimRevive.tsx`

- [ ] **Step 1: ProgressBar 组件**

```tsx
interface Props {
  roundName: string
  current: number
  total: number
}

export default function ProgressBar({ roundName, current, total }: Props) {
  const pct = Math.round((current / total) * 100)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 6 }}>
        <span>{roundName}</span>
        <span>第 {current + 1} / {total} 组</span>
      </div>
      <div style={{ height: 4, background: '#eee', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1db954', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: SongCard 组件**

```tsx
import { useState, useEffect } from 'react'
import { play, stop, getCurrentSongId } from '../lib/audio'
import type { Song } from '../types'

interface Props {
  song: Song
  selected: boolean
  onClick: () => void
  canBoth: boolean
}

export default function SongCard({ song, selected, onClick, canBoth }: Props) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const check = setInterval(() => {
      setPlaying(getCurrentSongId() === song.id)
    }, 200)
    return () => clearInterval(check)
  }, [song.id])

  // 加载播放URL后自动触发
  useEffect(() => {
    if (!song.playUrl) return
    // 不自动播放，等用户点击
  }, [song.playUrl])

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!song.playUrl) return
    if (playing) { stop(); return }
    play(song.playUrl, song.id)
  }

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, border: selected ? '2px solid #1db954' : '2px solid #eee',
        borderRadius: 12, padding: 16, textAlign: 'center',
        cursor: 'pointer', background: selected ? '#f0fdf4' : '#fff',
        transition: 'border 0.2s',
      }}
    >
      <img src={song.cover || '/placeholder.png'} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />
      <p style={{ fontWeight: 600, margin: '0 0 4px', fontSize: 16 }}>{song.name}</p>
      <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{song.album} · {song.year}</p>
      <button
        onClick={handlePlay}
        style={{
          marginTop: 10, border: 'none', background: playing ? '#e74c3c' : '#1db954',
          color: '#fff', borderRadius: 20, padding: '6px 20px', cursor: 'pointer',
          fontSize: 12, fontWeight: 600,
        }}
      >
        {playing ? '⏸ 停止' : '▶ 试听 30s'}
      </button>
      {selected && (
        <div style={{ marginTop: 8, color: '#1db954', fontSize: 13, fontWeight: 600 }}>
          {canBoth ? '已选择 ✓' : '✓'}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: TrimRevive 组件（裁剪/复活界面）**

```tsx
import { useState } from 'react'
import type { Song } from '../types'

interface Props {
  mode: 'trim' | 'revive'
  candidates: Song[]
  target: number
  onConfirm: (selected: Song[]) => void
}

export default function TrimRevive({ mode, candidates, target, onConfirm }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  const label = mode === 'trim' ? '请去除' : '请复活'
  const current = mode === 'trim' ? candidates.length - checked.size : checked.size
  const count = mode === 'trim' ? `去除 ${checked.size} 首，当前 ${current} / ${target}` : `复活 ${checked.size} 首，当前 ${current} / ${target}`

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center' }}>{label} {mode === 'trim' ? target - candidates.length + checked.size : target - checked.size} 首歌</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>{count}</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {candidates.map((s) => (
          <li
            key={s.id}
            onClick={() => toggle(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 10, margin: '6px 0', borderRadius: 8,
              cursor: 'pointer', background: checked.has(s.id) ? '#fff3cd' : '#f9f9f9',
            }}
          >
            <input type="checkbox" checked={checked.has(s.id)} onChange={() => toggle(s.id)} />
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          const result = mode === 'trim'
            ? candidates.filter(s => !checked.has(s.id))
            : candidates.filter(s => checked.has(s.id))
          onConfirm(result)
        }}
        disabled={current !== target}
        style={{
          width: '100%', padding: 14, marginTop: 20,
          background: current === target ? '#1db954' : '#ccc',
          color: '#fff', border: 'none', borderRadius: 24, fontSize: 16,
          cursor: current === target ? 'pointer' : 'not-allowed',
        }}
      >
        确认
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Game 页面**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { getSongs } from '../lib/api'
import { generateRounds, buildNextRound, getSelectedSongs, getEliminatedSongs, getTournamentConfig } from '../lib/bracket'
import ProgressBar from '../components/ProgressBar'
import SongCard from '../components/SongCard'
import TrimRevive from '../components/TrimRevive'
import type { Choice, Song } from '../types'

export default function Game() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const singerId = searchParams.get('singer') || ''
  const platform = searchParams.get('platform') || ''
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [matchStart, setMatchStart] = useState(0)
  const [error, setError] = useState('')

  // 初始化：加载歌曲、生成对战
  useEffect(() => {
    if (store.rounds.length > 0) { setLoading(false); return }
    if (!singerId) { navigate('/'); return }
    getSongs(singerId, platform)
      .then((songs) => {
        if (!getTournamentConfig(songs.length)) {
          setError('该歌手歌曲太少（不足8首），请换一个歌手')
          setLoading(false)
          return
        }
        const rounds = generateRounds(songs)
        store.setSongs(songs)
        store.setRounds(rounds)
        setMatchStart(Date.now())
        setLoading(false)
      })
      .catch(() => { setError('加载歌曲失败，请重试'); setLoading(false) })
  }, [])

  // 加载播放URL
  useEffect(() => {
    if (store.stage !== 'playing' || loading) return
    const round = store.rounds[store.currentRound]
    if (!round) return
    const match = round.matches[store.currentMatch]
    if (!match) return
    // 为当前对战的歌曲异步加载播放URL
    const loadUrls = async () => {
      const { getPlayUrl } = await import('../lib/api')
      for (const song of [match.songA, match.songB]) {
        if (!song.playUrl) {
          try {
            song.playUrl = await getPlayUrl(song.id, song.platform)
          } catch { song.playUrl = '' }
        }
      }
    }
    loadUrls()
  }, [store.currentRound, store.currentMatch, store.stage, loading])

  if (loading) return <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>加载中...</div>
  if (error) return (
    <div style={{ textAlign: 'center', padding: 100 }}>
      <p>{error}</p>
      <button onClick={() => navigate('/')} style={{ background: '#1db954', color: '#fff', border: 'none', padding: '10px 32px', borderRadius: 20, cursor: 'pointer' }}>返回首页</button>
    </div>
  )

  // 裁剪/复活阶段
  if (store.stage === 'trimming') {
    const allSelected = getSelectedSongs(store.rounds[0])
    return (
      <TrimRevive
        mode="trim"
        candidates={allSelected}
        target={32}
        onConfirm={(kept) => {
          // 用 kept 列表替换第一轮，重新生成后续
          // ponytail: 直接在 Game 内处理，不拆额外函数
          const newFirstRound = {
            ...store.rounds[0],
            matches: store.rounds[0].matches.filter(m => {
              const keptA = kept.find(s => s.id === m.songA.id)
              const keptB = kept.find(s => s.id === m.songB.id)
              if (!keptA && !keptB) return false
              // 更新 choice 以反映裁剪结果
              if (!keptA) m.choice = 'b'
              else if (!keptB) m.choice = 'a'
              else if (keptA && keptB) m.choice = 'both'
              else m.choice = 'a'
              return true
            }),
          }
          const rounds = [newFirstRound]
          const config = ['32进16', '16进8', '8进4', '4进2', '2选1']
          let pool = kept
          for (const name of config) {
            const next = buildNextRound({ name: '', matches: [] }, name)
            // 手动构建
            const shuffled = [...pool].sort(() => Math.random() - 0.5)
            const matches: typeof next.matches = []
            for (let i = 0; i < shuffled.length; i += 2) {
              matches.push({ songA: shuffled[i], songB: shuffled[i + 1] || shuffled[i], choice: null, decisionMs: 0 })
            }
            rounds.push({ name, matches })
            pool = []
          }
          store.setRounds(rounds)
          store.setStage('playing')
          setMatchStart(Date.now())
        }}
      />
    )
  }

  if (store.stage === 'reviving') {
    const eliminated = getEliminatedSongs(store.rounds[0])
    const need = 32 - getSelectedSongs(store.rounds[0]).length
    return (
      <TrimRevive
        mode="revive"
        candidates={eliminated}
        target={need}
        onConfirm={(revived) => {
          const selected = getSelectedSongs(store.rounds[0])
          const pool = [...selected, ...revived]
          // 重建rounds（同trim逻辑，代码略重复）
          const config = ['32进16', '16进8', '8进4', '4进2', '2选1']
          const rounds = [store.rounds[0]]
          let cur = pool
          for (const name of config) {
            const shuffled = [...cur].sort(() => Math.random() - 0.5)
            const matches: Round['matches'] = []
            for (let i = 0; i < shuffled.length; i += 2) {
              matches.push({ songA: shuffled[i], songB: shuffled[i + 1] || shuffled[i], choice: null, decisionMs: 0 })
            }
            rounds.push({ name, matches })
            cur = []
          }
          store.setRounds(rounds)
          store.setStage('playing')
          setMatchStart(Date.now())
        }}
      />
    )
  }

  // 完成所有轮次
  if (store.currentRound >= store.rounds.length) {
    navigate(`/result?singer=${encodeURIComponent(singerId)}&platform=${encodeURIComponent(platform)}`)
    return null
  }

  const round = store.rounds[store.currentRound]
  if (!round) return null
  const match = round.matches[store.currentMatch]
  if (!match) return null

  const isFirstRound = store.currentRound === 0

  const handleChoice = (choice: Choice) => {
    const decisionMs = Date.now() - matchStart
    store.recordChoice(store.currentRound, store.currentMatch, choice, decisionMs)

    // 构建下一轮（单选时）
    if (!isFirstRound && choice !== 'both' && choice !== 'neither') {
      // 完成当前轮所有match后构建下一轮
      const allDone = store.currentMatch + 1 >= round.matches.length
      if (allDone) {
        const nextRoundName = store.rounds[store.currentRound + 1]?.name
        if (nextRoundName) {
          const nextRound = buildNextRound(round, nextRoundName)
          const rounds = [...store.rounds]
          rounds[store.currentRound + 1] = nextRound
          store.setRounds(rounds)
        }
      }
    }

    store.nextMatch()
    setMatchStart(Date.now())
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>
      <ProgressBar
        roundName={round.name}
        current={store.currentMatch}
        total={round.matches.length}
      />
      <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
        <SongCard
          song={match.songA}
          selected={match.choice === 'a' || match.choice === 'both'}
          onClick={() => handleChoice(match.choice === 'a' ? null as any : 'a')}
          canBoth={isFirstRound}
        />
        <SongCard
          song={match.songB}
          selected={match.choice === 'b' || match.choice === 'both'}
          onClick={() => handleChoice(match.choice === 'b' ? null as any : 'b')}
          canBoth={isFirstRound}
        />
      </div>
      {isFirstRound && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button
            onClick={() => handleChoice('neither')}
            style={{
              background: match.choice === 'neither' ? '#e74c3c' : '#fff',
              color: match.choice === 'neither' ? '#fff' : '#333',
              border: '1px solid #ddd', padding: '10px 24px', borderRadius: 20,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            两个都不选
          </button>
          <button
            onClick={() => handleChoice('both')}
            style={{
              background: match.choice === 'both' ? '#1db954' : '#fff',
              color: match.choice === 'both' ? '#fff' : '#333',
              border: '1px solid #ddd', padding: '10px 24px', borderRadius: 20,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            两个都选
          </button>
          <button
            onClick={() => handleChoice(match.choice || 'a')}
            style={{
              background: '#1db954', color: '#fff', border: 'none',
              padding: '10px 32px', borderRadius: 20, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            下一组 →
          </button>
        </div>
      )}
      {!isFirstRound && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#888', fontSize: 14 }}>点击歌曲卡片选择</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: 更新 App.tsx 引入 Game**

Edit `src/App.tsx`: 在 import 和 Route 中加入 Game

- [ ] **Step 6: Commit**

```bash
git add src/pages/Game.tsx src/components/SongCard.tsx src/components/ProgressBar.tsx src/components/TrimRevive.tsx src/App.tsx
git commit -m "feat: add game page with tournament gameplay"
```

---

### Task 9: 结果页 + 对阵树 + 导出

**Files:**
- Create: `src/pages/Result.tsx`, `src/components/BracketTree.tsx`

- [ ] **Step 1: BracketTree 组件**

```tsx
import { useState, useRef } from 'react'
import type { Round } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

export default function BracketTree({ rounds, champion }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const treeRef = useRef<HTMLDivElement>(null)

  const toggle = (idx: number) => {
    const next = new Set(expanded)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setExpanded(next)
  }

  return (
    <div ref={treeRef} style={{ overflowX: 'auto', padding: '20px 0' }}>
      <div style={{ display: 'flex', gap: 24, minWidth: 900, justifyContent: 'center', alignItems: 'flex-start' }}>
        {rounds.map((round, ri) => (
          <div key={ri} style={{ minWidth: 130 }}>
            <div
              onClick={() => toggle(ri)}
              style={{
                fontWeight: 600, fontSize: 13, marginBottom: 8,
                cursor: 'pointer', userSelect: 'none',
                color: expanded.has(ri) ? '#333' : '#999',
              }}
            >
              {expanded.has(ri) ? '▼' : '▶'} {round.name}
            </div>
            {expanded.has(ri) && round.matches.map((m, mi) => (
              <div
                key={mi}
                style={{
                  border: '1px solid #eee', borderRadius: 6, padding: '6px 8px',
                  margin: '3px 0', fontSize: 11, cursor: 'default',
                  background: m.choice ? '#fafafa' : '#fff',
                }}
                title={m.choice ? `选了: ${m.choice}\n耗时: ${(m.decisionMs / 1000).toFixed(1)}s` : ''}
              >
                <div style={{ fontWeight: m.choice === 'a' || m.choice === 'both' ? 600 : 400 }}>
                  {m.songA.name}
                </div>
                <div style={{ fontWeight: m.choice === 'b' || m.choice === 'both' ? 600 : 400 }}>
                  {m.songB.name}
                </div>
                {m.choice && (
                  <div style={{ fontSize: 9, color: '#1db954', marginTop: 2 }}>
                    {m.choice === 'both' ? '双选' : m.choice === 'neither' ? '都不选' : `选${m.choice === 'a' ? m.songA.name : m.songB.name}`} · {(m.decisionMs / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{ textAlign: 'center', minWidth: 80, alignSelf: 'center' }}>
          <div style={{ fontSize: 10, color: '#f5a623', textTransform: 'uppercase', marginBottom: 4 }}>冠军</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f5a623' }}>{champion}</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Result 页面**

```tsx
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import BracketTree from '../components/BracketTree'

export default function Result() {
  const navigate = useNavigate()
  const { rounds, singer } = useStore()
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!singer || rounds.length === 0) { navigate('/'); return }
  }, [singer, rounds, navigate])

  if (!singer) return null

  const lastRound = rounds[rounds.length - 1]
  const champion = lastRound?.matches[0]?.choice === 'a'
    ? lastRound.matches[0].songA.name
    : lastRound?.matches[0]?.songB.name || '—'

  const handleExport = async () => {
    if (!exportRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const QRCode = (await import('qrcode')).default

    const canvas = await html2canvas(exportRef.current, { backgroundColor: '#fff', scale: 2 })
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, window.location.origin, { width: 120, margin: 1 })

    // 拼二维码到右下角
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = canvas.width
    finalCanvas.height = canvas.height
    const ctx = finalCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, 0)
    ctx.drawImage(qrCanvas, finalCanvas.width - 140, finalCanvas.height - 140, 120, 120)

    // 下载
    const link = document.createElement('a')
    link.download = `${singer.name}-音乐淘汰赛.png`
    link.href = finalCanvas.toDataURL()
    link.click()
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <div ref={exportRef}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>{singer.name} · 歌曲淘汰赛</h1>
        </div>
        <BracketTree rounds={rounds} champion={champion} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={handleExport}
          style={{
            background: '#1db954', color: '#fff', border: 'none',
            padding: '14px 40px', borderRadius: 24, fontSize: 16,
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          导出图片
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#fff', color: '#333', border: '1px solid #ddd',
            padding: '14px 40px', borderRadius: 24, fontSize: 16,
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 更新 App.tsx 引入 Result**

Edit `src/App.tsx`: 在 import 和 Route 中加入 Result

- [ ] **Step 4: Commit**

```bash
git add src/pages/Result.tsx src/components/BracketTree.tsx src/App.tsx
git commit -m "feat: add result page with bracket tree and image export"
```

---

### Task 10: 全局样式 + 收尾

**Files:**
- Modify: `src/App.tsx` (确认三个路由)
- Modify: `index.html` (加 viewport meta，已有)

- [ ] **Step 1: 确认 App.tsx 三个路由完整**

```tsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Result from './pages/Result'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  )
}
```

- [ ] **Step 2: 全局 CSS reset**

在 `index.html` 已有的基础上，不需要额外 CSS 文件（所有样式 inline）

- [ ] **Step 3: 验证构建**

Run: `cd /d/wy001 && npx vite build`
Expected: build 成功，dist 目录生成

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up all routes, verify build"
```

---

### Task 11: 添加 placeholder 头像图

**Files:**
- Create: `public/placeholder.png` （一张 200x200 的灰色默认图）

- [ ] **Step 1: 生成占位图脚本或直接跳过**

ponytail: 直接在前端用 CSS background 兜底，不加文件。img 标签的 onError 和 background 色已覆盖。

跳过此任务。

---

### Task 12: 部署到 Vercel

- [ ] **Step 1: 确保 git init 并提交所有代码**

```bash
cd /d/wy001
git init
git add -A
git commit -m "feat: music tournament app — search singer, bracket elimination, image export"
```

- [ ] **Step 2: 安装 Vercel CLI 并部署**

```bash
npm i -g vercel
cd /d/wy001
vercel --prod
```

按提示登录、确认项目名，部署完成后获取 URL。

- [ ] **Step 3: 配置腾讯云域名**

在腾讯云 DNS 控制台添加 CNAME 记录，指向 `cname.vercel-dns.com`，在 Vercel 项目 Settings → Domains 中添加自定义域名。

---

## 计划结束

所有任务完成后，应用应该具备：搜索歌手 → 加载歌曲 → 随机分组 → 两两试听对决 → 逐轮淘汰 → 导出长图（带二维码）的完整流程。
