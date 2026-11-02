import type { ProductId } from "@/domain/catalog";
import { productCopy } from "./product-copy";

import { illustrations } from "./illustrations";

export function CompanionIllustration({ id }: { id: ProductId }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={productCopy[id].illustrationLabel} shapeRendering="crispEdges">
      <rect x="12" y="57" width="43" height="3" fill="#0c191b" />
      {illustrations[id].map(([x, y, width, height, fill], index) => (
        <rect key={index} {...{ x, y, width, height, fill }} />
      ))}
    </svg>
  );
}
