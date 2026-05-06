import React from 'react'
import { useTheme } from '../ThemeContext'

interface SlideLayoutProps {
  caption?: string
  showDecoratorBar?: boolean
  showCaption?: boolean
  gradientAngle?: number
  accentColor?: string
  children: React.ReactNode
}

export const SlideLayout: React.FC<SlideLayoutProps> = ({
  caption,
  showDecoratorBar = true,
  showCaption = true,
  gradientAngle = 135,
  accentColor = 'transparent',
  children,
}) => {
  const theme = useTheme()
  const { colors, decoratorBarColors, fontFamily, layout } = theme

  const bgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: `
      radial-gradient(ellipse at 20% 80%, rgba(${hexToRgb(accentColor)}, 0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(${hexToRgb(accentColor)}, 0.05) 0%, transparent 55%),
      linear-gradient(${gradientAngle}deg, ${colors.bg} 0%, ${colors.bgElevated} 50%, #0f0f12 100%)
    `,
    fontFamily,
    overflow: 'hidden',
  }

  return (
    <div style={bgStyle}>
      {showDecoratorBar && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: layout.decoratorHeight,
          display: 'flex',
          zIndex: 10,
        }}>
          {decoratorBarColors.map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          ))}
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: showDecoratorBar ? layout.decoratorHeight : 0,
        left: 0,
        right: 0,
        bottom: showCaption && caption ? layout.captionHeight : 0,
        overflow: 'hidden',
      }}>
        {children}
      </div>

      {showCaption && caption && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: layout.captionHeight,
          background: 'rgba(0, 0, 0, 0.75)',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: layout.paddingH,
          paddingRight: layout.paddingH,
          zIndex: 10,
        }}>
          <div style={{
            width: 3,
            height: 28,
            background: accentColor !== 'transparent' ? accentColor : colors.neonGreen,
            marginRight: 20,
            borderRadius: 2,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 22,
            color: colors.text,
            lineHeight: 1.5,
            letterSpacing: '0.02em',
            opacity: 0.9,
          }}>
            {caption}
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
    </div>
  )
}

function hexToRgb(hex: string): string {
  if (!hex || hex === 'transparent') return '255,255,255'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '255,255,255'
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}
