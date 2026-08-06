"use client";

import { useContext } from "react";
import { ThemeContext } from "@/components/providers/ThemeProvider";

export function useTema() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTema deve ser usado dentro de <ThemeProvider>.");
  }
  return context;
}
