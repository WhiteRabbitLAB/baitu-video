#!/usr/bin/env python3
"""查字幕时长与阅读速度(验收第 4b 条):python3 check_sub_timing.py 片子.srt [更多.srt …]

标准【一手】Netflix 简体中文与通用字幕规范(2026-10-07 核):
  成人节目 ≤ 9 字/秒(儿童 ≤ 7);每条字幕 ≥ 5/6 秒(0.83s)、≤ 7 秒。
只数汉字(英文数字不计);有一条不达标就以退出码 1 结束,并列出是哪条。
"""
import re, sys

MIN, MAX, CPS = 5 / 6, 7.0, 9.0
def ts(s):
    h, m, x = s.strip().split(':'); sec, ms = x.replace('.', ',').split(','); return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

bad = 0
for f in sys.argv[1:]:
    cues = []
    for b in open(f, encoding='utf-8').read().strip().split('\n\n'):
        L = b.strip().split('\n')
        if len(L) < 3 or '-->' not in L[1]: continue
        a, c = [ts(x) for x in L[1].split('-->')]
        cues.append((L[0], a, c, ''.join(L[2:])))
    probs = []
    for i, a, c, txt in cues:
        d, n = c - a, len(re.findall(r'[一-鿿]', txt))
        if d < MIN: probs.append(f'#{i} {d:.2f}s 太短(< 0.83s):{txt}')
        if d > MAX: probs.append(f'#{i} {d:.2f}s 太长(> 7s):{txt}')
        if n and d > 0 and n / d > CPS: probs.append(f'#{i} {n / d:.1f} 字/秒 太快(> 9):{txt}')
    print(f'{f}:{len(cues)} 条,不达标 {len(probs)} 条')
    for p in probs: print('  ' + p)
    bad += len(probs)
sys.exit(1 if bad else 0)
