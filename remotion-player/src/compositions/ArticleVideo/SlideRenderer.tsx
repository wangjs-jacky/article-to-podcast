import React from 'react'
import type { Slide } from '../../types'
import { TitleSlide } from './components/TitleSlide'
import { ContentSlide } from './components/ContentSlide'
import { CardsSlide } from './components/CardsSlide'
import { HighlightSlide } from './components/HighlightSlide'
import { ComparisonSlide } from './components/ComparisonSlide'

export const SlideRenderer: React.FC<{ slide: Slide }> = ({ slide }) => {
  switch (slide.type) {
    case 'title':      return <TitleSlide slide={slide} />
    case 'content':    return <ContentSlide slide={slide} />
    case 'cards':      return <CardsSlide slide={slide} />
    case 'highlight':  return <HighlightSlide slide={slide} />
    case 'comparison': return <ComparisonSlide slide={slide} />
    default:           return null
  }
}
