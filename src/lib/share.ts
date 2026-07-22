// Canvas-based export — like musiccup.app share.js
import type { Round, Song } from '../types'

const W = 1080
const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif'
const GREEN = '#1db954'
const DARK = '#0b0b13'

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function loadImg(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null
  return new Promise(res => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    const t = setTimeout(() => { im.src = ''; res(null) }, 4000)
    im.onload = () => { clearTimeout(t); res(im) }
    im.onerror = () => { clearTimeout(t); res(null) }
    im.src = url
  })
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

export async function buildShareImage(
  singerName: string,
  rounds: Round[],
  champion: string,
) {
  // Flatten all songs with their round info
  type Entry = { song: Song; roundIdx: number; matchIdx: number; won: boolean }
  const entries: Entry[] = []
  rounds.forEach((round, ri) => {
    round.matches.forEach((m, mi) => {
      if (m.choice) {
        const aWin = m.choice === 'a' || m.choice === 'both'
        const bWin = m.choice === 'b' || m.choice === 'both'
        entries.push({ song: m.songA, roundIdx: ri, matchIdx: mi, won: aWin })
        entries.push({ song: m.songB, roundIdx: ri, matchIdx: mi, won: bWin })
      }
    })
  })

  // Load cover images (first 20 unique songs)
  const uniqueSongs = new Map<string, Song>()
  for (const e of entries) {
    if (!uniqueSongs.has(e.song.id) && uniqueSongs.size < 30) {
      uniqueSongs.set(e.song.id, e.song)
    }
  }
  const coverMap = new Map<string, HTMLImageElement | null>()
  await Promise.all([...uniqueSongs.values()].map(async s => {
    coverMap.set(s.id, await loadImg(s.cover))
  }))

  // Layout
  const visible = rounds.filter(r => r.matches.length > 0)
  const nRounds = visible.length
  const colW = 140
  const colGap = 24
  const totalW = nRounds * colW + (nRounds - 1) * colGap
  const startX = Math.max(40, (W - totalW) / 2)
  const headerH = 130
  const footerH = 90
  const cardH = 52
  const cardGap = 6

  // Calculate total height needed
  const maxMatches = Math.max(...visible.map(r => r.matches.length))
  const chartH = maxMatches * (cardH + cardGap) + 60
  const H = headerH + chartH + footerH

  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0d0d18'); bg.addColorStop(1, DARK)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Glow
  const glow = ctx.createRadialGradient(W / 2, headerH + chartH * 0.4, 0, W / 2, headerH + chartH * 0.4, 500)
  glow.addColorStop(0, 'rgba(29,185,84,0.06)'); glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)

  // Header
  ctx.textAlign = 'center'
  ctx.font = `900 40px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 52)

  const totalMatches = rounds.reduce((a, r) => a + r.matches.length, 0)
  ctx.font = `500 20px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`${totalMatches} 组对决  ·  冠军  ${champion}`, W / 2, 90)

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(40, headerH); ctx.lineTo(W - 40, headerH); ctx.stroke()

  // Draw rounds
  visible.forEach((round, ri) => {
    const x = startX + ri * (colW + colGap)
    const colCenter = x + colW / 2

    // Round header
    ctx.font = `700 13px ${FONT}`
    ctx.fillStyle = GREEN
    ctx.textAlign = 'center'
    ctx.fillText(round.name, colCenter, headerH + 22)

    // Matches
    const matches = round.matches
    const totalH = matches.length * (cardH + cardGap)
    const startY = headerH + 40 + (chartH - totalH) / 2

    matches.forEach((m, mi) => {
      const y = startY + mi * (cardH + cardGap)
      const aWin = m.choice === 'a' || m.choice === 'both'
      const bWin = m.choice === 'b' || m.choice === 'both'

      // Card background
      rr(ctx, x, y, colW, cardH, 8)
      ctx.fillStyle = m.choice ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
      ctx.fill()
      rr(ctx, x, y, colW, cardH, 8)
      ctx.strokeStyle = m.choice ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Song A (top half)
      const halfH = cardH / 2
      if (aWin) {
        ctx.fillStyle = 'rgba(29,185,84,0.12)'
        ctx.fillRect(x + 2, y + 2, colW - 4, halfH - 3)
      }
      const coverA = coverMap.get(m.songA.id)
      if (coverA) {
        rr(ctx, x + 6, y + 6, halfH - 12, halfH - 12, 4)
        ctx.save(); ctx.clip()
        ctx.drawImage(coverA, x + 6, y + 6, halfH - 12, halfH - 12)
        ctx.restore()
      }
      ctx.textAlign = 'left'
      ctx.font = `${aWin ? '700' : '400'} 12px ${FONT}`
      ctx.fillStyle = aWin ? '#fff' : m.choice ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)'
      const tx = x + (halfH - 12) + 14
      ctx.fillText(fit(ctx, m.songA.name, colW - halfH - 20), tx, y + halfH / 2 + 4)

      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath(); ctx.moveTo(x + 8, y + halfH); ctx.lineTo(x + colW - 8, y + halfH); ctx.stroke()

      // Song B (bottom half)
      if (bWin) {
        ctx.fillStyle = 'rgba(29,185,84,0.12)'
        ctx.fillRect(x + 2, y + halfH + 1, colW - 4, halfH - 3)
      }
      const coverB = coverMap.get(m.songB.id)
      if (coverB) {
        rr(ctx, x + 6, y + halfH + 6, halfH - 12, halfH - 12, 4)
        ctx.save(); ctx.clip()
        ctx.drawImage(coverB, x + 6, y + halfH + 6, halfH - 12, halfH - 12)
        ctx.restore()
      }
      ctx.fillStyle = bWin ? '#fff' : m.choice ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)'
      ctx.fillText(fit(ctx, m.songB.name, colW - halfH - 20), tx, y + halfH + halfH / 2 + 4)
    })
  })

  // Champion card (on the right)
  const champX = startX + nRounds * (colW + colGap) + 20
  const champW = 120
  const champCY = headerH + chartH / 2
  rr(ctx, champX, champCY - 45, champW, 90, 16)
  ctx.fillStyle = 'rgba(29,185,84,0.1)'
  ctx.fill()
  rr(ctx, champX, champCY - 45, champW, 90, 16)
  ctx.strokeStyle = GREEN
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = `24px sans-serif`
  ctx.fillText('👑', champX + champW / 2, champCY - 14)
  ctx.font = `700 11px ${FONT}`
  ctx.fillStyle = GREEN
  ctx.fillText('冠军', champX + champW / 2, champCY + 6)
  ctx.font = `700 14px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(fit(ctx, champion, champW - 16), champX + champW / 2, champCY + 28)

  // Footer
  const fy = headerH + chartH + 10
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath(); ctx.moveTo(40, fy); ctx.lineTo(W - 40, fy); ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `400 14px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText('音乐淘汰赛 · echoesvs.site', W / 2, fy + 30)

  // Grain
  ctx.globalAlpha = 0.03
  for (let i = 0, cnt = Math.floor(W * H / 1200); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}
