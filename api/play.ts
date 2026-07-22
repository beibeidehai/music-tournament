import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod

    // Try multiple quality levels — some songs only have lower bitrate
    let url = ''
    for (const br of [128000, 320000, 999000]) {
      const result: any = await api.song_url({ id: Number(id) || id, br })
      const data = result.body?.data
      const candidate = Array.isArray(data) ? data[0]?.url : data?.url
      if (candidate) { url = candidate; break }
    }

    // Upgrade HTTP to HTTPS to avoid mixed-content blocking
    if (url && url.startsWith('http://')) {
      url = url.replace('http://', 'https://')
    }

    res.json({ playUrl: url })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get play url failed' })
  }
}
