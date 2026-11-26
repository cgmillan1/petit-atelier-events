"""Free fairy reveal video: empty room -> each stage pops in where the fairy waves her wand -> ends exactly on the final photo.
Usage: python3 fairy_video.py PROJECT N_STAGES OUT.mp4 [--w 880 --h 1100 --fps 30]
Stage frames: img/stages/{p}_0..{n-1}.jpg, final: img/proj/{p}_final.jpg (used as the last stage so the video ends on it)."""
import sys, math, random, subprocess, argparse
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('project'); ap.add_argument('n', type=int); ap.add_argument('out')
ap.add_argument('--w', type=int); ap.add_argument('--h', type=int); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--img', default='img'); ap.add_argument('--seed', type=int, default=7)
a = ap.parse_args(); random.seed(a.seed); np.random.seed(a.seed)
IMG = a.img; P = a.project
final = Image.open(f'{IMG}/proj/{P}_final.jpg').convert('RGB')
W, H = (a.w or final.width), (a.h or final.height)
# stage canvases a bit larger than output so the camera can push in
Z0 = 1.06
CW, CH = round(W * Z0), round(H * Z0)
stages = [Image.open(f'{IMG}/stages/{P}_{k}.jpg').convert('RGB').resize((CW, CH), Image.LANCZOS) for k in range(a.n - 1)]
stages.append(final.resize((CW, CH), Image.LANCZOS))
S = [np.asarray(s, np.float32) for s in stages]

def diffmask(x, y):
    g = lambda im: np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(3)), np.float32)
    d = np.abs(g(x) - g(y)) > 22
    m = Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(10))
    m = np.asarray(m, np.float32) / 255
    return np.clip(m * 1.6, 0, 1)

trans = []
for k in range(len(stages) - 1):
    m = diffmask(stages[k], stages[k + 1])
    ys, xs = np.nonzero(m > 0.5)
    if len(xs) == 0: cx, cy, R = CW / 2, CH / 2, max(CW, CH)
    else:
        cx, cy = float(np.median(xs)), float(np.median(ys))
        R = float(np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2).max())) + 60
    trans.append(dict(m=m, c=(cx, cy), R=R, area=float((m > 0.5).mean())))

# ---------- sprites ----------
fairy0 = Image.open(f'{IMG}/proj/fairy.webp').convert('RGBA')
FS = round(W * 0.24)
fairyL = fairy0.resize((FS, FS), Image.LANCZOS); fairyR = fairyL.transpose(Image.FLIP_LEFT_RIGHT)
TIP = (22 / 340 * FS, 28 / 340 * FS)  # wand tip in the left-facing sprite

def star(sz, col):
    s = sz * 4; im = Image.new('RGB', (s, s), 0); d = ImageDraw.Draw(im); c = s / 2
    d.polygon([(c, 0), (c + sz * .22, c - sz * .22), (s, c), (c + sz * .22, c + sz * .22), (c, s), (c - sz * .22, c + sz * .22), (0, c), (c - sz * .22, c - sz * .22)], fill=col)
    glow = im.filter(ImageFilter.GaussianBlur(sz * .6))
    core = Image.new('RGB', (s, s), 0); ImageDraw.Draw(core).ellipse([c - sz * .35, c - sz * .35, c + sz * .35, c + sz * .35], fill=(255, 255, 255))
    a_ = np.asarray(im, np.float32) * .9 + np.asarray(glow, np.float32) * 1.4 + np.asarray(core.filter(ImageFilter.GaussianBlur(sz * .2)), np.float32)
    return np.clip(a_, 0, 255)
COLS = [(255, 226, 140), (255, 255, 255), (255, 190, 215), (210, 235, 255), (255, 214, 102)]
SPR = {(sz, i): star(sz, c) for sz in (5, 8, 12, 18) for i, c in enumerate(COLS)}

parts = []  # x,y,vx,vy,born,life,size,col
def emit(x, y, t, n, speed, life, sizes=(5, 8, 12)):
    for _ in range(n):
        ang = random.uniform(0, 2 * math.pi); sp = random.uniform(.25, 1) * speed
        parts.append([x, y, math.cos(ang) * sp, math.sin(ang) * sp - speed * .15, t, random.uniform(.5, 1) * life, random.choice(sizes), random.randrange(len(COLS))])

# ---------- timeline ----------
FPS = a.fps
HOLD0, FLY, POP, EXIT, HOLD1 = .35, .42, .55, .55, .7
events = []; t = HOLD0
start = (CW * 1.08, -CH * .05)
pos = start
for k, tr in enumerate(trans):
    tgt = (tr['c'][0], max(tr['c'][1] - 0.04 * CH, CH * .06))
    events.append(('fly', t, t + FLY, pos, tgt)); t += FLY
    events.append(('pop', t, t + POP * (1.25 if tr['area'] > .3 else 1), k)); t += POP * .55 * (1.25 if tr['area'] > .3 else 1)
    pos = tgt
t += POP * .45
exit_ = (-CW * .15, -CH * .08)
events.append(('fly', t, t + EXIT, pos, exit_)); t += EXIT
T = t + HOLD1; NF = round(T * FPS)

ease = lambda x: x * x * (3 - 2 * x)
def back(x, s=1.7): x -= 1; return x * x * ((s + 1) * x + s) + 1

def fairy_at(tt):
    for e in events:
        if e[0] == 'fly' and e[1] <= tt <= e[2]:
            u = ease((tt - e[1]) / (e[2] - e[1])); (x0, y0), (x1, y1) = e[3], e[4]
            mx, my = (x0 + x1) / 2, min(y0, y1) - 0.12 * CH  # arc
            x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1; y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1
            return x, y, x1 < x0, True
    last = None
    for e in events:
        if e[0] == 'fly' and e[2] <= tt: last = e
    if last is None: return start[0], start[1], True, False
    return last[4][0], last[4][1], last[4][0] < last[3][0], False

# ---------- render ----------
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out]
ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
cur = S[0].copy(); done_k = -1
prev_tip = None
for f in range(NF):
    tt = f / FPS
    # base image: apply finished pops, then the active pop
    base = S[0]
    img = None
    for e in events:
        if e[0] != 'pop': continue
        k = e[3]; tr = trans[k]
        if tt >= e[2]: base = S[k + 1]; continue
        if tt < e[1]: break
        u = (tt - e[1]) / (e[2] - e[1])
        cx, cy = tr['c']
        yy, xx = np.ogrid[:CH, :CW]
        r = back(min(1, u * 1.15), 1.2) * tr['R']
        rad = np.clip((r - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)) / 70, 0, 1)
        sc = 0.86 + 0.14 * back(min(1, u * 1.1), 2.2)  # pop scale
        nxt = Image.fromarray(S[k + 1].astype(np.uint8))
        nw, nh = round(CW * sc), round(CH * sc)
        sn = nxt.resize((nw, nh), Image.BILINEAR)
        canvas = Image.fromarray(S[k].astype(np.uint8)); canvas.paste(sn, (round(cx - cx * sc), round(cy - cy * sc)))
        popped = np.asarray(canvas, np.float32)
        m = (tr['m'] * rad)[..., None]
        fade = ease(min(1, u * 1.3))
        bg = S[k] * (1 - fade) + S[k + 1] * fade
        img = bg * (1 - m) + popped * m
        if f == round(e[1] * FPS) + 1: emit(cx, cy, tt, 70, CW * .9, .9, (5, 8, 12, 18))
        break
    if img is None: img = base.copy()
    # sparkles
    fx, fy, faceL, flying = fairy_at(tt)
    visible = tt < events[-1][2]
    tipx = fx - FS / 2 + (TIP[0] if faceL else FS - TIP[0]); tipy = fy - FS / 2 + TIP[1]
    if visible and 0 < tt:
        emit(tipx, tipy, tt, 3 if flying else 1, CW * .08, .7, (5, 8))
        if not flying and f % 3 == 0: emit(tipx, tipy, tt, 2, CW * .15, .6, (5, 8, 12))
    glow = np.zeros_like(img)
    keep = []
    for p_ in parts:
        age = tt - p_[4]
        if age > p_[5]: continue
        keep.append(p_)
        x = p_[0] + p_[2] * age; y = p_[1] + p_[3] * age + 0.25 * CH * age * age
        life = age / p_[5]; a_ = (1 - life) ** 1.3 * (0.6 + 0.4 * math.sin(age * 30 + p_[6]))
        spr = SPR[(p_[6], p_[7])]; s = spr.shape[0]; x0, y0 = int(x - s / 2), int(y - s / 2)
        xa, ya, xb, yb = max(0, x0), max(0, y0), min(CW, x0 + s), min(CH, y0 + s)
        if xa >= xb or ya >= yb: continue
        glow[ya:yb, xa:xb] += spr[ya - y0:yb - y0, xa - x0:xb - x0] * a_
    parts[:] = keep
    img = np.clip(img + glow, 0, 255)
    frame = Image.fromarray(img.astype(np.uint8))
    if visible:
        spr = fairyL if faceL else fairyR
        bob = math.sin(tt * 9) * FS * .03; ang = (-8 if faceL else 8) * (1 if flying else .4) + math.sin(tt * 6) * 3
        fs = spr.rotate(ang, resample=Image.BICUBIC, expand=False)
        # wing flutter: quick horizontal squash
        sq = 1 - 0.05 * (0.5 + 0.5 * math.sin(tt * 40))
        fs = fs.resize((max(1, round(FS * sq)), FS), Image.BILINEAR)
        frame.paste(fs, (round(fx - fs.width / 2), round(fy - FS / 2 + bob)), fs)
    # camera: slow pull back from 1.06 to 1.0, ending exactly on the final photo
    z = Z0 - (Z0 - 1) * ease(min(1, tt / (T - HOLD1 * .6)))
    vw, vh = W * z / Z0 * Z0, H * z / Z0 * Z0
    cw, ch = CW / z, CH / z
    x0, y0 = (CW - cw) / 2, (CH - ch) / 2
    out = frame.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    if f >= NF - round(HOLD1 * .6 * FPS): out = final.resize((W, H), Image.LANCZOS) if final.size != (W, H) else final
    ff.stdin.write(out.tobytes())
ff.stdin.close(); ff.wait()
print(a.out, f'{T:.2f}s', NF, 'frames')
