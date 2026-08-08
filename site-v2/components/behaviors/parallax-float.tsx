/* Gerado por tools/gen-app.mjs a partir do <script> inline #01
   do clone estatico. Parallax de scroll + flutuacao continua.
   Codigo preservado 1:1; apenas movido para dentro de um useEffect.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function ParallaxFloat() {
  useEffect(() => {
    /**
                       * Parallax (scroll) + flutuação contínua (órbita / “mouse”).
                       *
                       * Parallax — uso:
                       *   <div data-parallax>…</div>
                       *   data-parallax-strength="45"   — 0–100 (padrão: 50)
                       *   data-parallax-pattern="1|2"   — opcional; senão sorteia 1 ou 2 uma vez
                       *
                       * Parallax — padrões:
                       *   1 — vertical invertido
                       *   2 — vertical direto
                       *
                       * Flutuação — uso:
                       *   <div data-float>…</div>
                       *   data-float-strength="50"      — 0–100 (padrão: 50), amplitude em px
                       *   data-float-pattern="1|2|3"    — opcional; senão sorteia 1–3 uma vez
                       *
                       * Flutuação — padrões:
                       *   1 — círculo
                       *   2 — oito / lemniscata
                       *   3 — deriva com duas frequências (trajetória orgânica)
                       *
                       * Pode combinar nos mesmos nós: data-parallax e data-float.
                       *
                       * Performance: cache de nós, pausa com aba oculta, `transform` só quando muda
                       * (exceto com flutuação ativa, que muda todo frame). Dinâmico:
                       *   window.parallaxScrollRefresh && parallaxScrollRefresh();
                       */

                      (function () {
                        "use strict";

                        var SELECTOR_PARALLAX = "[data-parallax]";
                        var SELECTOR_FLOAT = "[data-float]";
                        var DEFAULT_STRENGTH = 50;
                        var DEFAULT_FLOAT_STRENGTH = 50;
                        var LERP = 0.14;
                        var TRANSLATE_K = 0.22;
                        var FLOAT_TIME = 0.82;
                        var FLOAT_AMP_MAX_PX = 17;
                        var EMPTY_POLL_MS = 600;

                        var stateMap = new WeakMap();
                        var elements = [];
                        var rafId = 0;
                        var emptyPollTimer = 0;

                        function collectElements() {
                          var seen = new Set();
                          var out = [];
                          var lists = [
                            document.querySelectorAll(SELECTOR_PARALLAX),
                            document.querySelectorAll(SELECTOR_FLOAT),
                          ];
                          var L;
                          var nl;
                          var i;
                          var el;
                          for (L = 0; L < lists.length; L++) {
                            nl = lists[L];
                            for (i = 0; i < nl.length; i++) {
                              el = nl[i];
                              if (!seen.has(el)) {
                                seen.add(el);
                                out.push(el);
                              }
                            }
                          }
                          elements = out;
                        }

                        function pruneDisconnected() {
                          var i;
                          var el;
                          var w = 0;
                          for (i = 0; i < elements.length; i++) {
                            el = elements[i];
                            if (el.isConnected) {
                              elements[w++] = el;
                            }
                          }
                          elements.length = w;
                        }

                        function cancelEmptyPoll() {
                          if (emptyPollTimer) {
                            clearTimeout(emptyPollTimer);
                            emptyPollTimer = 0;
                          }
                        }

                        function scheduleEmptyPoll() {
                          cancelEmptyPoll();
                          emptyPollTimer = setTimeout(function () {
                            emptyPollTimer = 0;
                            collectElements();
                            if (elements.length && !document.hidden && !rafId) {
                              rafId = requestAnimationFrame(tick);
                            } else if (!elements.length) {
                              scheduleEmptyPoll();
                            }
                          }, EMPTY_POLL_MS);
                        }

                        function clamp(n, a, b) {
                          return Math.max(a, Math.min(b, n));
                        }

                        function normFromViewport(el) {
                          var rect = el.getBoundingClientRect();
                          var vh = window.innerHeight || 1;
                          var center = rect.top + rect.height / 2;
                          var half = vh / 2;
                          return clamp((half - center) / half, -1, 1);
                        }

                        function parseStrength(el) {
                          var raw = el.getAttribute("data-parallax-strength");
                          if (raw == null || raw === "") return DEFAULT_STRENGTH;
                          var n = parseFloat(raw);
                          if (Number.isNaN(n)) return DEFAULT_STRENGTH;
                          return clamp(n, 0, 100);
                        }

                        function parseFloatStrength(el) {
                          var raw = el.getAttribute("data-float-strength");
                          if (raw == null || raw === "") return DEFAULT_FLOAT_STRENGTH;
                          var n = parseFloat(raw);
                          if (Number.isNaN(n)) return DEFAULT_FLOAT_STRENGTH;
                          return clamp(n, 0, 100);
                        }

                        function ensureParallaxPattern(el) {
                          var p = el.getAttribute("data-parallax-pattern");
                          if (p != null && p !== "") {
                            var n = parseInt(p, 10);
                            if (n === 1 || n === 2) return n;
                          }
                          var chosen = 1 + Math.floor(Math.random() * 2);
                          el.setAttribute("data-parallax-pattern", String(chosen));
                          return chosen;
                        }

                        function ensureFloatPattern(el) {
                          var p = el.getAttribute("data-float-pattern");
                          if (p != null && p !== "") {
                            var n = parseInt(p, 10);
                            if (n >= 1 && n <= 3) return n;
                          }
                          var chosen = 1 + Math.floor(Math.random() * 3);
                          el.setAttribute("data-float-pattern", String(chosen));
                          return chosen;
                        }

                        function getState(el) {
                          var s = stateMap.get(el);
                          if (!s) {
                            el.style.willChange = "transform";
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

                        function computeParallaxTargets(el, s) {
                          var n = normFromViewport(el);
                          var f = s.strength / 100;
                          var ty = 0;
                          if (s.parallaxPattern === 2) {
                            ty = -n * f * 100 * TRANSLATE_K;
                          } else {
                            ty = n * f * 100 * TRANSLATE_K;
                          }
                          return { ty: ty, tx: 0, sc: 1, r: 0 };
                        }

                        function computeFloatOffsets(pattern, timeSec, ampPx, phase) {
                          var t = timeSec * FLOAT_TIME;
                          var fx;
                          var fy;
                          switch (pattern) {
                            case 2:
                              fx = Math.sin(t + phase) * ampPx;
                              fy = Math.sin(2 * (t + phase)) * ampPx * 0.48;
                              break;
                            case 3:
                              fx =
                                ampPx *
                                (0.58 * Math.sin(0.62 * t + phase) +
                                  0.42 * Math.sin(1.73 * t + phase * 1.3));
                              fy =
                                ampPx *
                                (0.58 * Math.cos(0.81 * t + phase * 0.9) +
                                  0.42 * Math.cos(1.51 * t + phase * 1.1));
                              break;
                            default:
                              fx = Math.cos(t + phase) * ampPx;
                              fy = Math.sin(t + phase) * ampPx;
                          }
                          return { fx: fx, fy: fy };
                        }

                        function prefersReducedMotion() {
                          return (
                            typeof window.matchMedia === "function" &&
                            window.matchMedia("(prefers-reduced-motion: reduce)").matches
                          );
                        }

                        var reduced = prefersReducedMotion();

                        function buildTransform(fx, fy, xPct, yPct, sc, rDeg) {
                          return (
                            "translate3d(" +
                            fx.toFixed(2) +
                            "px," +
                            fy.toFixed(2) +
                            "px,0) translate3d(" +
                            xPct.toFixed(3) +
                            "%," +
                            yPct.toFixed(3) +
                            "%,0) scale(" +
                            sc.toFixed(4) +
                            ") rotate(" +
                            rDeg.toFixed(3) +
                            "deg)"
                          );
                        }

                        function tick() {
                          rafId = 0;
                          if (document.hidden) return;

                          pruneDisconnected();

                          var i;
                          var el;
                          var s;
                          var t;
                          var lerp = reduced ? 1 : LERP;
                          var tf;
                          var hasP;
                          var hasF;
                          var fx;
                          var fy;
                          var amp;
                          var nowSec = performance.now() * 0.001;

                          if (!elements.length) {
                            scheduleEmptyPoll();
                            return;
                          }

                          for (i = 0; i < elements.length; i++) {
                            el = elements[i];
                            s = getState(el);
                            hasP = el.hasAttribute("data-parallax");
                            hasF = el.hasAttribute("data-float");

                            if (hasP) {
                              s.strength = parseStrength(el);
                              t = computeParallaxTargets(el, s);
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

                            fx = 0;
                            fy = 0;
                            if (hasF && !reduced) {
                              s.floatStrength = parseFloatStrength(el);
                              amp = (s.floatStrength / 100) * FLOAT_AMP_MAX_PX;
                              t = computeFloatOffsets(s.floatPattern, nowSec, amp, s.floatPhase);
                              fx = t.fx;
                              fy = t.fy;
                            }

                            tf = buildTransform(fx, fy, s.x, s.y, s.sc, s.r);
                            if (hasF && !reduced) {
                              el.style.transform = tf;
                              s._tf = tf;
                            } else if (s._tf !== tf) {
                              s._tf = tf;
                              el.style.transform = tf;
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

                        document.addEventListener("visibilitychange", function () {
                          if (document.hidden) {
                            cancelEmptyPoll();
                            return;
                          }
                          if (elements.length) startLoop();
                          else scheduleEmptyPoll();
                        });

                        window.parallaxScrollRefresh = function () {
                          collectElements();
                          if (elements.length) startLoop();
                        };

                        if (document.readyState === "loading") {
                          document.addEventListener("DOMContentLoaded", init);
                        } else {
                          init();
                        }
                      })();
  }, []);

  return null;
}
