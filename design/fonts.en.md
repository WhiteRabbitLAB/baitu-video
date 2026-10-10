# Font catalog (by writing source)

中文:[fonts.md](fonts.md)

The rule: first ask "**who wrote this, on what occasion, with what tool?**", then pick from the tables below; one source, one font, throughout the video.
Only open-source fonts licensed for commercial use (nearly all SIL OFL 1.1; exceptions noted), subset to the characters the video uses: `node <engine>/cli.mjs fonts <ep>` downloads and subsets automatically. Download URLs and licenses for the fonts the styles use are registered in ../engine/fonts.json; add new fonts there.
The "Used in" column lists fonts already used in finished videos; anything without it is a candidate — make a sample sheet first.

## Chinese

| Writing source | Font | Character | Used in | Pitfalls |
|---|---|---|---|---|
| Printed body · journals · forms · woodblock | Noto Serif SC 500/900 | Printed, formal; 900 looks like a Ming woodblock | case files, lab, strategy-game quote cards | — |
| UI · body · subtitles · charts | Noto Sans SC 500/900 | Neutral, clear | everything | — |
| Chinese typewriter · Fangsong print | Zhuque Fangsong | Typescript, old forms | case files, lab | — |
| Fountain pen (filling forms, notes) | Long Cang | Hard-pen running script, looks human | case files, lab | LXGW WenKai was too neat, like a computer font, and was rejected; **its simplified "时" is drawn as the traditional "時"** (found on a 2026-10-07 sample sheet; two instances shipped in N8's notebook; decision-maker 2026-10-07: one character doesn't matter, no fix); zoom in on a sample of the video's characters before using it |
| Quick red-pen / red-pencil notes | Zhi Mang Xing | Scrawled and strong | case files, lab, dashboard | Use with multiply |
| Ballpoint sticky notes · notebook | Xiaolai | Casual, modern | case files, lab, dashboard | — |
| Marker · brush lettering | Ma Shan Zheng | Thick brush, handwritten | case-file Polaroids, antique-map place names | — |
| Games · decorative titles | ZCOOL XiaoWei | Elegant, game-like | strategy game | "回" has same-direction contours ⇒ a solid block (fixed with fix-winding); "宋" looks like "市"; "米" has no middle horizontal stroke (the font's own design, compared side by side with the original on 2026-10-08) — use Noto Serif SC for titles containing "米" |
| Cartoons · character dialogue | ZCOOL KuaiLe | Round, cute | cartoon UI, character bubbles | — |
| Flat science titles | Smiley Sans | Modern, crisp | flat geometric | — |
| Product-packaging display (rich) | ZCOOL Qingke Huangyou | Fat, sweet | dashboard (product labels) | — |
| Chalkboard | Jason Handwriting 1 | Casual, like chalk on a board | samples | Missing 35 rare characters from the first-level simplified set (皑, 钡, 蹿…); styles 5, 6 etc. of the family are traditional — don't mix them up |
| Chalkboard (alternatives) | Xiaolai (have) / Long Cang (have; mind "时") | Xiaolai is neater; Long Cang the most scrawled | samples | The chalk feel comes from the grain mask + per-character tilt, not the font |
| Chalkboard titles | LXGW Marker Gothic | A marker-style sans with even strokes | samples | Doesn't look handwritten; only for big board titles or neon |
| Newspaper headlines | Noto Serif SC 900 (have) | Letterpress headlines | samples | — |
| Pixel games / thermal receipt | Fusion Pixel 12px | 8-bit bitmap, checkout-receipt printing | thermal receipt style (since 2026-10-10, registered in `engine/fonts.json`) | Use multiples of 12 (24/36/48/72/96) to stay crisp; the style's `pixel:12` snaps automatically; **the family name contains a digit, so it must be quoted in CSS** (unquoted, the whole declaration is dropped and the browser silently falls back to a sans); **Zpix requires a paid commercial license (from US$1000) — don't use it** |
| Neon signs | ZCOOL KuaiLe (have) / LXGW Marker Gothic | Round, even strokes, suits tubes | samples | The glow comes from layered shadows |
| Classical traditional · woodblock | Noto Serif TC 500/900 | Woodblock, formal | samples | No simplified characters (964 missing from the first-level set), traditional only; vertical text runs right to left |
| Classical traditional · old glyph forms (alternative) | I.Ming | Inherited glyph forms, more like old books | samples | **IPA Font License**: commercial use OK but not OFL; redistributing a modified file (including subsets) requires renaming; fine for making videos. Uses old forms ("真" shows as "眞") |

## Latin / digits

| Writing source | Font | Used in |
|---|---|---|
| Typewriter · hang tags · card numbers | Special Elite | case files, lab |
| Instrument screens · monospace digits | Space Mono 400/700 | dashboard monitor |
| Journal mastheads · rich packaging | Abril Fatface | dashboard |
| Clean packaging | Quicksand | dashboard |
| Tech UI titles | Space Grotesk | tech terminal |
| Terminal · code · test numbers | JetBrains Mono | tech terminal, lab notes |
| Old book type · magazine serif · wall labels | Cormorant Garamond (roman / italic) | lab notes, brand wordmark |
| Latin species names (italic by biological convention) | Cormorant Italic (engine family `Cormorant Italic`, registered in fonts.json) | Risograph (episode 11) |
| English handwriting (ballpoint / notebook) | Caveat, Kalam | lab notes, English version |
| English marker / red pen | Caveat Brush | lab notes, English version |
| Chalkboard | Handwriting: Gochi Hand (alternatives Patrick Hand, Architects Daughter); board titles: Fredericka the Great, Cabin Sketch Bold | samples |
| Newspaper headlines / mastheads | Playfair Display 900 (headlines), UnifrakturMaguntia (blackletter masthead) | samples |
| Pixel games | Press Start 2P (classic 8-bit), Silkscreen | samples |
| Neon signs | Monoton (multi-line tubes), Neonderthaw (handwritten tubes) | samples |
| Classical / old books | IM Fell English (17th-century type) | samples |

**Pitfall: Latin fonts have no Chinese, and Chinese silently falls back.** Special Elite, Space Grotesk and JetBrains Mono contain no Chinese glyphs; Chinese in the same font stack lands on the next Chinese font in the stack, at the "nearest loaded weight": with only 500/900 loaded, 700 lands on 900 and 400 on 500 (verified 2026-10-07 on N4's typed labels and A1/A2's monospace labels). If the Chinese has a writing source of its own (a typewriter, say), **set its font explicitly** rather than relying on fallback.

**Pitfall: contour direction.** ZCOOL XiaoWei's "回" has inner contours in the same direction as the outer frame, so browsers' non-zero fill rule fills the hole. Check with `engine/tools/check-winding.py font.ttf characters` (read-only, judging relative direction); it falsely flags characters whose strokes sit inside a frame (e.g. 直, 真, 面 in Noto Serif TC), so every flagged character **must be checked by eye on an enlarged sample** — only rendering counts. `engine/tools/fix-winding.py` hard-codes "outer contours clockwise" and only suits ZCOOL XiaoWei; on other fonts it reverses the whole set and can break variable fonts (measured 2026-10-07).

Sample sheet: [font-samples/2026-10-new-sources.jpg](font-samples/2026-10-new-sources.jpg) (five new sources: chalk, newspaper, pixel, neon, classical; regenerate with `node engine/vc/font-sheet.mjs`).

## Multi-language
When the same picture gets an English version, **every Chinese writing source needs an English counterpart** (handwriting for handwriting, typing for typing) — English must never land on a fallback font;
English scenes may get their own layout (English runs longer), anchored to English sentence / word times.

## Handwriting / typing entrances
See [motion.md](motion.en.md).

## Adding a font
Add a row: writing source, font, license (must allow commercial use), character, pitfalls. First make a sample sheet with every character the video uses, checking for missing characters and glyph defects.
