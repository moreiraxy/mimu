"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";

const MARK_PATH =
  "M2 34 L2 8 Q2 2 8 2 Q14 2 16 8 L24 24 L32 8 Q34 2 40 2 Q46 2 46 8 L46 34";

export function BemVindoScreen({ nome }: { nome: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-primary px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-text/10">
        <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
          <path
            d={MARK_PATH}
            stroke="#0A0A0A"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="flex max-w-xs items-center justify-center gap-2 text-2xl font-semibold text-primary-text">
        Tudo pronto, {nome}! Vamos lá
        <Trophy className="h-6 w-6 flex-shrink-0" strokeWidth={2.25} />
      </p>
    </div>
  );
}
