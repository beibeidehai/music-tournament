// Canvas export — musiccup-style bracket tree
import type { Round, Song } from '../types'

const W = 1080
const M = 40 // margin
const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif'
const FONT_DISPLAY = '"Anton","Arial Narrow",sans-serif'
const GREEN = '#1db954'
const GREEN2 = '#169c46'

// ---- helpers ----
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
  ctx.save()
  rr(ctx, x, y, s, s, r)
  ctx.clip()
  if (img) {
    ctx.drawImage(img, x, y, s, s)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fillRect(x, y, s, s)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = `${s * 0.45}px ${FONT}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('♪', x + s / 2, y + s / 2 + s * 0.02)
  }
  ctx.restore()
}

// ---- main ----
export async function buildShareImage(singerName: string, rounds: Round[], champion: string) {
  const visible = rounds.filter(r => r.matches.length > 0)
  const nCols = visible.length
  if (!nCols) throw new Error('no rounds')

  // --- collect all songs, track champion path ---
  const allSongs = new Map<string, Song>()
  const champWins = new Set<string>() // track IDs of songs that beat others on champion's path
  for (const r of rounds) {
    for (const m of r.matches) {
      allSongs.set(m.songA.id, m.songA)
      allSongs.set(m.songB.id, m.songB)
      if (m.choice) {
        const aW = m.choice === 'a' || m.choice === 'both'
        const bW = m.choice === 'b' || m.choice === 'both'
        const aIsChamp = m.songA.name === champion
        const bIsChamp = m.songB.name === champion
        if (aIsChamp && aW) champWins.add(m.songA.id)
        if (bIsChamp && bW) champWins.add(m.songB.id)
      }
    }
  }

  // --- load covers (parallel, limited to avoid OOM) ---
  const uniqueSongs = [...allSongs.values()]
  const covers = new Map<string, HTMLImageElement | null>()
  const toLoad = uniqueSongs.slice(0, 80) // cap at 80 covers
  await Promise.all(toLoad.map(async s => { covers.set(s.id, await loadImg(s.cover)) }))

  // --- layout params ---
  const cardW = 170; const cardH = 46
  const colDX = 86  // horizontal step per column
  const stub = 12   // stub line length
  const n = visible[0].matches.length * 2 // songs in first round
  const pairH = n >= 64 ? 120 : n >= 32 ? 130 : n >= 16 ? 150 : 170
  const gapH = n >= 64 ? 64 : n >= 32 ? 72 : 90

  // Calculate Y positions for each song in each round
  // Round 0: pairs of songs at fixed spacing
  const headerH = 150
  const pairs0 = visible[0].matches.length
  const chartH = (pairs0 - 1) * (pairH + gapH) + pairH + cardH + 20
  const padTop = 0
  const chartTop = headerH
  const chartCY = chartTop + chartH / 2

  // Build Y coords for all rounds
  const colYs: number[][] = []
  {
    const y0: number[] = []
    for (let p = 0; p < pairs0; p++) {
      y0.push(chartTop + padTop + cardH / 2 + p * (pairH + gapH))
      y0.push(chartTop + padTop + cardH / 2 + p * (pairH + gapH) + pairH)
    }
    colYs.push(y0)
    for (let k = 1; k < nCols; k++) {
      const prev = colYs[k - 1]; const cur: number[] = []
      for (let i = 0; i < prev.length; i += 2) cur.push((prev[i] + prev[i + 1]) / 2)
      colYs.push(cur)
    }
  }

  const colX = (k: number) => M + k * colDX

  // --- champion section layout ---
  const champSize = chartH >= 600 ? 140 : 110
  const champCX = W - M - cardW - colDX + 30
  const artCY = chartCY
  const artX = champCX + cardW / 2 - champSize / 2
  const artY = artCY - champSize / 2

  // --- canvas ---
  const footerH = 150
  const H = chartTop + chartH + footerH
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')!

  // Background
  const bgG = ctx.createLinearGradient(0, 0, 0, H)
  bgG.addColorStop(0, '#0b0b13'); bgG.addColorStop(0.5, '#08080d'); bgG.addColorStop(1, '#0b0a12')
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)

  // Glow
  const g1 = ctx.createRadialGradient(W * 0.2, 120, 0, W * 0.2, 120, 700)
  g1.addColorStop(0, 'rgba(29,185,84,0.05)'); g1.addColorStop(1, 'transparent')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, 800)
  const g2 = ctx.createRadialGradient(W / 2, chartCY, 0, W / 2, chartCY, 500)
  g2.addColorStop(0, 'rgba(29,185,84,0.07)'); g2.addColorStop(1, 'transparent')
  ctx.fillStyle = g2; ctx.fillRect(0, chartCY - 500, W, 1000)

  const grad = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, GREEN); g.addColorStop(1, GREEN2)
    return g
  }

  // --- Header ---
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  // Wordmark
  ctx.save()
  ctx.translate(W / 2, 52)
  ctx.transform(1, 0, -0.14, 1, 0, 0)
  ctx.font = `400 40px ${FONT_DISPLAY}`
  ctx.fillStyle = grad(W / 2 - 120, 0, W / 2 + 120, 0)
  ctx.fillText('MUSIC CUP', 0, 0)
  ctx.restore()
  ctx.font = `900 36px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 108)
  const totalMatches = rounds.reduce((a, r) => a + r.matches.length, 0)
  ctx.font = `500 18px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText(`${totalMatches} 组对决  ·  冠军  ${champion}`, W / 2, 138)

  // --- Connecting lines ---
  ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
  for (let k = 0; k < nCols; k++) {
    const x = colX(k); const edge = x + cardW
    const jx = edge + stub
    const ys = colYs[k]
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    for (let i = 0; i < ys.length; i += 2) {
      ctx.beginPath()
      ctx.moveTo(edge, ys[i]); ctx.lineTo(jx, ys[i])
      ctx.lineTo(jx, ys[i + 1]); ctx.lineTo(edge, ys[i + 1])
      ctx.stroke()
    }
    // Last column → champion
    if (k === nCols - 1 && ys.length >= 2) {
      const mid = (ys[0] + ys[1]) / 2
      ctx.beginPath()
      ctx.moveTo(jx, mid); ctx.lineTo(jx, artCY)
      ctx.lineTo(artX, artCY)
      ctx.stroke()
    }
  }

  // --- Champion route highlight ---
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.2
  for (let k = 0; k < nCols; k++) {
    const x = colX(k); const edge = x + cardW; const jx = edge + stub
    const entries: { song: Song; y: number }[] = []
    const round = visible[k]
    round.matches.forEach((m, mi) => {
      entries.push({ song: m.songA, y: colYs[k][mi * 2] })
      entries.push({ song: m.songB, y: colYs[k][mi * 2 + 1] })
    })
    const champEntry = entries.find(e => e.song.name === champion)
    if (!champEntry) continue
    const nextY = k + 1 < nCols ? colYs[k + 1][Math.floor(entries.findIndex(e => e === champEntry) / 2)] : artCY
    ctx.beginPath()
    ctx.moveTo(edge, champEntry.y); ctx.lineTo(jx, champEntry.y)
    ctx.lineTo(jx, nextY)
    if (k === nCols - 1) ctx.lineTo(artX, nextY)
    ctx.stroke()
  }

  // --- Song cards ---
  function drawCard(x: number, y: number, song: Song, won: boolean, isChamp: boolean) {
    const cy = y; const by = cy - cardH / 2
    rr(ctx, x, by, cardW, cardH, 10)
    if (isChamp || won) {
      const g = ctx.createLinearGradient(x, by, x + cardW, by)
      g.addColorStop(0, won && !isChamp ? 'rgba(255,255,255,0.08)' : 'rgba(29,185,84,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0.04)')
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
    }
    ctx.fill()
    ctx.strokeStyle = isChamp ? GREEN : won ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'
    ctx.lineWidth = isChamp ? 2 : 1.2
    rr(ctx, x, by, cardW, cardH, 10); ctx.stroke()

    const coverS = cardH - 14
    drawCover(ctx, covers.get(song.id) || null, x + 7, by + 7, coverS, 6)

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.font = `${won ? '700' : '400'} 15px ${FONT}`
    ctx.fillStyle = won ? '#fff' : 'rgba(235,235,245,0.38)'
    const tx = x + coverS + 16
    ctx.fillText(fit(ctx, song.name, cardW - coverS - 26), tx, cy + 1)
  }

  for (let k = 0; k < nCols; k++) {
    const x = colX(k)
    const round = visible[k]
    round.matches.forEach((m, mi) => {
      const aW = m.choice === 'a' || m.choice === 'both'
      const bW = m.choice === 'b' || m.choice === 'both'
      const aIsChamp = m.songA.name === champion && aW
      const bIsChamp = m.songB.name === champion && bW
      drawCard(x, colYs[k][mi * 2], m.songA, aW, aIsChamp)
      drawCard(x, colYs[k][mi * 2 + 1], m.songB, bW, bIsChamp)
    })
  }

  // --- Champion center ---
  ctx.save()
  ctx.shadowColor = 'rgba(29,185,84,0.25)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 12
  rr(ctx, artX, artY, champSize, champSize, 20)
  ctx.fillStyle = '#14141d'; ctx.fill()
  ctx.restore()
  const champSong = allSongs.get([...allSongs.keys()].find(id => allSongs.get(id)!.name === champion) || '') || [...allSongs.values()].find(s => s.name === champion)
  if (champSong) drawCover(ctx, covers.get(champSong.id) || null, artX, artY, champSize, 20)
  rr(ctx, artX, artY, champSize, champSize, 20)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.stroke()

  // Crown
  ctx.save()
  ctx.translate(artX + champSize - 6, artY - 2)
  ctx.rotate(0.3)
  ctx.font = '48px sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 1
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  // Champion label
  let labelY = artY + champSize + 18
  ctx.font = `700 18px ${FONT}`
  const champLabel = '🏆 冠军 · CHAMPION'
  const pw = ctx.measureText(champLabel).width + 40
  rr(ctx, (W - pw) / 2, labelY, pw, 38, 19)
  ctx.fillStyle = grad((W - pw) / 2, labelY, (W + pw) / 2, labelY)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(champLabel, W / 2, labelY + 20)
  labelY += 38 + 12

  ctx.font = `900 28px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(champion, W / 2, labelY + 22)

  // --- Footer ---
  const fy = chartTop + chartH + 30
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()

  ctx.textAlign = 'center'
  ctx.font = `400 28px ${FONT_DISPLAY}`
  ctx.save()
  ctx.translate(W / 2, fy + 44)
  ctx.transform(1, 0, -0.14, 1, 0, 0)
  ctx.fillStyle = grad(W / 2 - 100, 0, W / 2 + 100, 0)
  ctx.fillText('MUSIC CUP', 0, 0)
  ctx.restore()
  ctx.font = `400 16px ${FONT}`
  ctx.fillStyle = 'rgba(235,235,245,0.35)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', W / 2, fy + 78)

  // --- Grain ---
  ctx.globalAlpha = 0.04
  for (let i = 0, cnt = Math.floor(W * H / 1000); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.3, 1.3)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}
