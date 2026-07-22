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
  const semiRound = [...rounds].reverse().find(r => r.matches.length === 2)
  if (!semiRound) {
    const last = rounds[rounds.length - 1]
    if (!last?.matches[0]) return []
    return [last.matches[0].songA, last.matches[0].songB].filter(Boolean)
  }
  const songs: Song[] = []
  for (const m of semiRound.matches) {
    songs.push(m.songA, m.songB)
  }
  return songs
}

export default function BracketTree({ rounds, champion }: Props) {
  const top4 = getTop4(rounds, champion)
  const others = top4.filter(s => s.name !== champion).slice(0, 3)

  return (
    <div style={{ padding: '32px 16px' }}>
      <style>{STYLE}</style>

      {/* Champion — crown above, cover inside, star-border */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
        <div style={{ textAlign: 'center' }}>
          {/* Crown floating above */}
          <div style={{ fontSize: 48, marginBottom: -20, position: 'relative', zIndex: 2 }}>👑</div>

          {/* Star-border card */}
          <div style={{
            display: 'inline-block', position: 'relative',
            borderRadius: 20, overflow: 'hidden', width: 180,
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
              textAlign: 'center', padding: '24px 20px',
              borderRadius: 20, zIndex: 1,
            }}>
              {/* Album cover */}
              <div style={{
                width: 96, height: 96, borderRadius: 16,
                margin: '0 auto 14px',
                background: rounds[rounds.length - 1]?.matches[0]?.songA?.cover
                  ? `url(${rounds[rounds.length - 1].matches[0].songA.cover}) center/cover`
                  : 'rgba(255,255,255,0.04)',
              }} />
              <p style={{
                margin: 0, fontSize: 11, color: accent,
                fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              }}>CHAMPION</p>
              <p style={{
                margin: '8px 0 0', fontWeight: 800, fontSize: 16,
                color: '#fff', lineHeight: 1.3,
              }}>{champion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Other 3 finalists */}
      {others.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.25)',
            fontWeight: 600, letterSpacing: 2, marginBottom: 16,
          }}>四 强</p>
          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center',
            flexWrap: 'wrap', maxWidth: 540, margin: '0 auto',
          }}>
            {others.map((song) => (
              <div key={song.id} style={{
                flex: '1 1 130px', maxWidth: 160, minWidth: 120,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14, padding: 18,
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 12,
                  margin: '0 auto 12px',
                  background: song.cover
                    ? `url(${song.cover}) center/cover`
                    : 'rgba(255,255,255,0.04)',
                }} />
                <p style={{
                  margin: 0, fontWeight: 500,
                  fontSize: 13, color: 'rgba(255,255,255,0.55)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{song.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
