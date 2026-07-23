import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import SearchBox from '../components/SearchBox'
import type { Singer, Song } from '../types'

const accent = '#000'
const cardBg = '#fafafa'

// Sample recommended songs for the circular gallery
const DEMO_SONGS: { name: string; artist: string; cover: string }[] = [
  { name: '晴天', artist: '周杰伦', cover: '' },
  { name: '七里香', artist: '周杰伦', cover: '' },
  { name: '夜曲', artist: '周杰伦', cover: '' },
  { name: '稻香', artist: '周杰伦', cover: '' },
  { name: '简单爱', artist: '周杰伦', cover: '' },
  { name: '青花瓷', artist: '周杰伦', cover: '' },
  { name: '东风破', artist: '周杰伦', cover: '' },
  { name: '发如雪', artist: '周杰伦', cover: '' },
  { name: '彩虹', artist: '周杰伦', cover: '' },
  { name: '听妈妈的话', artist: '周杰伦', cover: '' },
]

// ---- Pixel Blast background ----
function PixelBlastBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!; let id = 0
    const resize = () => { cv.width = cv.parentElement!.clientWidth; cv.height = cv.parentElement!.clientHeight }
    resize(); window.addEventListener('resize', resize)
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = []
    const spawn = () => {
      if (particles.length < 50 && Math.random() > 0.5) {
        particles.push({
          x: Math.random() * cv.width, y: Math.random() * cv.height,
          vx: (Math.random() - .5) * .6, vy: -(Math.random() * 1.2 + .3),
          life: 0, maxLife: 160 + Math.random() * 200, size: 1 + Math.random() * 2.5,
        })
      }
    }
    const frame = () => {
      id = requestAnimationFrame(frame)
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.life++
        if (p.life > p.maxLife) { particles.splice(i, 1); continue }
        p.x += p.vx; p.y += p.vy
        const alpha = 1 - p.life / p.maxLife
        ctx.fillStyle = `rgba(0,0,0,${alpha * .12})`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
      spawn()
    }
    frame()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}

// ---- Circular Gallery (draggable carousel) ----
function CircularGallery() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, scrollLeft: 0 })

  const onDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    dragRef.current = { startX: e.clientX, scrollLeft: trackRef.current?.scrollLeft || 0 }
  }, [])
  const onUp = useCallback(() => setDragging(false), [])
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !trackRef.current) return
    e.preventDefault()
    trackRef.current.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.startX)
  }, [dragging])

  return (
    <div style={{ margin: '40px 0 24px', userSelect: 'none' }} onMouseUp={onUp} onMouseLeave={onUp}>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 16, letterSpacing: 1 }}>
        热门推荐
      </p>
      <div
        ref={trackRef}
        className="circular-gallery"
        onMouseDown={onDown}
        onMouseMove={onMove}
        style={{
          display: 'flex', gap: 14, overflowX: 'auto', overflowY: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          scrollbarWidth: 'none', paddingBottom: 8,
          WebkitOverflowScrolling: 'touch', height: 'auto',
        }}
      >
        {/* Duplicate for seamless loop feel */}
        {[...DEMO_SONGS, ...DEMO_SONGS].map((s, i) => (
          <div key={i} style={{
            flexShrink: 0, width: 92,
            textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 14, margin: '0 auto 8px',
              background: s.cover
                ? `url(${s.cover}) center/cover`
                : `linear-gradient(135deg, #e8e8e8, #d0d0d0)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#bbb',
            }}>
              {!s.cover && '♫'}
            </div>
            <p style={{
              margin: 0, fontSize: 12, fontWeight: 600, color: '#333',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{s.name}</p>
            <p style={{
              margin: '2px 0 0', fontSize: 10, color: '#aaa',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{s.artist}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const GALLERY_STYLE = `
.pixel-blast-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.circular-gallery {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
}
.circular-gallery:active {
  cursor: grabbing;
}
.circular-gallery:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}
`

export default function Home() {
  const navigate = useNavigate()
  const { singer, setSinger, reset } = useStore()

  const handleSelect = (s: Singer) => {
    reset()
    setSinger(s)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #fff 0%, #fafafa 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{GALLERY_STYLE}</style>

      {/* Pixel blast background */}
      <div className="pixel-blast-container" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden',
      }}>
        <PixelBlastBg />
      </div>

      <div style={{
        maxWidth: 560, margin: '0 auto', padding: '60px 20px 20px',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
          background: `linear-gradient(135deg, ${accent}, #333)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: `0 8px 28px rgba(0,0,0,0.2)`,
        }}>
          ♫
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px', color: '#111' }}>
          音乐淘汰赛 <span style={{ background: '#ff6b35', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle', fontWeight: 700 }}>v4.8</span>
        </h1>
        <p style={{ color: '#777', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
          搜索一位歌手，两两对决，选出你心中的最佳曲目
        </p>

        {!singer ? (
          <SearchBox onSelect={handleSelect} />
        ) : (
          <div>
            <div style={{
              background: '#fff', borderRadius: 20, padding: 28,
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: singer.avatar
                  ? `url(${singer.avatar}) center/cover`
                  : `linear-gradient(135deg, ${accent}, #333)`,
                margin: '0 auto 14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 32, fontWeight: 700,
              }}>{!singer.avatar && singer.name[0]}</div>
              <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700 }}>{singer.name}</h2>
              <p style={{ color: '#999', fontSize: 13, margin: '0 0 20px' }}>Apple Music</p>

              <div style={{
                background: cardBg, borderRadius: 14, padding: 16,
                textAlign: 'left', fontSize: 13, lineHeight: 2,
                color: '#555',
              }}>
                <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#333', fontSize: 14 }}>赛制规则</p>
                <p style={{ margin: 0 }}>随机抽取歌曲，两两对决</p>
                <p style={{ margin: 0 }}>每组试听 30 秒，凭感觉选择</p>
                <p style={{ margin: 0 }}>逐轮淘汰，直到选出冠军</p>
              </div>

              <button
                onClick={() => navigate(`/game?singer=${encodeURIComponent(singer.id)}&name=${encodeURIComponent(singer.name)}`)}
                style={{
                  background: `linear-gradient(135deg, ${accent}, #333)`,
                  color: '#fff', border: 'none',
                  padding: '14px 0', borderRadius: 16, fontSize: 17,
                  cursor: 'pointer', width: '100%', fontWeight: 700,
                  marginTop: 20,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
                  transition: 'all 0.2s ease',
                }}
              >
                开始淘汰赛
              </button>

              <button
                onClick={reset}
                style={{
                  background: 'none', border: 'none', color: '#aaa',
                  marginTop: 12, cursor: 'pointer', fontSize: 13,
                }}
              >
                换一个歌手
              </button>
            </div>
          </div>
        )}

        {/* Circular Gallery — recommended songs */}
        <CircularGallery />
      </div>

      {/* Promo footer — locked to bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        borderTop: '1px solid #e8e8e8',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        padding: '10px 20px calc(10px + env(safe-area-inset-bottom))',
        textAlign: 'center',
      }}>
        <p style={{ color: '#bbb', fontSize: 11, margin: '0 0 4px' }}>
          不知道和朋友出门吃饭吃什么 试试这个吧
        </p>
        <img src="/cfbxcx.png" alt="吃饭不想测" style={{ maxWidth: 90, borderRadius: 8, opacity: 0.55 }} />
      </div>

      {/* Spacer so content isn't hidden behind fixed footer */}
      <div style={{ height: 90 }} />
    </div>
  )
}
