export interface TTSOptions {
  speaker?: string
  speed?: number
  pitch?: number
  emotion?: string
}

export interface TTSProvider {
  /**
   * 合成单段文字为音频文件，返回实际音频时长（秒）
   */
  synthesize(text: string, outputPath: string, options?: TTSOptions): Promise<number>
}
