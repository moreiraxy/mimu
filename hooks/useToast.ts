"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/providers/ToastProvider";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>.");
  }
  return context;
}
