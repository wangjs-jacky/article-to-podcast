import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations'
import type { ContentSlide as ContentSlideType } from '../../../types'

const ContentPoint: React.FC<{ point: string; index: number }> = ({ point, index }) => {
  const { opacity, translateX } = useSlideInLeft(index * 15)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      opacity, transform: `translateX(${translateX}px)`,
    }}>
      <span style={{ color: '#007bff', fontSize: 40, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 40, color: '#1f2937' }}>{point}</span>
    </div>
  )
}

export const ContentSlide: React.FC<{ slide: ContentSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 30)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '80px 120px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h2 style={{
        fontSize: 72, fontWeight: 700, color: '#1e40af',
        opacity: titleOpacity, marginBottom: 60,
      }}>
        {slide.title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {slide.points.map((point, i) => (
          <ContentPoint key={i} point={point} index={i} />
        ))}
      </div>
    </div>
  )
}
