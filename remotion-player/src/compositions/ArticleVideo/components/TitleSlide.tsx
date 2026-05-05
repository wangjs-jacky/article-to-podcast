import React from 'react'
import { useFadeIn } from '../../../animations'
import type { TitleSlide as TitleSlideType } from '../../../types'

export const TitleSlide: React.FC<{ slide: TitleSlideType }> = ({ slide }) => {
  const opacity = useFadeIn(0, 30)
  const scale = 1.05 - 0.05 * opacity

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h1 style={{
        fontSize: 96, fontWeight: 700, color: '#1a1a2e',
        opacity, transform: `scale(${scale})`,
        margin: 0, textAlign: 'center',
      }}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p style={{
          fontSize: 48, color: '#6b7280', marginTop: 32,
          opacity: useFadeIn(20, 20),
        }}>
          {slide.subtitle}
        </p>
      )}
    </div>
  )
}
