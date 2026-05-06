<!-- 自动生成，请勿手动编辑。运行 `npm run gen-skill-prompt` 更新。 -->

## 可用幻灯片类型

### title
**何时使用：** 视频开头的封面页，**仅第一张 SLIDE 使用**

**字段：**
- `type` ("title")
- `title` (string) — 主标题，建议 4-12 字
- `subtitle` (string, 可选) — 副标题，建议 8-20 字

**示例：**
```json
{ "id":"intro","type":"title","title":"AI 时代的 UI 设计","subtitle":"从代码到设计的范式转移" }
```

---

### content
**何时使用：** 列举要点（2-6 条）时使用，最常用的类型

**字段：**
- `type` ("content")
- `title` (string) — 段落标题
- `points` (string[]) — 要点列表，建议 3-5 条，每条 8-20 字

**示例：**
```json
{ "id":"s2","type":"content","title":"三大设计原则","points":["可读性优先","一致性原则","减少认知负担"] }
```

---

### cards
**何时使用：** 展示 2-4 个并列概念/方案时使用，每个卡片有图标

**字段：**
- `type` ("cards")
- `title` (string)
- `cards` (object[])
  - `icon` (string) — 单个 emoji 字符
  - `label` (string) — 卡片标题，4-8 字
  - `desc` (string) — 卡片描述，10-20 字

**示例：**
```json
{ "id":"s3","type":"cards","title":"四种架构模式","cards":[{"icon":"🏗️","label":"分层架构","desc":"经典三层结构，职责清晰"},{"icon":"🔄","label":"事件驱动","desc":"松耦合，适合复杂业务"}] }
```

---

### highlight
**何时使用：** 强调某句关键结论或引言时使用

**字段：**
- `type` ("highlight")
- `title` (string)
- `quote` (string) — 核心引用句，15-40 字，带引号
- `body` (string, 可选) — 补充说明，可选

**示例：**
```json
{ "id":"s4","type":"highlight","title":"核心洞察","quote":"\"好的设计是让用户感觉不到设计的存在\"" }
```

---

### comparison
**何时使用：** 对比正确做法和错误做法时使用

**字段：**
- `type` ("comparison")
- `title` (string)
- `correct` (object)
  - `label` (string) — 正确做法的标题
  - `items` (string[])
- `wrong` (object)
  - `label` (string) — 错误做法的标题
  - `items` (string[])

**示例：**
```json
{ "id":"s5","type":"comparison","title":"接口设计对比","correct":{"label":"✅ 推荐","items":["语义化命名","单一职责"]},"wrong":{"label":"❌ 避免","items":["万能接口","参数超过 5 个"]} }
```

---