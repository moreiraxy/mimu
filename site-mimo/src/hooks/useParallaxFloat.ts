import { useEffect } from "react";

/**
 * Portado de site-v2/components/behaviors/parallax-float.tsx — mesmo
 * algoritmo (scroll parallax + flutuação orgânica contínua), só que como
 * hook real (import de módulo) em vez de script solto dependendo de
 * `beforeInteractive` no root layout do Next. Continua escaneando o DOM
 * inteiro por `[data-parallax]`/`[data-float]`, então qualquer seção pode
 * usar esses atributos sem precisar montar nada além deste hook uma vez.
 *
 * Parallax — uso:
 *   <div data-parallax data-parallax-strength="45" data-parallax-pattern="1|2">
 * Flutuação — uso:
 *   <div data-float data-float-strength="50" data-float-pattern="1|2|3">
 * Os dois atributos podem coexistir no mesmo nó.
 */
export function useParallaxFloat() {
  useEffect(() => {
    const SELECTOR_PARALLAX = "[data-parallax]";
    const SELECTOR_FLOAT = "[data-float]";
    const DEFAULT_STRENGTH = 50;
    const DEFAULT_FLOAT_STRENGTH = 50;
    const LERP = 0.14;
    const TRANSLATE_K = 0.22;
    const FLOAT_TIME = 0.82;
    const FLOAT_AMP_MAX_PX = 17;
    const EMPTY_POLL_MS = 600;

    interface EstadoNo {
      parallaxPattern: number;
      strength: number;
      y: number;
      x: number;
      sc: number;
      r: number;
      floatPattern: number;
      floatStrength: number;
      floatPhase: number;
      _tf: string;
    }

    const stateMap = new WeakMap<Element, EstadoNo>();
    let elements: Element[] = [];
    let rafId = 0;
    let emptyPollTimer = 0;

    function collectElements() {
      const seen = new Set<Element>();
      const out: Element[] = [];
      const lists = [
        document.querySelectorAll(SELECTOR_PARALLAX),
        document.querySelectorAll(SELECTOR_FLOAT),
      ];
      for (const nl of lists) {
        for (const el of Array.from(nl)) {
          if (!seen.has(el)) {
            seen.add(el);
            out.push(el);
          }
        }
      }
      elements = out;
    }

    function pruneDisconnected() {
      elements = elements.filter((el) => el.isConnected);
    }

    function cancelEmptyPoll() {
      if (emptyPollTimer) {
        clearTimeout(emptyPollTimer);
        emptyPollTimer = 0;
      }
    }

    function scheduleEmptyPoll() {
      cancelEmptyPoll();
      emptyPollTimer = window.setTimeout(() => {
        emptyPollTimer = 0;
        collectElements();
        if (elements.length && !document.hidden && !rafId) {
          rafId = requestAnimationFrame(tick);
        } else if (!elements.length) {
          scheduleEmptyPoll();
        }
      }, EMPTY_POLL_MS);
    }

    function clamp(n: number, a: number, b: number) {
      return Math.max(a, Math.min(b, n));
    }

    function normFromViewport(el: Element) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const half = vh / 2;
      return clamp((half - center) / half, -1, 1);
    }

    function parseStrength(el: Element) {
      const raw = el.getAttribute("data-parallax-strength");
      if (raw == null || raw === "") return DEFAULT_STRENGTH;
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return DEFAULT_STRENGTH;
      return clamp(n, 0, 100);
    }

    function parseFloatStrength(el: Element) {
      const raw = el.getAttribute("data-float-strength");
      if (raw == null || raw === "") return DEFAULT_FLOAT_STRENGTH;
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return DEFAULT_FLOAT_STRENGTH;
      return clamp(n, 0, 100);
    }

    function ensureParallaxPattern(el: Element) {
      const p = el.getAttribute("data-parallax-pattern");
      if (p != null && p !== "") {
        const n = parseInt(p, 10);
        if (n === 1 || n === 2) return n;
      }
      const chosen = 1 + Math.floor(Math.random() * 2);
      el.setAttribute("data-parallax-pattern", String(chosen));
      return chosen;
    }

    function ensureFloatPattern(el: Element) {
      const p = el.getAttribute("data-float-pattern");
      if (p != null && p !== "") {
        const n = parseInt(p, 10);
        if (n >= 1 && n <= 3) return n;
      }
      const chosen = 1 + Math.floor(Math.random() * 3);
      el.setAttribute("data-float-pattern", String(chosen));
      return chosen;
    }

    function getState(el: Element): EstadoNo {
      let s = stateMap.get(el);
      if (!s) {
        (el as HTMLElement).style.willChange = "transform";
        s = {
          parallaxPattern: 1,
          strength: DEFAULT_STRENGTH,
          y: 0,
          x: 0,
          sc: 1,
          r: 0,
          floatPattern: 1,
          floatStrength: DEFAULT_FLOAT_STRENGTH,
          floatPhase: Math.random() * Math.PI * 2,
          _tf: "",
        };
        if (el.hasAttribute("data-parallax")) {
          s.parallaxPattern = ensureParallaxPattern(el);
          s.strength = parseStrength(el);
        }
        if (el.hasAttribute("data-float")) {
          s.floatPattern = ensureFloatPattern(el);
          s.floatStrength = parseFloatStrength(el);
        }
        stateMap.set(el, s);
      }
      return s;
    }

    function computeParallaxTargets(el: Element, s: EstadoNo) {
      const n = normFromViewport(el);
      const f = s.strength / 100;
      const ty = s.parallaxPattern === 2 ? -n * f * 100 * TRANSLATE_K : n * f * 100 * TRANSLATE_K;
      return { ty, tx: 0, sc: 1, r: 0 };
    }

    function computeFloatOffsets(pattern: number, timeSec: number, ampPx: number, phase: number) {
      const t = timeSec * FLOAT_TIME;
      let fx: number;
      let fy: number;
      switch (pattern) {
        case 2:
          fx = Math.sin(t + phase) * ampPx;
          fy = Math.sin(2 * (t + phase)) * ampPx * 0.48;
          break;
        case 3:
          fx = ampPx * (0.58 * Math.sin(0.62 * t + phase) + 0.42 * Math.sin(1.73 * t + phase * 1.3));
          fy = ampPx * (0.58 * Math.cos(0.81 * t + phase * 0.9) + 0.42 * Math.cos(1.51 * t + phase * 1.1));
          break;
        default:
          fx = Math.cos(t + phase) * ampPx;
          fy = Math.sin(t + phase) * ampPx;
      }
      return { fx, fy };
    }

    function prefersReducedMotion() {
      return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    const reduced = prefersReducedMotion();

    function buildTransform(fx: number, fy: number, xPct: number, yPct: number, sc: number, rDeg: number) {
      return `translate3d(${fx.toFixed(2)}px,${fy.toFixed(2)}px,0) translate3d(${xPct.toFixed(3)}%,${yPct.toFixed(3)}%,0) scale(${sc.toFixed(4)}) rotate(${rDeg.toFixed(3)}deg)`;
    }

    function tick() {
      rafId = 0;
      if (document.hidden) return;

      pruneDisconnected();

      const lerp = reduced ? 1 : LERP;
      const nowSec = performance.now() * 0.001;

      if (!elements.length) {
        scheduleEmptyPoll();
        return;
      }

      for (const el of elements) {
        const s = getState(el);
        const hasP = el.hasAttribute("data-parallax");
        const hasF = el.hasAttribute("data-float");

        if (hasP) {
          s.strength = parseStrength(el);
          const t = computeParallaxTargets(el, s);
          s.y += (t.ty - s.y) * lerp;
          s.x += (t.tx - s.x) * lerp;
          s.sc += (t.sc - s.sc) * lerp;
          s.r += (t.r - s.r) * lerp;
        } else {
          s.y = 0;
          s.x = 0;
          s.sc = 1;
          s.r = 0;
        }

        let fx = 0;
        let fy = 0;
        if (hasF && !reduced) {
          s.floatStrength = parseFloatStrength(el);
          const amp = (s.floatStrength / 100) * FLOAT_AMP_MAX_PX;
          const t = computeFloatOffsets(s.floatPattern, nowSec, amp, s.floatPhase);
          fx = t.fx;
          fy = t.fy;
        }

        const tf = buildTransform(fx, fy, s.x, s.y, s.sc, s.r);
        if (hasF && !reduced) {
          (el as HTMLElement).style.transform = tf;
          s._tf = tf;
        } else if (s._tf !== tf) {
          s._tf = tf;
          (el as HTMLElement).style.transform = tf;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      cancelEmptyPoll();
      if (rafId || document.hidden) return;
      rafId = requestAnimationFrame(tick);
    }

    function init() {
      collectElements();
      if (elements.length) {
        startLoop();
      } else {
        scheduleEmptyPoll();
      }
    }

    function aoVisibilidadeMudar() {
      if (document.hidden) {
        cancelEmptyPoll();
        return;
      }
      if (elements.length) startLoop();
      else scheduleEmptyPoll();
    }

    document.addEventListener("visibilitychange", aoVisibilidadeMudar);
    init();

    return () => {
      document.removeEventListener("visibilitychange", aoVisibilidadeMudar);
      cancelEmptyPoll();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}
