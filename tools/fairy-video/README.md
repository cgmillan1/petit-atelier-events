# Fairy reveal video (free, no credits)

Makes the "fairy builds the setup" video from Karol's photos, in about 10 seconds per video on any computer.
The video starts in the empty space, the fairy flies to each spot, waves her wand, sparkles burst and
that part of the setup pops in with a small bounce. A slow camera pull-back ends exactly on the final photo,
so the website can fade to the photo with no jump. 4 to 5 seconds long, 1.2 to 2.1 MB.

## What you need
- Python 3 with `numpy` and `Pillow`, plus `ffmpeg`:
  `pip install numpy pillow` (ffmpeg from ffmpeg.org or `brew install ffmpeg`)
- Stage photos, same camera framing, from empty to almost done:
  `img/stages/<project>_0.jpg ... <project>_<n-2>.jpg` (0 = empty space)
- The finished photo: `img/proj/<project>_final.jpg` (used as the last stage, so the video ends on it)
- The fairy: `img/proj/fairy.webp` (original character, transparent PNG/WebP, facing left, wand tip at top-left)

Tip: the stage photos can come from the real finished photo with pieces erased step by step
(any AI photo editor). They must line up with the final photo; only the new pieces should change.

## Make a video
Run from the repo root. N = number of stage photos + 1 (the final).
```
python3 tools/fairy-video/fairy_video.py blocks 5 blocks.mp4
python3 tools/fairy-video/fairy_video.py mermaid 4 mermaid.mp4
python3 tools/fairy-video/fairy_video.py neverland 5 neverland.mp4
```
Options: `--w 880 --h 1100` output size (default: size of the final photo), `--fps 30`, `--seed 7` (sparkle pattern).
For an Instagram Reel use the free-reels skill on top, or pad to 1080x1920.

## How it works (to change the look)
- Each step's "new pieces" are found by comparing two stage photos (blur, difference over 22, grow, soften).
- The reveal is a circle growing from the center of the new pieces, with an overshoot ("back" easing),
  and the new pieces scale from 86% to 100% with a bounce so they pop in.
- The fairy follows a curved path to each spot, bobs, tilts and flutters (quick horizontal squash).
- Sparkles: glowing 4-point stars in gold, white, pink and light blue, a trail from the wand while she flies,
  and a burst of 70 when each part appears. They fall slightly and fade.
- Timing in seconds (top of the timeline section): HOLD0 .35 start, FLY .42 per move, POP .55 per reveal
  (x1.25 for big reveals), EXIT .55, HOLD1 .7 on the final photo.
- Size of the fairy: `FS = round(W * 0.24)`. Camera: starts at 1.06 zoom and pulls back to 1.0.
- Quality: x264 CRF 25, faststart, so it plays right away on the website.

## Use on the website
Copy the mp4 to `img/proj/<project>.mp4` and set that project's `video` in `src/data.js`
to `'img/proj/<project>.mp4'` (one string instead of the Higgsfield links), then rebuild.
The current site still uses the Higgsfield videos; these were made Nov 25, 2026 as the free option.
