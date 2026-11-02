import Phaser, { Scene } from "phaser";
import { ART_HEIGHT, ART_WIDTH } from "../art/canvas";
import { buildVillageArt } from "../art/manifest";
import { locations } from "../world/locations";
import { visitorSpawn, WORLD_HEIGHT, WORLD_WIDTH } from "../world/villageMap";
import { createPlayer } from "../entities/Player";
import type { LocationHandler, SceneReadyHandler } from "../systems/interaction";

export class WillowMarket extends Scene {
  constructor(private readonly onLocation: LocationHandler, private readonly onReady: SceneReadyHandler) { super("willow-market"); }

  private texture(key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) throw new Error(`Could not create ${key} canvas texture`);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    texture.refresh();
  }

  create() {
    const art = buildVillageArt();
    this.texture("village-ground", ART_WIDTH, ART_HEIGHT, art.ground);
    this.add.image(0, 0, "village-ground").setOrigin(0).setDepth(-1000);
    this.texture("village-foreground", ART_WIDTH, ART_HEIGHT, art.foreground);
    this.add.image(0, 0, "village-foreground").setOrigin(0).setDepth(1000);
    for (const sprite of art.sprites) this.texture(sprite.key, sprite.width, sprite.height, sprite.paint);
    for (const item of art.placements) {
      this.add.image(item.x, item.y, item.key).setOrigin(item.originX, item.originY).setDepth(item.depth ?? item.y);
    }
    createPlayer(this, visitorSpawn.x, visitorSpawn.y);
    this.texture("glow", 64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.45, "rgba(255,255,255,0.28)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
    for (const l of art.lights) {
      this.add.image(l.x, l.y, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(l.color).setAlpha(l.alpha).setDisplaySize(l.radius * 2, l.radius * 2).setDepth(1100);
    }
    this.texture("vignette", WORLD_WIDTH, WORLD_HEIGHT, (ctx) => {
      const g = ctx.createRadialGradient(320, 200, 120, 320, 200, 400);
      g.addColorStop(0, "rgba(5,10,14,0)");
      g.addColorStop(0.75, "rgba(5,10,14,0.28)");
      g.addColorStop(1, "rgba(5,10,14,0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    });
    this.add.image(0, 0, "vignette").setOrigin(0).setDepth(1200);
    for (const location of locations) {
      const { x, y, width, height } = location.hitArea;
      this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.onLocation(location.id));
    }
    this.onReady();
  }
}
