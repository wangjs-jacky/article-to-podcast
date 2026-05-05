export interface TTSProvider {
  /**
   * 合成单段文字为音频文件，返回实际音频时长（秒）
   */
  synthesize(text: string, outputPath: string): Promise<number>
}
