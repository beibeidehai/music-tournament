import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, platform } = req.query as { id: string; platform: string }
  if (!id || !platform) return res.status(400).json({ error: 'missing params' })

  try {
    const listen1 = await import('listen1-api')
    const data = await listen1.bootstrapTrack(id, platform)
    res.json({ playUrl: data.url || '' })
  } catch (e) {
    res.status(500).json({ error: 'get play url failed' })
  }
}
