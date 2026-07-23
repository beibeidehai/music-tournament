// Canvas export — converging bracket (horizontal) + vertical 32-song layout
import type { Round, Song } from '../types'
import QRCode from 'qrcode'

const SCALE = 2
const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif'
const GREEN = '#fff'; const GREEN2 = '#aaa'
const DARK = '#0b0b13'

// Horizontal layout constants
const M = 36
const CARD_W = 136; const CARD_H = 44
const COL_GAP = 20; const V_GAP = 6
const CHAMP_W = 190
const CHAMP_SIZE = 150

// Vertical layout constants
const V_W = 760; const VM = 26
const V_CARD_W = 132; const V_CARD_GAP = 10
const V_ROW_GAP = 3
const V_ROUND_GAP = 14
const V_CARDS_PER_ROW = 4
const V_CARD_H = 34

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

export async function buildShareImage(
  singerName: string, rounds: Round[], champion: string,
  opts?: { vertical?: boolean },
) {
  const visible = rounds.filter(r => r.matches.length > 0)
  if (!visible.length) throw new Error('no rounds')

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

  if (opts?.vertical) {
    return buildVertical(singerName, visible, champion, covers, qrDataUrl)
  }
  return buildHorizontal(singerName, visible, champion, covers, qrDataUrl)
}

// ========== Horizontal (64-song) layout ==========

async function buildHorizontal(
  singerName: string, visible: Round[], champion: string,
  covers: Map<string, HTMLImageElement | null>, qrDataUrl: string,
) {
  const nRounds = visible.length
  const bracketRounds = visible.slice(0, -1)
  const finalRound = visible[nRounds - 1]
  const nBracket = bracketRounds.length

  const maxHalf = Math.max(...bracketRounds.map(r => Math.ceil(r.matches.length / 2)), 1)
  const chartH = maxHalf * (CARD_H + V_GAP) + 8
  const champSectionH = Math.max(60, CHAMP_SIZE + 180 - chartH)

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

  const gl = ctx.createRadialGradient(W / 2, headerH + bodyH / 2, 0, W / 2, headerH + bodyH / 2, 500)
  gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H)

  // Header
  drawHeader(ctx, singerName, champion, visible[0].matches.length * 2, W, headerH)

  const startX = M + (W - M * 2 - totalW) / 2
  const colX = (i: number) => startX + i * (CARD_W + COL_GAP)
  const centerX = startX + nBracket * (CARD_W + COL_GAP) + COL_GAP
  const rightStartX = centerX + CHAMP_W + COL_GAP

  const positions: (Pos | null)[][] = []

  bracketRounds.forEach((round, ri) => {
    const matches = round.matches
    const mid = Math.ceil(matches.length / 2)
    const leftHalf = matches.slice(0, mid)
    const rightHalf = matches.slice(mid)
    positions[ri] = []

    const lx = colX(ri)
    drawColumn(ctx, round.name + ' (上半区)', leftHalf, lx, headerH, chartH, covers, ri, positions, 0)
    const rx = rightStartX + (nBracket - 1 - ri) * (CARD_W + COL_GAP)
    drawColumn(ctx, round.name + ' (下半区)', rightHalf, rx, headerH, chartH, covers, ri, positions, leftHalf.length)
  })

  // Bracket lines
  for (let ri = 0; ri < nBracket - 1; ri++) {
    const cur = positions[ri]; if (!cur) continue
    for (let mi = 0; mi < cur.length; mi++) {
      const pos = cur[mi]; if (!pos) continue
      const parent = positions[ri + 1]?.[Math.floor(mi / 2)]; if (!parent) continue
      const leftSide = pos.x + pos.w / 2 < centerX
      if (leftSide) drawHLine(ctx, pos.x + pos.w, pos.midY, parent.x, parent.midY)
      else drawHLine(ctx, pos.x, pos.midY, parent.x + parent.w, parent.midY)
    }
  }

  // Champion card
  if (nBracket > 0 && finalRound.matches[0]) {
    const lastRound = positions[nBracket - 1]
    const lastLeft = lastRound?.[0]
    const lastRight = lastRound?.[(lastRound?.length ?? 1) - 1]
    const finalMatch = finalRound.matches[0]

    const clusterH = CHAMP_SIZE + 16 + 38 + 8 + 46
    const bodyCenter = headerH + bodyH / 2
    const cX = centerX + (CHAMP_W - CHAMP_SIZE) / 2
    const cY = bodyCenter - clusterH / 2 + 10

    if (lastLeft) drawHLine(ctx, lastLeft.x + lastLeft.w, lastLeft.midY, cX, cY + CHAMP_SIZE / 2)
    if (lastRight) drawHLine(ctx, lastRight.x, lastRight.midY, cX + CHAMP_SIZE, cY + CHAMP_SIZE / 2)

    drawChampionCard(ctx, finalMatch, champion, cX, cY, CHAMP_W, CHAMP_SIZE, centerX, covers)
  }

  // Footer + QR
  const fy = headerH + bodyH + 1
  await drawFooter(ctx, W, fy, qrDataUrl)

  // Grain
  grain(ctx, W, H)

  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}

// ========== Vertical layout: top half ↓ champion ↓ bottom half ==========

async function buildVertical(
  singerName: string, visible: Round[], champion: string,
  covers: Map<string, HTMLImageElement | null>, qrDataUrl: string,
) {
  const vertRounds = visible.length > 5 ? visible.slice(1) : visible
  const bracketRounds = vertRounds.slice(0, -1)
  const finalRound = vertRounds[vertRounds.length - 1]
  const nBracket = bracketRounds.length

  const headerH = 110; const footerH = 100
  const W = V_W
  const availW = W - VM * 2
  const cardH = V_CARD_H

  // Compute top half height (same for bottom half)
  let topH = 0
  for (const r of bracketRounds) {
    const leftCount = Math.ceil(r.matches.length / 2)
    const rows = Math.ceil(leftCount / V_CARDS_PER_ROW)
    topH += rows * (cardH + V_ROW_GAP) + 28
  }
  // Final section: song A card + champion + song B card
  const finalGap = 20
  const champCardH = CHAMP_SIZE + 80
  const finalH = 8 + cardH + finalGap + champCardH + finalGap + cardH + 12
  const bodyH = topH + finalH + topH
  const H = headerH + bodyH + footerH

  const cv = document.createElement('canvas')
  cv.width = W * SCALE; cv.height = H * SCALE
  const ctx = cv.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  const bgG = ctx.createLinearGradient(0, 0, W, H)
  bgG.addColorStop(0, '#0c0c16'); bgG.addColorStop(1, DARK)
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
  const gl = ctx.createRadialGradient(W / 2, headerH + bodyH / 2, 0, W / 2, headerH + bodyH / 2, 500)
  gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(1, 'transparent')
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H)

  drawHeader(ctx, singerName, champion, vertRounds[0].matches.length * 2, W, headerH)

  const topPos: (Pos | null)[][] = []
  const botPos: (Pos | null)[][] = []

  // --- Top half: 32→16, 16→8, 8→4, 4→2 (top to bottom) ---
  let curY = headerH + 8
  bracketRounds.forEach((round, ri) => {
    const mid = Math.ceil(round.matches.length / 2)
    const leftHalf = round.matches.slice(0, mid)
    topPos[ri] = []

    ctx.textAlign = 'center'
    ctx.font = `700 12px ${FONT}`; ctx.fillStyle = GREEN
    ctx.fillText(round.name + ' (上半区)', W / 2, curY + 14)
    curY += 26

    const nRows = Math.ceil(leftHalf.length / V_CARDS_PER_ROW)
    for (let row = 0; row < nRows; row++) {
      const rowMatches = leftHalf.slice(row * V_CARDS_PER_ROW, (row + 1) * V_CARDS_PER_ROW)
      const rowW = rowMatches.length * V_CARD_W + (rowMatches.length - 1) * V_CARD_GAP
      const sx = VM + (availW - rowW) / 2
      rowMatches.forEach((m, ci) => {
        const x = sx + ci * (V_CARD_W + V_CARD_GAP)
        drawMatchCard(ctx, m, x, curY, V_CARD_W, cardH, covers)
        topPos[ri][row * V_CARDS_PER_ROW + ci] = { x, y: curY, w: V_CARD_W, h: cardH, midY: curY + cardH / 2 }
      })
      curY += cardH + V_ROW_GAP
    }
    curY += V_ROUND_GAP - V_ROW_GAP
  })

  // Top bracket lines (downward)
  for (let ri = 0; ri < nBracket - 1; ri++) {
    const cur = topPos[ri]; if (!cur) continue
    for (let mi = 0; mi < cur.length; mi++) {
      const pos = cur[mi]; if (!pos) continue
      const parent = topPos[ri + 1]?.[Math.floor(mi / 2)]; if (!parent) continue
      drawVLine(ctx, pos.x + pos.w / 2, pos.y + pos.h, parent.x + parent.w / 2, parent.y)
    }
  }

  // --- Final match section: Song A → Champion ← Song B ---
  const finalMatch = finalRound.matches[0]
  const lastTop = topPos[nBracket - 1]?.[0]
  const finalCenterX = W / 2
  let finalY = curY + 8

  // Song A card (top half winner)
  let songAPos: Pos | null = null
  if (finalMatch) {
    const aX = (W - V_CARD_W) / 2
    const aWinner = finalMatch.choice === 'a'
    drawSingleSongCard(ctx, finalMatch.songA, aWinner, aX, finalY, V_CARD_W, cardH, covers)
    songAPos = { x: aX, y: finalY, w: V_CARD_W, h: cardH, midY: finalY + cardH / 2 }
    if (lastTop) drawVLine(ctx, lastTop.x + lastTop.w / 2, lastTop.y + lastTop.h, finalCenterX, finalY)
    finalY += cardH + finalGap
  }

  // Champion card
  const cX = (W - CHAMP_SIZE) / 2
  if (finalMatch && songAPos) {
    drawVLine(ctx, finalCenterX, songAPos.y + songAPos.h, cX + CHAMP_SIZE / 2, finalY)
  }
  drawSimpleChampion(ctx, champion, finalMatch, cX, finalY, CHAMP_SIZE, covers, W)
  const champBottomY = finalY + champCardH
  finalY += champCardH + finalGap

  // Song B card (bottom half winner)
  let songBPos: Pos | null = null
  if (finalMatch) {
    const bX = (W - V_CARD_W) / 2
    const bWinner = finalMatch.choice === 'b'
    drawSingleSongCard(ctx, finalMatch.songB, bWinner, bX, finalY, V_CARD_W, cardH, covers)
    songBPos = { x: bX, y: finalY, w: V_CARD_W, h: cardH, midY: finalY + cardH / 2 }
    drawVLine(ctx, cX + CHAMP_SIZE / 2, champBottomY, finalCenterX, finalY)
    finalY += cardH
  }

  // --- Bottom half: 4→2, 8→4, 16→8, 32→16 (top to bottom) ---
  finalY += 12
  // Draw in display order: ri = nBracket-1 first (4→2, nearest champion), down to ri = 0 (32→16, at bottom)
  for (let di = 0; di < nBracket; di++) {
    const ri = nBracket - 1 - di
    const round = bracketRounds[ri]
    const mid = Math.ceil(round.matches.length / 2)
    const rightHalf = round.matches.slice(mid)
    botPos[ri] = []

    ctx.textAlign = 'center'
    ctx.font = `700 12px ${FONT}`; ctx.fillStyle = GREEN
    ctx.fillText(round.name + ' (下半区)', W / 2, finalY + 14)
    finalY += 26

    const nRows = Math.ceil(rightHalf.length / V_CARDS_PER_ROW)
    for (let row = 0; row < nRows; row++) {
      const rowMatches = rightHalf.slice(row * V_CARDS_PER_ROW, (row + 1) * V_CARDS_PER_ROW)
      const rowW = rowMatches.length * V_CARD_W + (rowMatches.length - 1) * V_CARD_GAP
      const sx = VM + (availW - rowW) / 2
      rowMatches.forEach((m, ci) => {
        const x = sx + ci * (V_CARD_W + V_CARD_GAP)
        drawMatchCard(ctx, m, x, finalY, V_CARD_W, cardH, covers)
        botPos[ri][row * V_CARDS_PER_ROW + ci] = { x, y: finalY, w: V_CARD_W, h: cardH, midY: finalY + cardH / 2 }
      })
      finalY += cardH + V_ROW_GAP
    }
    finalY += V_ROUND_GAP - V_ROW_GAP
  }

  // Bottom bracket lines (upward)
  for (let ri = 0; ri < nBracket - 1; ri++) {
    const cur = botPos[ri]; if (!cur) continue
    for (let mi = 0; mi < cur.length; mi++) {
      const pos = cur[mi]; if (!pos) continue
      const parent = botPos[ri + 1]?.[Math.floor(mi / 2)]; if (!parent) continue
      drawVLine(ctx, pos.x + pos.w / 2, pos.y + pos.h, parent.x + parent.w / 2, parent.y)
    }
  }

  // Bottom 4→2 → Song B line
  const lastBot = botPos[nBracket - 1]?.[0]
  if (lastBot && songBPos) {
    drawVLine(ctx, finalCenterX, songBPos.y + songBPos.h, lastBot.x + lastBot.w / 2, lastBot.y)
  }

  // Footer + QR
  const fy = headerH + bodyH + 1
  await drawFooter(ctx, W, fy, qrDataUrl)

  grain(ctx, W, H)
  return new Promise<Blob>(res => cv.toBlob(b => res(b!), 'image/jpeg', 0.92))
}

// ========== Shared draw helpers ==========

function drawHeader(ctx: CanvasRenderingContext2D, singerName: string, champion: string, totalSongs: number, W: number, headerH: number) {
  ctx.textAlign = 'center'
  ctx.font = `900 36px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(`${singerName} · 歌曲淘汰赛`, W / 2, 40)
  ctx.font = `500 18px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText(`冠军 ${champion}`, W / 2, 72)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, headerH - 8); ctx.lineTo(W - M, headerH - 8); ctx.stroke()
}

async function drawFooter(ctx: CanvasRenderingContext2D, W: number, fy: number, qrDataUrl: string) {
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke()
  ctx.textAlign = 'left'
  ctx.font = `400 15px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText('决战歌曲之巅 · echoesvs.site', M, fy + 34)

  if (qrDataUrl) {
    const qrSize = 72
    const qrX = W - M - qrSize
    const qrY = fy
    rr(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8)
    ctx.fillStyle = '#fff'; ctx.fill()
    const qrImg = await loadImg(qrDataUrl)
    if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    ctx.textAlign = 'right'
    ctx.font = `400 9px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillText('扫码访问', W - M, qrY + qrSize + 14)
  }
}

function drawChampionCard(
  ctx: CanvasRenderingContext2D, finalMatch: Round['matches'][0],
  champion: string, cX: number, cY: number,
  centerW: number, champSize: number, centerLabelX: number,
  covers: Map<string, HTMLImageElement | null>,
) {
  ctx.save()
  ctx.shadowColor = 'rgba(255,255,255,0.12)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 8
  rr(ctx, cX, cY, champSize, champSize, 22)
  ctx.fillStyle = '#111119'; ctx.fill()
  ctx.restore()

  const champSong = finalMatch.choice === 'a' ? finalMatch.songA : finalMatch.songB
  const champImg = covers.get(champSong.cover)
  if (champImg) { ctx.save(); rr(ctx, cX, cY, champSize, champSize, 22); ctx.clip(); ctx.drawImage(champImg, cX, cY, champSize, champSize); ctx.restore() }

  rr(ctx, cX, cY, champSize, champSize, 22)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.stroke()

  ctx.save()
  ctx.translate(cX + champSize, cY - 6)
  ctx.rotate(0.3)
  ctx.font = '64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  let ly = cY + champSize + 16
  ctx.textAlign = 'center'
  ctx.font = `700 16px ${FONT}`
  const lbl = '🏆 冠军'
  const lw = ctx.measureText(lbl).width + 40
  const lblX = cX + champSize / 2 - lw / 2 // center label over card
  rr(ctx, lblX, ly, lw, 38, 19)
  ctx.fillStyle = grd(ctx, lblX, ly, lblX + lw, ly)
  ctx.fill()
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
  ctx.fillText(lbl, cX + champSize / 2, ly + 19)
  ly += 38 + 8
  ctx.font = `900 28px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(champion, cX + champSize / 2, ly + 18)
}

function drawSimpleChampion(
  ctx: CanvasRenderingContext2D,
  champion: string,
  finalMatch: Round['matches'][0] | undefined,
  x: number, y: number, size: number,
  covers: Map<string, HTMLImageElement | null>,
  _W: number,
) {
  // Champion cover
  ctx.save()
  ctx.shadowColor = 'rgba(255,255,255,0.12)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 8
  rr(ctx, x, y, size, size, 22)
  ctx.fillStyle = '#111119'; ctx.fill()
  ctx.restore()

  const champSong = finalMatch?.choice === 'a' ? finalMatch.songA : finalMatch?.songB
  if (champSong) {
    const champImg = covers.get(champSong.cover)
    if (champImg) { ctx.save(); rr(ctx, x, y, size, size, 22); ctx.clip(); ctx.drawImage(champImg, x, y, size, size); ctx.restore() }
  }

  rr(ctx, x, y, size, size, 22)
  ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.stroke()

  // Crown
  ctx.save()
  ctx.translate(x + size, y - 6)
  ctx.rotate(0.3)
  ctx.font = '64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText('👑', 0, 0)
  ctx.restore()

  // Label + name below the card
  let ly = y + size + 16
  ctx.textAlign = 'center'
  const lbl = '🏆 冠军'
  const lw = ctx.measureText(lbl).width + 40
  const lblX = x + size / 2 - lw / 2
  rr(ctx, lblX, ly, lw, 38, 19)
  ctx.fillStyle = grd(ctx, lblX, ly, lblX + lw, ly)
  ctx.fill()
  ctx.font = `700 16px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
  ctx.fillText(lbl, x + size / 2, ly + 19)
  ly += 38 + 8
  ctx.font = `900 28px ${FONT}`; ctx.fillStyle = '#fff'
  ctx.fillText(champion, x + size / 2, ly + 18)
}

function drawSingleSongCard(
  ctx: CanvasRenderingContext2D,
  song: Song,
  isWinner: boolean,
  x: number, y: number, w: number, h: number,
  covers: Map<string, HTMLImageElement | null>,
) {
  const cs = h - 12
  rr(ctx, x, y, w, h, 9)
  ctx.fillStyle = isWinner ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
  ctx.fill()
  ctx.strokeStyle = isWinner ? GREEN : 'rgba(255,255,255,0.04)'
  ctx.lineWidth = isWinner ? 2 : 1; rr(ctx, x, y, w, h, 9); ctx.stroke()
  if (isWinner) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2) }

  const cover = covers.get(song.cover)
  if (cover) { ctx.save(); rr(ctx, x + 6, y + 6, cs, cs, 4); ctx.clip(); ctx.drawImage(cover, x + 6, y + 6, cs, cs); ctx.restore() }
  else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 6, y + 6, cs, cs) }

  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.font = `${isWinner ? 700 : 400} 10px ${FONT}`
  ctx.fillStyle = isWinner ? '#fff' : 'rgba(255,255,255,0.28)'
  ctx.fillText(fit(ctx, song.name, w - cs - 20), x + cs + 12, y + h / 2 + 1)
}
function grd(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, GREEN); g.addColorStop(1, GREEN2); return g
}

function grain(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.globalAlpha = 0.03
  for (let i = 0, cnt = Math.floor(W * H / 1500); i < cnt; i++) {
    ctx.fillStyle = Math.random() > .5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1
}

// ========== Line drawing ==========

function drawHLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1)
  const cp = dx * 0.45
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.stroke()
}

function drawVLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const dy = Math.abs(y2 - y1)
  const cp = dy * 0.4
  const sign = y2 > y1 ? 1 : -1
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1, y1 + cp * sign, x2, y2 - cp * sign, x2, y2)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.stroke()
}

// ========== Column drawing (horizontal layout) ==========

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
  const cs = half - 8

  rr(ctx, x, y, w, h, 9)
  ctx.fillStyle = m.choice ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
  ctx.fill()
  ctx.strokeStyle = m.choice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1; rr(ctx, x, y, w, h, 9); ctx.stroke()

  // Song A
  if (aW) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1, y + 1, w - 2, half - 2) }
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
  if (bW) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1, y + half + 1, w - 2, half - 2) }
  const coverB = covers.get(m.songB.cover)
  if (coverB) { ctx.save(); rr(ctx, x + 4, y + half + 4, cs, cs, 4); ctx.clip(); ctx.drawImage(coverB, x + 4, y + half + 4, cs, cs); ctx.restore() }
  else { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 4, y + half + 4, cs, cs) }
  ctx.fillStyle = bW ? '#fff' : 'rgba(255,255,255,0.28)'
  ctx.fillText(fit(ctx, m.songB.name, w - cs - 16), x + cs + 8, y + half + half / 2 + 1)
}
