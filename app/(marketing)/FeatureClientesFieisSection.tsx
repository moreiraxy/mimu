"use client";

import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

export function FeatureClientesFieisSection() {
  const reduzida = useReducedMotion();

  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <SpringIn className="relative w-full max-w-[400px] flex-1">
        <ParallaxFloat strength={85}>
          <svg viewBox="0 0 400 460" className="w-full rounded-card" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="mercadoBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F4A653" />
                <stop offset="50%" stopColor="#FF8A64" />
                <stop offset="100%" stopColor="#E8564A" />
              </linearGradient>
              <linearGradient id="skin2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D9A46B" />
                <stop offset="100%" stopColor="#B87C46" />
              </linearGradient>
              <filter id="softBlur2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            <rect width="400" height="460" fill="url(#mercadoBg)" />
            <circle cx="355" cy="65" r="66" fill="#ffffff" opacity="0.14" />
            <circle cx="25" cy="380" r="72" fill="#2DBE8C" opacity="0.16" />
            <g opacity="0.16" fill="#ffffff">
              <circle cx="60" cy="50" r="3" />
              <circle cx="80" cy="65" r="3" />
              <circle cx="40" cy="70" r="3" />
            </g>

            <rect x="20" y="40" width="360" height="150" rx="8" fill="#8A4A2A" opacity="0.9" />
            <rect x="30" y="50" width="340" height="60" rx="6" fill="#FFF7EC" />
            <rect x="30" y="120" width="340" height="60" rx="6" fill="#FFF7EC" />

            <g>
              <rect x="42" y="60" width="24" height="42" rx="4" fill="#2DBE8C" />
              <ellipse cx="54" cy="60" rx="12" ry="4" fill="#1c7a54" />
              <rect x="74" y="66" width="30" height="36" rx="10" fill="#F4A653" />
              <rect x="112" y="58" width="22" height="44" rx="4" fill="#FF6B5B" />
              <ellipse cx="123" cy="58" rx="11" ry="4" fill="#C2453F" />
              <rect x="142" y="70" width="34" height="32" rx="14" fill="#6B4FA0" />
              <rect x="184" y="62" width="26" height="40" rx="5" fill="#2DBE8C" />
              <rect x="218" y="66" width="24" height="36" rx="8" fill="#F4A653" />
              <rect x="250" y="58" width="22" height="44" rx="4" fill="#FF6B5B" />
              <ellipse cx="261" cy="58" rx="11" ry="4" fill="#C2453F" />
              <rect x="280" y="70" width="32" height="32" rx="12" fill="#2DBE8C" />
              <rect x="320" y="64" width="24" height="38" rx="5" fill="#6B4FA0" />

              <rect x="42" y="130" width="30" height="42" rx="6" fill="#F4A653" />
              <rect x="80" y="126" width="22" height="46" rx="4" fill="#FF6B5B" />
              <ellipse cx="91" cy="126" rx="11" ry="4" fill="#C2453F" />
              <rect x="110" y="136" width="34" height="36" rx="14" fill="#2DBE8C" />
              <rect x="152" y="128" width="24" height="44" rx="5" fill="#6B4FA0" />
              <rect x="184" y="134" width="30" height="38" rx="10" fill="#F4A653" />
              <rect x="222" y="126" width="22" height="46" rx="4" fill="#FF6B5B" />
              <ellipse cx="233" cy="126" rx="11" ry="4" fill="#C2453F" />
              <rect x="252" y="136" width="34" height="36" rx="14" fill="#6B4FA0" />
              <rect x="294" y="128" width="24" height="44" rx="5" fill="#2DBE8C" />
              <rect x="326" y="134" width="26" height="38" rx="10" fill="#F4A653" />
            </g>

            <ellipse cx="200" cy="432" rx="175" ry="18" fill="#7A2F1E" opacity="0.28" filter="url(#softBlur2)" />

            <rect x="30" y="300" width="340" height="120" rx="14" fill="#8A4A2A" />
            <path d="M30 314 H370 M30 334 H370 M30 354 H370 M30 374 H370" stroke="#7A3F22" strokeWidth={2} opacity="0.5" />
            <rect x="30" y="290" width="340" height="18" rx="9" fill="#FFF7EC" />
            <rect x="270" y="255" width="70" height="45" rx="6" fill="#2A2136" />
            <rect x="278" y="262" width="54" height="22" rx="3" fill="#7ED6C1" />
            <circle cx="70" cy="275" r="14" fill="#E8564A" />
            <circle cx="92" cy="280" r="14" fill="#F4A653" />
            <circle cx="114" cy="273" r="14" fill="#E8564A" />
            <path d="M60 296 Q90 260 124 296 Z" fill="#7A3F22" opacity="0.4" />

            <path d="M140 300 Q134 240 160 210 Q170 192 200 192 H222 Q252 192 262 210 Q288 240 282 300 Z" fill="#F7F6F3" />
            <path d="M160 210 Q170 196 200 196 H222 Q252 196 262 210 L262 230 Q211 248 160 230 Z" fill="#E4DFD6" />
            <rect x="192" y="230" width="38" height="50" rx="6" fill="#FF6B5B" />
            <rect x="198" y="238" width="26" height="10" rx="3" fill="#ffffff" opacity="0.85" />

            <path d="M156 214 Q160 176 211 174 Q262 176 266 214 Q270 244 258 260 Q262 220 211 216 Q160 220 164 260 Q152 244 156 214 Z" fill="#241A10" />

            <circle cx="211" cy="238" r="50" fill="url(#skin2)" />
            <path d="M168 226 Q178 204 211 202 Q244 204 254 226" stroke="#8A5A32" strokeWidth={3} opacity="0.4" fill="none" />
            <path d="M186 226 Q194 218 204 224" stroke="#3A2414" strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M218 224 Q228 218 236 226" stroke="#3A2414" strokeWidth={4} fill="none" strokeLinecap="round" />
            <circle cx="195" cy="242" r="4.5" fill="#211208" />
            <circle cx="228" cy="242" r="4.5" fill="#211208" />
            <path d="M206 250 Q211 258 218 250" stroke="#8A5A32" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            <path d="M188 264 Q211 284 234 264 Q211 278 188 264 Z" fill="#2A180F" />
            <path d="M191 266 Q211 280 231 266" stroke="#ffffff" strokeWidth={4} fill="none" strokeLinecap="round" opacity="0.9" />

            <path d="M170 280 Q150 296 148 316 Q146 328 158 330 Q168 330 170 320 Q172 302 186 292 Z" fill="url(#skin2)" />
          </svg>
        </ParallaxFloat>

          <ParallaxFloat strength={160} className="absolute -bottom-6 -left-4 w-[210px] sm:w-[240px]">
            <motion.div
              initial={{ opacity: 0, scale: reduzida ? 1 : 0.9, y: reduzida ? 0 : 14 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                reduzida
                  ? { duration: 0.25, delay: 0.3 }
                  : { type: "spring", bounce: 0.1, duration: 0.7, delay: 0.5 }
              }
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-escuro/15 backdrop-blur-xl"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-xs font-extrabold text-white">
                MG
              </div>
              <div>
                <p className="text-xs font-bold text-escuro">Maria das Graças</p>
                <span className="my-1 inline-flex items-center gap-1 rounded-full bg-ambar-soft px-2 py-0.5 text-[9px] font-bold text-ambar-text">
                  <Star className="h-2 w-2 fill-ambar-text" strokeWidth={0} />
                  Cliente Fiel
                </span>
                <p className="text-[10px] text-neutro-muted">47 visitas · R$ 4.820</p>
              </div>
            </motion.div>
          </ParallaxFloat>
        </SpringIn>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Clientes fiéis
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Reconhece quem sempre volta.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            A Mimu identifica automaticamente seus clientes mais fiéis, para
            você tratar cada um do jeito que ele merece.
          </p>
        </SpringIn>
      </div>
    </section>
  );
}
