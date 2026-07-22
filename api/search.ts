import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    // 1. Search both platforms in parallel
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const neteaseApi = mod.default || mod

    const [neteaseR, itunesR_cn, itunesR_tw] = await Promise.allSettled([
      neteaseApi.search({ keywords: q, type: 100, limit: 15 }),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=10&country=cn`),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=10&country=tw`),
    ])

    // Parse Netease results → map by name for avatar lookup
    const neteaseByName = new Map<string, { avatar: string; songCount: number }>()
    if (neteaseR.status === 'fulfilled') {
      const artists = neteaseR.value?.body?.result?.artists || []
      for (const a of artists) {
        const key = a.name.toLowerCase().trim()
        if (!neteaseByName.has(key)) {
          neteaseByName.set(key, { avatar: a.picUrl || a.img1v1Url || '', songCount: a.albumSize || 0 })
        }
      }
    }

    // Parse iTunes results (both stores)
    const itunesArtists = new Map<number, { id: string; name: string }>()
    for (const r of [itunesR_cn, itunesR_tw]) {
      if (r.status !== 'fulfilled' || !r.value.ok) continue
      const data: any = await r.value.json()
      for (const a of data.results || []) {
        if (a.wrapperType !== 'artist') continue
        if (!itunesArtists.has(a.artistId)) {
          itunesArtists.set(a.artistId, { id: String(a.artistId), name: a.artistName })
        }
      }
    }

    // 2. Cross-reference: only artists in BOTH platforms
    const artists: any[] = []
    for (const [, ita] of itunesArtists) {
      const itName = ita.name.toLowerCase().trim()
      // Match by name (try exact and variations)
      let ne = neteaseByName.get(itName)
      if (!ne) {
        // Try without spaces
        for (const [k, v] of neteaseByName) {
          if (k.replace(/\s+/g, '') === itName.replace(/\s+/g, '')) { ne = v; break }
        }
      }
      if (!ne) continue // Not in both platforms → skip

      // 3. Get actual song count from iTunes (resultCount from search)
      let songCount = ne.songCount // fallback to Netease album count
      try {
        const scR = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(ita.name)}&entity=song&attribute=artistTerm&limit=1&country=cn`
        )
        if (scR.ok) {
          const scData: any = await scR.json()
          if (scData.resultCount > 0) songCount = scData.resultCount
        }
      } catch { /* use fallback */ }

      if (songCount < 8) continue // Filter < 8 songs

      artists.push({
        id: ita.id,
        name: ita.name,
        avatar: ne.avatar,
        songCount,
        platform: 'apple',
      })
    }

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
