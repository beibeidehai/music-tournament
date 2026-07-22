import { useState } from 'react'
import type { Round } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

export default function BracketTree({ rounds, champion }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))

  const toggle = (idx: number) => {
    const next = new Set(expanded)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setExpanded(next)
  }

  return (
    <div style={{ overflowX: 'auto', padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 20, minWidth: 900, justifyContent: 'center', alignItems: 'flex-start' }}>
        {rounds.map((round, ri) => (
          <div key={ri} style={{ minWidth: 140 }}>
            <div
              onClick={() => toggle(ri)}
              style={{
                fontWeight: 700, fontSize: 13, marginBottom: 10,
                cursor: 'pointer', userSelect: 'none',
                color: expanded.has(ri) ? '#1db954' : '#aaa',
                padding: '6px 12px', borderRadius: 10,
                background: expanded.has(ri) ? '#f0fdf4' : 'transparent',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
            >
              {expanded.has(ri) ? '▼' : '▶'} {round.name}
            </div>
            {expanded.has(ri) && round.matches.map((m, mi) => (
              <div
                key={mi}
                style={{
                  border: '1px solid #eee', borderRadius: 10, padding: '8px 10px',
                  margin: '4px 0', fontSize: 11,
                  background: m.choice ? '#fafafa' : '#fff',
                  transition: 'all 0.2s ease',
                }}
                title={m.choice ? `决策耗时: ${(m.decisionMs / 1000).toFixed(1)}s` : ''}
              >
                <div style={{
                  fontWeight: m.choice === 'a' || m.choice === 'both' ? 700 : 400,
                  color: m.choice === 'a' || m.choice === 'both' ? '#1db954' : '#555',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {m.songA.name}
                </div>
                <div style={{
                  fontWeight: m.choice === 'b' || m.choice === 'both' ? 700 : 400,
                  color: m.choice === 'b' || m.choice === 'both' ? '#1db954' : '#555',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginTop: 2,
                }}>
                  {m.songB.name}
                </div>
                {m.choice && (
                  <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>
                    {m.choice === 'both' ? '双选' : m.choice === 'neither' ? '都不选' : m.choice === 'a' ? '← 选中' : '← 选中'}
                    {m.decisionMs > 0 ? ` · ${(m.decisionMs / 1000).toFixed(1)}s` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {/* Champion */}
        <div style={{
          textAlign: 'center', minWidth: 90, alignSelf: 'center',
          background: 'linear-gradient(135deg, #fff9e6, #fff3cd)',
          borderRadius: 16, padding: '16px 20px',
          border: '2px solid #f5a623',
          boxShadow: '0 4px 16px rgba(245,166,35,0.2)',
        }}>
          <div style={{ fontSize: 10, color: '#d4920a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>冠军</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#d4920a' }}>{champion}</div>
        </div>
      </div>
    </div>
  )
}
