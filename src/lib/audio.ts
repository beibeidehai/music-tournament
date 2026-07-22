let currentAudio: HTMLAudioElement | null = null
let currentSongId: string | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null

export function play(url: string, songId: string): HTMLAudioElement {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    if (timeoutId) clearTimeout(timeoutId)
  }

  const audio = new Audio(url)
  audio.volume = 1
  audio.play().catch(() => {})
  currentAudio = audio
  currentSongId = songId

  timeoutId = setTimeout(() => audio.pause(), 30000)

  return audio
}

export function stop() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  if (timeoutId) clearTimeout(timeoutId)
  currentAudio = null
  currentSongId = null
}

export function getCurrentSongId() {
  return currentSongId
}
