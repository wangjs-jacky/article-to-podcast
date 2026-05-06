import React from 'react'
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { SlidesJson } from '../../types'
import { SlideRenderer } from './SlideRenderer'
import { ThemeContext } from './ThemeContext'
import { resolveTheme } from './theme'
import type { ThemeConfig } from './theme'

interface Props {
  slidesData: SlidesJson
  themePreset?: string
  themeOverrides?: Partial<ThemeConfig>
}

export const ArticleVideo: React.FC<Props> = ({ slidesData, themePreset, themeOverrides }) => {
  const theme = resolveTheme(themePreset, themeOverrides)
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSec = frame / fps

  const currentSlide = slidesData.slides.find(
    s => s.startSec !== undefined && s.endSec !== undefined
      && currentSec >= s.startSec && currentSec < s.endSec
  ) ?? slidesData.slides[0]

  const slideStartFrame = Math.round((currentSlide.startSec ?? 0) * fps)

  return (
    <ThemeContext.Provider value={theme}>
      <AbsoluteFill style={{ background: theme.colors.bg }}>
        <Audio src={staticFile('audio.mp3')} />
        <Sequence from={slideStartFrame} key={currentSlide.id}>
          <SlideRenderer slide={currentSlide} />
        </Sequence>
      </AbsoluteFill>
    </ThemeContext.Provider>
  )
}
