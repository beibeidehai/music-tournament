let currentAudio: HTMLAudioElement | null = null
let currentSongId: string | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null
let onError: ((songId: string) => void) | null = null

export function setOnError(fn: (songId: string) => void) { onError = fn }

export function play(url: string, songId: string): HTMLAudioElement {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    if (timeoutId) clearTimeout(timeoutId)
  }

  const audio = new Audio(url)
  const promise = audio.play()
  if (promise) {
    promise.catch(() => {
      if (onError) onError(songId)
    })
  }
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
