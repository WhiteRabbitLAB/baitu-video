# Acceptance

中文:[acceptance.md](acceptance.md)

Archive the command and raw output for every item. **Every checker proves itself first** (only trust its 0 after a positive control has been caught).
**One command runs every automatic item below**: `node .claude/skills/baitu-video/engine/cli.mjs accept <ep>` → `<output dir>/acceptance/summary.md` (each item's raw output is saved in its own file).
Five outcomes: PASS / FAIL / LOOK (a person should look) / INFO (recorded only) / BROKEN (the probe itself failed; the result doesn't count).
Skipped-word alarms a person has listened to and cleared (a homophone misheard, say) go in `heardOk` in `<brief>/accept.json`, with the reason.

| # | Item | How it's checked | Threshold |
|---|---|---|---|
| 1 | No leaked keys | Count occurrences of the key in the output folder and in git-tracked files (positive control: it must be found in .env) | 0; print counts only, never the value |
| 2 | Duration | Video duration vs narration audio duration | Difference ≤ 0.3 s |
| 3 | Loudness | ebur128 | Integrated -16 LUFS ±1; true peak ≤ -1 dBTP. The mix targets -1.5, but AAC encoding pushes it back up a few tenths (N10 measured -1.2), hence the -1 gate [our inference, 2026-10-08] |
| 4 | Subtitles match | Subtitles reversed through this episode's conversion table, punctuation stripped, compared character by character with the script | Identical |
| 5 | Subtitle timing | `engine/tools/check_sub_timing.py` | Each cue ≥ 0.83 s, ≤ 7 s, ≤ 9 characters/s (Netflix, primary source); merge short lines into neighbours or extend them to the next line's start |
| 6 | Fonts | Every font on every rendered page really loaded (a 0 = not loaded); every character on the page is in the subset cut by `fonts` | All loaded, no fallback fonts |
| 7 | Blank frames | Sample a frame every 2 s, compute pixel variance, list the lowest | A person has looked |
| 8 | Skipped words | whisper transcribes each paragraph independently and it's compared clause by clause with the script; human-cleared homophone misreadings go in `heardOk` in `<brief>/accept.json` | Every flagged item reviewed and recorded |
| 9 | Onset timing | Each paragraph's first-sentence start in the timeline vs where the audio goes from silence to voice | API timestamps < 0.1 s; whisper alignment < 0.3 s |
| 10 | Text out of frame | `check-text-bounds` on vertical thumbnails, the vertical cut every 5 s, and landscape thumbnails | Vertical: 0; landscape thumbnails touching the margin only get a heads-up |
| 11 | URLs | Look for URLs and the channel's banned words (`bannedWords` in `explainer.json`) in the script, subtitles and publish notes | 0 |

Frame count isn't in the table: `render` and `vertical` check "expected frames = actual frames" themselves and fail outright if they differ.

## Camera and pacing vs references
Measure your video with the method in design/camera-transitions.md: shot-length distribution, transition durations, share of still time within a paragraph, frame-to-frame jumps; put them in one table with the reference numbers this episode cites and record the gaps (not required to match — required to know the difference).
Command: `python3 engine/tools/measure_film.py video.mp4 --expect transition-starts.json` (needs numpy); feed `--expect` the transition times from your source as a positive control, and don't trust it if the detection rate is low. Past baselines are in camera-transitions.md "Ours vs references".

## Manual checks
- Packaging (principles.md §Packaging): frame 0, the line in the first 3 seconds, the title.
- Aspect ratio matches the platforms: deliver only the ratios chosen in step 0; the vertical video and vertical thumbnail pass the text-out-of-frame / overlap check (`engine/tools/check-text-bounds.mjs`, 0 out of frame, 0 overlaps; run it on landscape too for overlaps), and you've looked at every shot to confirm it isn't scaled / cropped landscape. The vertical cut also passes the centering check (`engine/tools/check-vert-balance.mjs`, sampling each shot's entrance and end state; only the instants when items are still entering may be exceptions), and screenshots confirm it doesn't sit high or lean to one side.
- Grep for every platform rule in the channel profile (profiles/).
- On-screen text review: every piece of on-screen text against the fact sheet and for language errors (use an independent reviewer).
- The chapter progress bar matches the chapter timestamps in the publish notes.
- With character acting: planted feet don't slide (check consecutive frames), legs alternate, no jumps at pose switches, no green fringe from keying, no green on the character keyed out.
