// Canvas export — musiccup-style, dynamic height, left-right bracket tree
import type { Round, Song } from '../types'

const SCALE = 2
const W = 1080
const M = 28
const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif'
const GREEN = '#1db954'; const GREEN2 = '#169c46'

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r)
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

function fit(ctx: CanvasRenderingContext2D, t: string, w: number): string {
  t = String(t ?? ''); if (ctx.measureText(t).width <= w) return t
  let s = t; while (s.length > 1 && ctx.measureText(s + '…').width > w) s = s.slice(0, -1)
  return s + '…'
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, s: number, r: number) {
  ctx.save(); rr(ctx, x, y, s, s, r); ctx.clip()
  if (img) ctx.drawImage(img, x, y, s, s)
  else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x, y, s, s) }
  ctx.restore()
}

function grd(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, GREEN); g.addColorStop(1, GREEN2); return g
}

export async function buildShareImage(singerName: string, rounds: Round[], champion: string) {
  const visible = rounds.filter(r => r.matches.length > 0)
  const nCols = visible.length
  if (!nCols) throw new Error('no rounds')

  // --- collect songs ---
  const allSongs = new Map<string, Song>()
  for (const r of rounds) for (const m of r.matches) {
    allSongs.set(m.songA.id, m.songA); allSongs.set(m.songB.id, m.songB)
  }
  const songs = [...allSongs.values()]
  const champSong = songs.find(s => s.name === champion)

  // --- load covers ---
  const covers = new Map<string, HTMLImageElement | null>()
  await Promise.all(songs.slice(0, 64).map(async s => { covers.set(s.id, await loadImg(s.cover)) }))

  // --- musiccup layout params ---
  const cardW = 170; const cardH = 46
  const colDX = 86; const stub = 12
  const n = visible[0].matches.length * 2 // total songs in first round
  const pairH = n >= 64 ? 120 : n >= 32 ? 130 : n >= 16 ? 150 : 170
  const gapH  = n >= 64 ? 64  : n >= 32 ? 72  : 90
  const pairs0 = visible[0].matches.length / 2 // pairs per half
  const blockH = (pairs0 - 1) * (pairH + gapH) + pairH + cardH
  const chartH = Math.max(blockH, 500)
  const chartTop = 150
  const chartCY = chartTop + chartH / 2
  const midX = W / 2

  // Y positions per half (like musiccup)
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
  const colX = (k: number, side: 0 | 1) => side === 0 ? M + k * colDX : W - M - cardW - k * colDX
  const colSongs = (r: number, side: 0 | 1) => {
    const ms = visible[r].matches
    const h = Math.ceil(ms.length / 2)
    const half = side === 0 ? ms.slice(0, h) : ms.slice(h)
    const out: { s: Song; win: boolean }[] = []
    for (const m of half) {
      out.push({ s: m.songA, win: m.choice === 'a' || m.choice === 'both' })
      out.push({ s: m.songB, win: m.choice === 'b' || m.choice === 'both' })
    }
    return out
  }

  // Champion center
  const champSize = chartH >= 680 ? 170 : 132
  const artCY = chartCY
  const artX = midX - champSize / 2
  const artY = artCY - champSize / 2

  // Dynamic height
  const footerH = 160
  const H = chartTop + chartH + footerH

  // --- canvas ---
  const cv = document.createElement('canvas')
  cv.width = W * SCALE; cv.height = H * SCALE
  const ctx = cv.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  const bgG = ctx.createLinearGradient(0, 0, 0, H)
  bgG.addColorStop(0, '#0b0b13'); bgG.addColorStop(0.5, '#08080d'); bgG.addColorStop(1, '#0b0a12')
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
  const gl1 = ctx.createRadialGradient(W * 0.16, 120, 0, W * 0.16, 120, 700)
  gl1.addColorStop(0, 'rgba(29,185,84,0.04)'); gl1.addColorStop(1, 'transparent')
  ctx.fillStyle = gl1; ctx.fillRect(0, 0, W, 800)
  const gl2 = ctx.createRadialGradient(midX, chartCY, 0, midX, chartCY, 520)
  gl2.addColorStop(0, 'rgba(29,185,84,0.06)'); gl2.addColorStop(1, 'transparent')
  ctx.fillStyle = gl2; ctx.fillRect(0, chartCY - 560, W, 1120)

  // --- Header ---
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.font = `900 44px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 56)
  const total = rounds.reduce((a, r) => a + r.matches.length, 0)
  ctx.font = `500 22px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`${total} 组对决  ·  冠军 ${champion}`, W / 2, 96)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, chartTop - 16); ctx.lineTo(W - M, chartTop - 16); ctx.stroke()

  // --- Connecting lines ---
  ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < nCols; k++) {
      const x = colX(k, side as 0 | 1)
      const edge = side === 0 ? x + cardW : x
      const jx = side === 0 ? edge + stub : edge - stub
      const ys = colYs[k]
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      for (let i = 0; i < ys.length; i += 2) {
        ctx.beginPath()
        ctx.moveTo(edge, ys[i]); ctx.lineTo(jx, ys[i])
        ctx.lineTo(jx, ys[i + 1]); ctx.lineTo(edge, ys[i + 1])
        ctx.stroke()
      }
      if (k === nCols - 1) {
        const my = (ys[0] + ys[1]) / 2
        ctx.beginPath(); ctx.moveTo(jx, my); ctx.lineTo(jx, artCY)
        ctx.lineTo(side === 0 ? artX : artX + champSize, artCY); ctx.stroke()
      }
    }
  }

  // Champion route highlight
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5
  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < nCols; k++) {
      const entries = colSongs(k, side as 0 | 1)
      const ci = entries.findIndex(e => e.s.name === champion)
      if (ci < 0) continue
      const x = colX(k, side as 0 | 1)
      const edge = side === 0 ? x + cardW : x
      const jx = side === 0 ? edge + stub : edge - stub
      const y = colYs[k][ci]
      const nextY = k + 1 < nCols ? colYs[k + 1][Math.floor(ci / 2)] : artCY
      ctx.beginPath(); ctx.moveTo(edge, y); ctx.lineTo(jx, y)
      ctx.lineTo(jx, nextY)
      if (k === nCols - 1) ctx.lineTo(side === 0 ? artX : artX + champSize, nextY)
      ctx.stroke()
    }
  }

  // --- Song cards ---
  function pill(x: number, yC: number, song: Song, won: boolean, isChamp: boolean) {
    const y = yC - cardH / 2
    rr(ctx, x, y, cardW, cardH, 12)
    if (isChamp) {
      ctx.fillStyle = 'rgba(29,185,84,0.12)'
    } else {
      ctx.fillStyle = won ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)'
    }
    ctx.fill()
    ctx.strokeStyle = isChamp ? GREEN : won ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'
    ctx.lineWidth = isChamp ? 2 : 1.2
    rr(ctx, x, y, cardW, cardH, 12); ctx.stroke()

    const cs = cardH - 16
    drawCover(ctx, covers.get(song.id) || null, x + 8, y + 8, cs, 7)

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.font = `${won ? 700 : 400} 16px ${FONT}`
    ctx.fillStyle = won ? '#fff' : 'rgba(235,235,245,0.35)'
    ctx.fillText(fit(ctx, song.name, cardW - cs - 24), x + cs + 16, yC + 1)
  }

  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < nCols; k++) {
      const entries = colSongs(k, side as 0 | 1)
      const x = colX(k, side as 0 | 1)
      entries.forEach((e, i) => {
        pill(x, colYs[k][i], e.s, e.win, e.s.name === champion && e.win)
      })
    }
  }

  // --- Champion center ---
  ctx.save()
  ctx.shadowColor = 'rgba(29,185,84,0.2)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 14
  rr(ctx, artX, artY, champSize, champSize, 20)
  ctx.fillStyle = '#14141d'; ctx.fill()
  ctx.restore()
  if (champSong) drawCover(ctx, covers.get(champSong.id) || null, artX, artY, champSize, 20)
  rr(ctx, artX, artY, champSize, champSize, 20)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.stroke()

  ctx.save()
  ctx.translate(artX + champSize - 6, artY - 4)
  ctx.rotate(0.3)
  ctx.font = '56px sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 1
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  let labelY = artY + champSize + 18
  ctx.font = `700 20px ${FONT}`
  const pillTxt = '🏆 冠军 · CHAMPION'
  const pw = ctx.measureText(pillTxt).width + 48
  rr(ctx, midX - pw / 2, labelY, pw, 40, 20)
  ctx.fillStyle = grd(ctx, midX - pw / 2, labelY, midX + pw / 2, labelY)
  ctx.fill()
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(pillTxt, midX, labelY + 21)
  labelY += 40 + 14

  ctx.font = `900 32px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(champion, midX, labelY + 22)

  // --- Footer ---
  const fy = chartTop + chartH + 34
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `400 22px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', W / 2, fy + 46)

  // Grain
  ctx.globalAlpha = 0.04
  for (let i = 0, cnt = Math.floor(W * H / 1000); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.3, 1.3)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}
