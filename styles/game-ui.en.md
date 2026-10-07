# Game skeuomorphic (id: game-ui)

中文:[game-ui.md](game-ui.md)

## Rendering language
Like a screenshot of a real game: polished dark panels with gold edges, terrain with materials (grassland, plains, snowy peaks, karst, sea), and a parchment antique map for unexplored areas.
**It must look game-quality — rough doesn't work** (the decision-maker's words: if you're going for the Civilization feel, don't make it rough).

## Materials and post
Gold-edged panels (gradient stroke + inner shadow), parchment, terrain textures, fog, cloth-like unit flags.

## Font tendencies
A game title font (ZCOOL XiaoWei) + a UI sans serif (Noto Sans SC); historical texts in a woodblock Song face; antique-map place names in brush.

## Component looks
Turn banners, achievement bars, unit panels, city name plates, resource counters, "moment in history" cards, an advisor dialog (gold-framed portrait), a minimap, a "Next turn" button.

## Motion feel
Panels slide in, banners unfurl, achievements pop, fog lifts hex by hex, numbers roll; each paragraph unlocks one new mechanic.

## How characters are drawn
- The mascot goes into the gold-framed portrait as the advisor.
- Unit portraits suit image generation (untried): same light source as the UI, outline style matching the icons.

## Scenes it can draw
Used in: strategy game (strategy-game). Suggested: RPG quest logs, management sims, card battles.

## Pitfalls
ZCOOL XiaoWei glyph defects (see ../design/fonts.md); maps are schematic, place names only, no borders.
