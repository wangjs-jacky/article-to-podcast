import React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

type Variant = 'fade-up' | 'slide-right' | 'zoom' | 'blur-in'

interface Props {
  variant?: Variant
  durationFrames?: number
  children: React.ReactNode
}

export const SlideTransition: React.FC<Props> = ({
  variant = 'fade-up',
  durationFrames = 14,
  children,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = Math.max(0, Math.min(1, frame / durationFrames))
  const ease = 1 - Math.pow(1 - t, 3)

  const opacity = ease
  let transform = ''
  let filter: string | undefined

  switch (variant) {
    case 'fade-up':
      transform = `translateY(${(1 - ease) * 40}px)`
      break
    case 'slide-right':
      transform = `translateX(${(1 - ease) * 80}px)`
      break
    case 'zoom':
      transform = `scale(${0.94 + 0.06 * ease})`
      break
    case 'blur-in':
      transform = `scale(${0.98 + 0.02 * ease})`
      filter = `blur(${(1 - ease) * 8}px)`
      break
  }

  void fps

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity,
        transform,
        filter,
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </div>
  )
}

export function variantForSlide(index: number): Variant {
  const cycle: Variant[] = ['fade-up', 'slide-right', 'zoom', 'blur-in']
  return cycle[index % cycle.length]
}

void interpolate
