import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { getSongs } from '../lib/api'
import { generateRounds, buildNextRound, getSelectedSongs, getEliminatedSongs, getTournamentConfig } from '../lib/bracket'
import ProgressBar from '../components/ProgressBar'
import SongCard from '../components/SongCard'
import TrimRevive from '../components/TrimRevive'
import type { Choice, Round, Song } from '../types'

function buildRemainingRounds(pool: Song[], firstRound: Round): Round[] {
  const config = getTournamentConfig(pool.length * 2)
  if (!config) return [firstRound]
  const rounds: Round[] = [firstRound]
  let cur = [...pool]
  for (const name of config.rounds.slice(1)) {
    const shuffled = [...cur].sort(() => Math.random() - 0.5)
    const matches: Round['matches'] = []
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({ songA: shuffled[i], songB: shuffled[i + 1] || shuffled[i], choice: null, decisionMs: 0 })
    }
    rounds.push({ name, matches })
    // 预留空槽给下一轮（在 buildNextRound 中动态填充）
    cur = []
  }
  return rounds
}

export default function Game() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const singerId = searchParams.get('singer') || ''
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [matchStart, setMatchStart] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (store.rounds.length > 0) { setLoading(false); setMatchStart(Date.now()); return }
    if (!singerId) { navigate('/'); return }
    getSongs(singerId)
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

  useEffect(() => {
    if (store.stage !== 'playing' || loading) return
    const round = store.rounds[store.currentRound]
    if (!round) return
    const match = round.matches[store.currentMatch]
    if (!match) return
    const loadUrls = async () => {
      const { getPlayUrl } = await import('../lib/api')
      for (const song of [match.songA, match.songB]) {
        if (!song.playUrl) {
          try { song.playUrl = await getPlayUrl(song.id) }
          catch { song.playUrl = '' }
        }
      }
    }
    loadUrls()
  }, [store.currentRound, store.currentMatch, store.stage, loading])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#999', fontSize: 16 }}>
      加载中...
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <p style={{ color: '#666', fontSize: 16 }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ background: '#1db954', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: 24, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
        返回首页
      </button>
    </div>
  )

  // Trim stage
  if (store.stage === 'trimming') {
    const allSelected = getSelectedSongs(store.rounds[0])
    return (
      <TrimRevive
        mode="trim"
        candidates={allSelected}
        target={32}
        onConfirm={(kept) => {
          const newFirstRound: Round = {
            ...store.rounds[0],
            matches: store.rounds[0].matches.filter(m => {
              const ka = kept.find(s => s.id === m.songA.id)
              const kb = kept.find(s => s.id === m.songB.id)
              if (!ka && !kb) return false
              if (!ka) m.choice = 'b'
              else if (!kb) m.choice = 'a'
              else m.choice = 'both'
              return true
            }),
          }
          const rounds = buildRemainingRounds(kept, newFirstRound)
          store.setRoundsAndSkip(rounds, 1)
          setMatchStart(Date.now())
        }}
      />
    )
  }

  // Revive stage
  if (store.stage === 'reviving') {
    const eliminated = getEliminatedSongs(store.rounds[0])
    const selected = getSelectedSongs(store.rounds[0])
    const need = 32 - selected.length
    return (
      <TrimRevive
        mode="revive"
        candidates={eliminated}
        target={need}
        onConfirm={(revived) => {
          const pool = [...selected, ...revived]
          const rounds = buildRemainingRounds(pool, store.rounds[0])
          store.setRoundsAndSkip(rounds, 1)
          setMatchStart(Date.now())
        }}
      />
    )
  }

  // Finished all rounds
  if (store.currentRound >= store.rounds.length) {
    navigate(`/result?singer=${encodeURIComponent(singerId)}`)
    return null
  }

  const round = store.rounds[store.currentRound]
  if (!round) return null
  const match = round.matches[store.currentMatch]
  if (!match) return null
  const isFirstRound = store.currentRound === 0

  // Record choice only, don't advance
  const setChoice = (choice: Choice) => {
    store.recordChoice(store.currentRound, store.currentMatch, choice, 0)
  }

  // Record with decision time and advance
  const commitAndAdvance = (choice: Choice) => {
    const decisionMs = Date.now() - matchStart
    store.recordChoice(store.currentRound, store.currentMatch, choice, decisionMs)

    // Build next round if last match of a non-first round
    if (!isFirstRound) {
      const allDone = store.currentMatch + 1 >= round.matches.length
      if (allDone) {
        const nextRoundName = store.rounds[store.currentRound + 1]?.name
        if (nextRoundName) {
          // Read fresh round from store — the render-closure `round` is stale after recordChoice
          const freshRound = useStore.getState().rounds[store.currentRound]
          const nextRound = buildNextRound(freshRound, nextRoundName)
          const rounds = [...useStore.getState().rounds]
          rounds[store.currentRound + 1] = nextRound
          useStore.getState().setRoundsAndSkip(rounds, store.currentRound)
        }
      }
    }

    store.nextMatch()
    setMatchStart(Date.now())
  }

  // All rounds: click card only selects, doesn't advance
  const handleCardClick = (side: 'a' | 'b') => {
    const cur = match.choice
    if (isFirstRound) {
      if (side === 'a') {
        if (cur === 'a') { setChoice(null as any); return }
        if (!cur) { setChoice('a'); return }
        if (cur === 'b') { setChoice('both'); return }
        if (cur === 'both') { setChoice('b'); return }
        if (cur === 'neither') { setChoice('a'); return }
      } else {
        if (cur === 'b') { setChoice(null as any); return }
        if (!cur) { setChoice('b'); return }
        if (cur === 'a') { setChoice('both'); return }
        if (cur === 'both') { setChoice('a'); return }
        if (cur === 'neither') { setChoice('b'); return }
      }
    } else {
      if (cur === side) return
      setChoice(side)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← 首页
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>{store.singer?.name} · <span style={{ color: '#ff6b35' }}>v3</span></span>
        </div>

        <ProgressBar roundName={round.name} current={store.currentMatch} total={round.matches.length} />

        {round.matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#888', marginBottom: 24 }}>准备进入下一轮...</p>
            <button onClick={() => { store.setStage('playing'); setMatchStart(Date.now()) }}
              style={{ background: '#1db954', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: 24, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
              继续
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <SongCard
                song={match.songA}
                selected={match.choice === 'a' || match.choice === 'both'}
                onClick={() => handleCardClick('a')}
                canBoth={isFirstRound}
              />
              <div style={{
                display: 'flex', alignItems: 'center',
                fontSize: 24, fontWeight: 900, color: '#ddd',
                alignSelf: 'center',
              }}>VS</div>
              <SongCard
                song={match.songB}
                selected={match.choice === 'b' || match.choice === 'both'}
                onClick={() => handleCardClick('b')}
                canBoth={isFirstRound}
              />
            </div>

            <div style={{ marginTop: 28, textAlign: 'center' }}>
              {isFirstRound && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <button
                    onClick={() => setChoice(match.choice === 'neither' ? null as any : 'neither')}
                    style={{
                      background: match.choice === 'neither' ? '#e74c3c' : '#fff',
                      color: match.choice === 'neither' ? '#fff' : '#666',
                      border: match.choice === 'neither' ? 'none' : '1px solid #ddd',
                      padding: '10px 28px', borderRadius: 24,
                      cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    都不选
                  </button>
                  <button
                    onClick={() => setChoice(match.choice === 'both' ? null as any : 'both')}
                    style={{
                      background: match.choice === 'both' ? '#1db954' : '#fff',
                      color: match.choice === 'both' ? '#fff' : '#666',
                      border: match.choice === 'both' ? 'none' : '1px solid #ddd',
                      padding: '10px 28px', borderRadius: 24,
                      cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    两首都选
                  </button>
                </div>
              )}

              <button
                onClick={() => match.choice && commitAndAdvance(match.choice)}
                disabled={!match.choice}
                style={{
                  background: match.choice ? 'linear-gradient(135deg, #1db954, #169c46)' : '#e0e0e0',
                  color: '#fff', border: 'none',
                  padding: '14px 48px', borderRadius: 28, cursor: match.choice ? 'pointer' : 'not-allowed',
                  fontSize: 16, fontWeight: 700,
                  boxShadow: match.choice ? '0 4px 20px rgba(29,185,84,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                下一组 {match.choice ? '→' : '(请选择)'}
              </button>

              {!match.choice && (
                <p style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>点击歌曲卡片选择，再点下一组</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
