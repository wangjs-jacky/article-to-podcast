import React from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

interface CaptionProps {
  text: string
}

export const Caption: React.FC<CaptionProps> = ({ text }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const translateY = (1 - spring({ frame, fps, config: { damping: 15 }, durationInFrames: 20 })) * 50

  return (
    <div style={{
      position: 'absolute',
      bottom: 40,
      left: '50%',
      transform: `translateX(-50%) translateY(${translateY}px)`,
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '8px 24px',
      borderRadius: 4,
      fontSize: 28,
      maxWidth: '80%',
      textAlign: 'center',
      fontFamily: '"Noto Sans SC", sans-serif',
    }}>
      {text}
    </div>
  )
}
