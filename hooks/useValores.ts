"use client";

import { useContext } from "react";
import { ValoresContext } from "@/components/providers/ValoresProvider";

export function useValores() {
  const contexto = useContext(ValoresContext);
  if (!contexto) {
    throw new Error("useValores precisa estar dentro de <ValoresProvider>.");
  }
  return contexto;
}
