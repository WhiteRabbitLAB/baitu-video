# Pexels 素材的唯一网络出口:下载只走这里的 curl;ffmpeg / ffprobe 只读本地文件。
# 省流规则(决策者 2026-10-22):先看平台预览图再选;同一 ID 只下一次;筛选用最低清晰度,确定采用才下高清;
# 最多 2 路并发,失败只重试一次;每批预算默认 1GB(环境变量 PX_BUDGET_MB),按 curl 实收字节记账(失败的也算),超了就停。
# 缓存按视频 ID 放 $PX_CACHE(默认 ./cache/px),跨关键词、跨期共用:
#   head/<id>.json      下载跳转查到的各档地址、大小、预览图张数(只取响应头)
#   thumb/<id>/*.jpg    平台预览图(约 15KB 一张),或从本地视频抽的帧
#   sd/<id>.mp4         640 宽低清版(预览图不够看时才下)
#   ledger.jsonl        每次真实传输一行
# 一次运行 = 一批;要接着上一批的账,设 PX_BATCH=<那一批的编号>。
# 用法:各期脚本里 import 本文件(见 design/live-footage.md「省流」);汇总账本用 pxledger.py。
import glob, json, os, re, subprocess, threading, time

C = os.environ.get('PX_CACHE') or os.path.abspath('cache/px')          # 缓存目录,跨期共用
SRC_GLOB = [g for g in os.environ.get('PX_SRC_GLOB', '').split(':') if g]  # 各期高清原片的位置,如 /proj/cache/*/src/{id}.mp4
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
POOL = 2
BUDGET = float(os.environ.get('PX_BUDGET_MB', 1024)) * 1e6
BATCH = os.environ.get('PX_BATCH') or os.environ.get('PX_TAG', '') + time.strftime('%Y%m%d-%H%M%S')   # PX_TAG:批次名前缀(每期一个,如「<期号>-」),按期汇总用
THUMB = 16e3                      # 一张预览图的预估字节,做计划用
for d in ('head', 'thumb', 'sd'): os.makedirs(f'{C}/{d}', exist_ok=True)
_lock = threading.Lock()
st = {'req': 0, 'bytes': 0, 'conn': 0, 'hit': 0}
if 'PX_BATCH' in os.environ and os.path.exists(C + '/ledger.jsonl'):
    st['bytes'] = sum(json.loads(l)['bytes'] for l in open(C + '/ledger.jsonl') if json.loads(l)['batch'] == BATCH)


class OverBudget(Exception): pass


def left(): return BUDGET - st['bytes']


def _curl(url, kind, dest=None, expect=0):
    """一次传输;dest=None 只取响应头。每次尝试都记账,失败(断网 / 超时 / 5xx / 429)最多重试一次,4xx 不重试。
    返回 (状态码, 跳转地址, 响应里的 Content-Length)。"""
    for attempt in (1, 2):
        with _lock:
            if st['bytes'] + expect > BUDGET:
                raise OverBudget(f'本批已收 {st["bytes"] / 1e6:.1f} MB,下一项约 {expect / 1e6:.1f} MB,会超过预算 {BUDGET / 1e6:.0f} MB')
        part = dest + '.part' if dest else None
        a = ['curl', '-s', '-A', UA, '--connect-timeout', '15', '--max-time', '300',
             '-w', '%{http_code} %{size_download} %{size_header} %{num_connects} %header{content-length} %{redirect_url}']
        a += ['-o', part] if dest else ['-I', '-o', '/dev/null']
        r = subprocess.run(a + [url], capture_output=True, text=True)
        f = (r.stdout.split(' ', 5) + [''] * 6)[:6]
        code, got, conn, clen, loc = f[0] or '000', int(f[1] or 0) + int(f[2] or 0), int(f[3] or 0), f[4], f[5].strip()
        with _lock:
            st['req'] += 1; st['bytes'] += got; st['conn'] += conn
            with open(C + '/ledger.jsonl', 'a') as L:
                L.write(json.dumps({'t': time.strftime('%F %T'), 'batch': BATCH, 'kind': kind, 'url': url, 'code': code,
                                    'bytes': got, 'conn': conn, 'try': attempt}) + '\n')
        ok = r.returncode == 0 and code[0] in '234' and code != '429'
        if dest:
            if ok and code == '200': os.replace(part, dest)
            elif os.path.exists(part): os.remove(part)
        if ok: return code, loc, int(clen) if clen.isdigit() else 0
        if attempt == 1: time.sleep(3)
    return code, '', 0


def get(url, dest, kind, expect):
    """下载到 dest(先写 .part,完整收到才改名,断掉的不会被当成缓存)。"""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    _curl(url, kind, dest, expect)
    return dest if os.path.exists(dest) else None


def local(p):
    if re.match(r'^[a-z]+://', str(p)): raise ValueError(f'不许远程读视频:{p}')
    return p


def _head(i):
    p = f'{C}/head/{i}.json'
    return json.load(open(p)) if os.path.exists(p) else {}


def _save(i, k, v):
    d = _head(i); d[k] = v
    json.dump(d, open(f'{C}/head/{i}.json', 'w'), indent=1)


def rendition(i, w=None, sized=True):
    """某一档的文件地址:w=640 / 1280 / 1920(竖片 1080);w=None 是原片。走下载跳转只取响应头,结果缓存。没有这一档返回 None。"""
    k = f'w{w}' if w else 'orig'
    d = _head(i)
    if k in d and (d[k] is None or not sized or d[k]['size']): st['hit'] += 1; return d[k]
    code, loc, _ = _curl(f'https://www.pexels.com/download/video/{i}/' + (f'?w={w}' if w else ''), 'head')
    if code == '404': _save(i, k, None); return None
    if code[0] != '3' or not loc: return None          # 临时失败,不缓存
    m = re.search(r'_(\d+)_(\d+)_(\d+(?:\.\d+)?)fps', loc)
    r = {'url': loc, 'wh': f'{m[1]}x{m[2]}' if m else '', 'fps': m[3] if m else '', 'size': 0}
    if sized: r['size'] = _curl(loc, 'head')[2]
    _save(i, k, r)
    return r


def npreview(i, lo=None, hi=32):
    """平台预览图张数(preview-0 … preview-(n-1),按片长均匀分布)。只取响应头二分查找,结果缓存。
    已知 preview-lo 存在、preview-hi 不存在时传进来,直接在这两个之间找(省掉重查)。"""
    d = _head(i)
    if 'npv' in d: st['hit'] += 1; return d['npv']
    def ok(n):
        c = _curl(f'https://images.pexels.com/videos/{i}/pictures/preview-{n}.jpg', 'head')[0]
        if c not in ('200', '404'): raise IOError(f'{i} 预览图 {n} 返回 {c}')
        return c == '200'
    n = 0
    if lo is not None or ok(0):
        lo = lo or 0
        while hi - lo > 1:
            m = (lo + hi) // 2
            lo, hi = (m, hi) if ok(m) else (lo, m)
        n = lo + 1
    _save(i, 'npv', n)
    return n


def local_video(i):
    """本地已有的这条素材:各期 src/ 里的高清版优先,其次 sd/ 低清版。"""
    for p in sum((sorted(glob.glob(g.format(id=i))) for g in SRC_GLOB), []) + [f'{C}/sd/{i}.mp4']:
        if os.path.exists(p): return p
    return None


def thumbs(i, at=(.15, .5, .85)):
    """筛选用的几张小图:本地有视频就从本地抽;否则用平台预览图。都缓存,第二次不联网。"""
    v = local_video(i)
    out = []
    if v:
        dur = None
        for r in at:
            f = f'{C}/thumb/{i}/loc-{os.path.basename(os.path.dirname(v))}-{int(r * 100)}.jpg'
            if os.path.exists(f): st['hit'] += 1
            else:
                if dur is None:
                    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', local(v)],
                                               capture_output=True, text=True).stdout or 8)
                os.makedirs(os.path.dirname(f), exist_ok=True)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{dur * r:.2f}', '-i', local(v), '-frames:v', '1', '-vf', 'scale=480:-2', f])
            if os.path.exists(f): out.append(f)
        return out
    have = {}   # 已经下到的预览图:编号 → 文件
    if 'npv' not in _head(i):
        # 先按最常见的 15 张直接取(省掉二分查张数的那 6–8 次请求);取全了就不再查张数
        last_ok, miss = None, None
        for r in at:
            j = round(r * 14); f = f'{C}/thumb/{i}/{j}.jpg'
            if os.path.exists(f) or get(f'https://images.pexels.com/videos/{i}/pictures/preview-{j}.jpg', f, 'thumb', THUMB): have[j] = f; last_ok = j
            else: miss = j; break
        if miss is None: return list(have.values())
        n = npreview(i, last_ok, miss)   # 张数一定落在「最后取到的」和「第一张取不到的」之间
    else: n = npreview(i)
    for r in at if n else ():
        j = round(r * (n - 1)); f = f'{C}/thumb/{i}/{j}.jpg'
        near = [k for k in have if abs(k - j) <= 1]   # 差一张以内的已经下到了,就用它,不再下
        if near: out.append(have[near[0]]); st['hit'] += 1; continue
        if os.path.exists(f): st['hit'] += 1
        else: get(f'https://images.pexels.com/videos/{i}/pictures/preview-{j}.jpg', f, 'thumb', THUMB)
        if os.path.exists(f): out.append(f)
    return list(dict.fromkeys(out))


def thumb_cost(i, k=3):
    """thumbs(i) 还要从网上收多少字节(预估)。"""
    if local_video(i): return 0
    d = _head(i)
    if 'npv' not in d: return k * THUMB + 6 * 1.2e3
    n = d['npv']
    return sum(THUMB for r in (.15, .5, .85)[:k] if n and not os.path.exists(f'{C}/thumb/{i}/{round(r * (n - 1))}.jpg'))


def sd(i):
    """640 宽低清版,下到 sd/<id>.mp4(只下一次)。"""
    f = f'{C}/sd/{i}.mp4'
    if os.path.exists(f): st['hit'] += 1; return f
    r = rendition(i, 640)
    return get(r['url'], f, 'sd', r['size'] or 10e6) if r else None


def summary():
    return (f'本批 {BATCH}:联网请求 {st["req"]} 次,新建连接 {st["conn"]} 个,实收 {st["bytes"] / 1e6:.2f} MB'
            f'(curl 统计的正文 + 响应头,不含 TLS / TCP 开销);缓存命中 {st["hit"]} 次;预算 {BUDGET / 1e6:.0f} MB')


# ---------- 只下用到的那几秒(2026-10-22 起) ----------
# Pexels 的 mp4 多是分片格式(moov 在前,之后一段段 moof + mdat,每段几秒):只要前面几段是完整的,ffmpeg 就能从本地文件解出这几秒。
# 镜头一般只用素材开头几秒 ⇒ 按「用到第几秒」只下前面几段(HTTP Range),不下整条;以后镜头变长,再从断点往后补。
import math, struct

def _atoms(path):
    """顶层 atom 列表 [(类型, 起点, 长度)];最后一个可能不完整。"""
    out, n, i = [], os.path.getsize(path), 0
    with open(path, 'rb') as f:
        while i + 8 <= n:
            f.seek(i); h = f.read(16)
            ln, t = struct.unpack('>I4s', h[:8])
            if ln == 1: ln = struct.unpack('>Q', h[8:16])[0]
            if ln < 8: break
            out.append((t.decode('latin1'), i, ln)); i += ln
    return out


def _frag_samples(path, start, ln):
    """一个 moof 里第一条轨道的样本数(trun 的 sample_count 加总)。"""
    with open(path, 'rb') as f: f.seek(start); b = f.read(ln)
    cnt, i = 0, 8
    def walk(s, e):
        nonlocal cnt
        while s + 8 <= e:
            n, t = struct.unpack('>I4s', b[s:s + 8])
            if n < 8: return
            if t == b'traf': walk(s + 8, s + n); return   # 只数第一条轨道(视频)
            if t == b'trun': cnt += struct.unpack('>I', b[s + 12:s + 16])[0]
            s += n
    walk(8, len(b))
    return cnt


def have_secs(path, fps):
    """本地(可能只下了一部分的)文件里,完整可解的秒数;不是分片格式返回 None。"""
    A = _atoms(path)
    if not any(t == 'moof' for t, _, _ in A): return None
    n, size, secs = 0, os.path.getsize(path), 0.0
    for k, (t, st, ln) in enumerate(A):
        if t == 'moof' and k + 1 < len(A) and A[k + 1][0] == 'mdat' and A[k + 1][1] + A[k + 1][2] <= size:
            secs += _frag_samples(path, st, ln) / fps
    return secs


def _fetch_range(url, part, lo, hi):
    """把 [lo, hi] 这段字节接到 part 后面(lo 必须等于 part 当前长度)。每次尝试都记账,失败重试一次。"""
    rng = f'{int(lo)}-{int(hi)}'
    for attempt in (1, 2):
        with _lock:
            if st['bytes'] + (hi - lo) > BUDGET: raise OverBudget(f'本批已收 {st["bytes"] / 1e6:.1f} MB,下一段约 {(hi - lo) / 1e6:.1f} MB,会超过预算 {BUDGET / 1e6:.0f} MB')
        seg_f = part + '.seg'
        r = subprocess.run(['curl', '-s', '-A', UA, '--connect-timeout', '15', '--max-time', '300', '-r', rng,
                            '-w', '%{http_code} %{size_download} %{size_header} %{num_connects}', '-o', seg_f, url], capture_output=True, text=True)
        f = (r.stdout.split() + ['000', '0', '0', '0'])[:4]
        code, got, hdr, conn = f[0], int(f[1]), int(f[2]), int(f[3])
        with _lock:
            st['req'] += 1; st['bytes'] += got + hdr; st['conn'] += conn
            with open(C + '/ledger.jsonl', 'a') as L:
                L.write(json.dumps({'t': time.strftime('%F %T'), 'batch': BATCH, 'kind': 'part', 'url': url, 'code': code, 'bytes': got + hdr, 'conn': conn, 'try': attempt, 'range': rng}) + '\n')
        ok = r.returncode == 0 and code == '206' and os.path.exists(seg_f) and os.path.getsize(seg_f) == got == int(hi) - int(lo) + 1
        if ok:
            with open(part, 'ab') as o, open(seg_f, 'rb') as i_: o.write(i_.read())
        if os.path.exists(seg_f): os.remove(seg_f)
        if ok: return
        if attempt == 1: time.sleep(3)
    raise IOError(f'分段下载失败 {code} {rng}')


def _complete_end(path):
    """最后一个完整分片(moof + mdat 都齐)的结束字节位置;没有分片返回 None。"""
    A, size, end = _atoms(path), os.path.getsize(path), None
    for k, (t, st_, ln) in enumerate(A):
        if t == 'moof' and k + 1 < len(A) and A[k + 1][0] == 'mdat' and A[k + 1][1] + A[k + 1][2] <= size: end = A[k + 1][1] + A[k + 1][2]
    return end


def prefix(url, dest, need, fps, total):
    """只下 url 前面够用的几段到 dest:本地完整可解 ≥ need 秒就停(或下完整条)。返回本地可解秒数(整条下完返回 inf)。
    total = 整个文件字节数(响应头查到的)。先取 64KB 读出第一段有多少帧、多少字节,再按秒数要;
    结束时把不完整的尾巴裁掉(文件里只留完整分片,整个文件解码零报错)。不是分片格式(moov 在后等)就整条下。"""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    part = dest + '.part'
    if os.path.exists(dest): os.replace(dest, part)   # 已有前缀:接着往后补
    elif os.path.exists(part): os.remove(part)
    if not os.path.exists(part): _fetch_range(url, part, 0, min(total, 65536) - 1)
    while os.path.getsize(part) < total:
        have = os.path.getsize(part)
        A = _atoms(part)
        frags = [(st_, ln) for t, st_, ln in A if t == 'moof']
        if not frags:   # 不是分片格式:整条下
            _fetch_range(url, part, have, total - 1); break
        secs = have_secs(part, fps)
        if secs >= need: break
        m0, mlen = frags[0]
        md = next((x for x in A if x[0] == 'mdat' and x[1] == m0 + mlen), None)
        if md is None:   # 第一个 mdat 的头还没到:再要 64KB
            _fetch_range(url, part, have, min(total, have + 65536) - 1); continue
        fsec = _frag_samples(part, m0, mlen) / fps or 1
        fbytes = mlen + md[2]
        n = math.ceil((need - secs) / fsec) if secs else math.ceil(need / fsec)
        start = _complete_end(part) or m0
        hi = min(total - 1, int(start + n * fbytes * 1.06 + 4096))   # 各段大小差不多,多留 6%
        if hi < have: hi = min(total - 1, have + int(fbytes * .5))
        _fetch_range(url, part, have, hi)
    end = _complete_end(part)
    if end is not None and end < os.path.getsize(part) < total:
        with open(part, 'r+b') as f: f.truncate(end)
    os.replace(part, dest)
    if os.path.getsize(dest) >= total: return float('inf')
    return have_secs(dest, fps)
