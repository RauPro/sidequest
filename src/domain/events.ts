export const eventNames = [
  "Sidequest Location Visited",
  "Sidequest Product Viewed",
  "Sidequest Bag Updated",
  "Sidequest Oracle Completed",
  "Sidequest Camp Question Asked",
  "Sidequest Demo Checkout Completed",
] as const;

export type EventName = (typeof eventNames)[number];
export type IntegrationOperation = "identify" | "event" | "subscribe";
export type DemoIntegrationResult = {
  status: "simulated";
  mode: "demo";
  operation: IntegrationOperation;
  delivered: false;
};
