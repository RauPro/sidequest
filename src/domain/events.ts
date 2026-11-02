export const eventNames = [
  "Sidequest Product Viewed",
  "Sidequest Bag Updated",
  "Sidequest Oracle Completed",
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
