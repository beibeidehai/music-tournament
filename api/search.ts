import type { VercelRequest, VercelResponse } from '@vercel/node'

// Traditional → Simplified Chinese mapping for common characters
const T2S: Record<string, string> = {}
const _SRC = '愛爱夢梦淚泪戀恋樂乐過过時时給给說说話话誰谁讓让願愿憶忆離离开开關关轉转动动風风云云龍龙鳳凤個个們们這这對对會会來来沒没為为麼么樣样兒儿東东車车馬马飛飞華华錢钱長长門门間间頭头體体點点麗丽傳传兩两應应该该懷怀戰战歡欢現现發发當当見见覺觉認认語语請请謝謝變变買买賣賣錯错陽阳難难雙雙電电顏颜驚惊魚鱼鳥鸟黃黃齊齐紅红綠绿藍蓝詞词歲岁隨随節节舊舊實实聲声選选進进讀读寫写萬萬畫畫遠远帶帶從从殺杀亞亚園园際际軍军敗败備备準准導导權权縣县顯显驗验夠够幹干準准樹树護护衝冲優优獎奖傷伤勢势夠够熱热眾众衛卫视视戰战歷历擔担壓压態态團团勞劳勢势兒儿準准單单嚴严盡尽義义僅僅個個與与麽麽體体處处確确業业際际適适務务頭头專专極极管管結结構构標标夠够掛挂輕轻礎础層层變变獨独優优環环陽阳隨随壞坏極极數数機机顯显鹽盐絕绝線线維维練练養养雖虽觀观貴贵費费質质資资敵敌稱称種种積积縣县據据認认講講論论謀谋試试詢询證证養养騰腾臘腊臺台灣湾參参彙汇誌志鬆松範范夠够幹干鬥斗鬍胡鬧闹鬱郁籤签讚赞歷历鐘钟鐵铁銅铜銀银鍵键鍋锅鋒锋銷销閉闭長长門门閃闪間间隊队際际陽阳險险隨随靜静頁页須须風风馬马驗验魚鱼鳥鸟鹹咸黃黄點点黨党齊齐'
for (let i = 0; i < _SRC.length; i += 2) T2S[_SRC[i]] = _SRC[i + 1]

function toSimplified(s: string): string {
  return s.replace(/[一-鿿]/g, c => T2S[c] || c)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string
  if (!q) return res.status(400).json({ error: 'missing q' })

  try {
    const stores = ['cn', 'tw']
    const results = await Promise.allSettled(stores.map(st =>
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6&country=${st}`)
    ))

    const artists: any[] = []
    const seen = new Set<number>()
    for (const r of results) {
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

    res.json(artists)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'search failed' })
  }
}
