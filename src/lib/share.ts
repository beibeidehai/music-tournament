// Canvas export — landscape 3:2, compact but clear, echoesvs branding
import type { Round, Song } from '../types'

const SCALE = 3
const W = 1200
const H = 800
const M = 32
const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif'
const GREEN = '#1db954'; const GREEN2 = '#169c46'

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function loadImg(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null
  return new Promise(res => {
    const im = new Image(); im.crossOrigin = 'anonymous'
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

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, s: number, rad: number) {
  ctx.save(); rr(ctx, x, y, s, s, rad); ctx.clip()
  if (img) ctx.drawImage(img, x, y, s, s)
  else { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x, y, s, s) }
  ctx.restore()
}

function grad(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, GREEN); g.addColorStop(1, GREEN2)
  return g
}

export async function buildShareImage(singerName: string, rounds: Round[], champion: string) {
  const visible = rounds.filter(r => r.matches.length > 0)
  const nCols = visible.length
  if (!nCols) throw new Error('no rounds')

  // --- collect data ---
  const allSongs = new Map<string, Song>()
  for (const r of rounds) for (const m of r.matches) {
    allSongs.set(m.songA.id, m.songA); allSongs.set(m.songB.id, m.songB)
  }
  // Robust champion song lookup
  const champSongs = [...allSongs.values()]
  const champSong = champSongs.find(s => s.name.trim() === champion.trim()) || champSongs.find(s => s.name.includes(champion)) || champSongs[0]

  // --- load covers ---
  const covers = new Map<string, HTMLImageElement | null>()
  const uniq = champSongs.slice(0, 50)
  await Promise.all(uniq.map(async s => { covers.set(s.id, await loadImg(s.cover)) }))

  // --- layout ---
  const headerH = 100
  const footerH = 56
  const availH = H - headerH - footerH
  const midX = W / 2
  const midY = headerH + availH / 2
  const pairsPerHalf = visible[0].matches.length / 2
  const cardH = Math.max(16, Math.min(28, Math.floor(availH / (pairsPerHalf * 2.2))))
  const pairH = cardH + 4
  const gapH = Math.floor((availH - pairsPerHalf * pairH * 2) / Math.max(1, pairsPerHalf * 2 - 1))
  const cardW = 120
  const colDX = 56
  const stub = 10

  const colYs: number[][] = []
  {
    const y0: number[] = []
    for (let p = 0; p < pairsPerHalf; p++) {
      y0.push(headerH + p * (pairH * 2 + gapH * 2))
      y0.push(headerH + p * (pairH * 2 + gapH * 2) + pairH + gapH)
    }
    colYs.push(y0)
    for (let k = 1; k < nCols; k++) {
      const prev = colYs[k - 1]; const cur: number[] = []
      for (let i = 0; i < prev.length; i += 2) cur.push((prev[i] + prev[i + 1]) / 2)
      colYs.push(cur)
    }
  }

  const leftX = (k: number) => midX - cardW - stub - colDX * (nCols - k) - M / 2
  const rightX = (k: number) => midX + colDX * (nCols - k) + stub + M / 2

  // Champion center
  const champSize = Math.min(110, availH * 0.5)
  const champX = midX - champSize / 2
  const champY = midY - champSize / 2

  // --- canvas ---
  const cv = document.createElement('canvas')
  cv.width = W * SCALE; cv.height = H * SCALE
  const ctx = cv.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  const bgG = ctx.createLinearGradient(0, 0, W, H)
  bgG.addColorStop(0, '#0c0c16'); bgG.addColorStop(1, '#08080d')
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
  const gl = ctx.createRadialGradient(midX, midY, 0, midX, midY, 420)
  gl.addColorStop(0, 'rgba(29,185,84,0.06)'); gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H)

  // --- Header ---
  ctx.textAlign = 'center'
  ctx.font = `900 30px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 36)
  const total = rounds.reduce((a, r) => a + r.matches.length, 0)
  ctx.font = `500 16px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`${total} 组对决  ·  冠军 ${champion}`, W / 2, 66)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, headerH - 4); ctx.lineTo(W - M, headerH - 4); ctx.stroke()

  // --- Draw bracket halves ---
  function drawHalf(isRight: boolean) {
    for (let k = 0; k < nCols; k++) {
      const round = visible[k]
      const h = Math.ceil(round.matches.length / 2)
      const matches = isRight ? round.matches.slice(h) : round.matches.slice(0, h)
      const x = isRight ? rightX(k) : leftX(k) - cardW
      const edge = isRight ? x : x + cardW
      const jx = isRight ? edge - stub : edge + stub
      const ys = colYs[k]

      // Lines
      ctx.lineWidth = 1; ctx.lineJoin = 'round'
      for (let i = 0; i < matches.length; i++) {
        const yt = ys[i * 2] + cardH / 2; const yb = ys[i * 2 + 1] + cardH / 2
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.beginPath()
        ctx.moveTo(edge, yt); ctx.lineTo(jx, yt)
        ctx.lineTo(jx, yb); ctx.lineTo(edge, yb)
        ctx.stroke()

        // Champion route
        const m = matches[i]
        const aC = m.songA.name === champion
        const bC = m.songB.name === champion
        if (aC || bC) {
          const cY = aC ? yt : yb
          ctx.strokeStyle = GREEN; ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(jx, cY)
          if (k < nCols - 1) {
            const nextY = colYs[k + 1][i] + cardH / 2
            ctx.lineTo(jx, nextY)
          } else {
            ctx.lineTo(jx, midY); ctx.lineTo(isRight ? champX + champSize : champX, midY)
          }
          ctx.stroke()
        }
      }

      // Last column → center line
      if (k === nCols - 1 && matches.length >= 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        const topY = ys[0] + cardH / 2
        const botY = ys[matches.length * 2 - 1] + cardH / 2
        const my = (topY + botY) / 2
        ctx.beginPath()
        ctx.moveTo(jx, my); ctx.lineTo(jx, midY)
        ctx.lineTo(isRight ? champX + champSize : champX, midY)
        ctx.stroke()
      }

      // Cards
      matches.forEach((m, mi) => {
        const aW = m.choice === 'a' || m.choice === 'both'
        const bW = m.choice === 'b' || m.choice === 'both'
        drawCard(x, ys[mi * 2], m.songA, aW)
        drawCard(x, ys[mi * 2 + 1], m.songB, bW)
      })
    }
  }

  function drawCard(cx: number, cy: number, song: Song, won: boolean) {
    rr(ctx, cx, cy, cardW, cardH, 7)
    ctx.fillStyle = won ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)'
    ctx.fill()
    ctx.strokeStyle = won ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'
    ctx.lineWidth = won ? 1.2 : 0.8
    rr(ctx, cx, cy, cardW, cardH, 7); ctx.stroke()

    const cs = cardH - 8
    drawCover(ctx, covers.get(song.id) || null, cx + 4, cy + 4, cs, 5)

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.font = `${won ? '700' : '400'} ${Math.max(8, cardH * 0.42)}px ${FONT}`
    ctx.fillStyle = won ? '#fff' : 'rgba(255,255,255,0.32)'
    ctx.fillText(fit(ctx, song.name, cardW - cs - 12), cx + cs + 8, cy + cardH / 2 + 1)
  }

  drawHalf(false)
  drawHalf(true)

  // --- Center champion (always visible) ---
  ctx.save()
  ctx.shadowColor = 'rgba(29,185,84,0.25)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 12
  rr(ctx, champX, champY, champSize, champSize, 18)
  ctx.fillStyle = '#12121b'; ctx.fill()
  ctx.restore()
  if (champSong) drawCover(ctx, covers.get(champSong.id) || null, champX, champY, champSize, 18)
  rr(ctx, champX, champY, champSize, champSize, 18)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.stroke()

  ctx.save()
  ctx.translate(champX + champSize + 4, champY - 4)
  ctx.rotate(0.3)
  ctx.font = `${champSize * 0.36}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 1
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  let labelY = champY + champSize + 12
  ctx.textAlign = 'center'
  ctx.font = `700 14px ${FONT}`
  const label = '🏆 冠军'
  const lw = ctx.measureText(label).width + 32
  rr(ctx, midX - lw / 2, labelY, lw, 28, 14)
  ctx.fillStyle = grad(ctx, midX - lw / 2, labelY, midX + lw / 2, labelY)
  ctx.fill()
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
  ctx.fillText(label, midX, labelY + 14)
  labelY += 28 + 6

  ctx.font = `900 20px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(champion, midX, labelY + 12)

  // --- Footer ---
  const fy = H - footerH + 4
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()
  ctx.font = `400 14px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', W / 2, fy + 28)

  // Grain
  ctx.globalAlpha = 0.03
  for (let i = 0, cnt = Math.floor(W * H / 2000); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.95))
}
