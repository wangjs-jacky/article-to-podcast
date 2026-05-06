# article-to-podcast

将 Markdown 文章自动转换为口播播客（MP3）和幻灯片讲解视频（MP4）。

## 项目结构

- `pipeline/` — TTS 合成、ffmpeg 拼接、Remotion 调用（TypeScript + tsx）
- `remotion-player/` — Remotion 幻灯片组件和视频合成
- `skills/article-to-podcast/` — Claude Code skill，处理 LLM 步骤（Step 1&2）
- `output/` — 中间产物（gitignore）

## 运行流程

```bash
# 全流程（在 Claude Code 中调用 skill）
/article-to-podcast sample.md

# 单独运行 TTS（Step 3）
cd pipeline && npm run tts

# 单独运行渲染（Step 4）
cd pipeline && npm run render

# 从指定步骤重跑
/article-to-podcast sample.md --from=2
```

## 注意事项

- Remotion 首次运行需要下载 Chrome headless shell（~94MB），国内需代理，见踩坑记录
- `remotion-player/src/` 的 import 不能带 `.js` 后缀（webpack 不支持）
- `--props` 传参需要包裹成 `{ slidesData: ... }` 并用文件路径传入

<!-- ob-index:start -->
## Obsidian 知识库

> 索引路径：`/Users/jiashengwang/jacky-github/jacky-obsidian/wiki/projects/article-to-podcast/index.md`
> 渐进式加载：先读本概览，需要详情时读取索引文件，再读取具体文章。

| 文件 | 主题 | 何时读取 |
|------|------|----------|
| architecture.md | 技术架构总览 | 需要了解流水线设计、时间戳机制、幻灯片切换逻辑时 |
| troubleshooting.md | 踩坑记录 | 遇到 Chrome 下载、import 报错、--props 解析失败等问题时 |
<!-- ob-index:end -->
