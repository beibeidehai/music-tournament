import type { VercelRequest, VercelResponse } from '@vercel/node'

// Traditional → Simplified mapping (comprehensive for music/artist names)
const T2S: Record<string, string> = {}
const _SRC = '愛爱夢梦淚泪戀恋樂乐過过時时給给說说話话誰谁讓让願愿憶忆離离开开關關轉转动动風风云云龍龙鳳凤個个們们這这對对會会來来沒没為为麼么樣樣兒儿東东車车馬马飛飞華华錢钱長长門门間间頭头體体點点麗丽傳传兩两應应该该懷怀戰战歡欢現现發发當当見见覺觉認认語语請谢谢謝變变買买賣賣錯錯陽阳難难雙雙電电顏颜驚惊魚鱼鳥鸟黃黃齊齐紅红綠绿藍蓝詞词歲岁隨随節节舊舊實实聲声選选進进讀读寫写萬萬畫畫遠远帶带從从殺杀亞亚園园際际軍军敗败備备準准導导權权縣县顯显驗验幹干樹樹護护衝衝優优獎奖傷伤勢势熱热眾众衛卫视视戰战歷历擔担壓压態态團团勞劳單單嚴严盡尽義义僅僅與与麽麽體体處处確确業业際际適适務务專专極极管管結结構构標标掛挂輕轻礎础層层變变獨独優优環环隨随壞坏數数機机顯显鹽盐絕绝線线維维練练養养雖虽觀观貴贵費费質质資资敵敌稱称種种積积縣县據据認认講讲論论謀谋試试詢询證证養养騰騰臘腊臺台灣湾參参彙汇誌志鬆松範范鬥斗鬍胡鬧闹鬱郁籤签讚赞歷历鐘钟鐵铁銅铜銀银鍵键鍋锅鋒锋銷销閉闭閃闪隊队際际險险靜静頁页須须風风驗验魚鱼鹹咸黨党齊齐濕湿潤润繫系築筑靈灵宮宫聖圣傑杰倫伦張张陳陈鄧邓劉刘吳吴楊杨趙赵鄭郑許许孫孙聽听见见說说讓让貝贝車车門门馬马魚鱼鳥鸟麥麦羅罗蘇苏衛卫蔣蒋韓韩馮冯蕭萧葉叶盧卢鐘钟範范賈贾薛薛餘余潘潘杜杜戴戴夏夏姚姚石石譚谭廖廖鄒邹熊熊金金陸陆郝郝白白崔崔康康毛毛邱邱秦秦江江史史顧顾侯侯邵邵孟孟龍龙萬万段段雷雷錢钱湯汤尹尹黎黎易易常常武武喬乔賀贺賴赖龔龚文文'
for (let i = 0; i < _SRC.length; i += 2) T2S[_SRC[i]] = _SRC[i + 1]

function toSimplified(s: string): string {
  return s.replace(/[一-鿿]/g, c => T2S[c] || c)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    // 1. Search iTunes for clean artist list
    const stores = ['cn', 'tw']
    const itunesResults = await Promise.allSettled(stores.map(st =>
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6&country=${st}`)
    ))

    const artists: any[] = []
    const seen = new Set<number>()
    for (const r of itunesResults) {
      if (r.status !== 'fulfilled' || !r.value.ok) continue
      const data: any = await r.value.json()
      for (const a of data.results || []) {
        if (a.wrapperType !== 'artist' || seen.has(a.artistId)) continue
        seen.add(a.artistId)
        artists.push({
          id: String(a.artistId),
          name: toSimplified(a.artistName),
          avatar: '',
          songCount: 0,
          platform: 'apple',
        })
      }
    }

    // 2. For avatars, search Netease by name in parallel
    try {
      const neteaseMod = await import('@neteasecloudmusicapienhanced/api')
      const neteaseApi = neteaseMod.default || neteaseMod

      const avatarResults = await Promise.allSettled(
        artists.map(async (artist) => {
          try {
            const r: any = await neteaseApi.search({ keywords: artist.name, type: 100, limit: 3 })
            const neteaseArtists = r.body?.result?.artists || []
            // Match by simplified name
            const match = neteaseArtists.find((na: any) =>
              toSimplified(na.name) === artist.name
            )
            if (match?.picUrl) {
              artist.avatar = match.picUrl
            }
          } catch { /* ignore */ }
        })
      )
      await Promise.allSettled(avatarResults) // don't block on failures
    } catch { /* Netease not available, no avatars */ }

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
