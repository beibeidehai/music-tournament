import type { VercelRequest, VercelResponse } from '@vercel/node'

// Traditional → Simplified Chinese mapping
const T2S: Record<string, string> = {}
const _SRC = '愛爱夢梦淚泪戀恋樂乐過过時时給给說说話话誰谁讓让願愿憶忆離离开开關關轉转动动風风云云龍龙鳳凤個个們们這这對对會会來来沒没為为麼么樣樣兒儿東东車车馬马飛飞華华錢钱長长門门間间頭头體体點点麗丽傳传兩两應应该该懷怀戰战歡欢現现發发當当見见覺觉認认語语請谢谢謝變变買买賣賣錯错陽阳難难雙雙電电顏颜驚惊魚鱼鳥鸟黃黃齊齐紅红綠绿藍蓝詞词歲岁隨随節节舊舊實实聲声選选進进讀读寫写萬萬畫畫遠远帶带從从殺杀亞亚園园際际軍军敗败備备準准導导權权縣县顯显驗验夠够幹干樹树護护衝冲優优獎奖傷伤勢势熱热眾众衛卫视视戰战歷历擔担壓压態态團团勞劳單单嚴严盡尽義义僅僅與与麽麽體体處处確确業业際际適适務务專专極极管管結结構构標标掛挂輕轻礎础層层變变獨独優优環环陽阳隨随壞坏數数機机顯显鹽盐絕绝線线維维練练養养雖虽觀观貴贵費费質质資资敵敌稱称種种積积縣县據据認认講讲論论謀谋試试詢询證证養养騰腾臘腊臺台灣湾參参彙汇誌志鬆松範范夠够幹干鬥斗鬍胡鬧闹鬱郁籤签讚赞歷历鐘钟鐵铁銅铜銀银鍵键鍋锅鋒锋銷销閉闭閃闪間间隊队際际陽阳險险靜静頁页須须風风馬马驗验魚鱼鳥鸟鹹咸黃黄點点黨党齊齐濕湿潤润幹干繫系範范築筑靈灵宮宫聖圣傑杰倫伦'
for (let i = 0; i < _SRC.length; i += 2) T2S[_SRC[i]] = _SRC[i + 1]

function toSimplified(s: string): string {
  return s.replace(/[一-鿿]/g, c => T2S[c] || c)
}

// Patterns to filter live versions, instrumentals, junk
const LIVE = [
  /\(.*(live|Live|LIVE|unplugged|Unplugged).*\)/,
  /\blive\s+(at|from|in|on|@)\b/i,
  /[-–—~]\s*live\b/i,
  /\blive\s*(version|ver\.?|session|edit|recording|album)\b/i,
  /\b(in concert|unplugged)\b/i,
  /(现场|現場|演唱会|演唱會|音乐会|音樂會|音乐节|音樂節|live版|巡回|巡迴|巡演|不插电|不插電|演奏会|演奏會)/i,
]
const JUNK = [
  /(\binstrumental\b|伴奏|卡拉OK|karaoke|off\s*vocal|纯音乐|純音樂|\bcommentary\b|\bvoice memo\b|Remix)/i,
]

function isLive(name: string, album: string): boolean {
  const s = `${name} ${album}`
  return LIVE.some(re => re.test(s))
}

function isJunk(name: string): boolean {
  return JUNK.some(re => re.test(name))
}

function cleanName(name: string): string {
  return name.replace(/\s*[(\[（【][^)\]）】]*[)\]）】]/g, ' ').replace(/\s+/g, ' ').trim() || name
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { name } = req.query as { id?: string; name?: string }
  if (!name) return res.status(400).json({ error: 'missing name' })

  try {
    const allSongs: any[] = []
    const seen = new Set<number>()

    // Search iTunes by artist name (cn + tw stores)
    for (const store of ['cn', 'tw']) {
      try {
        const url = `https://itunes.apple.com/search?entity=song&attribute=artistTerm&limit=200&country=${store}&term=${encodeURIComponent(name)}`
        const r = await fetch(url)
        if (!r.ok) continue
        const data: any = await r.json()
        for (const t of data.results || []) {
          if (t.wrapperType !== 'track' || !t.trackId || seen.has(t.trackId)) continue
          if (isLive(t.trackName, t.collectionName || '')) continue
          if (isJunk(t.trackName)) continue
          seen.add(t.trackId)
          allSongs.push({
            id: String(t.trackId),
            name: toSimplified(cleanName(t.trackName)),
            artist: toSimplified(t.artistName || ''),
            album: (t.collectionName || '').replace(/ - (Single|EP)$/i, ''),
            year: t.releaseDate ? t.releaseDate.slice(0, 4) : '',
            cover: (t.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
            platform: 'apple',
            playUrl: t.previewUrl || '',
          })
        }
      } catch { continue }
    }

    if (!allSongs.length) return res.json([])

    // Deduplicate by normalized name
    const deduped: any[] = []
    const seenNames = new Set<string>()
    for (const s of allSongs) {
      const key = s.name.toLowerCase().replace(/\s*[([（【][^)\]）】]*[)\]）】]/g, '').trim()
      if (seenNames.has(key)) continue
      seenNames.add(key)
      deduped.push(s)
    }

    res.json(deduped.slice(0, 100))
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get songs failed' })
  }
}
