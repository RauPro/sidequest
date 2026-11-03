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
magenta key from the player and product images, and exports portraits as WebP.

### Prompts

- **`clean-plate-v1.png`** (village background, with NPCs baked in):
  “Edit this 16-bit pixel-art RPG village screenshot to produce a clean game background plate. Remove ALL user-interface overlays (title bar, quest card, product panel, Milo dialogue box, controls bar) and the player character and speech bubbles; repaint seamlessly in the same pixel-art style; keep all buildings, NPCs, lighting and composition.”
- **`portrait-milo.png`, `portrait-oracle.png`, `portrait-finn.png`, `portrait-pip.png`** (dialogue portraits):
  “16-bit pixel-art RPG dialogue portrait, head-and-shoulders bust of <Milo the bearded merchant in a green feathered hat | the village Oracle in a purple hood with a glowing crystal ball | Finn the camp guide in a green ranger cap holding a mug | Pip the white post-office cat in a red postal cap holding a letter>, plain dark navy background, no text.”
- **`product-ember.png`, `product-moss.png`, `product-bolt.png`** (companion sprites):
  “16-bit pixel-art item sprite of <Ember, a cute orange fire dragon | Moss, a round green slime with a sprout and mushroom | Bolt, a light-blue retro robot with an antenna>, flat magenta background, no text.”
- **`player-sheet.png`** (4×4 walk-cycle sheet, rows down/left/right/up):
  “16-bit pixel-art 4x4 walk-cycle sprite sheet of a young adventurer with brown hair, green tunic and red backpack (rows: down, left, right, up), flat magenta background.”
