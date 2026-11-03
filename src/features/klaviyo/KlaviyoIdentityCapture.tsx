"use client";

import { useEffect, type ReactNode } from "react";
import { captureKlaviyoIdentity } from "./identity";

export function KlaviyoIdentityCapture({ children }: { children: ReactNode }) {
  useEffect(() => captureKlaviyoIdentity(), []);
  return children;
}
