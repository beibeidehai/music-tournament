// Canvas export — converging bracket: left/right halves → center champion
import type { Round, Song } from '../types'
import QRCode from 'qrcode'

const SCALE = 2
const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif'
const GREEN = '#1db954'; const GREEN2 = '#169c46'
const DARK = '#0b0b13'

// Layout constants
const M = 36
const CARD_W = 136; const CARD_H = 44
const COL_GAP = 20; const V_GAP = 6
const CHAMP_W = 190
const CHAMP_SIZE = 150

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

type Pos = { x: number; y: number; w: number; h: number; midY: number }

export async function buildShareImage(singerName: string, rounds: Round[], champion: string) {
  const visible = rounds.filter(r => r.matches.length > 0)
  const nRounds = visible.length
  if (!nRounds) throw new Error('no rounds')

  // --- load covers ---
  const allCovers: string[] = []
  const seen = new Set<string>()
  for (const r of rounds) for (const m of r.matches) {
    if (m.songA.cover && !seen.has(m.songA.cover)) { seen.add(m.songA.cover); allCovers.push(m.songA.cover) }
    if (m.songB.cover && !seen.has(m.songB.cover)) { seen.add(m.songB.cover); allCovers.push(m.songB.cover) }
  }
  const covers = new Map<string, HTMLImageElement | null>()
  await Promise.all(allCovers.slice(0, 60).map(async u => { covers.set(u, await loadImg(u)) }))

  // QR code
  let qrDataUrl = ''
  try { qrDataUrl = await QRCode.toDataURL('https://echoesvs.site', { width: 200, margin: 1 }) }
  catch { /* skip qr */ }

  // --- layout ---
  const bracketRounds = visible.slice(0, -1)  // rounds split into L/R halves
  const finalRound = visible[nRounds - 1]
  const nBracket = bracketRounds.length

  // Max matches in any half-column
  const maxHalf = Math.max(...bracketRounds.map(r => Math.ceil(r.matches.length / 2)), 1)
  const chartH = maxHalf * (CARD_H + V_GAP) + 8
  // ponytail: champion overlays center, just need enough body for bracket + champion cluster
  const champSectionH = Math.max(60, CHAMP_SIZE + 180 - chartH)

  // Total width: left columns + center gap + champion + center gap + right columns
  const totalW = 2 * nBracket * (CARD_W + COL_GAP) + CHAMP_W + COL_GAP * 2
  const W = Math.max(1000, M * 2 + totalW)
  const headerH = 110; const footerH = 80
  const bodyH = chartH + champSectionH
  const H = headerH + bodyH + footerH

  const cv = document.createElement('canvas')
  cv.width = W * SCALE; cv.height = H * SCALE
  const ctx = cv.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  const bgG = ctx.createLinearGradient(0, 0, W, H)
  bgG.addColorStop(0, '#0c0c16'); bgG.addColorStop(1, DARK)
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)

  // Glow
  const gl = ctx.createRadialGradient(W / 2, headerH + bodyH / 2, 0, W / 2, headerH + bodyH / 2, 500)
  gl.addColorStop(0, 'rgba(29,185,84,0.05)'); gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H)

  // Header
  ctx.textAlign = 'center'
  ctx.font = `900 36px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 40)
  const totalSongs = visible[0].matches.length * 2
  ctx.font = `500 18px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`${totalSongs} 首歌对决  ·  冠军 ${champion}`, W / 2, 72)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, headerH - 8); ctx.lineTo(W - M, headerH - 8); ctx.stroke()

  // Column x-positions (center of each column)
  const startX = M + (W - M * 2 - totalW) / 2
  const colX = (i: number) => startX + i * (CARD_W + COL_GAP)
  // Center champion column starts after all left columns + gap
  const centerX = startX + nBracket * (CARD_W + COL_GAP) + COL_GAP
  // Right columns start after center
  const rightStartX = centerX + CHAMP_W + COL_GAP

  // Track match positions for bracket lines
  const positions: (Pos | null)[][] = []

  // --- draw bracket rounds ---
  bracketRounds.forEach((round, ri) => {
    const matches = round.matches
    const mid = Math.ceil(matches.length / 2)
    const leftHalf = matches.slice(0, mid)
    const rightHalf = matches.slice(mid)

    positions[ri] = []

    // Left column
    const lx = colX(ri)
    drawColumn(ctx, round.name + ' (上半区)', leftHalf, lx, headerH, chartH, covers, ri, positions, 0)

    // Right column (positioned symmetrically)
    const rx = rightStartX + (nBracket - 1 - ri) * (CARD_W + COL_GAP)
    drawColumn(ctx, round.name + ' (下半区)', rightHalf, rx, headerH, chartH, covers, ri, positions, leftHalf.length)
  })

  // --- draw bracket lines ---
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
  for (let ri = 0; ri < nBracket - 1; ri++) {
    const cur = positions[ri]
    if (!cur) continue
    for (let mi = 0; mi < cur.length; mi++) {
      const pos = cur[mi]
      if (!pos) continue
      const parentMi = Math.floor(mi / 2)
      const parent = positions[ri + 1]?.[parentMi]
      if (!parent) continue

      // Determine direction: left half → exit right, right half → exit left
      const isLeft = mi < Math.ceil(cur.length / 2) || (cur.length <= 2 && mi === 0)
      // ponytail: simpler heuristic — if card is left of centerX, it's left half
      const leftSide = pos.x + pos.w / 2 < centerX

      if (leftSide) {
        drawBracketLine(ctx, pos.x + pos.w, pos.midY, parent.x, parent.midY)
      } else {
        drawBracketLine(ctx, pos.x, pos.midY, parent.x + parent.w, parent.midY)
      }
    }
  }

  // --- champion card centered (covers the final match slot) ---
  if (nBracket > 0 && finalRound.matches[0]) {
    const lastRound = positions[nBracket - 1]
    const lastLeft = lastRound?.[0]
    const lastRight = lastRound?.[(lastRound?.length ?? 1) - 1]
    const finalMatch = finalRound.matches[0]

    // Total champion cluster height: crown protrude + card + gap + label + name
    const clusterH = CHAMP_SIZE + 16 + 36 + 8 + 42
    const bodyCenter = headerH + bodyH / 2
    const cX = centerX + (CHAMP_W - CHAMP_SIZE) / 2
    const cY = bodyCenter - clusterH / 2 + 10 // slight nudge down for crown

    // Lines from last bracket rounds → champion card edges
    if (lastLeft) drawBracketLine(ctx, lastLeft.x + lastLeft.w, lastLeft.midY, cX, cY + CHAMP_SIZE / 2)
    if (lastRight) drawBracketLine(ctx, lastRight.x, lastRight.midY, cX + CHAMP_SIZE, cY + CHAMP_SIZE / 2)

    // Champion card bg
    ctx.save()
    ctx.shadowColor = 'rgba(29,185,84,0.35)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 14
    rr(ctx, cX, cY, CHAMP_SIZE, CHAMP_SIZE, 22)
    ctx.fillStyle = '#111119'; ctx.fill()
    ctx.restore()

    // Cover image
    const champSong = finalMatch.choice === 'a' ? finalMatch.songA : finalMatch.songB
    const champImg = covers.get(champSong.cover)
    if (champImg) { ctx.save(); rr(ctx, cX, cY, CHAMP_SIZE, CHAMP_SIZE, 22); ctx.clip(); ctx.drawImage(champImg, cX, cY, CHAMP_SIZE, CHAMP_SIZE); ctx.restore() }

    // Green border
    rr(ctx, cX, cY, CHAMP_SIZE, CHAMP_SIZE, 22)
    ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.stroke()

    // Crown
    ctx.save()
    ctx.translate(cX + CHAMP_SIZE, cY - 6)
    ctx.rotate(0.3)
    ctx.font = '64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText('👑', 0, 0)
    ctx.restore()

    // Champion label
    let ly = cY + CHAMP_SIZE + 16
    ctx.textAlign = 'center'
    ctx.font = `700 16px ${FONT}`
    const lbl = '🏆 冠军'
    const lw = ctx.measureText(lbl).width + 40
    rr(ctx, centerX + (CHAMP_W - lw) / 2, ly, lw, 38, 19)
    ctx.fillStyle = grd(ctx, centerX + (CHAMP_W - lw) / 2, ly, centerX + (CHAMP_W + lw) / 2, ly)
    ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
    ctx.fillText(lbl, centerX + CHAMP_W / 2, ly + 19)
    ly += 38 + 8
    ctx.font = `900 28px ${FONT}`; ctx.fillStyle = '#fff'
    ctx.fillText(champion, centerX + CHAMP_W / 2, ly + 18)
  }

  // Footer
  const fy = headerH + bodyH + 1
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()
  ctx.textAlign = 'left'
  ctx.font = `400 15px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', M, fy + 34)

  // QR code
  if (qrDataUrl) {
    const qrSize = 72
    const qrX = W - M - qrSize
    const qrY = fy
    // White bg for QR
    rr(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8)
    ctx.fillStyle = '#fff'; ctx.fill()
    const qrImg = await loadImg(qrDataUrl)
    if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    // Caption
    ctx.textAlign = 'right'
    ctx.font = `400 9px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillText('扫码访问', W - M, qrY + qrSize + 14)
  }

  // Grain
  ctx.globalAlpha = 0.03
  for (let i = 0, cnt = Math.floor(W * H / 1500); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}

function grd(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, GREEN); g.addColorStop(1, GREEN2); return g
}

function drawBracketLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1)
  const cp = dx * 0.45
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.stroke()
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  name: string,
  matches: Round['matches'],
  x: number,
  headerH: number,
  chartH: number,
  covers: Map<string, HTMLImageElement | null>,
  roundIdx: number,
  positions: (Pos | null)[][],
  offset: number,
) {
  const colH = matches.length * (CARD_H + V_GAP)
  const startY = headerH + (chartH - colH) / 2

  // Round label
  ctx.textAlign = 'center'
  ctx.font = `700 11px ${FONT}`; ctx.fillStyle = GREEN
  ctx.fillText(name, x + CARD_W / 2, startY - 8)

  if (!positions[roundIdx]) positions[roundIdx] = []

  matches.forEach((m, mi) => {
    const y = startY + mi * (CARD_H + V_GAP)
    drawMatchCard(ctx, m, x, y, CARD_W, CARD_H, covers)

    const pos: Pos = { x, y, w: CARD_W, h: CARD_H, midY: y + CARD_H / 2 }
    positions[roundIdx][offset + mi] = pos
  })
}

function drawMatchCard(
  ctx: CanvasRenderingContext2D,
  m: Round['matches'][0],
  x: number, y: number, w: number, h: number,
  covers: Map<string, HTMLImageElement | null>,
) {
  const aW = m.choice === 'a' || m.choice === 'both'
  const bW = m.choice === 'b' || m.choice === 'both'
  const half = h / 2
  const cs = half - 8  // cover size

  // Card bg
  rr(ctx, x, y, w, h, 9)
  ctx.fillStyle = m.choice ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
  ctx.fill()
  ctx.strokeStyle = m.choice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1; rr(ctx, x, y, w, h, 9); ctx.stroke()

  // Match number
  ctx.textAlign = 'right'
  ctx.font = `400 7px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillText(`#${(m as any)._idx ?? ''}`, x + w - 5, y + 9)

  // Song A
  if (aW) { ctx.fillStyle = 'rgba(29,185,84,0.1)'; ctx.fillRect(x + 1, y + 1, w - 2, half - 2) }
  const coverA = covers.get(m.songA.cover)
  if (coverA) { ctx.save(); rr(ctx, x + 4, y + 4, cs, cs, 4); ctx.clip(); ctx.drawImage(coverA, x + 4, y + 4, cs, cs); ctx.restore() }
  else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 4, y + 4, cs, cs) }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.font = `${aW ? 700 : 400} 9px ${FONT}`
  ctx.fillStyle = aW ? '#fff' : 'rgba(255,255,255,0.28)'
  ctx.fillText(fit(ctx, m.songA.name, w - cs - 16), x + cs + 8, y + half / 2 + 1)

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath()
  ctx.moveTo(x + 5, y + half); ctx.lineTo(x + w - 5, y + half); ctx.stroke()

  // Song B
  if (bW) { ctx.fillStyle = 'rgba(29,185,84,0.1)'; ctx.fillRect(x + 1, y + half + 1, w - 2, half - 2) }
  const coverB = covers.get(m.songB.cover)
  if (coverB) { ctx.save(); rr(ctx, x + 4, y + half + 4, cs, cs, 4); ctx.clip(); ctx.drawImage(coverB, x + 4, y + half + 4, cs, cs); ctx.restore() }
  else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 4, y + half + 4, cs, cs) }
  ctx.fillStyle = bW ? '#fff' : 'rgba(255,255,255,0.28)'
  ctx.fillText(fit(ctx, m.songB.name, w - cs - 16), x + cs + 8, y + half + half / 2 + 1)
}
