import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, platform } = req.query as { id: string; platform: string }
  if (!id || !platform) return res.status(400).json({ error: 'missing params' })

  try {
    const listen1 = await import('listen1-api')
    const data = await listen1.getArtistSongs(id, platform)
    const songs = (data.songs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      artist: s.artist || '',
      album: s.album || '',
      year: s.year || 0,
      cover: s.cover || '',
      platform,
    }))
    res.json(songs)
  } catch (e) {
    res.status(500).json({ error: 'get songs failed' })
  }
}
