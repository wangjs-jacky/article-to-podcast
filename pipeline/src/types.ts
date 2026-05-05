export interface Card {
  icon: string
  label: string
  desc: string
}

export interface ComparisonSide {
  label: string
  items: string[]
}

export type SlideType = 'title' | 'content' | 'cards' | 'highlight' | 'comparison'

export interface BaseSlide {
  id: string
  type: SlideType
  startSec?: number
  endSec?: number
}

export interface TitleSlide extends BaseSlide {
  type: 'title'
  title: string
  subtitle?: string
}

export interface ContentSlide extends BaseSlide {
  type: 'content'
  title: string
  points: string[]
}

export interface CardsSlide extends BaseSlide {
  type: 'cards'
  title: string
  cards: Card[]
}

export interface HighlightSlide extends BaseSlide {
  type: 'highlight'
  title: string
  quote: string
  body?: string
}

export interface ComparisonSlide extends BaseSlide {
  type: 'comparison'
  title: string
  correct: ComparisonSide
  wrong: ComparisonSide
}

export type Slide = TitleSlide | ContentSlide | CardsSlide | HighlightSlide | ComparisonSlide

export interface SlidesJson {
  title: string
  slides: Slide[]
}

export interface ScriptFrontmatter {
  title: string
  slide_markers: string[]
}

export interface ScriptSegment {
  id: string
  text: string
}
