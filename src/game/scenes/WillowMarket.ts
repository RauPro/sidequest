import { Scene } from "phaser";
import { locations } from "../world/locations";
import { createPlayer } from "../entities/Player";
import type { LocationHandler } from "../systems/interaction";

export class WillowMarket extends Scene {
  constructor(private readonly onLocation: LocationHandler) { super("willow-market"); }

  create() {
    this.add.rectangle(400, 250, 800, 500, 0x172d2d);
    this.add.rectangle(400, 250, 18, 370, 0x526351);
    this.add.rectangle(400, 145, 380, 14, 0x526351);
    this.add.rectangle(400, 355, 380, 14, 0x526351);
    this.add.text(400, 40, "WILLOW MARKET", { fontSize: "20px", color: "#d7be86", fontFamily: "monospace" }).setOrigin(0.5);
    for (const location of locations) {
      this.add.rectangle(location.x, location.y, 210, 100, 0x223c39)
        .setStrokeStyle(2, location.color).setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.onLocation(location.id));
      this.add.text(location.x, location.y - 12, location.name, { fontSize: "22px", color: "#f2e6cb", fontFamily: "Georgia" }).setOrigin(0.5);
      this.add.text(location.x, location.y + 22, location.purpose, { fontSize: "12px", color: "#bfd0c2", fontFamily: "monospace" }).setOrigin(0.5);
    }
    createPlayer(this, 400, 250);
    this.add.text(400, 465, "WORLD SCAFFOLD · ARTWORK AND MOVEMENT TO FOLLOW", { fontSize: "11px", color: "#a7b9ac", fontFamily: "monospace" }).setOrigin(0.5);
  }
}
