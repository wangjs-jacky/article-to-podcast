import React from 'react'
import { useFadeIn } from '../../../animations'
import type { HighlightSlide as HighlightSlideType } from '../../../types'
import { useTheme } from '../ThemeContext'
import { SlideLayout } from './SlideLayout'

export const HighlightSlide: React.FC<{ slide: HighlightSlideType }> = ({ slide }) => {
  const theme = useTheme()
  const slideTheme = theme.slideThemes.highlight

  const titleOpacity = useFadeIn(0, 20)
  const quoteOpacity = useFadeIn(15, 30)
  const bodyOpacity = useFadeIn(35, 20)
  const decorOpacity = useFadeIn(5, 20)

  const caption = slide.quote

  return (
    <SlideLayout caption={caption} accentColor={slideTheme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${theme.layout.paddingV}px ${theme.layout.paddingH + 60}px`,
        position: 'relative',
        textAlign: 'center',
      }}>
        <div style={{
          opacity: titleOpacity,
          marginBottom: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ display: 'inline-block', width: 30, height: 1, background: slideTheme.accent }} />
          <span style={{
            fontSize: 24,
            color: slideTheme.accent,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
          }}>
            {slide.title}
          </span>
          <span style={{ display: 'inline-block', width: 30, height: 1, background: slideTheme.accent }} />
        </div>

        <div style={{
          position: 'absolute',
          top: theme.layout.paddingV - 20,
          left: theme.layout.paddingH + 20,
          fontSize: 200,
          lineHeight: 1,
          color: slideTheme.accentDim,
          fontFamily: 'Georgia, serif',
          opacity: decorOpacity,
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
        }}>
          "
        </div>

        <div style={{
          opacity: quoteOpacity,
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          border: `1px solid ${slideTheme.accentBorder}`,
          padding: '48px 64px',
          position: 'relative',
          maxWidth: '100%',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 48,
            right: 48,
            height: 2,
            background: `linear-gradient(90deg, ${slideTheme.accent} 0%, transparent 100%)`,
            borderRadius: '0 0 2px 2px',
          }} />

          <blockquote style={{
            fontSize: 64,
            fontWeight: 700,
            color: theme.colors.text,
            margin: 0,
            lineHeight: 1.45,
            letterSpacing: '-0.01em',
          }}>
            {slide.quote}
          </blockquote>
        </div>

        {slide.body && (
          <p style={{
            fontSize: 32,
            color: theme.colors.textMuted,
            marginTop: 40,
            opacity: bodyOpacity,
            lineHeight: 1.6,
            letterSpacing: '0.02em',
          }}>
            {slide.body}
          </p>
        )}
      </div>
    </SlideLayout>
  )
}
