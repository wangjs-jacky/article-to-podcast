import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

export function useFadeIn(delayFrames = 0, durationFrames = 20) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 15 },
    durationInFrames: durationFrames,
  })
}

export function useSlideInLeft(delayFrames = 0) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 15 },
    durationInFrames: 20,
  })
  return { opacity: progress, translateX: (1 - progress) * -50 }
}
