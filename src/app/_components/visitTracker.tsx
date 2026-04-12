"use client";

import { useEffect } from "react";

const VISIT_SESSION_KEY = "guessrealm-visit-tracked";

export default function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(VISIT_SESSION_KEY) === "1") return;

    sessionStorage.setItem(VISIT_SESSION_KEY, "1");

    void fetch("/api/analytics/visit", {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Ignore analytics failures to avoid affecting gameplay UX.
    });
  }, []);

  return null;
}
