import type { Round, Song } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

const accent = '#1db954'

const STYLE = `
@keyframes star-move-top {
  0%   { transform: translate(0%, 0%); opacity: 1; }
  100% { transform: translate(100%, 0%); opacity: 0; }
}
@keyframes star-move-bottom {
  0%   { transform: translate(0%, 0%); opacity: 1; }
  100% { transform: translate(-100%, 0%); opacity: 0; }
}
`

function getTop4(rounds: Round[], champion: string): Song[] {
  // Get songs from the semi-final round (4→2) — these are the top 4
  const semiRound = [...rounds].reverse().find(r => r.matches.length === 2)
  if (!semiRound) {
    // fallback: last round's songs
    const last = rounds[rounds.length - 1]
    if (!last?.matches[0]) return []
    const m = last.matches[0]
    return [m.songA, m.songB].filter(Boolean)
  }
  const songs: Song[] = []
  for (const m of semiRound.matches) {
    songs.push(m.songA, m.songB)
  }
  return songs
}

export default function BracketTree({ rounds, champion }: Props) {
  const top4 = getTop4(rounds, champion)

  return (
    <div style={{ padding: '24px 16px' }}>
      <style>{STYLE}</style>

      {/* Champion — centered, star-border */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', position: 'relative',
          borderRadius: 24, overflow: 'hidden', width: 200,
        }}>
          <div style={{
            position: 'absolute', width: '300%', height: '50%',
            opacity: 0.7, top: -10, left: '-250%', borderRadius: '50%',
            background: `linear-gradient(90deg, transparent, ${accent}, #f5a623, ${accent}, transparent)`,
            animation: 'star-move-top 3s linear infinite alternate',
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', width: '300%', height: '50%',
            opacity: 0.7, bottom: -10, right: '-250%', borderRadius: '50%',
            background: `linear-gradient(90deg, transparent, ${accent}, #f5a623, ${accent}, transparent)`,
            animation: 'star-move-bottom 3s linear infinite alternate',
            zIndex: 0,
          }} />
          <div style={{
            position: 'relative', border: '1px solid #222',
            background: '#0d0d15', color: 'white',
            textAlign: 'center', padding: '32px 20px',
            borderRadius: 24, zIndex: 1,
          }}>
            <div style={{ fontSize: 42 }}>👑</div>
            <p style={{
              margin: '8px 0 0', fontSize: 11, color: accent,
              fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            }}>CHAMPION</p>
            <p style={{
              margin: '12px 0 0', fontWeight: 800, fontSize: 18,
              color: '#fff', lineHeight: 1.3,
            }}>{champion}</p>
          </div>
        </div>
      </div>

      {/* Top 4 cards */}
      {top4.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.3)',
            fontWeight: 600, letterSpacing: 2, marginBottom: 16,
          }}>四 强</p>
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center',
            flexWrap: 'wrap', maxWidth: 640, margin: '0 auto',
          }}>
            {top4.map((song, i) => {
              const isChamp = song.name === champion
              return (
                <div key={song.id} style={{
                  flex: '1 1 130px', maxWidth: 160, minWidth: 120,
                  background: isChamp ? 'rgba(29,185,84,0.06)' : 'rgba(255,255,255,0.03)',
                  borderRadius: 14, padding: 16,
                  border: isChamp
                    ? `1px solid ${accent}`
                    : '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 12,
                    margin: '0 auto 10px',
                    background: song.cover
                      ? `url(${song.cover}) center/cover`
                      : 'rgba(255,255,255,0.04)',
                  }} />
                  <p style={{
                    margin: 0, fontWeight: isChamp ? 700 : 500,
                    fontSize: 13, color: isChamp ? accent : 'rgba(255,255,255,0.7)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{song.name}</p>
                  {isChamp && (
                    <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>冠军</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
