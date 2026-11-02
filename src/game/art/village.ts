import { Ctx, createRng } from "./canvas";
import { paintTerrain } from "./terrain";
import { paintGroundDecor, paintStandingDecor } from "./decor";
import { paintLandmarks } from "./landmarks";

// Passes stay separate so WORLD-03 can move occluders to a foreground layer.
export function paintVillage(ctx: Ctx) {
  ctx.imageSmoothingEnabled = false;
  const rng = createRng(0x51de);
  paintTerrain(ctx, rng);
  paintGroundDecor(ctx, rng);
  paintLandmarks(ctx);
  paintStandingDecor(ctx, rng);
}
