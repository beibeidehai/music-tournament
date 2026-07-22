import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const { default: api } = await import('@neteasecloudmusicapienhanced/api')
    const allSongs: any[] = []
    for (let offset = 0; offset < 200; offset += 100) {
      const result = await api.artist_songs({ id, limit: 100, offset, order: 'hot' })
      const songs = result.body?.songs || []
      if (songs.length === 0) break
      allSongs.push(...songs)
    }

    const mapped = allSongs.map((s: any) => ({
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
