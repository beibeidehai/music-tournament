import type { Round } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

const accent = '#1db954'

export default function BracketTree({ rounds, champion }: Props) {
  const visible = rounds.filter(r => r.matches.length > 0)

  return (
    <div style={{ overflowX: 'auto', padding: '20px 0 12px' }}>
      <div style={{
        display: 'flex', gap: 20, justifyContent: 'center',
        minWidth: visible.length * 170,
      }}>
        {rounds.map((round, ri) => (
          <div key={ri} style={{ minWidth: 145, maxWidth: 165 }}>
            {/* Round header */}
            <div style={{
              textAlign: 'center', fontWeight: 800, fontSize: 13,
              color: accent, marginBottom: 10,
              padding: '4px 0', borderRadius: 6,
              background: 'rgba(29,185,84,0.08)',
            }}>{round.name}</div>

            {/* Matches */}
            {round.matches.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: 12 }}>—</div>
            ) : (
              round.matches.map((m, mi) => (
                <div key={mi} style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '8px 10px',
                  margin: '4px 0', fontSize: 11,
                  background: m.choice ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                }}>
                  {/* Song A */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: m.choice === 'a' || m.choice === 'both' ? 1 : m.choice ? 0.3 : 0.7,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: m.songA.cover
                        ? `url(${m.songA.cover}) center/cover`
                        : 'rgba(255,255,255,0.06)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontWeight: m.choice === 'a' || m.choice === 'both' ? 700 : 400,
                      color: m.choice === 'a' || m.choice === 'both' ? accent : '#ccc',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: m.choice && m.choice !== 'a' && m.choice !== 'both' ? 'line-through' : 'none',
                    }}>{m.songA.name}</span>
                  </div>

                  {/* VS divider */}
                  <div style={{
                    height: 1, background: 'rgba(255,255,255,0.06)',
                    margin: '6px 0 6px 36px',
                  }} />

                  {/* Song B */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: m.choice === 'b' || m.choice === 'both' ? 1 : m.choice ? 0.3 : 0.7,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: m.songB.cover
                        ? `url(${m.songB.cover}) center/cover`
                        : 'rgba(255,255,255,0.06)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontWeight: m.choice === 'b' || m.choice === 'both' ? 700 : 400,
                      color: m.choice === 'b' || m.choice === 'both' ? accent : '#ccc',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: m.choice && m.choice !== 'b' && m.choice !== 'both' ? 'line-through' : 'none',
                    }}>{m.songB.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}

        {/* Champion */}
        <div style={{
          textAlign: 'center', minWidth: 110, maxWidth: 130,
          alignSelf: 'center',
          background: 'linear-gradient(135deg, rgba(29,185,84,0.15), rgba(22,156,70,0.1))',
          borderRadius: 18, padding: '20px 16px',
          border: `2px solid ${accent}`,
          boxShadow: `0 4px 32px rgba(29,185,84,0.2)`,
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>👑</div>
          <p style={{
            margin: 0, fontSize: 10, color: accent, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 2,
          }}>冠军</p>
          <p style={{
            margin: '6px 0 0', fontWeight: 800, fontSize: 15,
            color: '#fff', wordBreak: 'break-all', lineHeight: 1.3,
          }}>{champion}</p>
        </div>
      </div>
    </div>
  )
}
