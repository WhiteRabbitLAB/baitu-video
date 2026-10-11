# Live-action footage in the picture (existing public-domain / licensed footage)

【Capability boundary updated 2026-10-10】The engine originally only drew code animation. Existing live footage (not filmed by us) can be wired into the same page this way, sharing layers, transitions, subtitles and the chapter bar with the animation. Proven on a 13-minute full video.

## Where footage comes from, what to accept
| Source | License | How | Notes |
|---|---|---|---|
| Government public-domain video (e.g. US national park video libraries, NASA, USDA) | Public domain | mp4 links on the page | Often 720p only; each page states the filming location — **use it to verify what the shot shows** |
| Wikimedia Commons | Accept public domain / CC0 / CC BY only; **reject CC BY-SA** (it would propagate to the film) | `api.php?list=search&srsearch=<term> filetype:video` + `prop=imageinfo&iiextmetadatafilter=LicenseShortName\|Artist` gets license and author in one call | Parallel downloads get 429: **download one at a time, 2–3 s apart, with a User-Agent that has contact info**; CC BY needs attribution in the description |
| Pexels | Pexels license (commercial use, no attribution) | The search page blocks curl but WebFetch can read IDs; download via `pexels.com/download/video/<id>/` | Many are vertical; a place name in the title doesn't mean it was filmed there (we found another country's landmark tagged as the destination) |

**Sample frames remotely before downloading**: ffmpeg reads the URL, grab 3 frames, tile them, check content, location, faces / gore / illegal camera positions, then download.

## Pitfalls to check
- **Illegal camera positions**: if drones are banned at the destination, don't use high top-down aerials (we found one on Pexels that was clearly a drone shot); the film can't contradict the rules it teaches.
- **Picture must match narration / caption**: verify with the location on the source page; skip what you can't identify. Captions use the year and author from the original title, never our inference.
- **Old photos may be stereograph cards** (two images side by side on a mount): crop the left image with measured ratios; in one Commons scan batch **file names and contents were swapped** — caption from the title printed on the card.
- **People in footage**: public-domain footage is fine, but avoid close-up faces and injury / gore.
- **Third-party copyrighted shots inside public-domain films**: agency videos splice in satellite maps (Google-marked) or other people's photos, often with a **dissolve**, so scene-cut detection (`select='gt(scene,0.3)'`) merges them with the neighbouring shot ⇒ re-check any chosen range with a frame every 3 s (2026-10-11, second live-footage film: an "underwater reef" range hid 10 s of satellite map).
- **Burned-in watermarks / name captions**: CC BY street footage often carries the videographer's name in a corner; agency films carry lower-third name captions ⇒ zoom in and anchor the focus away from it (`fy: 0` crops the bottom); still credit the author; if it can't be cropped, don't use the shot.
- **Pexels search pages are blocked by Cloudflare for curl**: if WebFetch is unavailable too, `fetch` the search page from inside a pexels.com tab via the browser extension and extract `/video/<slug>-<id>/` and `videos.pexels.com/video-files/<id>/…mp4`; the CDN files download (or frame-sample remotely) fine. The page's `"location"` field is usually the uploader's location, **not** where it was shot — always sample frames and look.
- **One camera position per shot**: run scene-cut detection on a source before choosing ranges; a shot's "in point + duration × speed" must not cross a cut (or the next camera angle flashes in); if the source is too short, slow it down or pick another clip.

## Getting it into the page (deterministic per frame)
1. **One shot table** (a js file shared by the page and the extraction script): per live shot — clip key, in-point, speed, zoom start/end, focal point, overlays; times anchored to narration sentences.
2. **Extraction script** writes only the needed span to `frames/<shot>/%05d.jpg` (1920×1080, `-q:v 3`; vertical sources take a horizontal band with `crop=iw:iw*9/16:0:(ih-iw*9/16)*cy`; light unified grade `eq=contrast=1.04:saturation=1.06`; `tpad` freezes and warns if the source is too short); unchanged shots are skipped. ~10k frames ≈ 2.4 GB.
3. **The page references frames with SVG `<image>`**, zooms via transforms (sub-pixel smooth). Tested: an `<image>` rebuilt every frame never screenshots blank; prove the checker first with a positive control ("no image → must report blank everywhere") — our first checker measured all-black because of an unquoted SVG attribute, only the positive control caught it.
4. Small frames inside the animation (old film, old video) are extracted at native size and framed with sprocket holes or a white print border.

## Page build
Scene code can live in separate files, but **the engine's `fonts` only scans the page HTML**: on-screen text inside external js is missed and silently falls back. Add a build step that inlines the scene scripts into the page, then run `fonts`.

## Music (when the computer must stay silent)
Without listening, read the loudness curve: `ffmpeg -af ebur128`, one M value every 10 s; pick steady, quiet tracks under narration, put a track's swell on the film's turning point; skip tracks with long near-silent stretches. Normalize each track to the same loudness with `loudnorm`, then crossfade; the total must be **longer than the film** (the mix loops background music, so a short bed restarts at the end).
