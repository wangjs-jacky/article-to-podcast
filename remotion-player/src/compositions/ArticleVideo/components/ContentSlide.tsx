import React from 'react'
import { useFadeIn, useSlideInLeft } from '../../../animations'
import type { ContentSlide as ContentSlideType } from '../../../types'
import { useTheme } from '../ThemeContext'
import { SlideLayout } from './SlideLayout'

const ContentPoint: React.FC<{ point: string; index: number; accentColor: string; textColor: string }> = ({
  point,
  index,
  accentColor,
  textColor,
}) => {
  const { opacity, translateX } = useSlideInLeft(index * 15)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 24,
      opacity,
      transform: `translateX(${translateX}px)`,
      padding: '20px 28px',
      background: 'rgba(255, 255, 255, 0.04)',
      borderRadius: 12,
      border: `1px solid rgba(255, 255, 255, 0.07)`,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `rgba(${hexAccentToRgb(accentColor)}, 0.15)`,
        border: `1px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 20,
        fontWeight: 700,
        color: accentColor,
        marginTop: 2,
      }}>
        {index + 1}
      </div>

      <span style={{
        fontSize: 34,
        color: textColor,
        lineHeight: 1.55,
        letterSpacing: '0.01em',
      }}>
        {point}
      </span>
    </div>
  )
}

export const ContentSlide: React.FC<{ slide: ContentSlideType }> = ({ slide }) => {
  const theme = useTheme()
  const slideTheme = theme.slideThemes.content
  const titleOpacity = useFadeIn(0, 30)

  const caption = slide.points[0] ?? slide.title

  return (
    <SlideLayout caption={caption} accentColor={slideTheme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${theme.layout.paddingV}px ${theme.layout.paddingH}px`,
        gap: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 48,
          opacity: titleOpacity,
        }}>
          <div style={{
            width: 6,
            height: 56,
            background: slideTheme.accent,
            borderRadius: 3,
            flexShrink: 0,
            boxShadow: `0 0 12px ${slideTheme.accent}`,
          }} />
          <h2 style={{
            fontSize: 64,
            fontWeight: 700,
            color: theme.colors.text,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            {slide.title}
          </h2>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          flex: 1,
        }}>
          {slide.points.map((point, i) => (
            <ContentPoint
              key={i}
              point={point}
              index={i}
              accentColor={slideTheme.accent}
              textColor={theme.colors.text}
            />
          ))}
        </div>
      </div>
    </SlideLayout>
  )
}

function hexAccentToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '0,212,255'
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}
