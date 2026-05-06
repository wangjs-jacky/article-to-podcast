/**
 * 主题配色系统
 * 支持多主题预设 + 运行时覆盖
 */

export interface ThemeColors {
  bg: string
  bgElevated: string
  bgCard: string
  bgCardHover: string
  text: string
  textMuted: string
  textDim: string
  border: string
  borderStrong: string
  neonGreen: string
  neonGreenDim: string
  neonGreenBorder: string
  amber: string
  amberDim: string
  amberBorder: string
  skyBlue: string
  skyBlueDim: string
  skyBlueBorder: string
  red: string
  redDim: string
  redBorder: string
  purple: string
  purpleDim: string
  purpleBorder: string
}

export interface SlideThemeAccent {
  accent: string
  accentDim: string
  accentBorder: string
}

export interface SlideThemes {
  title: SlideThemeAccent
  content: SlideThemeAccent
  highlight: SlideThemeAccent
  cards: SlideThemeAccent
  comparison: SlideThemeAccent
}

export interface ThemeConfig {
  colors: ThemeColors
  slideThemes: SlideThemes
  decoratorBarColors: readonly [string, string, string, string]
  fontFamily: string
  layout: {
    paddingH: number
    paddingV: number
    captionHeight: number
    decoratorHeight: number
  }
}

const terminalNoirColors: ThemeColors = {
  bg: '#0a0a0b',
  bgElevated: '#131316',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  bgCardHover: 'rgba(255, 255, 255, 0.07)',
  text: '#e5e5e7',
  textMuted: '#6b6b76',
  textDim: '#3d3d45',
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
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
}

const defaultLayout = {
  paddingH: 100,
  paddingV: 72,
  captionHeight: 72,
  decoratorHeight: 6,
}

const defaultFontFamily =
  '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif'

export const terminalNoir: ThemeConfig = {
  colors: terminalNoirColors,
  slideThemes: {
    title: {
      accent: terminalNoirColors.neonGreen,
      accentDim: terminalNoirColors.neonGreenDim,
      accentBorder: terminalNoirColors.neonGreenBorder,
    },
    content: {
      accent: terminalNoirColors.skyBlue,
      accentDim: terminalNoirColors.skyBlueDim,
      accentBorder: terminalNoirColors.skyBlueBorder,
    },
    highlight: {
      accent: terminalNoirColors.amber,
      accentDim: terminalNoirColors.amberDim,
      accentBorder: terminalNoirColors.amberBorder,
    },
    cards: {
      accent: terminalNoirColors.purple,
      accentDim: terminalNoirColors.purpleDim,
      accentBorder: terminalNoirColors.purpleBorder,
    },
    comparison: {
      accent: terminalNoirColors.neonGreen,
      accentDim: terminalNoirColors.neonGreenDim,
      accentBorder: terminalNoirColors.neonGreenBorder,
    },
  },
  decoratorBarColors: [
    terminalNoirColors.neonGreen,
    terminalNoirColors.skyBlue,
    terminalNoirColors.amber,
    terminalNoirColors.red,
  ],
  fontFamily: defaultFontFamily,
  layout: { ...defaultLayout },
}

// ─── Sunset Glow 预设 ──────────────────────────────────────────

const sunsetGlowColors: ThemeColors = {
  bg: '#0e0c14',
  bgElevated: '#16141e',
  bgCard: 'rgba(212, 160, 106, 0.06)',
  bgCardHover: 'rgba(212, 160, 106, 0.10)',
  text: '#f0e4d8',
  textMuted: '#8a7d74',
  textDim: '#3d3836',
  border: 'rgba(212, 160, 106, 0.08)',
  borderStrong: 'rgba(212, 160, 106, 0.15)',
  neonGreen: '#d4a06c',
  neonGreenDim: 'rgba(212, 160, 108, 0.15)',
  neonGreenBorder: 'rgba(212, 160, 108, 0.3)',
  amber: '#c87058',
  amberDim: 'rgba(200, 112, 88, 0.15)',
  amberBorder: 'rgba(200, 112, 88, 0.3)',
  skyBlue: '#d4a248',
  skyBlueDim: 'rgba(212, 162, 72, 0.15)',
  skyBlueBorder: 'rgba(212, 162, 72, 0.3)',
  red: '#c45040',
  redDim: 'rgba(196, 80, 64, 0.15)',
  redBorder: 'rgba(196, 80, 64, 0.3)',
  purple: '#b87890',
  purpleDim: 'rgba(184, 120, 144, 0.15)',
  purpleBorder: 'rgba(184, 120, 144, 0.3)',
}

export const sunsetGlow: ThemeConfig = {
  colors: sunsetGlowColors,
  slideThemes: {
    title: {
      accent: sunsetGlowColors.neonGreen,
      accentDim: sunsetGlowColors.neonGreenDim,
      accentBorder: sunsetGlowColors.neonGreenBorder,
    },
    content: {
      accent: sunsetGlowColors.skyBlue,
      accentDim: sunsetGlowColors.skyBlueDim,
      accentBorder: sunsetGlowColors.skyBlueBorder,
    },
    highlight: {
      accent: sunsetGlowColors.amber,
      accentDim: sunsetGlowColors.amberDim,
      accentBorder: sunsetGlowColors.amberBorder,
    },
    cards: {
      accent: sunsetGlowColors.purple,
      accentDim: sunsetGlowColors.purpleDim,
      accentBorder: sunsetGlowColors.purpleBorder,
    },
    comparison: {
      accent: sunsetGlowColors.neonGreen,
      accentDim: sunsetGlowColors.neonGreenDim,
      accentBorder: sunsetGlowColors.neonGreenBorder,
    },
  },
  decoratorBarColors: [
    sunsetGlowColors.neonGreen,
    sunsetGlowColors.skyBlue,
    sunsetGlowColors.amber,
    sunsetGlowColors.red,
  ],
  fontFamily: defaultFontFamily,
  layout: { ...defaultLayout },
}

const presets: Record<string, ThemeConfig> = {
  'terminal-noir': terminalNoir,
  'sunset-glow': sunsetGlow,
}

export function registerPreset(name: string, theme: ThemeConfig): void {
  presets[name] = theme
}

export function resolveTheme(
  preset?: string,
  overrides?: Partial<ThemeConfig>,
): ThemeConfig {
  const base = presets[preset ?? 'terminal-noir'] ?? terminalNoir
  if (!overrides) return base
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...overrides.colors },
    slideThemes: { ...base.slideThemes, ...overrides.slideThemes },
    layout: { ...base.layout, ...overrides.layout },
  }
}

// 向后兼容的具名导出（现有 import { colors, ... } 不需要改）
export const colors = terminalNoirColors
export const slideThemes = terminalNoir.slideThemes
export const decoratorBarColors = terminalNoir.decoratorBarColors
export const fontFamily = terminalNoir.fontFamily
export const layout = terminalNoir.layout
