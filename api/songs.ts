import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, name } = req.query as { id: string; name?: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const stores = ['cn', 'tw']
    const allSongs: any[] = []
    const seen = new Set<number>()

    for (const store of stores) {
      const urls = [
        name
          ? `https://itunes.apple.com/search?entity=song&attribute=artistTerm&limit=200&country=${store}&term=${encodeURIComponent(name)}`
          : null,
        `https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200&country=${store}`,
      ].filter(Boolean) as string[]

      const results = await Promise.allSettled(urls.map(u => fetch(u)))
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value.ok) continue
        const data: any = await r.value.json()
        for (const t of data.results || []) {
          if (t.wrapperType !== 'track' || t.kind !== 'song' || !t.trackId || seen.has(t.trackId)) continue
          seen.add(t.trackId)
          allSongs.push({
            id: String(t.trackId),
            name: t.trackName,
            artist: t.artistName || '',
            album: t.collectionName || '',
            year: t.releaseDate ? t.releaseDate.slice(0, 4) : '',
            cover: (t.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
            platform: 'apple',
            playUrl: t.previewUrl || '',
          })
        }
      }
    }

    if (!allSongs.length) return res.json([])

    // Deduplicate by normalized track name
    const deduped: any[] = []
    const seenNames = new Set<string>()
    for (const s of allSongs) {
      const key = s.name.toLowerCase().replace(/\s*[([（【][^)\]）】]*[)\]）】]/g, '').trim()
      if (seenNames.has(key)) continue
      seenNames.add(key)
      deduped.push(s)
    }

    res.json(deduped)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get songs failed' })
  }
}
