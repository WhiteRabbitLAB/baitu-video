# 只检查、不改:找出「内轮廓和包住它的外轮廓同向」的字 —— 浏览器按非零规则填充,这种字的洞会被填实(站酷小薇「回」那类缺陷)。
# 按相对方向判断,不假设外轮廓是顺时针还是逆时针(engine/tools/fix-winding.py 写死了顺时针,拿去查别的字体会整片误报,2026-10-07 实测)。
# 用法:python engine/tools/check-winding.py 字体.ttf [只查这些字]      阳性对照:站酷小薇原版必须报出「回」
import sys
from fontTools.ttLib import TTFont
src = sys.argv[1]; only = set(sys.argv[2]) if len(sys.argv) > 2 else None
f = TTFont(src); glyf = f['glyf'] if 'glyf' in f else None
if glyf is None: print('不是 TrueType 轮廓(CFF),本脚本不适用'); sys.exit(2)
cm = f.getBestCmap()
def area(p): return sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2
def inside(pt, poly):
    x, y = pt; c = False
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i+1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c = not c
    return c
bad = []
for code, name in cm.items():
    ch = chr(code)
    if only and ch not in only: continue
    g = glyf[name]
    if g.isComposite() or g.numberOfContours <= 1: continue
    coords, ends, _ = g.getCoordinates(glyf)
    polys, s = [], 0
    for e in ends: polys.append([tuple(coords[i]) for i in range(s, e+1)]); s = e+1
    A = [area(p) for p in polys]
    for k, p in enumerate(polys):
        if len(p) < 3 or A[k] == 0: continue
        # 直接包住它的轮廓 = 包含它的轮廓里面积最小的那个
        cont = [j for j, q in enumerate(polys) if j != k and abs(A[j]) > abs(A[k]) and all(inside(pt, q) for pt in p[::max(1, len(p) // 12)])]   # 整条都在里面才算「洞」;只是笔画交叠(可变字体常见)不算
        if not cont: continue
        j = min(cont, key=lambda j: abs(A[j]))
        if (A[j] > 0) == (A[k] > 0): bad.append(ch); break
print(f'{len(bad)} 个字有同向内轮廓(洞会被填实):', ''.join(bad[:200]) or '无')
