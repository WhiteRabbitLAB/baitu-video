# 用法: python3 pxledger.py <ledger.jsonl> [批次名前缀]   汇总 pxcache 账本:按批次、按种类(head / thumb / sd / hd)列请求数、实收字节、失败数
# 例: python3 pxledger.py cache/px/ledger.jsonl <期号>-   → 一期的总账
import json, sys, collections

path, tag = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else '')
rows = [json.loads(l) for l in open(path) if l.strip()]
rows = [r for r in rows if r['batch'].startswith(tag)]
if not rows: print('没有匹配的记录'); sys.exit(1)
ok = lambda r: r['code'][0] in '23' or (r['kind'] == 'head' and r['code'] == '404')   # 查预览图张数时 404 是正常答案
mb = lambda b: f'{b / 1e6:8.2f} MB'
by_batch = collections.OrderedDict()
for r in rows: by_batch.setdefault(r['batch'], []).append(r)
print(f'{"批次":<28}{"请求":>6}{"失败":>6}{"实收":>12}')
for b, rs in by_batch.items():
    print(f'{b:<28}{len(rs):>6}{sum(not ok(r) for r in rs):>6}{mb(sum(r["bytes"] for r in rs)):>12}')
print()
kinds = collections.OrderedDict((k, []) for k in ('head', 'thumb', 'sd', 'hd'))
for r in rows: kinds.setdefault(r['kind'], []).append(r)
ids = lambda rs: len({r['url'].split('/videos/')[-1].split('/')[0] if '/videos/' in r['url'] else r['url'].split('/video-files/')[-1].split('/')[0] for r in rs if ok(r)})
print(f'{"种类":<8}{"请求":>6}{"失败":>6}{"涉及素材":>8}{"实收":>12}')
for k, rs in kinds.items():
    if rs: print(f'{k:<8}{len(rs):>6}{sum(not ok(r) for r in rs):>6}{ids(rs):>8}{mb(sum(r["bytes"] for r in rs)):>12}')
tot = sum(r['bytes'] for r in rows)
print(f'{"合计":<8}{len(rows):>6}{sum(not ok(r) for r in rows):>6}{"":>8}{mb(tot):>12}   新建连接 {sum(r["conn"] for r in rows)} 个')
