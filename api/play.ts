import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const { song_url } = await import('@neteasecloudmusicapienhanced/api')
    const result = await song_url({ id, br: 128000 })
    const url = result.body?.data?.[0]?.url || ''
    res.json({ playUrl: url })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get play url failed' })
  }
}
