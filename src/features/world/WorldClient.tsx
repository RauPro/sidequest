"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { locations, type LocationId } from "@/game/world/locations";
import { ProductGrid } from "@/features/shop/ProductGrid";
import { OraclePanel } from "@/features/oracle/OraclePanel";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";

const PhaserHost = dynamic(() => import("./PhaserHost"), { ssr: false, loading: () => <p role="status">Loading village…</p> });

export function WorldClient() {
  const [location, setLocation] = useState<LocationId>("market");
  const [mapReady, setMapReady] = useState(false);
  const handleReady = useCallback(() => setMapReady(true), []);
  return <>
    <div className="world-frame" data-testid="village-map" data-ready={mapReady ? "true" : undefined}>
      <PhaserHost onLocation={setLocation} onReady={handleReady} />
    </div>
    <nav className="location-nav" aria-label="Village locations">{locations.map((item) =>
      <button key={item.id} aria-pressed={location === item.id} aria-describedby={`location-purpose-${item.id}`} onClick={() => setLocation(item.id)}>
        <span className="location-name">{item.name}</span>
        <span className="location-purpose" id={`location-purpose-${item.id}`} aria-hidden="true">{item.purpose}</span>
      </button>)}</nav>
    <div id="location-content">
      {location === "market" && <section aria-label="Market"><ProductGrid /></section>}
      {location === "oracle" && <OraclePanel />}
      {location === "camp" && <SupportPanel />}
      {location === "post" && <SubscriptionForm />}
    </div>
  </>;
}
