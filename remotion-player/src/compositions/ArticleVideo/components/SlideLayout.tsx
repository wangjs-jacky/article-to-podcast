import React from 'react'
import { colors, decoratorBarColors, fontFamily, layout } from '../theme'

interface SlideLayoutProps {
  /** 当前 slide 的字幕文字（显示在底部字幕条） */
  caption?: string
  /** 是否显示顶部4色装饰条（默认显示） */
  showDecoratorBar?: boolean
  /** 是否显示底部字幕条（默认显示） */
  showCaption?: boolean
  /** 背景渐变方向，默认从左下到右上 */
  gradientAngle?: number
  /** 整体主题强调色，用于背景渐变的微弱色调 */
  accentColor?: string
  children: React.ReactNode
}

/**
 * SlideLayout — 所有 Slide 共享的外层容器
 * 包含：深色渐变背景、顶部4色装饰条、底部字幕条
 *
 * 注意：Remotion 渲染器不支持 backdrop-filter，
 * 因此玻璃效果改用纯半透明背景色实现。
 */
export const SlideLayout: React.FC<SlideLayoutProps> = ({
  caption,
  showDecoratorBar = true,
  showCaption = true,
  gradientAngle = 135,
  accentColor = 'transparent',
  children,
}) => {
  // 背景：深黑 + 极弱的放射状色调，营造深邃感
  const bgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: `
      radial-gradient(ellipse at 20% 80%, rgba(${hexToRgb(accentColor)}, 0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(${hexToRgb(accentColor)}, 0.05) 0%, transparent 55%),
      linear-gradient(${gradientAngle}deg, #0a0a0b 0%, #131316 50%, #0f0f12 100%)
    `,
    fontFamily,
    overflow: 'hidden',
  }

  return (
    <div style={bgStyle}>
      {/* 顶部4色装饰条 */}
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
                // 给装饰条加轻微发光效果
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          ))}
        </div>
      )}

      {/* 主内容区域（预留装饰条和字幕条的空间） */}
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

      {/* 底部字幕条 */}
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
          {/* 字幕条左侧的细色块装饰 */}
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

      {/* 背景噪点纹理层（用SVG filter替代，增加质感） */}
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

/**
 * 将 hex 颜色转换为 R,G,B 格式（供 rgba() 使用）
 * 只处理 #rrggbb 格式，不处理 transparent
 */
function hexToRgb(hex: string): string {
  if (!hex || hex === 'transparent') return '255,255,255'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '255,255,255'
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}
