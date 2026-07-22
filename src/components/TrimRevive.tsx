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

  const current = mode === 'trim' ? candidates.length - checked.size : checked.size
  const label = mode === 'trim' ? '请去除多余歌曲' : '请复活被淘汰的歌曲'
  const need = mode === 'trim' ? candidates.length - target : target
  const isOk = current === target

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', paddingTop: 40 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#111' }}>{label}</h2>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            {mode === 'trim'
              ? `还需要去除 ${need} 首歌，剩余 ${current} / ${target}`
              : `还需要复活 ${target - current} 首歌，当前 ${current} / ${target}`}
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ height: 4, background: '#eee', borderRadius: 2, marginBottom: 20 }}>
          <div style={{
            width: `${(current / target) * 100}%`, height: '100%',
            background: isOk ? '#1db954' : '#f5a623',
            borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Song list */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 420, overflowY: 'auto' }}>
          {candidates.map((s) => {
            const isChecked = checked.has(s.id)
            return (
              <li
                key={s.id}
                onClick={() => toggle(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', margin: '4px 0', borderRadius: 14,
                  cursor: 'pointer',
                  background: isChecked ? '#fff9e6' : '#fff',
                  border: isChecked ? '1px solid #f5a623' : '1px solid transparent',
                  boxShadow: isChecked ? '0 2px 8px rgba(245,166,35,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: isChecked ? 'none' : '2px solid #ddd',
                  background: isChecked ? '#f5a623' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s ease',
                }}>
                  {isChecked && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, fontWeight: isChecked ? 600 : 400, color: isChecked ? '#222' : '#555' }}>
                  {s.name}
                </span>
              </li>
            )
          })}
        </ul>

        {/* Confirm */}
        <button
          onClick={() => {
            const result = mode === 'trim'
              ? candidates.filter(s => !checked.has(s.id))
              : candidates.filter(s => checked.has(s.id))
            onConfirm(result)
          }}
          disabled={!isOk}
          style={{
            width: '100%', padding: 16, marginTop: 24,
            background: isOk ? 'linear-gradient(135deg, #1db954, #169c46)' : '#ddd',
            color: '#fff', border: 'none', borderRadius: 16, fontSize: 17,
            cursor: isOk ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            boxShadow: isOk ? '0 4px 16px rgba(29,185,84,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          确认 ({current}/{target})
        </button>
      </div>
    </div>
  )
}
