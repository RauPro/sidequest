"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { locations, type LocationId } from "@/game/world/locations";
import { ProductGrid } from "@/features/shop/ProductGrid";
import { OraclePanel } from "@/features/oracle/OraclePanel";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";

const PhaserHost = dynamic(() => import("./PhaserHost"), { ssr: false, loading: () => <p role="status">Loading village…</p> });

export function WorldClient() {
  const [location, setLocation] = useState<LocationId>("market");
  return <>
    <div className="world-frame"><PhaserHost onLocation={setLocation} /></div>
    <nav className="location-nav" aria-label="Village locations">{locations.map((item) =>
      <button key={item.id} aria-pressed={location === item.id} onClick={() => setLocation(item.id)}>{item.name}</button>)}</nav>
    <div id="location-content">
      {location === "market" && <section aria-label="Market"><ProductGrid /></section>}
      {location === "oracle" && <OraclePanel />}
      {location === "camp" && <SupportPanel />}
      {location === "post" && <SubscriptionForm />}
    </div>
  </>;
}
