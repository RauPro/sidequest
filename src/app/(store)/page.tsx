import { WorldClient } from "@/features/world/WorldClient";
import { CartPanel } from "@/features/cart/CartPanel";

export default function VillagePage() {
  return <><div className="page-intro"><p className="eyebrow">A little adventure for your desk</p>
    <h1>Welcome to Willow Market.</h1><p>Explore a location or open Shop view. This is the working project foundation.</p></div>
    <WorldClient /><CartPanel />
  </>;
}
