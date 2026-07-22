import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod
    const allSongs: any[] = []
    for (let offset = 0; offset < 200; offset += 100) {
      const result: any = await api.artist_songs({ id, limit: 100, offset, order: 'hot' as any })
      const songs: any[] = result.body?.songs || []
      if (songs.length === 0) break
      allSongs.push(...songs)
    }

    // 去重：同名歌曲只保留第一个（通常是热度最高的版本）
    const seen = new Set<string>()
    const deduped = allSongs.filter((s: any) => {
      const key = s.name?.trim()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    const mapped = deduped.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      artist: s.ar?.map((a: any) => a.name).join('/') || '',
      album: s.al?.name || '',
      year: s.publishTime ? new Date(s.publishTime).getFullYear() : 0,
      cover: s.al?.picUrl || '',
      platform: 'netease',
    }))

    res.json(mapped)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get songs failed' })
  }
}
