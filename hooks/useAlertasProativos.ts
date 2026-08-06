"use client";

import { useContext } from "react";
import { AlertasContext } from "@/components/providers/AlertasProvider";

export function useAlertasProativos() {
  const context = useContext(AlertasContext);
  if (!context) {
    throw new Error(
      "useAlertasProativos deve ser usado dentro de <AlertasProvider>.",
    );
  }
  return context;
}
