/**
 * Terminal Noir 深色主题配色系统
 * 适用于 article-to-podcast Remotion 幻灯片
 */

// 基础色彩
export const colors = {
  // 背景层
  bg: '#0a0a0b',
  bgElevated: '#131316',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  bgCardHover: 'rgba(255, 255, 255, 0.07)',

  // 文字
  text: '#e5e5e7',
  textMuted: '#6b6b76',
  textDim: '#3d3d45',

  // 边框
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',

  // 强调色（霓虹风格）
  neonGreen: '#00ff88',
  neonGreenDim: 'rgba(0, 255, 136, 0.15)',
  neonGreenBorder: 'rgba(0, 255, 136, 0.3)',

  amber: '#ffb800',
  amberDim: 'rgba(255, 184, 0, 0.15)',
  amberBorder: 'rgba(255, 184, 0, 0.3)',

  skyBlue: '#00d4ff',
  skyBlueDim: 'rgba(0, 212, 255, 0.15)',
  skyBlueBorder: 'rgba(0, 212, 255, 0.3)',

  red: '#ff4757',
  redDim: 'rgba(255, 71, 87, 0.15)',
  redBorder: 'rgba(255, 71, 87, 0.3)',

  purple: '#c77dff',
  purpleDim: 'rgba(199, 125, 255, 0.15)',
  purpleBorder: 'rgba(199, 125, 255, 0.3)',
} as const

// 每种 Slide 类型对应的主题色
export const slideThemes = {
  title: {
    accent: colors.neonGreen,
    accentDim: colors.neonGreenDim,
    accentBorder: colors.neonGreenBorder,
  },
  content: {
    accent: colors.skyBlue,
    accentDim: colors.skyBlueDim,
    accentBorder: colors.skyBlueBorder,
  },
  highlight: {
    accent: colors.amber,
    accentDim: colors.amberDim,
    accentBorder: colors.amberBorder,
  },
  cards: {
    accent: colors.purple,
    accentDim: colors.purpleDim,
    accentBorder: colors.purpleBorder,
  },
  comparison: {
    accent: colors.neonGreen,
    accentDim: colors.neonGreenDim,
    accentBorder: colors.neonGreenBorder,
  },
} as const

// 4色装饰条颜色（顺序：霓虹绿 / 天蓝 / 琥珀 / 红）
export const decoratorBarColors = [
  colors.neonGreen,
  colors.skyBlue,
  colors.amber,
  colors.red,
] as const

// 字体栈（中文优先，系统字体）
export const fontFamily =
  '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif'

// 通用尺寸常量（基于 1920x1080）
export const layout = {
  paddingH: 100,   // 水平内边距
  paddingV: 72,    // 垂直内边距
  captionHeight: 72, // 底部字幕条高度
  decoratorHeight: 6, // 装饰条高度
} as const
