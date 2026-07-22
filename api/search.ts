import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    // 动态导入 listen1-api（部署时 Vercel 会安装此依赖）
    const listen1 = await import('listen1-api')
    const results = await listen1.search(q, ['netease', 'qq', 'kugou', 'kuwo', 'bilibili'])
    const singers = results
      .filter((r: any) => r.type === 'artist')
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar || '',
        songCount: r.song_count || 0,
        platform: r.platform,
      }))
    res.json(singers)
  } catch (e) {
    res.status(500).json({ error: 'search failed' })
  }
}
