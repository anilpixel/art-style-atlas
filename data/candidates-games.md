# 游戏美术风格 · 新增词条候选清单（8 个）

目标：为 cg-3d-games 域新增 2 个谱系，每个 4 词条。
- 谱系 A：game-rendering（游戏渲染风格）
- 谱系 B：game-visual-language（游戏视觉语言）

注意：`cel-shading` slug 已被动画域的「赛璐璐上色」（2D 动画分色）占用，故 3D 卡通渲染技术改用 `toon-shading` 区分。

---

## 谱系 A：game-rendering

### toon-shading
- nameCn: 三维卡通渲染
- nameEn: Toon shading
- source: https://en.wikipedia.org/wiki/Cel_shading
- facts: 赛璐璐着色（又称卡通着色）是一种非真实感渲染技术，目的是让三维计算机图形看起来扁平、像手绘。常规渲染中连续变化的光照值会被量化成少量离散色阶，明暗以色块而非平滑渐变呈现，常用来模仿漫画或卡通风格。名称源于传统二维动画绘制用的透明赛璐璐片。游戏中的代表作包括 2000 年的《Jet Set Radio》（早期应用）、2002 年的《塞尔达传说：风之律动》，以及用水墨笔触呈现的《大神》。

### pbr
- nameCn: PBR 物理写实渲染
- nameEn: Physically based rendering
- source: http://en.wikipedia.org/wiki/Physically_based_rendering
- facts: PBR 是一种试图按现实世界光学规律渲染图像的计算机图形方法，模拟光线与表面的真实交互，多数管线的目标是达到照片级真实感。数学上依赖对双向反射分布函数（BRDF）与渲染方程的可行近似，也可用摄影测量来获取材质准确的光学属性。实现方式包括着色器、光线追踪或路径追踪。是当代 3A 游戏实时渲染的主流管线，材质以金属度、粗糙度等物理参数而非临时调参来定义。

### npr
- nameCn: 非真实感渲染
- nameEn: Non-photorealistic rendering
- source: https://en.wikipedia.org/wiki/Non-photorealistic_rendering
- facts: NPR 是计算机图形学中专注于表现性风格的分支，与追求照片真实感的传统图形学相对，灵感来自绘画、素描、技术插图与动画卡通。「非真实感渲染」一词据信由 1990 年 SIGGRAPH 论文委员会的一场专题讨论提出。三维领域的 NPR 最常见于游戏与电影，常用技术包括卡通着色与 Gooch 着色，大多数做法是让三维场景看起来二维化。自 2000 年起有专门的 NPAR（非真实感动画与渲染）学术研讨会。知名案例包括《Jet Set Radio》《塞尔达传说：风之律动》《大神》（水墨风）与《奥伯拉丁的回归》（单色点彩风）。

### pre-rendered-bg
- nameCn: 预渲染背景
- nameEn: Pre-rendered backgrounds
- source: https://en.wikipedia.org/wiki/Pre-rendered
- facts: 预渲染指图像事先离线计算完成，游戏运行时直接使用，而非由主机实时渲染。在早期主机性能不足的年代，《生化危机》与《最终幻想》在初代 PlayStation 上大量使用预渲染背景与过场动画，以呈现远超主机实时三维能力的画面。角色、道具等可交互元素仍为实时多边形，叠加在预渲染背景之上；这种分工让剩余算力能集中在可交互元素上。1994 年 SNES 的《大金刚国度》是早期重要案例。2000 年代中期后，随着主机与 PC 图形能力提升，该手法逐渐失宠，但过场动画至今仍常用预渲染。

---

## 谱系 B：game-visual-language

### hd-2d
- nameCn: HD-2D
- nameEn: HD-2D
- source: https://en.wikipedia.org/wiki/HD-2D
- facts: HD-2D（或 HD2D）是结合传统二维元素（像素精灵、广告牌精灵）与全三维环境的游戏美术风格与视角。该风格大量使用现代渲染效果——动态光照、景深、移轴摄影——共同营造出微缩模型般的立体透视书观感，唤起经典角色扮演游戏的样貌。该词由 Square Enix 创造并注册商标，用于描述 2018 年与其合作方 Acquire 开发的《八方旅人》；其后沿用于《三角战略》以及《Live A Live》《勇者斗恶龙》的重制版。独立游戏如《Wandering Sword》也有类似美学。评论普遍正面，认为它在保持真实感的同时让 16 位 RPG 观感现代化。

### silhouette-game
- nameCn: 剪影游戏
- nameEn: Silhouette game
- source: https://en.wikipedia.org/wiki/LIMBO
- facts: 《Limbo》（2010，丹麦独立工作室 Playdead 首作）是剪影美学的代表作，一款带恐怖元素的解谜平台游戏。整个游戏以黑白单色呈现，角色与物件多为纯黑剪影，衬在灰阶背景上，配合灯光、胶片颗粒效果与极简环境音营造诡异氛围。媒体将其黑色风格比作黑色电影与德国表现主义，不少评论将其视为「游戏即艺术」的例证。该作曾获独立游戏节奖项，发售后被多家媒体列入史上最佳游戏之列。

### paper-craft-game
- nameCn: 纸艺游戏
- nameEn: Papercraft game
- source: https://en.wikipedia.org/wiki/Tearaway_(video_game)
- facts: 《Tearaway》（2013，Media Molecule 开发，索尼发行于 PS Vita）是纸艺美学的代表作，灵感来自纸艺与设计师 Rex Crowle 留在工作室的涂鸦。整个世界由纸构成：山川、建筑乃至动植物都是折纸，细节以粘贴呈现；主角 Iota 是一名纸艺信使，头部就是一封写给玩家的信封。纸的物理局限成了设计语言——纸片会被踩得下陷、跳跃溅起五彩纸屑、胶水痕可供攀爬。2015 年推出了 PS4 扩展重制版《Tearaway Unfolded》。

### ps1-lowfi
- nameCn: PS1 复古低精度
- nameEn: PS1-style low-fi
- source: https://en.wikipedia.org/wiki/Haunted_PS1
- facts: Haunted PS1 是爱尔兰独立开发者 Breogán Hackett 于 2018 年在 itch.io 建立的社群，聚集制作低分辨率恐怖游戏的独立开发者。该社群每年发布 Demo Disc 合集，模仿 1990 年代游戏杂志附赠的试玩光碟，刻意还原 PS1 时代美学：抖动的多边形、低分辨率贴图、浑浊的色彩与抖动渐变。其视觉参照主要是《生化危机》《寂静岭》等 PlayStation 恐怖游戏。系列合集获得 Giant Bomb、Kotaku、PC Gamer 等媒体好评，被视为低精度三维美学复兴运动的核心阵地。
