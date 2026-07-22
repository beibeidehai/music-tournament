import type { Round } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

const accent = '#1db954'
const cardBg = 'rgba(255,255,255,0.03)'
const lineColor = 'rgba(255,255,255,0.06)'

const KEYFRAMES = `
@keyframes star-move-top {
  0%   { transform: translate(0%, 0%); opacity: 1; }
  100% { transform: translate(100%, 0%); opacity: 0; }
}
@keyframes star-move-bottom {
  0%   { transform: translate(0%, 0%); opacity: 1; }
  100% { transform: translate(-100%, 0%); opacity: 0; }
}
`

/* ---------- song mini-card ---------- */
function SongRow({ song, won, side }: { song: any; won: boolean; side: 'left' | 'right' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flexDirection: side === 'left' ? 'row' : 'row-reverse',
      opacity: won ? 1 : 0.35,
      padding: '5px 0',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: song.cover
          ? `url(${song.cover}) center/cover`
          : 'rgba(255,255,255,0.05)',
      }} />
      <span style={{
        fontWeight: won ? 600 : 400,
        fontSize: 12,
        color: won ? accent : 'rgba(255,255,255,0.45)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: !won ? 'line-through' : 'none',
        maxWidth: 120,
        textAlign: side === 'left' ? 'left' : 'right',
      }}>{song.name}</span>
    </div>
  )
}

export default function BracketTree({ rounds, champion }: Props) {
  const visible = rounds.filter(r => r.matches.length > 0)
  const nCols = visible.length
  const firstMatches = visible[0]?.matches.length || 0

  return (
    <div style={{ overflowX: 'auto', padding: '24px 0' }}>
      <style>{KEYFRAMES}</style>

      <div style={{
        display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'stretch',
        minWidth: nCols * 180 + 180,
      }}>
        {/* ===== LEFT HALF ===== */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flex: '1 1 50%' }}>
          {visible.map((round, ri) => {
            const half = Math.ceil(round.matches.length / 2)
            const leftMatches = round.matches.slice(0, half)
            return (
              <div key={ri} style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 4, minWidth: 150, maxWidth: 165,
              }}>
                <div style={{
                  textAlign: 'right', fontWeight: 700, fontSize: 11,
                  color: accent, marginBottom: 6, paddingRight: 4,
                  opacity: 0.8,
                }}>{round.name}</div>
                {leftMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#444', fontSize: 11, padding: 8 }}>—</div>
                ) : (
                  leftMatches.map((m, mi) => (
                    <div key={mi} style={{
                      background: cardBg, borderRadius: 10,
                      padding: '8px 8px 8px 12px',
                      border: `1px solid ${m.choice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <SongRow song={m.songA} won={m.choice === 'a' || m.choice === 'both'} side="left" />
                      <div style={{ height: 1, background: lineColor, margin: '4px 0' }} />
                      <SongRow song={m.songB} won={m.choice === 'b' || m.choice === 'both'} side="left" />
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>

        {/* ===== CENTER CHAMPION ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, padding: '0 8px',
        }}>
          <div className="star-border-container" style={{
            display: 'inline-block', position: 'relative',
            borderRadius: 24, overflow: 'hidden', width: 140,
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
              textAlign: 'center', padding: '28px 16px',
              borderRadius: 24, zIndex: 1,
            }}>
              <div style={{ fontSize: 36 }}>👑</div>
              <p style={{
                margin: '6px 0 0', fontSize: 10, color: accent,
                fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              }}>CHAMPION</p>
              <p style={{
                margin: '10px 0 0', fontWeight: 800, fontSize: 16,
                color: '#fff', wordBreak: 'break-all', lineHeight: 1.3,
              }}>{champion}</p>
            </div>
          </div>
        </div>

        {/* ===== RIGHT HALF ===== */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', flex: '1 1 50%' }}>
          {visible.map((round, ri) => {
            const half = Math.ceil(round.matches.length / 2)
            const rightMatches = round.matches.slice(half)
            return (
              <div key={ri} style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 4, minWidth: 150, maxWidth: 165,
              }}>
                <div style={{
                  textAlign: 'left', fontWeight: 700, fontSize: 11,
                  color: accent, marginBottom: 6, paddingLeft: 4,
                  opacity: rightMatches.length ? 0.8 : 0,
                }}>{rightMatches.length ? round.name : ''}</div>
                {rightMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#444', fontSize: 11, padding: 8 }}>—</div>
                ) : (
                  rightMatches.map((m, mi) => (
                    <div key={mi} style={{
                      background: cardBg, borderRadius: 10,
                      padding: '8px 12px 8px 8px',
                      border: `1px solid ${m.choice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <SongRow song={m.songA} won={m.choice === 'a' || m.choice === 'both'} side="right" />
                      <div style={{ height: 1, background: lineColor, margin: '4px 0' }} />
                      <SongRow song={m.songB} won={m.choice === 'b' || m.choice === 'both'} side="right" />
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
