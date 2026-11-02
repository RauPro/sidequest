import { WorldClient } from "@/features/world/WorldClient";
import { CartPanel } from "@/features/cart/CartPanel";

export default function VillagePage() {
  return <><div className="page-intro"><p className="eyebrow">A little adventure for your desk</p>
    <h1>Welcome to Willow Market.</h1><p>Tap or click a signposted place on the map to visit it, or open Shop view to browse every companion directly.</p></div>
    <WorldClient /><CartPanel />
  </>;
}
