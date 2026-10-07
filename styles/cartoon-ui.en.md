# Cartoon UI (id: cartoon-ui)

中文:[cartoon-ui.md](cartoon-ui.md)

## Rendering language
Cartoon software UI / cards on off-white paper: macaron colors, rounded corners, thick outlines (about 6 px), hatched fills — hand-drawn feel with clear lines.

## Materials and post
Paper background; no jitter filters (the fuzzy edges look blurry).

## Font tendencies
Two: a rounded face (ZCOOL KuaiLe) for titles, labels and dialogue; Noto Sans SC 900 for computed numbers and 500 for small gray notes (what N1/N2 actually did, verified 2026-10-07; N3 used ZCOOL KuaiLe for everything on screen and Noto Sans SC only for subtitles). Key text no smaller than about 28 px (readable on a vertical phone).

## Component looks
Multi-track timeline, clips, sliders, preview window, thick-outline bubbles, whiteboard, cards, a small chapter tag top left.

## Motion feel
Bounce, hop, zoom punch; a different UI gag per paragraph; number slides show real values only.

## How characters are drawn
- A code-drawn cartoon mascot fits best (round, simple, can deform a lot).
- For surprise, don't enlarge the black pupils (looks like a ghost); squinting is fine.

## Scenes it can draw
Used in: editing desk (editing-desk), info cards (info-cards). Suggested: chat UIs, phone apps, whiteboards.

## Pitfalls
A number transition flashed an intermediate value (caught: 1.7) — animations only jump between real values.
