import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod
    if (typeof api.search !== 'function') {
      return res.status(500).json({ error: 'search not a function', keys: Object.keys(api).slice(0, 5) })
    }
    const result = await api.search({ keywords: q, type: 100, limit: 8 })
    const artists = (result.body?.result?.artists || []).map((a: any) => ({
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
