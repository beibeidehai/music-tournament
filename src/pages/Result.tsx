import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import BracketTree from '../components/BracketTree'

export default function Result() {
  const navigate = useNavigate()
  const { rounds, singer } = useStore()
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!singer || rounds.length === 0) navigate('/')
  }, [singer, rounds, navigate])

  if (!singer) return null

  const lastRound = rounds[rounds.length - 1]
  const champion = lastRound?.matches[0]?.choice === 'a'
    ? lastRound.matches[0].songA.name
    : lastRound?.matches[0]?.songB.name || '—'

  // Stats
  const totalMatches = rounds.reduce((acc, r) => acc + r.matches.length, 0)
  const totalMs = rounds.reduce((acc, r) => acc + r.matches.reduce((a, m) => a + m.decisionMs, 0), 0)
  const totalMin = Math.round(totalMs / 60000)

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const QRCode = (await import('qrcode')).default

      const canvas = await html2canvas(exportRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, window.location.origin, { width: 100, margin: 1 })

      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = canvas.width
      finalCanvas.height = canvas.height + 60
      const ctx = finalCanvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      ctx.drawImage(canvas, 0, 0)
      // QR code bottom-right
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(finalCanvas.width - 128, finalCanvas.height - 128, 120, 120)
      ctx.drawImage(qrCanvas, finalCanvas.width - 124, finalCanvas.height - 124, 112, 112)
      // "扫码来玩" label
      ctx.fillStyle = '#999'
      ctx.font = '11px sans-serif'
      ctx.fillText('扫码来玩', finalCanvas.width - 124, finalCanvas.height - 134)

      const link = document.createElement('a')
      link.download = `${singer.name}-音乐淘汰赛.png`
      link.href = finalCanvas.toDataURL()
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 40 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 20px' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 14, padding: 0,
          }}>← 首页</button>
        </div>

        {/* EXPORTABLE AREA */}
        <div ref={exportRef} style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fcfcfc 100%)',
          borderRadius: 24, padding: '36px 24px 24px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            paddingBottom: 20, borderBottom: '2px solid #f0f0f0', marginBottom: 16,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: singer.avatar ? `url(${singer.avatar}) center/cover` : 'linear-gradient(135deg, #1db954, #169c46)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0,
            }} />
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111' }}>
                {singer.name} · 歌曲淘汰赛
              </h1>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#666' }}>
                  <strong style={{ color: '#1db954', fontSize: 18 }}>{totalMatches}</strong> 组对决
                </span>
                <span style={{ fontSize: 13, color: '#666' }}>
                  <strong style={{ color: '#f5a623', fontSize: 18 }}>{champion}</strong> 夺冠
                </span>
                {totalMin > 0 && (
                  <span style={{ fontSize: 13, color: '#999' }}>总耗时 {totalMin} 分钟</span>
                )}
              </div>
            </div>
          </div>

          {/* Bracket */}
          <BracketTree rounds={rounds} champion={champion} />

          {/* Footer line */}
          <div style={{
            textAlign: 'center', paddingTop: 16, marginTop: 8,
            borderTop: '1px solid #f0f0f0',
            fontSize: 11, color: '#ccc',
          }}>
            echoesvs.site
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: exporting ? '#ccc' : 'linear-gradient(135deg, #1db954, #169c46)',
              color: '#fff', border: 'none',
              padding: '14px 48px', borderRadius: 28, fontSize: 16,
              cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: 700,
              boxShadow: exporting ? 'none' : '0 4px 20px rgba(29,185,84,0.25)',
            }}
          >
            {exporting ? '生成中...' : '导出图片'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#fff', color: '#555', border: '1px solid #e0e0e0',
              padding: '14px 48px', borderRadius: 28, fontSize: 16,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  )
}
