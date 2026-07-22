import { useState, useEffect } from 'react'
import { play, stop, getCurrentSongId } from '../lib/audio'
import type { Song } from '../types'

interface Props {
  song: Song
  selected: boolean
  onClick: () => void
  canBoth: boolean
}

export default function SongCard({ song, selected, onClick, canBoth }: Props) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const check = setInterval(() => {
      setPlaying(getCurrentSongId() === song.id)
    }, 200)
    return () => clearInterval(check)
  }, [song.id])

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (playing) { stop(); return }
    play(song.id)
  }

  const borderColor = selected ? '#1db954' : '#e8e8e8'
  const bg = selected ? '#f0fdf4' : '#fff'
  const shadow = selected
    ? '0 4px 24px rgba(29,185,84,0.15)'
    : '0 2px 12px rgba(0,0,0,0.06)'

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, border: `2px solid ${borderColor}`,
        borderRadius: 16, padding: 0, textAlign: 'center',
        cursor: 'pointer', background: bg,
        boxShadow: shadow,
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        maxWidth: 320,
      }}
    >
      <div style={{
        width: '100%', aspectRatio: '1',
        background: song.cover ? `url(${song.cover}) center/cover` : 'linear-gradient(135deg, #e0e0e0, #ccc)',
        position: 'relative',
      }}>
        {selected && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#1db954', color: '#fff',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(29,185,84,0.4)',
          }}>✓</div>
        )}
      </div>

      <div style={{ padding: '16px 14px 14px' }}>
        <p style={{
          fontWeight: 700, margin: 0, fontSize: 15,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: '#1a1a1a',
        }}>{song.name}</p>
        <p style={{
          color: '#666', fontSize: 12, margin: '4px 0 8px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{song.artist} · {song.album}</p>
        <p style={{ color: '#999', fontSize: 11, margin: 0 }}>{song.year || ''}</p>

        <button
          onClick={handlePlay}
          style={{
            marginTop: 12, border: 'none',
            background: playing ? '#e74c3c' : '#1db954',
            color: '#fff', borderRadius: 24,
            padding: '8px 28px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.2s ease',
            width: '100%',
          }}
        >
          {playing ? '⏸ 停止' : '▶ 试听 30s'}
        </button>
      </div>
    </div>
  )
}
