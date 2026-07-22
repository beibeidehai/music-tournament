import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod

    if (typeof api.search !== 'function') {
      return res.status(500).json({ error: 'search not available' })
    }

    const result: any = await api.search({ keywords: q, type: 100, limit: 12 })
    const raw = result.body?.result?.artists || []

    const artists = raw
      .filter((a: any) => (a.albumSize || 0) >= 8)
      .map((a: any) => ({
        id: String(a.id),
        name: a.name,
        avatar: a.picUrl || a.img1v1Url || '',
        songCount: a.albumSize || 0,
        platform: 'netease',
      }))

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
