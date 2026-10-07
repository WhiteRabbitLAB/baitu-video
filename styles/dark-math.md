# 黑底数学(id: dark-math)

## 渲染语言
注意:这是 3b1b 的**屏幕排版风**(印刷字、干净细线),不是黑板;要粉笔板书感用 [chalkboard](chalkboard.md)。
3Blue1Brown 一路:近黑底(#111214),**一个对象连续变形成下一个**,颜色 = 概念(同一个量全片同一个颜色,字和图同色)。
线是细的(2.5–4px)、干净、无抖动;面用纯色,无渐变无材质。强调靠「黄框框起来」,不靠放大或发光。

## 材质与后期
几乎没有:极轻颗粒(overlay 6%)、轻暗角(20%)。

## 色板【一手】manimgl `default_config.yml`
| 用途 | 色 | Manim 名 |
|---|---|---|
| 主色 / 大数字 | #58C4DD | blue_c |
| 手记 / 第二概念 | #5CD0B3 | teal_c |
| 第三概念 | #83C167 | green_c |
| 强调框 / 批注 | #FFFF00 | yellow_c |
| 备用 | #F0AC5F、#FC6255 | gold_c、red_c |
| 角色身子 | #1C758A | blue_e(π 小人的颜色) |
| 次要字 / 线 | #BBBBBB / #888888 | grey_b / grey_c |
底色:manimgl 默认 #333333;3b1b 成片里的底更黑,这里取 #111214(我们的选择,可调)。

## 字体倾向
中文思源黑体 500;英文与数字 STIX Two Text(OFL,衬线数学字,替代 3b1b 用的 LaTeX Computer Modern)。终端 JetBrains Mono。只用这两种 + 等宽。

## 组件长什么样
| 组件 | 造型 |
|---|---|
| 面板 / 窗口 | 细灰线圆角框,标题小字左上 |
| 气泡 | 细白线圆角气泡 + 尾巴,一笔画出后字再出现(π 小人的气泡) |
| 印章 / 标记 | 黄字先「书写」出来,再画一圈细矩形 |
| 批注 | 黄色矩形一笔框住(Manim 的 SurroundingRectangle) |
| 大数字 | 蓝色衬线大字,只在真实值之间变 |

## 动效手感
- **书写(Write)**:每个字先描轮廓、再填满、最后收掉描边,字与字错开(`entrance: 'write'`)。
- 缓动用 smooth(6t⁵−15t⁴+10t³,和 manimgl 源码一致);默认动画时长 1.0s【一手】manimgl。
- 转场:**morph 为主**,从局部进入下一层用 **zoom-through**;几乎不切镜头;不用淡化转场(Manim 的 FadeIn/Out 只给元素用)。

## 人物怎么画
- 代码画:吉祥物按 π 小人的画法——蓝深色实心身子、无描边、大白眼黑瞳孔、眼神看向说话对象(`kit.mascot` 的 line 分支)。
- 生图角色:不建议;这个画风的角色就该简单。

## 能画的场景
样张:信息卡片。建议:概念教学(../formats/concept-lesson.md)、「坐标与图形」场景(待建)。

## 样张(2026-10-07)
[空场景](samples/dark-math-1-scene.jpg) · [文字角色 R1–R10](samples/dark-math-2-roles.jpg) · [角色](samples/dark-math-3-character.jpg)。重出:`node engine/vc/samples.mjs dark-math`。

## 踩坑
- 坐标系、函数曲线这些「主角图形」还没做成组件;做概念教学那期时补(坐标轴、函数曲线、割线 / 切线、表格)。
