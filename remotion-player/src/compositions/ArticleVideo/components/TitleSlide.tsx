import React from 'react'
import { useFadeIn } from '../../../animations'
import type { TitleSlide as TitleSlideType } from '../../../types'
import { useTheme } from '../ThemeContext'
import { SlideLayout } from './SlideLayout'

export const TitleSlide: React.FC<{ slide: TitleSlideType }> = ({ slide }) => {
  const theme = useTheme()
  const slideTheme = theme.slideThemes.title

  const titleOpacity = useFadeIn(0, 30)
  const titleScale = 1.04 - 0.04 * titleOpacity
  const subtitleOpacity = useFadeIn(20, 25)
  const decorLineOpacity = useFadeIn(10, 20)

  const caption = slide.subtitle ?? slide.title

  return (
    <SlideLayout caption={caption} accentColor={slideTheme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${theme.layout.paddingV}px ${theme.layout.paddingH}px`,
        position: 'relative',
      }}>
        <div style={{
          fontSize: 20,
          color: slideTheme.accent,
          letterSpacing: '0.25em',
          textTransform: 'uppercase' as const,
          fontWeight: 500,
          opacity: decorLineOpacity,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ display: 'inline-block', width: 40, height: 1, background: slideTheme.accent }} />
          PODCAST
          <span style={{ display: 'inline-block', width: 40, height: 1, background: slideTheme.accent }} />
        </div>

        <h1 style={{
          fontSize: 88,
          fontWeight: 700,
          color: theme.colors.text,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>
          {slide.title}
        </h1>

        <div style={{
          width: 80,
          height: 3,
          background: slideTheme.accent,
          marginTop: 40,
          marginBottom: 32,
          opacity: decorLineOpacity,
          borderRadius: 2,
          boxShadow: `0 0 10px ${slideTheme.accent}`,
        }} />

        {slide.subtitle && (
          <p style={{
            fontSize: 40,
            color: theme.colors.textMuted,
            opacity: subtitleOpacity,
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.02em',
            lineHeight: 1.5,
          }}>
            {slide.subtitle}
          </p>
        )}

        <div style={{
          position: 'absolute',
          bottom: -20,
          right: theme.layout.paddingH - 40,
          fontSize: 280,
          fontWeight: 900,
          color: 'rgba(0, 255, 136, 0.03)',
          lineHeight: 1,
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
          letterSpacing: '-0.05em',
        }}>
          AI
        </div>
      </div>
    </SlideLayout>
  )
}
