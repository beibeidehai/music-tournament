import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { getSongs } from '../lib/api'
import { generateRounds, buildNextRound, getSelectedSongs, getEliminatedSongs, getTournamentConfig } from '../lib/bracket'
import { stop as stopAudio } from '../lib/audio'
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
    const matches: Round['matches'] = []
    for (let i = 0; i < cur.length; i += 2) {
      matches.push({ songA: cur[i], songB: cur[i + 1] || cur[i], choice: null, decisionMs: 0 })
    }
    rounds.push({ name, matches })
    // 预留空槽给下一轮（在 buildNextRound 中动态填充）
    cur = []
  }
  return rounds
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

export default function Game() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const singerId = searchParams.get('singer') || ''
  const singerName = searchParams.get('name') || ''
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [matchStart, setMatchStart] = useState(0)
  const [error, setError] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [previewPool, setPreviewPool] = useState<Song[]>([])
  const [fullSongs, setFullSongs] = useState<Song[]>([])

  useEffect(() => {
    if (store.rounds.length > 0) { setLoading(false); setMatchStart(Date.now()); return }
    if (!singerId) { navigate('/'); return }
    getSongs(singerId, singerName)
      .then((songs) => {
        const config = getTournamentConfig(songs.length)
        if (!config) {
          setError('该歌手歌曲太少（不足8首），请换一个歌手')
          setLoading(false)
          return
        }
        const shuffled = shuffle(songs)
        const pool = shuffled.slice(0, config.pick)
        setFullSongs(shuffled)
        setPreviewPool(pool)
        setPreviewing(true)
        setLoading(false)
      })
      .catch(() => { setError('加载歌曲失败，请重试'); setLoading(false) })
  }, [])

  const replaceSong = (idx: number) => {
    const used = new Set(previewPool.map(s => s.id))
    const unused = fullSongs.filter(s => !used.has(s.id))
    if (!unused.length) return
    const replacement = unused[Math.floor(Math.random() * unused.length)]
    const next = [...previewPool]
    next[idx] = replacement
    setPreviewPool(next)
  }

  const confirmPreview = () => {
    const rounds = generateRounds(previewPool)
    store.setSongs(previewPool)
    store.setRounds(rounds)
    setPreviewing(false)
    setMatchStart(Date.now())
  }

  // Round transition toast
  const [toast, setToast] = useState('')
  const prevRoundRef = useRef(store.currentRound)
  useEffect(() => {
    if (store.currentRound !== prevRoundRef.current && store.stage === 'playing') {
      const name = store.rounds[store.currentRound]?.name
      if (name) {
        setToast(name)
        const t = setTimeout(() => setToast(''), 2000)
        prevRoundRef.current = store.currentRound
        return () => clearTimeout(t)
      }
    }
    prevRoundRef.current = store.currentRound
  }, [store.currentRound, store.stage])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#999', fontSize: 16 }}>
      加载中...
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <p style={{ color: '#666', fontSize: 16 }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: 24, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
        返回首页
      </button>
    </div>
  )

  // Preview stage
  if (previewing) {
    const config = getTournamentConfig(previewPool.length)
    const songsPerRow = 4
    const rows = Math.ceil(previewPool.length / songsPerRow)
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => { setPreviewing(false); navigate('/') }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 14, cursor: 'pointer' }}>
              ← 返回
            </button>
            <span style={{ fontSize: 13, color: '#aaa' }}>{singerName} · 预览</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>
            {config?.rounds[0]} · 共 {previewPool.length} 首
          </h2>
          <p style={{ color: '#999', fontSize: 13, margin: '0 0 24px' }}>点击歌曲可替换，满意后开始对战</p>

          {Array.from({ length: rows }, (_, row) => {
            const rowSongs = previewPool.slice(row * songsPerRow, (row + 1) * songsPerRow)
            return (
              <div key={row} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {rowSongs.map((song, ci) => {
                  const idx = row * songsPerRow + ci
                  return (
                    <div key={idx} style={{
                      flex: 1, minWidth: 0,
                      background: '#fff', borderRadius: 14, padding: 10,
                      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                      cursor: 'pointer', transition: 'transform .15s',
                    }}
                      onClick={() => replaceSong(idx)}
                      title="点击替换"
                    >
                      <div style={{
                        width: '100%', aspectRatio: '1', borderRadius: 10,
                        background: song.cover ? `url(${song.cover}) center/cover` : '#eee',
                        marginBottom: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ccc', fontSize: 20,
                      }}>
                        {!song.cover && '♫'}
                      </div>
                      <p style={{
                        margin: 0, fontSize: 12, fontWeight: 500, color: '#333',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}>{idx + 1}. {song.name}</p>
                      <p style={{
                        margin: '2px 0 0', fontSize: 10, color: '#bbb',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>点击替换</p>
                    </div>
                  )
                })}
                {/* Fill empty slots */}
                {rowSongs.length < songsPerRow && Array.from({ length: songsPerRow - rowSongs.length }, (_, fi) => (
                  <div key={`empty-${fi}`} style={{ flex: 1, minWidth: 0 }} />
                ))}
              </div>
            )
          })}

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button onClick={confirmPreview} style={{
              background: 'linear-gradient(135deg, #000, #333)',
              color: '#fff', border: 'none',
              padding: '16px 60px', borderRadius: 28, fontSize: 17,
              cursor: 'pointer', fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              开始对战
            </button>
            <button onClick={() => {
              const shuffled = shuffle(fullSongs)
              setPreviewPool(shuffled.slice(0, previewPool.length))
            }} style={{
              background: 'none', border: 'none', color: '#999',
              marginLeft: 14, cursor: 'pointer', fontSize: 13,
            }}>
              全部换一批
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Trim stage
  if (store.stage === 'trimming') {
    const allSelected = getSelectedSongs(store.rounds[0])
    return (
      <TrimRevive
        mode="trim"
        candidates={allSelected}
        target={store.rounds[0].matches.length}
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
    const need = store.rounds[0].matches.length - selected.length
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
    stopAudio()
    store.recordChoice(store.currentRound, store.currentMatch, choice, decisionMs)

    // Build next round if last match, without resetting position
    const allDone = store.currentMatch + 1 >= round.matches.length
    if (allDone) {
      const nextIdx = store.currentRound + 1
      const nextRoundName = store.rounds[nextIdx]?.name
      if (nextRoundName) {
        const freshRound = useStore.getState().rounds[store.currentRound]
        const nextRound = buildNextRound(freshRound, nextRoundName)
        // Only update rounds — let nextMatch handle position advance
        useStore.setState((s: any) => {
          const rounds = [...s.rounds]
          rounds[nextIdx] = nextRound
          return { rounds }
        })
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
      {/* Round transition toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #000, #333)',
          color: '#fff', padding: '12px 32px', borderRadius: 28,
          fontSize: 16, fontWeight: 700,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          animation: 'toastIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← 首页
          </button>
          <span style={{ fontSize: 12, color: '#bbb' }}>{store.singer?.name} · <span style={{ color: '#ff6b35' }}>v4.19</span></span>
        </div>

        <ProgressBar roundName={round.name} current={store.currentMatch} total={round.matches.length} />

        {round.matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#888', marginBottom: 24 }}>准备进入下一轮...</p>
            <button onClick={() => {
              const prevRound = useStore.getState().rounds[store.currentRound - 1]
              if (prevRound) {
                const nextRound = buildNextRound(prevRound, round.name)
                const rounds = [...useStore.getState().rounds]
                rounds[store.currentRound] = nextRound
                useStore.getState().setRoundsAndSkip(rounds, store.currentRound)
              }
              setMatchStart(Date.now())
            }}
              style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: 24, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
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
                      background: match.choice === 'both' ? '#000' : '#fff',
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
                  background: match.choice ? 'linear-gradient(135deg, #000, #333)' : '#e0e0e0',
                  color: '#fff', border: 'none',
                  padding: '14px 48px', borderRadius: 28, cursor: match.choice ? 'pointer' : 'not-allowed',
                  fontSize: 16, fontWeight: 700,
                  boxShadow: match.choice ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                下一组 {match.choice ? '→' : '(请选择)'}
              </button>

              {store.currentMatch > 0 && (
                <button
                  onClick={() => store.prevMatch()}
                  style={{
                    background: 'none', border: '1px solid #ddd',
                    color: '#999', padding: '10px 32px', borderRadius: 24,
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    marginTop: 10,
                  }}
                >
                  ← 上一组
                </button>
              )}

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
