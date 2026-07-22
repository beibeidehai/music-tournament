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

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const QRCode = (await import('qrcode')).default

      const canvas = await html2canvas(exportRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, window.location.origin, { width: 120, margin: 1 })

      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = canvas.width
      finalCanvas.height = canvas.height
      const ctx = finalCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, 0)
      ctx.drawImage(qrCanvas, finalCanvas.width - 140, finalCanvas.height - 140, 120, 120)

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
        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← 首页
          </button>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: 14, padding: 0,
          }}>
            返回游戏
          </button>
        </div>

        {/* Exportable area */}
        <div ref={exportRef} style={{ background: '#ffffff', borderRadius: 20, padding: '32px 20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111' }}>
              {singer.name} · 音乐淘汰赛
            </h1>
            <p style={{ color: '#999', fontSize: 13, margin: '6px 0 0' }}>
              {rounds.length} 轮淘汰 · 冠军: {champion}
            </p>
          </div>
          <BracketTree rounds={rounds} champion={champion} />
        </div>

        {/* Actions */}
        <div style={{ textAlign: 'center', marginTop: 28, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: exporting ? '#ccc' : 'linear-gradient(135deg, #1db954, #169c46)',
              color: '#fff', border: 'none',
              padding: '14px 44px', borderRadius: 28, fontSize: 16,
              cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: 700,
              boxShadow: exporting ? 'none' : '0 4px 20px rgba(29,185,84,0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {exporting ? '生成中...' : '导出图片'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#fff', color: '#555', border: '1px solid #e0e0e0',
              padding: '14px 44px', borderRadius: 28, fontSize: 16,
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
