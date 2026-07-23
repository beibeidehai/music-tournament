import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import SearchBox from '../components/SearchBox'
import PixelBlast from '../components/PixelBlast'
import type { Singer } from '../types'

const accent = '#000'
const cardBg = '#fafafa'

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
      {/* Three.js Pixel Blast background */}
      <PixelBlast
        color="#888"
        pixelSize={2.5}
        patternScale={1.5}
        patternDensity={0.7}
        speed={0.3}
        edgeFade={0.6}
        enableRipples={true}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

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
          音乐淘汰赛 <span style={{ background: '#ff6b35', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle', fontWeight: 700 }}>v4.12</span>
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

      <div style={{ height: 90 }} />
    </div>
  )
}
