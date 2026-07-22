import type { Singer, Song } from '../types'

const BASE = '/api'

export async function searchSinger(q: string): Promise<Singer[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('搜索失败')
  return res.json()
}

export async function getSongs(singerId: string, platform: string): Promise<Song[]> {
  const res = await fetch(`${BASE}/songs?id=${encodeURIComponent(singerId)}&platform=${encodeURIComponent(platform)}`)
  if (!res.ok) throw new Error('获取歌曲失败')
  return res.json()
}

export async function getPlayUrl(songId: string, platform: string): Promise<string> {
  const res = await fetch(`${BASE}/play?id=${encodeURIComponent(songId)}&platform=${encodeURIComponent(platform)}`)
  if (!res.ok) throw new Error('获取播放地址失败')
  const data = await res.json()
  return data.playUrl
}
