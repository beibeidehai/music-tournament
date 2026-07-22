import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const mod = await import('@neteasecloudmusicapienhanced/api')
    const api = mod.default || mod

    let url = ''
    for (const br of [128000, 320000, 999000]) {
      const result: any = await api.song_url({ id: Number(id) || id, br })
      const data = result.body?.data
      const candidate = Array.isArray(data) ? data[0]?.url : data?.url
      if (candidate) { url = candidate; break }
    }

    if (!url) return res.status(404).json({ error: 'no play url' })

    // Proxy audio from Netease (HTTP) → client (HTTPS via Vercel)
    const audioRes = await fetch(url)
    if (!audioRes.ok) return res.status(502).json({ error: 'upstream fetch failed' })

    const buffer = Buffer.from(await audioRes.arrayBuffer())
    res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buffer)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'proxy failed' })
  }
}
