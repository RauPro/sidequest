# Editable game artwork

Keep editable Aseprite files, Tiled projects, source layers, and provenance/license notes here. Export only runtime assets to `public/game/` or `public/products/`.

## Village raster assets

The original village images in `source/village/` were generated with Devin's
`generate_image` tool using gpt-image. The clean-plate prompt used
`ui-concepts/sidequest.png` as its input reference. Portraits, product sprites,
and the player sheet were generated from the prompts below. The image files are
preserved unchanged; `walk.json` contains the authored walk/block polygons,
hotspots, and spawn point in 1536×1024 background-pixel coordinates at 32px per
tile. `walk-grid.json` is the supplied rasterization fixture used to protect
the derived walk grid.

Run `npm run assets:build` to create the Phaser runtime outputs under
`public/game/`. The build script converts the clean plate to WebP, removes the
magenta key from the player, NPC, duck and product images, re-centres each NPC
and duck frame on a shared foot baseline (generated sheets drift inside their
cells), exports portraits as WebP, and cuts the animated water, sway and
occluder layers listed in `src/game/world/villageFx.json` out of the clean plate
into `public/game/fx/`.

### Clean plate v2

`clean-plate-v2.png` is `clean-plate-v1.png` with Milo and the two ducks
removed so they can move as sprites. Each was removed by cropping the area
(`edits/*-crop.png`, upscaled 4× nearest), asking `generate_image` to repaint
it without the character (`edits/*-removed.png`), and compositing the result
back through a feathered ellipse mask over the character only. Water, sway and
light effects are procedural and need no extra source art.

### Prompts

- **`clean-plate-v1.png`** (village background, with NPCs baked in):
  “Edit this 16-bit pixel-art RPG village screenshot to produce a clean game background plate. Remove ALL user-interface overlays (title bar, quest card, product panel, Milo dialogue box, controls bar) and the player character and speech bubbles; repaint seamlessly in the same pixel-art style; keep all buildings, NPCs, lighting and composition.”
- **`portrait-milo.png`, `portrait-oracle.png`, `portrait-finn.png`, `portrait-pip.png`** (dialogue portraits):
  “16-bit pixel-art RPG dialogue portrait, head-and-shoulders bust of <Milo the bearded merchant in a green feathered hat | the village Oracle in a purple hood with a glowing crystal ball | Finn the camp guide in a green ranger cap holding a mug | Pip the white post-office cat in a red postal cap holding a letter>, plain dark navy background, no text.”
- **`product-ember.png`, `product-moss.png`, `product-bolt.png`** (companion sprites):
  “16-bit pixel-art item sprite of <Ember, a cute orange fire dragon | Moss, a round green slime with a sprout and mushroom | Bolt, a light-blue retro robot with an antenna>, flat magenta background, no text.”
- **`player-sheet.png`** (4×4 walk-cycle sheet, rows down/left/right/up):
  “16-bit pixel-art 4x4 walk-cycle sprite sheet of a young adventurer with brown hair, green tunic and red backpack (rows: down, left, right, up), flat magenta background.”
- **`npc-milo-sheet.png`** (inputs: a crop of Milo from v1 and `player-sheet.png`):
  “16-bit pixel-art 4x4 sprite sheet on a flat solid magenta background … Milo the friendly bearded village merchant … rows: walking toward the viewer, walking left, walking right, idle (standing, breathing, waving, open-palm gesture).” Both side rows came out facing right; the game uses row 3 flipped for left.
- **`npc-villager-sheet.png`**, **`npc-lamplighter-sheet.png`** (input: `player-sheet.png`):
  “16-bit pixel-art 4x4 walk-cycle sprite sheet on a flat solid magenta background … <a cozy fantasy village woman with a red braid, blue headscarf, mustard-yellow dress, white apron and a basket of apples | an elderly lamplighter with a white beard, spectacles, navy long coat, brown cap and a glowing brass lantern on a pole> … rows: down, left, right, up.”
- **`duck-sheet.png`** (input: `edits/ducks-crop.png`):
  “16-bit pixel-art sprite sheet on a flat solid magenta background, 4x4 cells … the same small white duck swimming, facing left … 4-frame swim bob; all rows identical.”
- **`edits/milo-removed.png`**, **`edits/ducks-removed.png`**:
  “Edit this pixel-art RPG village close-up: completely remove <the bearded merchant | the two white ducks> … repaint the area seamlessly … keep every other pixel, the lighting and the 16-bit pixel-art style exactly the same.”
