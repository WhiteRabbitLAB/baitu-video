# 画风库

画风 = **怎么画**:渲染语言、材质、光、线、动效手感、人物怎么画。和「画的是什么世界」(场景,../scenes/)分开:
同一个画风可以画很多场景(纸面拟物既画档案桌,也画 1944 实验室);同一个场景也能换画风(档案桌可以画成扁平的)。

| 缩略图 | id | 画风 | 一句话 | 实战场景 | 纯代码能做细吗 | 状态 |
|---|---|---|---|---|---|---|
| ![paper-skeuo](thumbs/paper-skeuo.jpg) | [paper-skeuo](paper-skeuo.md) | 纸面拟物 | 真纸、真墨、真打字机,俯拍桌面 | 档案案卷、1944 实验室、看板的纸质物件、纸面实验记录、画作展签 | 能 | 整片 ×5 |
| ![game-ui](thumbs/game-ui.jpg) | [game-ui](game-ui.md) | 游戏拟物 | 游戏级精致面板 + 地形材质 | 策略游戏 | 能(要下功夫) | 整片 ×2 |
| ![flat-geometric](thumbs/flat-geometric.jpg) | [flat-geometric](flat-geometric.md) | 扁平几何 | 无描边双色块、几何图解 | 解剖图解 | 能 | 整片 ×1 |
| ![flat-illustration](thumbs/flat-illustration.jpg) | [flat-illustration](flat-illustration.md) | 扁平插画 | Kurzgesagt 一路:层次、光、颗粒、会动的风景 | 横版风景 | 背景能;人物要生图 | 样片 |
| ![cartoon-ui](thumbs/cartoon-ui.jpg) | [cartoon-ui](cartoon-ui.md) | 卡通界面 | 马卡龙色、圆角粗描边、排线填色 | 剪辑台、信息卡片 | 能 | 整片 ×3 |
| ![tech-ui](thumbs/tech-ui.jpg) | [tech-ui](tech-ui.md) | 科技深色界面 | 深蓝黑底、细线面板、蓝色辉光、等宽数字 | 科技终端 | 能 | 整片 ×2 |
| ![whiteboard](thumbs/whiteboard.jpg) | [whiteboard](whiteboard.md) | 白板手绘 | 马克笔线稿边讲边画,斜线排线,三色笔 | 样张(信息卡片) | 能 | 样张(决策者 2026-10-07 看过) |
| ![dark-math](thumbs/dark-math.jpg) | [dark-math](dark-math.md) | 黑底数学 | 3Blue1Brown 一路:黑底、颜色 = 概念、一个对象连续变形 | 样张(信息卡片) | 能 | 样张(决策者 2026-10-07 看过) |
| ![chalkboard](thumbs/chalkboard.jpg) | [chalkboard](chalkboard.md) | 黑板粉笔 | 深绿黑板、粉笔手写逐字 + 颗粒、边讲边画 | 样张(信息卡片) | 能 | 样张(决策者 2026-10-07 看过:没问题) |
| ![kinetic](thumbs/kinetic.jpg) | [kinetic](kinetic.md) | 动态文字 | 字就是演员:关键词甩入砸下、钉住;黄 + 红橙 | 样张(信息卡片) | 能 | 样张(待决策者看) |

候选画风、入库标准(三张样张)和更新节奏见 [ROADMAP.md](ROADMAP.md)。

**缩略图**(2026-10-07):同一个场景(信息卡片)、同一段内容、同一套版面,只换画风层,全部并排见 [thumbs/_all.jpg](thumbs/_all.jpg)。
由 `engine/vc/thumbs.html` 生成(`node engine/vc/thumbs.mjs`);场景函数里只调组件和文字角色,不写颜色和字体,所以这十张同时证明了「换画风 = 只换 `engine/vc/styles.js` 的一套外观」。
注意:缩略图是共享组件的第一版外观,比各画风的整片简单(没有游戏的地形与迷雾、没有插画的骨骼角色、角色是统一的占位:圆身子 + 头顶小芽,故意不像任何动物——频道吉祥物各用各的);新加画风时在 `styles.js` 加一套再重跑即可。

## 判断:纯代码能不能做细
主角是图形(图表、界面、纸、地图、几何)⇒ 能;主角是细节多的人物 ⇒ 交给生图角色(../characters/),代码负责动作与补光。
【能力边界 2026-10】表里「纯代码能做细吗」一列是当时模型的水平;换了更强的模型,先拿一个标「不能」的画风重测一次,再决定改不改。

## 新增画风(口子)
1. 复制 [_template.md](_template.md)。
2. 必写:渲染语言、材质、字体倾向(从 ../design/fonts.md 挑)、**人物在这个画风里怎么画**(代码画 / 生图约束 / 代码补光参数)。
3. 用一个已有场景 + 一个角色做样张实测,才登记。
