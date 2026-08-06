"use client";

import { useContext } from "react";
import { OfflineContext } from "@/components/providers/OfflineProvider";

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline deve ser usado dentro de <OfflineProvider>.");
  }
  return context;
}
