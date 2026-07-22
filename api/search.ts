import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    const stores = ['cn', 'tw']
    const results = await Promise.allSettled(stores.map(st =>
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6&country=${st}`)
    ))

    const artists: any[] = []
    const seen = new Set<number>()
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value.ok) continue
      const data: any = await r.value.json()
      for (const a of data.results || []) {
        if (a.wrapperType !== 'artist' || seen.has(a.artistId)) continue
        seen.add(a.artistId)
        artists.push({
          id: String(a.artistId),
          name: a.artistName,
          avatar: '',
          songCount: 0,
          platform: 'apple',
        })
      }
    }

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
