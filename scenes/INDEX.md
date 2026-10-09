# 场景库

场景 = **画面是个什么世界**:观众看到的是一张档案桌、一局游戏、一台监护屏,还是一片风景。
场景决定:有哪些**书写来源**(于是有哪些文字角色和字体)、有哪些组件、什么东西贯穿全片、镜头怎么移。
场景**不决定**怎么画——那是画风(../styles/)。每个场景有一个默认画风,也可以换。

![scenes](thumbs/_all.jpg)
*11 个场景的成片截图(作者已发布的视频)。同一个中性题目(天为什么是蓝的)的示范帧在 [demo/](demo/_all.jpg),由 `node engine/vc/scene-gallery.mjs zh` 生成。*

| id | 场景 | 画面世界 | 默认画风 | 适配片型 | 状态 |
|---|---|---|---|---|---|
| [case-file](case-file.md) | 档案案卷 | 牛皮纸案卷、证物、红章 | paper-skeuo | case-file、experiment | 整片 |
| [lab-desk-1944](lab-desk-1944.md) | 老实验室办公桌 | 俯拍木桌、打字机、Isotype、坐标纸 | paper-skeuo | experiment、case-file | 整片 |
| [lab-dashboard](lab-dashboard.md) | 数据看板 | 病房台面 + 常驻监护屏 | paper-skeuo + 仪器屏 | experiment | 整片 |
| [strategy-game](strategy-game.md) | 策略游戏 | 六边形地图 + 游戏 UI | game-ui | spread-history | 整片 ×2 |
| [anatomy-diagram](anatomy-diagram.md) | 解剖图解 | 示意人体 + 因果链 | flat-geometric | mechanism | 整片 |
| [editing-desk](editing-desk.md) | 剪辑台 | 剪辑软件界面 + 多轨年份时间轴 | cartoon-ui | evolution | 整片 |
| [info-cards](info-cards.md) | 信息卡片 | 卡片 + 数据图 + 主持角色 | cartoon-ui | evolution | 整片 ×2 |
| [landscape-scroll](landscape-scroll.md) | 横版风景 | 多层视差风景,角色在小路上走 | flat-illustration | 角色表演段 | 样片 |
| [terminal-tech](terminal-tech.md) | 科技终端 | 深色界面、终端窗口、数据面板 | tech-ui | product-review、howto-guide | 整片 ×2 |
| [field-notebook](field-notebook.md) | 纸面实验记录 + 屏幕对话框 | 纸是人记的,屏幕是机器说的 | paper-skeuo | story-method-test | 整片(中英) |
| [gallery-wall](gallery-wall.md) | 画作与展签 | 公版名作 + 展签 + 对比墙 | paper-skeuo | story-method-test | 整片(中英;页面已删) |
| [deep-sea-section](deep-sea-section.md) | 深海剖面 | 竖向海水剖面 + 深度尺,镜头随讲解下潜,每种生物在真实深度 | risograph | spread-history、mechanism、case-file | 整片 |

## 新增场景(口子)
1. 复制 [_template.md](_template.md)。
2. 必写:画面世界、**书写来源表**(这个世界里谁在什么上面用什么写字 → 文字角色 R1–R10,不出现的写理由)、贯穿元素、组件、签名动作。
3. 字体从 ../design/fonts.md 挑;没有合适的先在设计库加一行。
4. 做一段样片验证,登记。

## 选场景
- 先找片型里的「核心比喻」:查案 ⇒ 档案;扩散 ⇒ 游戏地图;一个实验的结果 ⇒ 仪器屏;一条建议的版本 ⇒ 剪辑时间轴。
- 场景要能贯穿全片(同一张桌、同一块屏),段与段才接得上(../transitions.md)。
- 动手前出 1–3 张静帧给决策者选。

> 卡片里写着「往期成片」的地方,只说明这条规范是从已发布的片子里来的;规范本身就是卡片内容,实现用 `engine/vc` 共享组件。
