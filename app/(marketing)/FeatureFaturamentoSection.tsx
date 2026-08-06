import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

export function FeatureFaturamentoSection() {
  return (
    <section id="produto" className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <SpringIn className="relative w-full max-w-[400px] flex-1">
          <svg viewBox="0 0 400 460" className="w-full rounded-card" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="salaoBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5B3E8F" />
                <stop offset="50%" stopColor="#A6459B" />
                <stop offset="100%" stopColor="#FF6B5B" />
              </linearGradient>
              <linearGradient id="skin1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A9714B" />
                <stop offset="100%" stopColor="#7C4B2E" />
              </linearGradient>
              <linearGradient id="hair1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3A2A22" />
                <stop offset="100%" stopColor="#150F0C" />
              </linearGradient>
              <linearGradient id="mirrorGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3EEFB" />
                <stop offset="100%" stopColor="#D9CDEE" />
              </linearGradient>
              <filter id="softBlur1" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            <rect width="400" height="460" fill="url(#salaoBg)" />
            <circle cx="45" cy="60" r="70" fill="#F4A653" opacity="0.22" />
            <circle cx="375" cy="410" r="90" fill="#2DBE8C" opacity="0.14" />
            <path d="M0 40 Q120 10 220 40" stroke="#ffffff" strokeWidth={2} opacity="0.18" fill="none" />
            <g opacity="0.16" fill="#ffffff">
              <circle cx="330" cy="60" r="3" />
              <circle cx="350" cy="75" r="3" />
              <circle cx="310" cy="80" r="3" />
              <circle cx="330" cy="90" r="3" />
              <circle cx="350" cy="45" r="3" />
            </g>

            <ellipse cx="185" cy="430" rx="170" ry="18" fill="#1A1024" opacity="0.28" filter="url(#softBlur1)" />

            <rect x="20" y="330" width="70" height="10" rx="5" fill="#3B2A55" />
            <rect x="30" y="340" width="6" height="60" fill="#3B2A55" />
            <rect x="70" y="340" width="6" height="60" fill="#3B2A55" />
            <rect x="33" y="270" width="16" height="60" rx="6" fill="#2DBE8C" />
            <rect x="53" y="285" width="16" height="45" rx="6" fill="#F4A653" />
            <rect x="20" y="255" width="30" height="16" rx="4" fill="#1E1E2E" opacity="0.5" />

            <rect x="255" y="330" width="16" height="50" rx="4" fill="#7A5A3A" />
            <ellipse cx="300" cy="215" rx="72" ry="92" fill="#7A5A3A" />
            <ellipse cx="300" cy="215" rx="60" ry="80" fill="url(#mirrorGlass)" />
            <path d="M270 150 Q262 210 278 270" stroke="#ffffff" strokeWidth={10} opacity="0.5" fill="none" strokeLinecap="round" />

            <path d="M340 360 Q360 360 362 385 L366 420 L316 420 L320 385 Q322 360 340 360 Z" fill="#2A2136" />
            <rect x="330" y="300" width="20" height="70" rx="8" fill="#3B2A55" />
            <rect x="308" y="250" width="64" height="60" rx="16" fill="#E8564A" />
            <path d="M320 262 V300 M336 258 V304 M352 258 V304 M368 262 V300" stroke="#C2453F" strokeWidth={3} opacity="0.6" strokeLinecap="round" />

            <path d="M118 458 Q112 360 132 320 Q140 296 172 296 H206 Q238 296 246 320 Q266 360 260 458 Z" fill="#E8564A" />
            <path d="M132 320 Q140 300 172 300 H206 Q238 300 246 320 L246 340 Q189 356 132 340 Z" fill="#C2453F" opacity="0.55" />

            <path d="M150 210 Q120 190 100 240 Q84 280 108 340 Q120 360 138 348 Q120 300 132 260 Q140 232 150 210 Z" fill="url(#hair1)" />
            <path d="M228 210 Q262 186 282 236 Q296 278 268 336 Q254 358 238 344 Q258 298 246 258 Q236 230 228 210 Z" fill="url(#hair1)" />
            <path d="M138 172 Q189 130 240 172 Q252 210 240 252 Q236 200 189 194 Q142 200 138 252 Q126 210 138 172 Z" fill="url(#hair1)" />
            <path d="M150 176 Q160 150 189 148" stroke="#5A4438" strokeWidth={4} opacity="0.5" fill="none" strokeLinecap="round" />

            <circle cx="189" cy="228" r="52" fill="url(#skin1)" />
            <path d="M144 218 Q150 194 189 190 Q228 194 234 218" stroke="#5C3A22" strokeWidth={3} opacity="0.4" fill="none" />
            <path d="M162 216 Q170 208 180 214" stroke="#2A1810" strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M198 214 Q208 208 216 216" stroke="#2A1810" strokeWidth={4} fill="none" strokeLinecap="round" />
            <circle cx="172" cy="232" r="4.5" fill="#211208" />
            <circle cx="207" cy="232" r="4.5" fill="#211208" />
            <path d="M186 238 Q189 248 184 252" stroke="#5C3A22" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M168 262 Q189 276 210 262" stroke="#5C2A22" strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M172 264 Q189 272 206 264" fill="#B85A4E" opacity="0.7" />
            <circle cx="146" cy="240" r="3.5" fill="#F4A653" />

            <path d="M240 250 Q276 232 296 254 Q304 264 296 274 Q288 282 278 274 Q262 262 240 268 Z" fill="url(#skin1)" />
            <g transform="rotate(20 300 250)">
              <rect x="292" y="238" width="58" height="22" rx="11" fill="#F7F6F3" />
              <path d="M350 244 L372 249 L350 254 Z" fill="#D9D4CC" />
              <circle cx="303" cy="249" r="6" fill="#FF6B5B" />
            </g>
          </svg>

          <ParallaxFloat strength={16} className="absolute -bottom-6 -right-4 w-[190px] sm:w-[220px]">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-escuro/15 backdrop-blur-xl">
              <p className="mb-1.5 text-[11px] text-neutro-muted">Faturamento previsto</p>
              <p className="mb-2.5 text-xl font-extrabold text-escuro">R$ 470</p>
              <div className="h-1.5 w-full rounded-full bg-neutro-disabled">
                <div className="h-full w-[70%] rounded-full bg-coral" />
              </div>
            </div>
          </ParallaxFloat>
        </SpringIn>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Faturamento previsto
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Sabe quanto vai entrar antes de entrar.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            A Mimu cruza sua agenda com seu histórico e mostra o que já é
            certo e o que ainda é previsão, pra você planejar sem susto.
          </p>
        </SpringIn>
      </div>
    </section>
  );
}
