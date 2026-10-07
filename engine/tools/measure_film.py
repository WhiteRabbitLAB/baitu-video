#!/usr/bin/env python3
# /// script
# dependencies = ["numpy"]
# ///
"""量自己的成片(验收「和参考对照」用):静止占比、画面更新间隔、整屏换画面、相邻帧跳变。
结果写进 design/camera-transitions.md「我们自己的成片实测」。

    python3 measure_film.py 成片.mp4 [--expect 期望转场.json] [--out 结果.json]

--expect 是 {"transitions": [秒, ...]},填源码里转场的起点,用作阳性对照:检出率太低就别采信本次数字。
画面区 = 上 82%(去掉字幕和进度条,它们一直在变,会把「静止」量没)。整片缩到 192×108 灰度进内存。
"""
import argparse, json, subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--expect'); ap.add_argument('--out')
ap.add_argument('--fps', type=float, default=30.0)
a = ap.parse_args()
W, H, FPS = 192, 108, a.fps
CROP = int(H * 0.82)
PIX = 6          # 灰度差 > 6 才算这个像素变了(压缩噪声以下)
STILL = 0.0005   # 变化像素 < 0.05% 算「完全不动」

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
g = np.frombuffer(raw, np.uint8).reshape(-1, H, W)[:, :CROP].astype(np.int16)
N = len(g)
def frac(i, k): return (np.abs(g[i] - g[i - k]) > PIX).mean()
s1 = np.array([0] + [frac(i, 1) for i in range(1, N)])
s15 = np.array([frac(i, 15) if i >= 15 else 1 for i in range(N)])     # 0.5s 跨度
s12 = np.array([frac(i, 12) if i >= 12 else 0 for i in range(N)])     # 0.4s 跨度,找事件用
mdiff = np.array([0] + [np.abs(g[i] - g[i - 1]).mean() for i in range(1, N)])

def events(sig, th, gap):
    ev, i = [], 0
    while i < N:
        if sig[i] > th:
            j = i
            while j + 1 < N and sig[j + 1:j + 1 + gap].max(initial=0) > th: j += 1
            k = max(1, i - 12)                       # 回溯到真正开始变的那一帧
            while k < j and s1[k] < 0.002: k += 1
            ev.append(k / FPS); i = j + 1
        else: i += 1
    return ev
q = lambda x: [round(float(v), 2) for v in np.percentile(x, [10, 25, 50, 75, 90])] if len(x) else []

# 静止区间
runs, i = [], 15
while i < N:
    if s15[i] < STILL:
        j = i
        while j + 1 < N and s15[j + 1] < STILL: j += 1
        runs.append(((i - 15) / FPS, (j - i + 16) / FPS)); i = j + 1
    else: i += 1
runs.sort(key=lambda r: -r[1])

up = events(s12, 0.01, 3); iv = np.diff(up)
big = events(s12, 0.15, 6)
res = {
    'video': a.video, 'durSec': round(N / FPS, 2),
    'still_adjacentFrames': round(float((s1[1:] < STILL).mean()), 3),          # 对标 storytime 71%、动态文字 10–21%
    'still_0.5sWindow': round(float((s15[15:] < STILL).mean()), 3),           # 对标 Kurzgesagt 0.3%
    'stillRuns_ge3s': sum(1 for r in runs if r[1] >= 3), 'stillRuns_longest': [[round(s, 1), round(d, 1)] for s, d in runs[:5]],
    'updates_perMin': round(len(up) / (N / FPS) * 60, 1),                     # 变化面积 >1% 的视觉事件;对标动态文字 0.66–0.83s 一个
    'updates_intervalQ10_25_50_75_90': q(iv), 'updates_gapsOver5s': int((iv > 5).sum()), 'updates_maxGap': round(float(iv.max()), 2) if len(iv) else None,
    'bigChanges': len(big), 'bigChanges_at': [round(t, 2) for t in big],       # 0.4s 内 >15% 画面变了:换场 / 大元素进场
    'jump_maxMeanDiff': round(float(mdiff.max()), 2), 'jump_framesOver20': int((mdiff > 20).sum()),
}
if a.expect:
    exp = json.load(open(a.expect))['transitions']
    hit = [t for t in exp if big and min(abs(b - t) for b in big) <= 0.8]
    res['positiveControl'] = f'{len(hit)}/{len(exp)} 个已知转场被检出'
    res['missed'] = [round(t, 2) for t in exp if t not in hit]
print(json.dumps(res, ensure_ascii=False, indent=1))
if a.out: json.dump(res, open(a.out, 'w'), ensure_ascii=False, indent=1)
