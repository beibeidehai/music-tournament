import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import SearchBox from '../components/SearchBox'
import type { Singer } from '../types'

const accent = '#1db954'
const cardBg = '#fafafa'

export default function Home() {
  const navigate = useNavigate()
  const { singer, setSinger, reset } = useStore()

  const handleSelect = (s: Singer) => {
    reset()
    setSinger(s)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff 0%, #f8faf8 100%)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px 60px', textAlign: 'center' }}>
        {/* Logo area */}
        <div style={{
          width: 72, height: 72, borderRadius: 18, margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${accent}, #169c46)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, boxShadow: `0 8px 32px rgba(29,185,84,0.25)`,
        }}>
          ♫
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', color: '#111' }}>
          音乐淘汰赛 <span style={{ background: '#ff6b35', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle', fontWeight: 700 }}>v4.4</span>
        </h1>
        <p style={{ color: '#777', fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>
          搜索一位歌手，两两对决，选出你心中的最佳曲目
        </p>

        {!singer ? (
          <SearchBox onSelect={handleSelect} />
        ) : (
          <div>
            {/* Singer card */}
            <div style={{
              background: '#fff', borderRadius: 20, padding: 32,
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: singer.avatar
                  ? `url(${singer.avatar}) center/cover`
                  : `linear-gradient(135deg, ${accent}, #169c46)`,
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 36, fontWeight: 700,
              }}>{!singer.avatar && singer.name[0]}</div>
              <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{singer.name}</h2>
              <p style={{ color: '#999', fontSize: 14, margin: '0 0 24px' }}>Apple Music</p>

              <div style={{
                background: cardBg, borderRadius: 14, padding: 20,
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
                  background: `linear-gradient(135deg, ${accent}, #169c46)`,
                  color: '#fff', border: 'none',
                  padding: '16px 0', borderRadius: 16, fontSize: 18,
                  cursor: 'pointer', width: '100%', fontWeight: 700,
                  marginTop: 24,
                  boxShadow: `0 4px 16px rgba(29,185,84,0.25)`,
                  transition: 'all 0.2s ease',
                }}
              >
                开始淘汰赛
              </button>

              <button
                onClick={reset}
                style={{
                  background: 'none', border: 'none', color: '#aaa',
                  marginTop: 14, cursor: 'pointer', fontSize: 13,
                }}
              >
                换一个歌手
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e8e8e8',
          marginTop: 52,
          paddingTop: 20,
          textAlign: 'center',
        }}>
          <p style={{ color: '#999', fontSize: 13, margin: '0 0 12px' }}>
            不知道和朋友出门吃饭吃什么 试试这个吧
          </p>
          <img src="/cfbxcx.png" alt="吃饭不想测" style={{ maxWidth: 200, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  )
}
