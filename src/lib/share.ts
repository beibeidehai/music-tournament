// Canvas export — compact bracket tree, phone-friendly, echoesvs branding
import type { Round, Song } from '../types'

const SCALE = 2 // render at 2x for sharp export
const W = 1080
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
    const t = setTimeout(() => { im.src = ''; res(null) }, 5000)
    im.onload = () => { clearTimeout(t); res(im) }
    im.onerror = () => { clearTimeout(t); res(null) }
    im.src = url
  })
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  text = String(text ?? '')
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s + '…'
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, s: number, r: number) {
  ctx.save(); rr(ctx, x, y, s, s, r); ctx.clip()
  if (img) { ctx.drawImage(img, x, y, s, s) }
  else {
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${s * 0.4}px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('♪', x + s / 2, y + s / 2)
  }
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

  // --- collect songs & champion path ---
  const allSongs = new Map<string, Song>()
  const champSongIds = new Set<string>()
  for (const r of rounds) {
    for (const m of r.matches) {
      allSongs.set(m.songA.id, m.songA); allSongs.set(m.songB.id, m.songB)
      if (!m.choice) continue
      const aW = m.choice === 'a' || m.choice === 'both'
      const bW = m.choice === 'b' || m.choice === 'both'
      if (m.songA.name === champion && aW) champSongIds.add(m.songA.id)
      if (m.songB.name === champion && bW) champSongIds.add(m.songB.id)
    }
  }

  // --- load covers (cap at 60) ---
  const covers = new Map<string, HTMLImageElement | null>()
  const uniq = [...allSongs.values()].slice(0, 60)
  await Promise.all(uniq.map(async s => { covers.set(s.id, await loadImg(s.cover)) }))

  // --- layout: two halves (left / right) converging to center ---
  const cardW = 138; const cardH = 38
  const colDX = 68; const stub = 10
  const pairs0 = visible[0].matches.length / 2  // per half
  const n = pairs0 * 2
  const pairH = n >= 16 ? 100 : n >= 8 ? 110 : 130
  const gapH = n >= 16 ? 48 : n >= 8 ? 56 : 70

  const headerH = 140
  const chartH = (pairs0 - 1) * (pairH + gapH) + pairH + cardH + 32
  const chartTop = headerH
  const chartCY = chartTop + chartH / 2
  const midX = W / 2

  // Y positions per half
  const colYs: number[][] = []
  {
    const y0: number[] = []
    for (let p = 0; p < pairs0; p++) {
      y0.push(chartTop + cardH / 2 + p * (pairH + gapH))
      y0.push(chartTop + cardH / 2 + p * (pairH + gapH) + pairH)
    }
    colYs.push(y0)
    for (let k = 1; k < nCols; k++) {
      const prev = colYs[k - 1]; const cur: number[] = []
      for (let i = 0; i < prev.length; i += 2) cur.push((prev[i] + prev[i + 1]) / 2)
      colYs.push(cur)
    }
  }

  const leftX = (k: number) => midX - cardW - stub - colDX * (nCols - k) - M
  const rightX = (k: number) => midX + colDX * (nCols - k) + stub + M

  // --- champion center ---
  const champSize = Math.min(130, chartH * 0.45)
  const champY = chartCY - champSize / 2
  const champX = midX - champSize / 2

  // --- canvas size (compact, ~4:5 portrait ratio) ---
  const footerH = 110
  const H = chartTop + chartH + footerH

  const cv = document.createElement('canvas')
  cv.width = W * SCALE; cv.height = H * SCALE
  const ctx = cv.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  const bgG = ctx.createLinearGradient(0, 0, 0, H)
  bgG.addColorStop(0, '#0c0c16'); bgG.addColorStop(0.5, '#08080d'); bgG.addColorStop(1, '#0b0a12')
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)

  // Glow
  const gl = ctx.createRadialGradient(midX, chartCY, 0, midX, chartCY, 480)
  gl.addColorStop(0, 'rgba(29,185,84,0.07)'); gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl; ctx.fillRect(0, chartCY - 500, W, 1000)

  // --- Header ---
  ctx.textAlign = 'center'
  ctx.font = `900 36px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 48)

  const total = rounds.reduce((a, r) => a + r.matches.length, 0)
  ctx.font = `500 18px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`${total} 组对决  ·  冠军 ${champion}`, W / 2, 82)

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, chartTop - 8); ctx.lineTo(W - M, chartTop - 8); ctx.stroke()

  // --- Draw bracket: left half + right half ---
  function drawHalf(isRight: boolean) {
    for (let k = 0; k < nCols; k++) {
      const round = visible[k]
      const h = Math.ceil(round.matches.length / 2)
      const matches = isRight ? round.matches.slice(h) : round.matches.slice(0, h)
      const x = isRight ? rightX(k) : leftX(k) - cardW
      const edge = isRight ? x : x + cardW
      const jx = isRight ? edge - stub : edge + stub
      const ys = colYs[k]

      // Connecting lines
      ctx.lineWidth = 1.2; ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      for (let i = 0; i < matches.length; i++) {
        const yiTop = ys[i * 2]; const yiBot = ys[i * 2 + 1]
        ctx.beginPath()
        ctx.moveTo(edge, yiTop); ctx.lineTo(jx, yiTop)
        ctx.lineTo(jx, yiBot); ctx.lineTo(edge, yiBot)
        ctx.stroke()
      }
      // Line to center champion
      if (k === nCols - 1 && matches.length >= 1) {
        const mid = (ys[0] + ys[Math.min(1, ys.length - 1) * 2 + 1]) / 2
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.moveTo(jx, mid)
        ctx.lineTo(jx, chartCY)
        ctx.lineTo(isRight ? champX + champSize : champX, chartCY)
        ctx.stroke()

        // Champion's route highlight
        const champMatch = matches.find(m => (m.choice === 'a' || m.choice === 'both') && m.songA.name === champion || (m.choice === 'b' || m.choice === 'both') && m.songB.name === champion)
        if (champMatch) {
          const ci = matches.indexOf(champMatch)
          const cY = (ys[ci * 2] + ys[ci * 2 + 1]) / 2
          ctx.strokeStyle = GREEN; ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(edge, cY); ctx.lineTo(jx, cY)
          ctx.lineTo(jx, chartCY)
          ctx.lineTo(isRight ? champX + champSize : champX, chartCY)
          ctx.stroke()
        }
      }

      // Song cards
      matches.forEach((m, mi) => {
        const aW = m.choice === 'a' || m.choice === 'both'
        const bW = m.choice === 'b' || m.choice === 'both'
        drawMiniCard(x, ys[mi * 2], m.songA, aW, m.songA.name === champion && aW)
        drawMiniCard(x, ys[mi * 2 + 1], m.songB, bW, m.songB.name === champion && bW)
      })
    }
  }

  function drawMiniCard(cx: number, cy: number, song: Song, won: boolean, isChamp: boolean) {
    const by = cy - cardH / 2
    rr(ctx, cx, by, cardW, cardH, 8)
    ctx.fillStyle = isChamp ? 'rgba(29,185,84,0.1)' : won ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'
    ctx.fill()
    ctx.strokeStyle = isChamp ? GREEN : won ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)'
    ctx.lineWidth = isChamp ? 1.8 : 1
    rr(ctx, cx, by, cardW, cardH, 8); ctx.stroke()

    const cs = cardH - 12
    drawCover(ctx, covers.get(song.id) || null, cx + 5, by + 6, cs, 5)

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.font = `${won ? '600' : '400'} 10px ${FONT}`
    ctx.fillStyle = won ? '#fff' : 'rgba(235,235,245,0.3)'
    ctx.fillText(fit(ctx, song.name, cardW - cs - 16), cx + cs + 10, cy + 1)
  }

  drawHalf(false) // left
  drawHalf(true)  // right

  // --- Center champion ---
  ctx.save()
  ctx.shadowColor = 'rgba(29,185,84,0.2)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 10
  rr(ctx, champX, champY, champSize, champSize, 18)
  ctx.fillStyle = '#12121b'; ctx.fill()
  ctx.restore()

  const champSong = [...allSongs.values()].find(s => s.name === champion)
  if (champSong) drawCover(ctx, covers.get(champSong.id) || null, champX, champY, champSize, 18)
  rr(ctx, champX, champY, champSize, champSize, 18)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.stroke()

  // Crown
  ctx.save()
  ctx.translate(champX + champSize - 2, champY - 6)
  ctx.rotate(0.25)
  ctx.font = `${champSize * 0.38}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  // Champion name below
  let ly = champY + champSize + 16
  ctx.textAlign = 'center'
  ctx.font = `700 14px ${FONT}`
  const label = '🏆 冠军'
  const lw = ctx.measureText(label).width + 32
  rr(ctx, midX - lw / 2, ly, lw, 30, 15)
  ctx.fillStyle = grad(ctx, midX - lw / 2, ly, midX + lw / 2, ly)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, midX, ly + 16)

  ly += 30 + 8
  ctx.font = `900 22px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(champion, midX, ly + 12)

  // --- Footer ---
  const fy = chartTop + chartH + 22
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = `500 16px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', W / 2, fy + 36)

  // Grain
  ctx.globalAlpha = 0.03
  for (let i = 0, cnt = Math.floor(W * H / 1500); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}
