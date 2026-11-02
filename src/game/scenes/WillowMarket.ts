import { Scene } from "phaser";
import { ART_SCALE, ART_HEIGHT, ART_WIDTH } from "../art/canvas";
import { paintVillage } from "../art/village";
import { locations } from "../world/locations";
import { visitorSpawn } from "../world/villageMap";
import { createPlayer } from "../entities/Player";
import type { LocationHandler, SceneReadyHandler } from "../systems/interaction";

const VILLAGE_KEY = "willow-market-village";

export class WillowMarket extends Scene {
  constructor(private readonly onLocation: LocationHandler, private readonly onReady: SceneReadyHandler) { super("willow-market"); }

  create() {
    if (!this.textures.exists(VILLAGE_KEY)) {
      const texture = this.textures.createCanvas(VILLAGE_KEY, ART_WIDTH, ART_HEIGHT);
      if (!texture) throw new Error("Could not create village canvas texture");
      paintVillage(texture.getContext());
      texture.refresh();
    }
    this.add.image(0, 0, VILLAGE_KEY).setOrigin(0).setScale(ART_SCALE);
    for (const location of locations) {
      const { x, y, width, height } = location.hitArea;
      this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.onLocation(location.id));
    }
    createPlayer(this, visitorSpawn.x, visitorSpawn.y);
    this.onReady();
  }
}
