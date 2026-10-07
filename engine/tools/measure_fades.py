#!/usr/bin/env python3
# /// script
# dependencies = ["numpy"]
# ///
"""量一部片子里的交叉淡化:在哪、多长、什么缓动(给 camera-transitions.md 转场库 fade 一行找参考值用)。

    uv run measure_fades.py 片子.mp4 [--from 秒] [--to 秒] [--out 结果.json]

做法:先按 0.4s 内画面变化面积找「换画面」事件;对每个事件取前稳帧 A、后稳帧 B,
把中间每一帧拟合成 (1−a)·A + a·B(最小二乘求 a),残差小 ⇒ 这是交叉淡化,a 的 5–95% 用时 = 淡化时长;
残差大 ⇒ 不是淡化(位移、推拉、新元素入场等),只记「其他」。缩到 192×108 灰度,画面区取上 82%(避开字幕)。
先拿已知做法的片子当阳性对照(A6:0.35s 线性淡化)再采信别的片子。
"""
import argparse, json, subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--out')
ap.add_argument('--from', dest='t0', type=float, default=0); ap.add_argument('--to', dest='t1', type=float, default=None)
ap.add_argument('--fps', type=float, default=30.0)
a = ap.parse_args()
W, H, FPS = 192, 108, a.fps
CROP = int(H * 0.82)
cmd = ['ffmpeg', '-v', 'error', '-ss', str(a.t0)] + (['-to', str(a.t1)] if a.t1 else []) + ['-i', a.video, '-vf', f'fps={FPS},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
g = np.frombuffer(raw, np.uint8).reshape(-1, H, W)[:, :CROP].astype(np.float32)
N = len(g)
d1 = np.array([0] + [np.abs(g[i] - g[i - 1]).mean() for i in range(1, N)])     # 相邻帧差
ch12 = np.array([(np.abs(g[i] - g[i - 12]) > 6).mean() if i >= 12 else 0 for i in range(N)])

# 事件:0.4s 内 >15% 画面变了,合并相邻
ev, i = [], 0
while i < N:
    if ch12[i] > .15:
        j = i
        while j + 1 < N and ch12[j + 1:j + 7].max(initial=0) > .15: j += 1
        ev.append((i, j)); i = j + 1
    else: i += 1

out = []
for (i, j) in ev:
    # 变化段 = 事件附近相邻帧差明显的连续帧;A = 段前一帧,B = 段后一帧
    s = max(1, i - 14); e = min(N - 1, j + 2)
    act = [k for k in range(s, e + 1) if d1[k] > 0.4]
    if not act: continue
    s, e = act[0], act[-1]
    while s > 1 and d1[s - 1] > 0.4: s -= 1
    while e + 1 < N and d1[e + 1] > 0.4: e += 1
    A, B = g[s - 1], g[min(N - 1, e)]
    D = (B - A).ravel(); dd = float(D @ D)
    if dd < 1e-3 or e - s < 1: continue
    alphas, resid = [], []
    for k in range(s, e + 1):
        x = (g[k] - A).ravel(); al = float(x @ D) / dd
        r = np.abs(x - al * D).mean() / (np.abs(D).mean() + 1e-6)     # 残差 ÷ A→B 的平均变化
        alphas.append(al); resid.append(r)
    al = np.clip(np.array(alphas), 0, 1); rmax = float(np.max(resid))
    t = lambda q: next((k for k, v in enumerate(al) if v >= q), None)
    k5, k50, k95 = t(.05), t(.5), t(.95)
    is_fade = rmax < 0.25 and k5 is not None and k95 is not None
    rec = {'at': round(a.t0 + s / FPS, 2), 'frames': e - s + 1, 'kind': 'fade' if is_fade else 'other', 'residMax': round(rmax, 3)}
    if is_fade:
        rec['span5to95'] = round((k95 - k5) / FPS, 3)
        # 缓动形状:中段斜率 ÷ 平均斜率(线性 ≈ 1,smooth/ease-in-out ≈ 1.5–1.9)
        mid = al[(al > .3) & (al < .7)]
        rec['midSlopeRatio'] = round(float((np.ptp(mid) / max(1, len(mid) - 1)) / ((al[k95] - al[k5]) / max(1, k95 - k5))), 2) if len(mid) > 1 and k95 > k5 else None
    out.append(rec)

fades = [r for r in out if r['kind'] == 'fade']
spans = [r['span5to95'] for r in fades]
res = {'video': a.video, 'range': [a.t0, a.t1], 'events': len(out), 'fades': len(fades),
       'fadeSpan_q25_50_75': [round(float(v), 3) for v in np.percentile(spans, [25, 50, 75])] if spans else [],
       'midSlopeRatio_median': round(float(np.median([r['midSlopeRatio'] for r in fades if r.get('midSlopeRatio')])), 2) if fades else None,
       'list': out}
print(json.dumps(res, ensure_ascii=False, indent=1))
if a.out: json.dump(res, open(a.out, 'w'), ensure_ascii=False, indent=1)
