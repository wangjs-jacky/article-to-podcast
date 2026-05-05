import React from 'react'
import { useFadeIn } from '../../../animations'
import type { Card, CardsSlide as CardsSlideType } from '../../../types'

const CARD_COLORS = [
  { bg: 'rgba(240,248,255,0.8)', border: 'rgba(100,150,200,0.4)' },
  { bg: 'rgba(245,240,255,0.8)', border: 'rgba(150,100,200,0.4)' },
  { bg: 'rgba(240,255,240,0.8)', border: 'rgba(100,200,100,0.4)' },
  { bg: 'rgba(255,245,230,0.8)', border: 'rgba(200,150,100,0.4)' },
  { bg: 'rgba(230,255,240,0.8)', border: 'rgba(100,200,150,0.4)' },
]

const CardItem: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
  const opacity = useFadeIn(index * 12, 20)
  const color = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div style={{
      width: 300, padding: 28, borderRadius: 8,
      border: `1px solid ${color.border}`, background: color.bg,
      opacity, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <span style={{ fontSize: 48 }}>{card.icon}</span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937' }}>{card.label}</div>
        <div style={{ fontSize: 22, color: '#6b7280', marginTop: 8 }}>{card.desc}</div>
      </div>
    </div>
  )
}

export const CardsSlide: React.FC<{ slide: CardsSlideType }> = ({ slide }) => {
  const titleOpacity = useFadeIn(0, 30)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px',
      background: '#ffffff',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      <h2 style={{
        fontSize: 72, fontWeight: 700, color: '#1e40af',
        opacity: titleOpacity, marginBottom: 60,
      }}>
        {slide.title}
      </h2>
      <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
        {slide.cards.map((card, i) => (
          <CardItem key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  )
}
