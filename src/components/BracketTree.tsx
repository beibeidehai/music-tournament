import { useState } from 'react'
import type { Round } from '../types'

interface Props {
  rounds: Round[]
  champion: string
}

export default function BracketTree({ rounds, champion }: Props) {
  const allIdx = new Set(rounds.map((_, i) => i))
  const [expanded, setExpanded] = useState<Set<number>>(allIdx)

  const toggle = (idx: number) => {
    const next = new Set(expanded)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setExpanded(next)
  }

  const visibleRounds = rounds.filter(r => r.matches.length > 0)

  return (
    <div style={{ overflowX: 'auto', padding: '12px 0' }}>
      {/* 展开/折叠 全控制 */}
      <div style={{ textAlign: 'right', marginBottom: 12, paddingRight: 12 }}>
        <button
          onClick={() => setExpanded(new Set(rounds.map((_, i) => i)))}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '4px 14px', cursor: 'pointer', fontSize: 11, color: '#888', marginRight: 6 }}
        >展开全部</button>
        <button
          onClick={() => setExpanded(new Set())}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '4px 14px', cursor: 'pointer', fontSize: 11, color: '#888' }}
        >折叠全部</button>
      </div>

      <div style={{ display: 'flex', gap: 16, minWidth: Math.max(visibleRounds.length * 145, 600), justifyContent: 'center', alignItems: 'flex-start' }}>
        {rounds.map((round, ri) => (
          <div key={ri} style={{ minWidth: 135, maxWidth: 150 }}>
            <div
              onClick={() => toggle(ri)}
              style={{
                fontWeight: 700, fontSize: 12, marginBottom: 8,
                cursor: 'pointer', userSelect: 'none',
                color: '#1db954', padding: '5px 10px', borderRadius: 8,
                background: '#f0fdf4',
                textAlign: 'center', whiteSpace: 'nowrap',
              }}
            >
              {expanded.has(ri) ? '▼' : '▶'} {round.name}
              <span style={{ color: '#bbb', fontWeight: 400, marginLeft: 4 }}>
                {round.matches.length > 0 ? `${round.matches.length}组` : ''}
              </span>
            </div>
            {expanded.has(ri) && round.matches.length > 0 && round.matches.map((m, mi) => {
              const aWin = m.choice === 'a' || m.choice === 'both'
              const bWin = m.choice === 'b' || m.choice === 'both'
              return (
                <div
                  key={mi}
                  style={{
                    border: '1px solid #eee', borderRadius: 8, padding: '6px 8px',
                    margin: '3px 0', fontSize: 10,
                    background: m.choice ? '#fafafa' : '#fff',
                  }}
                >
                  <div style={{
                    fontWeight: aWin ? 700 : 400,
                    color: aWin ? '#1db954' : '#888',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: aWin ? 'none' : m.choice ? 'line-through' : 'none',
                  }}>{m.songA.name}</div>
                  <div style={{
                    fontWeight: bWin ? 700 : 400,
                    color: bWin ? '#1db954' : '#888',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: bWin ? 'none' : m.choice ? 'line-through' : 'none',
                  }}>{m.songB.name}</div>
                  {m.choice && (
                    <div style={{ fontSize: 8, color: '#bbb', marginTop: 2 }}>
                      {m.choice === 'both' ? '双选' : m.choice === 'neither' ? '都不选' : m.choice === 'a' ? '选上' : '选下'}
                      {m.decisionMs > 0 ? ` · ${(m.decisionMs / 1000).toFixed(1)}s` : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {/* Champion card */}
        <div style={{
          textAlign: 'center', minWidth: 80, maxWidth: 100, alignSelf: 'center',
          background: 'linear-gradient(135deg, #fff9e6, #fff3cd)',
          borderRadius: 14, padding: '14px 16px',
          border: '2px solid #f5a623',
          boxShadow: '0 4px 16px rgba(245,166,35,0.2)',
        }}>
          <div style={{ fontSize: 9, color: '#d4920a', fontWeight: 700, marginBottom: 2 }}>冠军</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#d4920a', wordBreak: 'break-all' }}>{champion}</div>
        </div>
      </div>
    </div>
  )
}
