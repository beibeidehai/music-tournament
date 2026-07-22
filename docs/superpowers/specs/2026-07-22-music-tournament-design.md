# 音乐淘汰赛 — 设计文档

## 概述

一个网页应用：搜索歌手 → 随机抽取歌曲两两对决 → 64强逐轮淘汰选出冠军 → 结果页展示完整对阵树，可导出为长图。

## 页面

### 1. 首页 `/`
- 搜索框输入歌手名 → 下拉显示匹配结果（头像+名字+歌曲数）
- 选择歌手 → 展示歌手信息 + 赛制说明 → "开始淘汰赛"按钮
- 简单，无多余内容

### 2. 游戏页 `/game?singer=<id>`
- 进度条（当前轮次 + 第几组）
- 左右两张歌曲卡片（封面、歌名、专辑、年份）
- 每首歌可播放30s试听（暂停另一个）
- 64进32轮：可选 A / B / 双选 / 双不选
- 32进16及之后：强制单选 A / B
- 64进32全部结束后，若歌曲数 ≠ 32：
  - 大于32 → 弹出大名单让用户勾选踢掉
  - 小于32 → 弹出淘汰池让用户勾选复活
- 记录每组决策耗时
- 所有轮次完成后 → 跳转结果页

### 3. 结果页 `/result?singer=<id>`
- 交互式对阵树：可展开/折叠每轮
- 点击任意对决卡片查看详情（两首歌 + 选了谁 + 决策耗时）
- "导出图片"按钮 → html2canvas 生成 PNG 长图
- 长图右下角带本网站二维码
- 导出图片中不含时间戳，不含"逆转/碾压"等主观标签

## 数据模型

```ts
type Singer = { id: string; name: string; avatar: string; songCount: number }

type Song = {
  id: string; name: string; artist: string; album: string
  year: number; cover: string; playUrl: string; platform: string
}

type Choice = 'a' | 'b' | 'both' | 'neither' | null

type Match = {
  songA: Song; songB: Song
  choice: Choice
  decisionMs: number
}

type Round = {
  name: string       // "64进32" | "32进16" | ...
  matches: Match[]
}

type GameState = {
  singer: Singer
  songs: Song[]            // 原始歌曲池
  rounds: Round[]
  currentRound: number
  currentMatch: number
  stage: 'playing' | 'trimming' | 'reviving' | 'finished'
}
```

状态管理：zustand + localStorage 持久化（刷新不丢，不登录）。

## 赛制缩放

| 歌曲数范围 | 抽取数 | 赛制 |
|-----------|--------|------|
| ≥64 | 64 | 64→32→16→8→4→2→1 |
| 32-63 | 32 | 32→16→8→4→2→1 |
| 16-31 | 16 | 16→8→4→2→1 |
| 8-15 | 8 | 8→4→2→1 |
| <8 | — | 提示换歌手 |

抽取策略：随机洗牌取前N首（非纯热度排序，保证每次玩有新鲜感）。

## API（Vercel Serverless Functions）

### `GET /api/search?q=<关键词>`
搜索歌手，返回 `Singer[]`。聚合网易云+QQ+酷狗+酷我+B站。

### `GET /api/songs?id=<歌手ID>&platform=<平台>`
获取歌手全部歌曲，去重后按平台热度排序，返回 `Song[]`（不含 playUrl）。

### `GET /api/play?id=<歌曲ID>&platform=<平台>`
获取单曲30s试听URL，返回 `{ playUrl: string }`。

底层：listen1-api (Node.js) 对接各音乐平台内网 API。

## 技术栈

- Vite + React + TypeScript
- React Router v6（3个路由）
- zustand（状态管理 + localStorage 持久化）
- html2canvas（导出长图）
- qrcode（生成网站二维码）
- listen1-api（服务端音乐平台聚合）

部署：Vercel（静态资源 + serverless functions）。

## 关键交互细节

- 同一时间只有一首歌在播放，点击A的播放自动暂停B
- 30s到自动停止，可重播
- 选完后自动跳到下一组（1s延迟，让用户感知到选择生效）
- 每页都有"返回首页"入口
- loading 态：搜索歌手时骨架屏，加载歌曲时进度条
- error 态：API 挂了提示重试，不要白屏
