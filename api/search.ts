import type { VercelRequest, VercelResponse } from '@vercel/node'

// Normalize name for cross-platform matching
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s·•\.\-_]+/g, '').trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    // 1. Fetch both platforms in parallel
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const neteaseApi = mod.default || mod

    const [neteaseR, itunesR] = await Promise.allSettled([
      neteaseApi.search({ keywords: q, type: 100, limit: 12 }),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=10&country=cn`),
    ])

    // Parse Netease → name → {avatar, albumSize}
    const neMap = new Map<string, { avatar: string; albumSize: number }>()
    if (neteaseR.status === 'fulfilled') {
      const list = (neteaseR.value as any)?.body?.result?.artists || []
      for (const a of list) {
        const key = norm(a.name)
        if (!neMap.has(key)) neMap.set(key, { avatar: a.picUrl || a.img1v1Url || '', albumSize: a.albumSize || 0 })
      }
    }

    // Parse iTunes → name → id
    const itList: { id: string; name: string }[] = []
    if (itunesR.status === 'fulfilled' && itunesR.value.ok) {
      const data: any = await itunesR.value.json()
      for (const a of data.results || []) {
        if (a.wrapperType !== 'artist') continue
        itList.push({ id: String(a.artistId), name: a.artistName })
      }
    }

    // 2. Cross-reference: match by normalized name
    const matched = itList.filter(it => neMap.has(norm(it.name)))
    if (!matched.length) return res.json([])

    // 3. Get song counts from iTunes in parallel
    const withCounts = await Promise.allSettled(matched.map(async (it) => {
      const ne = neMap.get(norm(it.name))!
      try {
        const r = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(it.name)}&entity=song&attribute=artistTerm&limit=1&country=cn`
        )
        if (!r.ok) return { ...it, avatar: ne.avatar, songCount: 0 }
        const d: any = await r.json()
        return { ...it, avatar: ne.avatar, songCount: d.resultCount || 0 }
      } catch {
        return { ...it, avatar: ne.avatar, songCount: ne.albumSize }
      }
    }))

    // 4. Filter and return
    const artists = withCounts
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((a: any) => a.songCount >= 8)
      .sort((a: any, b: any) => b.songCount - a.songCount)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        avatar: a.avatar,
        songCount: a.songCount,
        platform: 'apple',
      }))

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
