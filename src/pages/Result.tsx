import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import BracketTree from '../components/BracketTree'

const accent = '#fff'

export default function Result() {
  const navigate = useNavigate()
  const { rounds, singer } = useStore()
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!singer || rounds.length === 0) navigate('/')
  }, [singer, rounds, navigate])

  if (!singer) return null

  const lastRound = rounds[rounds.length - 1]
  const champion = lastRound?.matches[0]?.choice === 'a'
    ? lastRound.matches[0].songA.name
    : lastRound?.matches[0]?.songB.name || '—'

  const totalMatches = rounds.reduce((acc, r) => acc + r.matches.length, 0)
  const totalMs = rounds.reduce((acc, r) => acc + r.matches.reduce((a, m) => a + m.decisionMs, 0), 0)
  const totalMin = Math.round(totalMs / 60000)

  const doExport = async (vertical: boolean) => {
    setExporting(true)
    try {
      const { buildShareImage } = await import('../lib/share')
      const blob = await buildShareImage(singer.name, rounds, champion, { vertical })
      const link = document.createElement('a')
      const suffix = vertical ? '竖版' : '横版'
      link.download = `${singer.name}-音乐淘汰赛-${suffix}.jpg`
      link.href = URL.createObjectURL(blob)
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b13', paddingBottom: 40 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 20px' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: 0,
          }}>← 首页</button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            {singer.name} · echoesvs.site
          </span>
        </div>

        {/* EXPORTABLE AREA */}
        <div style={{
          background: 'linear-gradient(180deg, #111118 0%, #0b0b13 100%)',
          borderRadius: 24, padding: '40px 28px 32px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            paddingBottom: 28, marginBottom: 8,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {/* Avatar / initial */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: singer.avatar
                ? `url(${singer.avatar}) center/cover`
                : `linear-gradient(135deg, ${accent}, #aaa)`,
              boxShadow: `0 4px 24px rgba(255,255,255,0.25)`,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 30, fontWeight: 700,
            }}>{!singer.avatar && singer.name[0]}</div>

            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                margin: 0, fontSize: 28, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.5px',
              }}>
                {singer.name} · 歌曲淘汰赛
              </h1>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  冠军 <strong style={{ color: '#ddd', fontSize: 20 }}>{champion}</strong>
                </span>
                {totalMin > 0 && (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                    耗时 {totalMin} 分钟
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bracket */}
          <BracketTree rounds={rounds} champion={champion} />
        </div>

        {/* Action buttons */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              onClick={() => doExport(false)}
              disabled={exporting}
              style={{
                background: exporting
                  ? 'rgba(255,255,255,0.1)'
                  : `linear-gradient(135deg, ${accent}, #aaa)`,
                color: '#fff', border: 'none',
                padding: '14px 36px', borderRadius: 28, fontSize: 15,
                cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: 700,
                boxShadow: exporting ? 'none' : `0 4px 24px rgba(255,255,255,0.3)`,
              }}
            >
              {exporting ? '生成中...' : '导出横版'}
            </button>
            <button
              onClick={() => doExport(true)}
              disabled={exporting}
              style={{
                background: exporting
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.08)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                padding: '14px 36px', borderRadius: 28, fontSize: 15,
                cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: 600,
              }}
            >
              导出竖版
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 40px', borderRadius: 24, fontSize: 14,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            再来一局
          </button>
        </div>
      </div>

      {/* Footer locked to bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(11,11,19,0.92)',
        backdropFilter: 'blur(8px)',
        padding: '10px 20px calc(10px + env(safe-area-inset-bottom))',
        textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: '0 0 4px' }}>
          不知道和朋友出门吃饭吃什么 试试这个吧
        </p>
        <img src="/cfbxcx.png" alt="吃饭不想测" style={{ maxWidth: 90, borderRadius: 8, opacity: 0.45 }} />
      </div>

      {/* Spacer */}
      <div style={{ height: 90 }} />
    </div>
  )
}
