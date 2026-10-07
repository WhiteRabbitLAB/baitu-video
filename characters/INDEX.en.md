# Character library

中文:[INDEX.md](INDEX.md)

Two kinds of characters: **the channel mascot** (in every episode; its canonical design lives in the channel profile) and **one-off characters** (for one episode or segment).
This file only registers characters and what they can do; design details and asset paths live in the channel profile or the character's own folder.

| id | Character | Belongs to | How it's made | What it can do | Status |
|---|---|---|---|---|---|
| mascot | Channel mascot | Each channel's own (written in its channel profile) | Drawn in code (SVG / canvas) | A new role per scene each episode; hop, head tilt, raise a whiteboard, operate a UI | The shared components only have a neutral placeholder, `kit.mascot` (round body + sprout) |
| wukong | Sun Wukong (flat style) | The author's local test bed (not in the open-source release) | Generated art + code engine | Walk (code skeleton legs), slow to a stop, idle breathing, a startled hop, pointing | Test works; not in a finished video |

## Adding a character
Per [act-pipeline.md](act-pipeline.en.md): list the transition table → finalize a three-view sheet → cut parts / build a pose library → align → register here (stating what it can and can't do yet).
Bringing a character into a new style: first try "keep the original art and only re-grade / relight it in code for the new style"; if that's not enough, regenerate poses under the new style's constraints (with the three-view sheet as reference).
