"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

/**
 * Rehydrates the persisted local database (mock backend) once on the client,
 * then seeds the demo city if this is a first visit.
 */
export function StoreHydrator() {
  const hydrated = useApp((state) => state.hydrated);

  useEffect(() => {
    void useApp.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (hydrated) useApp.getState().bootstrap();
  }, [hydrated]);

  return null;
}
