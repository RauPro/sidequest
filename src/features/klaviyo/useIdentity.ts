"use client";

import { useCallback, useEffect, useState } from "react";
import { forgetEmail, getRememberedEmail, rememberEmail } from "./identity";

export function useIdentity() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setEmail(getRememberedEmail());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("sidequest:identity", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("sidequest:identity", refresh);
    };
  }, []);

  const remember = useCallback((value: string) => {
    const stored = rememberEmail(value);
    if (stored) setEmail(stored);
  }, []);

  const forget = useCallback(() => {
    forgetEmail();
    setEmail(null);
  }, []);

  return { email, remember, forget };
}
