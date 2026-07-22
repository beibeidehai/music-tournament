import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod
    const result: any = await api.song_url({ id, br: 128000 })
    let url = result.body?.data?.[0]?.url || ''

    // Upgrade HTTP to HTTPS to avoid mixed-content blocking
    if (url && url.startsWith('http://')) {
      url = url.replace('http://', 'https://')
    }

    res.json({ playUrl: url })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get play url failed' })
  }
}
