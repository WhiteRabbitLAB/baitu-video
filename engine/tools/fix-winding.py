# 修 TrueType 字形的轮廓方向:按嵌套深度重定方向(外轮廓一个方向、洞反向)。
# 起因:站酷小薇的「回」三条轮廓同向,浏览器按非零规则填充 ⇒ 渲染成实心方块(2026-10-01 实测)。
# 用法:python engine/tools/fix-winding.py in.ttf out.woff2   打印改过的字
# 只用于站酷小薇:下面写死「外轮廓顺时针」,别的字体约定可能相反,会被整套反向(可变字体还可能改坏)。查别的字体用 tools/check-winding.py(只查不改)。
import sys
from fontTools.ttLib import TTFont
src, dst = sys.argv[1], sys.argv[2]
f = TTFont(src); glyf = f['glyf']; rev = {v: k for k, v in f.getBestCmap().items()}
def area(p): return sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2
def inside(pt, poly):
    x, y = pt; c = False
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i+1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c = not c
    return c
fixed = []
for name in f.getGlyphOrder():
    g = glyf[name]
    if g.isComposite() or g.numberOfContours <= 1: continue
    coords, ends, flags = g.getCoordinates(glyf)
    cs, s = [], 0
    for e in ends: cs.append(list(range(s, e+1))); s = e+1
    polys = [[tuple(coords[i]) for i in c] for c in cs]
    outer_sign = -1   # 本字体外轮廓面积为负(顺时针)
    changed = False
    for k, p in enumerate(polys):
        # 用轮廓内一点(第一个点向轮廓重心挪一点会出界,直接用各点均值不稳)——取第一个点,但排除自身
        depth = sum(1 for j, q in enumerate(polys) if j != k and abs(area(q)) > abs(area(p)) and inside(p[0], q))
        want = outer_sign if depth % 2 == 0 else -outer_sign
        if (area(p) > 0) != (want > 0):
            idx = cs[k]; pts = [coords[i] for i in idx]; fl = [flags[i] for i in idx]
            pts = [pts[0]] + pts[1:][::-1]; fl = [fl[0]] + fl[1:][::-1]
            for i, pt, fg in zip(idx, pts, fl): coords[i] = pt; flags[i] = fg
            changed = True
    if changed:
        g.coordinates = coords; g.flags = flags; fixed.append(chr(rev[name]) if name in rev else name)
# 站酷小薇的「回」少一条轮廓:里面的小口只有外框、没有洞 ⇒ 渲染成实心小方块。
# 按外框笔画粗细在小口里挖一个反向的洞(只动这一个字,打印出来留痕)
cm = f.getBestCmap()
if 0x56DE in cm:
    g = glyf[cm[0x56DE]]
    coords, ends, flags = g.getCoordinates(glyf)
    if len(ends) == 3:
        cs, s0 = [], 0
        for e in ends: cs.append(list(range(s0, e+1))); s0 = e+1
        polys = [[tuple(coords[i]) for i in c] for c in cs]
        ar = [abs(area(p)) for p in polys]; order = sorted(range(3), key=lambda k: -ar[k])
        stroke = (ar[order[0]] ** .5 - ar[order[1]] ** .5) / 2
        small = polys[order[2]]; side = ar[order[2]] ** .5; k = max(.2, (side - 2 * stroke) / side)
        cx = sum(p[0] for p in small) / len(small); cy = sum(p[1] for p in small) / len(small)
        hole = [(round(cx + (x - cx) * k), round(cy + (y - cy) * k)) for x, y in small][::-1]
        from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
        allp = list(coords) + hole; g.coordinates = GlyphCoordinates(allp)
        g.flags = bytearray(list(flags) + [1] * len(hole)); g.endPtsOfContours = list(ends) + [len(allp) - 1]
        g.numberOfContours = 4; g.recalcBounds(glyf)
        print('「回」补了内洞,缩放', round(k, 2))
f.flavor = 'woff2'; f.save(dst)
print('改了方向的字:', ''.join(fixed) or '无')
