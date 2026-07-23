import { useState, useRef, useEffect } from 'react'
import { searchSinger } from '../lib/api'
import type { Singer } from '../types'

interface Props {
  onSelect: (singer: Singer) => void
}

const accent = '#20b860'

export default function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Singer[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setFocused(false)
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

  const borderColor = focused ? accent : '#e0e0e0'

  return (
    <div ref={ref} style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `2px solid ${borderColor}`, borderRadius: 16,
        background: '#fff', padding: '4px 4px 4px 20px',
        transition: 'border-color 0.2s ease',
        boxShadow: focused ? '0 4px 20px rgba(32,184,96,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); results.length > 0 && setShowDropdown(true) }}
          placeholder="输入歌手名字..."
          style={{
            flex: 1, padding: '12px 12px', fontSize: 16, border: 'none', outline: 'none',
            background: 'transparent', color: '#333',
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 16, color: '#aaa', fontSize: 14 }}>搜索中...</div>
      )}

      {showDropdown && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: 16,
          listStyle: 'none', padding: 8, margin: 0, zIndex: 100,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}>
          {results.map((s, i) => (
            <li
              key={s.id + s.platform}
              onClick={() => { onSelect(s); setShowDropdown(false); setQuery(''); setFocused(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', cursor: 'pointer', borderRadius: 12,
                transition: 'background 0.15s ease',
                animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5fdf7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: s.avatar
                  ? `url(${s.avatar}) center/cover`
                  : `linear-gradient(135deg, ${accent}, #189a4c)`,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, fontWeight: 700,
              }}>{!s.avatar && s.name[0]}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Apple Music</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
