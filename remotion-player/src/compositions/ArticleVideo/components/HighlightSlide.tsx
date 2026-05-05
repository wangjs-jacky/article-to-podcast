import React from 'react'
import { useFadeIn } from '../../../animations.js'
import type { HighlightSlide as HighlightSlideType } from '../../../types.js'

export const HighlightSlide: React.FC<{ slide: HighlightSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 20)
  const quoteOpacity = useFadeIn(15, 30)
  const bodyOpacity = useFadeIn(35, 20)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 160px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
      textAlign: 'center',
    }}>
      <h3 style={{ fontSize: 52, color: '#f97316', opacity: titleOpacity, marginBottom: 48 }}>
        {slide.title}
      </h3>
      <blockquote style={{
        fontSize: 64, fontWeight: 700, color: '#1a1a2e',
        opacity: quoteOpacity, margin: 0, lineHeight: 1.4,
        borderLeft: '6px solid #f97316', paddingLeft: 40, textAlign: 'left',
      }}>
        {slide.quote}
      </blockquote>
      {slide.body && (
        <p style={{ fontSize: 40, color: '#6b7280', marginTop: 48, opacity: bodyOpacity }}>
          {slide.body}
        </p>
      )}
    </div>
  )
}
