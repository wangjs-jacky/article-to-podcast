import React from 'react'
import { useFadeIn } from '../../../animations'
import type { Card, CardsSlide as CardsSlideType } from '../../../types'
import { useTheme } from '../ThemeContext'
import { SlideLayout } from './SlideLayout'

const CARD_ACCENT_COLORS = [
  { accent: '#00ff88', dim: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.3)' },
  { accent: '#00d4ff', dim: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.3)' },
  { accent: '#ffb800', dim: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)' },
  { accent: '#c77dff', dim: 'rgba(199,125,255,0.12)', border: 'rgba(199,125,255,0.3)' },
  { accent: '#ff4757', dim: 'rgba(255,71,87,0.12)', border: 'rgba(255,71,87,0.3)' },
]

const CardItem: React.FC<{ card: Card; index: number; totalCards: number; textMutedColor: string }> = ({
  card,
  index,
  totalCards,
  textMutedColor,
}) => {
  const opacity = useFadeIn(index * 12, 20)
  const cardColors = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length]
  const minWidth = totalCards <= 3 ? 280 : totalCards <= 4 ? 260 : 220

  return (
    <div style={{
      minWidth,
      flex: '1 1 0',
      maxWidth: 340,
      padding: '32px 28px',
      borderRadius: 16,
      border: `1px solid ${cardColors.border}`,
      background: cardColors.dim,
      opacity,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: cardColors.accent,
        boxShadow: `0 0 8px ${cardColors.accent}`,
      }} />

      <div style={{
        fontSize: 52,
        lineHeight: 1,
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))',
      }}>
        {card.icon}
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 600,
        color: cardColors.accent,
        lineHeight: 1.3,
        letterSpacing: '0.01em',
      }}>
        {card.label}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      <div style={{
        fontSize: 22,
        color: textMutedColor,
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      }}>
        {card.desc}
      </div>
    </div>
  )
}

export const CardsSlide: React.FC<{ slide: CardsSlideType }> = ({ slide }) => {
  const theme = useTheme()
  const slideTheme = theme.slideThemes.cards
  const titleOpacity = useFadeIn(0, 30)
  const caption = slide.title

  return (
    <SlideLayout caption={caption} accentColor={slideTheme.accent}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${theme.layout.paddingV}px ${theme.layout.paddingH}px`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 44,
          opacity: titleOpacity,
        }}>
          <div style={{
            width: 6,
            height: 52,
            background: slideTheme.accent,
            borderRadius: 3,
            flexShrink: 0,
            boxShadow: `0 0 12px ${slideTheme.accent}`,
          }} />
          <h2 style={{
            fontSize: 60,
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
          gap: 28,
          justifyContent: slide.cards.length <= 3 ? 'center' : 'flex-start',
          flexWrap: 'wrap' as const,
          flex: 1,
          alignContent: 'flex-start',
        }}>
          {slide.cards.map((card, i) => (
            <CardItem key={i} card={card} index={i} totalCards={slide.cards.length} textMutedColor={theme.colors.textMuted} />
          ))}
        </div>
      </div>
    </SlideLayout>
  )
}
