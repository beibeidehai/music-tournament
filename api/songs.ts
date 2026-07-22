import type { VercelRequest, VercelResponse } from '@vercel/node'

// Traditional → Simplified mapping
const T2S: Record<string, string> = {}
const _SRC = '愛爱夢梦淚泪戀恋樂乐過过時时給给說说話话誰谁讓让願愿憶忆離离开开關關轉转动动風风云云龍龙鳳凤個个們们這这對对會会來来沒没為为麼么樣樣兒儿東东車车馬马飛飞華华錢钱長长門门間间頭头體体點点麗丽傳传兩两應应该该懷怀戰战歡欢現现發发當当見见覺觉認认語语請谢谢謝變变買买賣賣錯錯陽阳難难雙雙電电顏颜驚惊魚鱼鳥鸟黃黃齊齐紅红綠绿藍蓝詞词歲岁隨随節节舊舊實实聲声選选進进讀读寫写萬萬畫畫遠远帶带從从殺杀亞亚園园際际軍军敗败備备準准導导權权縣县顯显驗验幹干樹树護护衝冲優优獎奖傷伤勢势熱热眾众衛卫视视戰战歷历擔担壓压態态團团勞劳單單嚴严盡尽義义僅僅與与麽麽體体處处確确業业際际適适務务專专極极管管結结構构標标掛挂輕轻礎础層层變变獨独優优環环陽阳隨随壞坏數数機机顯显鹽盐絕绝線线維维練练養养雖虽觀观貴贵費费質质資资敵敌稱称種种積积縣县據据認认講讲論论謀谋試试詢询證证養养騰腾臘腊臺台灣湾參参彙汇誌志鬆松範范鬥斗鬍胡鬧闹鬱郁籤签讚赞歷历鐘钟鐵铁銅铜銀银鍵键鍋锅鋒锋銷销閉闭閃闪隊队際际險险靜静頁页須须風风驗验魚鱼鹹咸黨党齊齐濕湿潤润繫系築筑靈灵宮宫聖圣傑杰倫伦張张陳陈鄧邓劉刘吳吴楊杨趙赵鄭郑許许孫孙聽听见见說说讓让貝贝車车門门馬马魚鱼鳥鸟麥麦羅罗蘇苏衛卫蔣蒋韓韩馮冯蕭萧葉叶盧卢鐘钟範范賈贾薛薛餘余潘潘杜杜戴戴夏夏姚姚石石譚谭廖廖鄒邹熊熊陸陆郝郝白白崔崔康康毛毛邱邱秦秦江江史史顧顾侯侯邵邵孟孟龍龙萬万段段雷雷錢钱湯汤尹尹黎黎易易常常武武喬乔賀贺賴赖龔龚溫温盧卢曾曾蕭萧'
for (let i = 0; i < _SRC.length; i += 2) T2S[_SRC[i]] = _SRC[i + 1]

function toSimplified(s: string): string {
  return s.replace(/[一-鿿]/g, c => T2S[c] || c)
}

// Live / junk filters (from musiccup.app)
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
  return LIVE.some(re => re.test(`${name} ${album}`))
}

function cleanName(name: string): string {
  return name.replace(/\s*[(\[（【][^)\]）】]*[)\]）】]/g, ' ').replace(/\s+/g, ' ').trim() || name
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, name } = req.query as { id?: string; name?: string }
  if (!name && !id) return res.status(400).json({ error: 'missing name or id' })

  try {
    const allSongs: any[] = []
    const seen = new Set<number>()

    for (const store of ['cn', 'tw']) {
      // Lookup by ID (more targeted)
      if (id) {
        try {
          const r = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200&country=${store}`)
          if (r.ok) {
            const data: any = await r.json()
            for (const t of data.results || []) {
              if (t.wrapperType !== 'track' || !t.trackId || seen.has(t.trackId)) continue
              if (isLive(t.trackName, t.collectionName || '')) continue
              if (JUNK.some(re => re.test(t.trackName))) continue
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
          }
        } catch { /* continue */ }
      }

      // Search by name (wider coverage)
      if (name) {
        try {
          const r = await fetch(`https://itunes.apple.com/search?entity=song&attribute=artistTerm&limit=200&country=${store}&term=${encodeURIComponent(name)}`)
          if (r.ok) {
            const data: any = await r.json()
            for (const t of data.results || []) {
              if (t.wrapperType !== 'track' || !t.trackId || seen.has(t.trackId)) continue
              if (isLive(t.trackName, t.collectionName || '')) continue
              if (JUNK.some(re => re.test(t.trackName))) continue
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
          }
        } catch { /* continue */ }
      }
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

    // iTunes returns by popularity — cap at 100
    res.json(deduped.slice(0, 100))
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'get songs failed' })
  }
}
