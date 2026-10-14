# Style Atlas 产品路线图

> 目标：从 demo 级"风格百科"进化为上线标准的真实产品 —— 真实案例、可复用、有付费可能。
> 本文件是 30 分钟迭代 cron 的唯一任务源：每次取最高优先级未完成项，做完、部署、勾选。

## 产品定位

**一句话**：给创作者（独立游戏开发者、vibe coder、设计师）的"美术风格决策工具"——看到风格 → 看到真实代表作 → 知道怎么复现（提示词/工具/教程）。

**与 vibeshot.club 的差异**：真实案例（非 AI 占位图）+ 中文 + 面向游戏/创作落地 + "怎么做出这种风格"。

**变现路径（Phase 4）**：风格简报 PDF 付费包（真实案例 + 提示词 + 教程）、Prompt packs、API。先做价值，再谈收费。

## 用户画像（每次迭代都要代入检验）

1. **陈默，28 岁，独立游戏开发者**：为恐怖解谜游戏选美术风格。需要真实游戏案例、实现成本、引擎/工具建议。反感 AI 占位图。
2. **Kira，22 岁，vibe coder**：用 AI 做小游戏，想要"看起来贵"的风格 + 可直接复制的提示词。没耐心读长文。
3. **林老师，35 岁，设计系教师**：备课找各风格代表作 + 可合法使用的高清图（要授权信息）。
4. **阿杰，30 岁，外包甲方**：跟画师沟通风格，需要准确风格名 + 参考图 + 来源，证明"我要的就是这个"。

## 认知心理学审计（首轮，2026-10-14）

1. **概念错配（双重编码理论 Paivio）**：用户想看"浮世绘长什么样"，看到的却是"小熊猫扮浮世绘"。图像没有锚定真实概念 → 真实案例图优先，AI 图降级为"AI 复现示意"。
2. **Hick 定律**：111 个风格平铺 = 决策瘫痪 → 需要"按用途找风格"（finder/小测试）+ 策展路径（"做恐怖游戏看这 8 个"）。
3. **认知负荷（Sweller）**：词条页文字墙 → 渐进披露：首屏只留 3 个关键特征 + 真实案例，features 全文折叠。
4. **信息气味（Pirolli & Card）**：首页无搜索框，只有"随机探索" → 首页加搜索，搜索要支持"恐怖""复古"这类用途词。
5. **真实性信号**：无来源标注 → 每个词条标注资料来源（Wikipedia 链接），每张案例图标注授权（Public Domain / CC）。
6. **Von Restorff**：精选风格区保留并加强（真实案例图）。

## 真实案例管线

- **图片来源**：Wikimedia Commons API（免费授权：Public Domain / CC），热链 `upload.wikimedia.org` 缩略图（稳定、合法）。
- **游戏/影视**：无免费截图 → 只收录代表作名称 + 年份 + 外链（Wikipedia/官方），不托管图片。
- **数据**：`data/cases.json`，`{slug: [{title, creator, year, img, url, license}]}`，由 `lib/lexicon.ts` 合并读取；单文件超 128KB（Vercel 上传 argv 上限）则拆 cases2.json。
- **脚本**：`scripts/fetch-commons-cases.py` 按 query 拉候选，人工精选后入库（质量 > 数量）。

## Backlog（按优先级）

### Phase 1 真实化
- [x] P1-1 真实案例数据模型 + Commons 管线脚本（2026-10-14：data/cases.json + scripts/fetch-commons-cases.py，10 个词条试点共 22 条案例）
- [x] P1-2 111 词条真实案例全量填充（分批，每批 ~15 个）—— 完成：2026-10-14 批次6+7，**111/111 词条全覆盖，共 293 条案例**（批次6：13 个 slug 46 条；批次7：13 个 slug 40 条；全部 wiki 外链 API 验链通过）。**运维教训**：合并后 cases.json 达 116KB，base64 后 ~155KB 超 Vercel upload_file 单参数 128KB 上限 → 拆为 `data/cases.json`（~54KB）+ `data/cases2.json`（~62KB），`lib/lexicon.ts` 合并读取。后续批次如再增长，保持单文件 <100KB。
- [x] P1-3 词条页"真实案例"区块 UI（2026-10-14：真实图优先 + 授权标注 + 外链；AI 图改标"AI 复现示意"）
- [x] P1-4 AI 示例图降级为"AI 复现示意"（标签 + 折叠）（2026-10-14：移除词条页 hero AI 大图，首屏只留风格名+元数据；AI 图移入页面底部原生 `<details>` 折叠区块，明确标注"AI 生成，非真实作品"；tsc+build 通过，已部署）
- [x] P1-5 每个词条标注资料来源链接（2026-10-14：111/111 词条入库 `source`（URL），73+8 来自 candidates 文档、30 个原词条逐条经 Wikipedia API 核验修正（16 个 404 替换为正确条目，如 Watercolor_painting / 135_film / Low_poly / Claymation）；词条页元数据区新增"资料来源 SOURCE"外链行（Wikipedia/Medium/GitHub 等按 host 显示）；运维教训：source 加入后 lexicon-new.json 达 116KB、base64 后超 argv 上限 → 拆为 lexicon-new.json（40）+ lexicon-new2.json（41），lib/lexicon.ts 与 /api/seed 合并读取；concepts 表新增 source 列（ALTER IF NOT EXISTS）；tsc+build 通过，已部署、force seed 13/28/111、抽查 4 个词条页 + 图片 200）

### Phase 2 好用
- [x] P2-1 "按用途找风格" finder（恐怖/复古/可爱/科幻… → 推荐风格）（2026-10-14：新增 /finder 页 + data/finder.json（10 用途 × 6 策展风格，全部 slug 验链通过）；卡片配图优先真实案例图（87/111 有图），无图时 AI 图 + "AI 复现示意"徽标；每个风格一行"为什么适合"（含成本/工具提示）；首页新增深色"按用途找风格"入口区（10 chips）；sitemap 加入 /finder（priority 0.9）；tsc+build 通过，已部署、force seed 13/28/111、线上 /finder + 各用途页 + 首页 200 抽查通过）
- [x] P2-2 首页搜索框 + 用途词搜索（2026-10-14："恐怖游戏"→ horror 6 个策展风格（含 silhouette-game）+ 用途 banner 链 /finder；"复古"→ 13 结果双用途 + 名称匹配优先排序；新增 data/search-keywords.json（10 用途 × 关键词）；searchConcepts 返回 SearchHit（matchKind: name>alias>usage>feature 排序 + matchNote 策展理由）；DB 查询补上 aliases ILIKE；结果卡片优先真实案例图、AI 图标"AI 复现示意"徽标；无结果时给 finder 快捷入口；SearchBox 占位提示用途词示例；tsc+build 通过，已部署、线上抽查通过）
- [x] P2-3 词条页渐进披露（features 折叠、移动端优化）（2026-10-14：头部元数据只留 类型/年代/谱系 3 行可见，其余 7 行 + 资料来源折叠进「更多属性」；新增「一眼看懂 At a Glance」首屏 3 个关键特征要点；features 全文移入默认收起的「完整特征描述」折叠；真实案例前置到首屏区域；顺序 = 头部 → 3 要点 → 真实案例 → 完整特征(折叠) → 提示词(保持展开) → AI 示意(折叠) → 相关风格；移动端：px-4/py-8、h1 text-3xl、MetaRow 标签列 72px、栅格/卡片间距 gap-3、全部用原生 <details> 无 JS；tsc+build 通过，已部署、线上 3 个词条页 + 图片 200 抽查通过）
- [x] P2-4 策展合集页（"8 种恐怖游戏美术风格"等，可分享）（2026-10-14：新增 data/collections.json（5 个合集：恐怖游戏 8 种 / 复古像素 8 种 / 治愈系 6 种 / 赛博朋克之外 7 种 / 国风 8 式，全部 slug 验链通过）；/collections 索引 + /collections/[slug] 详情页（编号清单、编者按、真实案例图优先、AI 图标徽标、一键复制合集链接分享、上下合集导航）；CopyButton 加 label 参数；sitemap 加入合集页；首页新增"策展合集"入口区；/finder 对应 5 个用途加"延伸阅读"横幅链合集；tsc+build 通过，已部署，线上 9 个页面 200 抽查通过）

### Phase 3 增长
- [ ] P3-1 SEO（sitemap、OG 分享卡片、结构化数据）
- [ ] P3-2 分享卡片图（每风格一键生成分享图）
- [ ] P3-3 与 Viblab 互链（游戏风格词条 ↔ Viblab 指南）

### Phase 4 变现
- [ ] P4-1 风格简报 PDF 导出（免费版带水印）
- [ ] P4-2 付费简报包（真实案例 + 提示词 + 教程链接）
- [ ] P4-3 支付与下载链路

## 迭代纪律（cron 每次遵守）

1. 只做 backlog 中最高优先级未完成项，做完才勾选。
2. 改数据/代码 → `npx tsc --noEmit` + `npm run build` 必过。
3. 需部署：走 `~/workspace/.deploy/` 流程（manifest → upload → deploy），注意单文件 128KB argv 上限、图片 88KB 上限。
4. 数据变更 → `POST /api/seed?force=1`，验证计数。
5. 验证线上 200 后 → git commit + push。
6. 更新本文件状态；在 `~/memory/YYYY-MM-DD.md` 记一句话日志。不打扰用户，除非被阻塞或有用户可见的大变化。
7. 需要注册/登录才能获取的资料，可用用户邮箱 linayanse@gmail.com（Gmail 连接器收验证码），用前先确认该站点值得。
