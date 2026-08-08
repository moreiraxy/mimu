
                        (function () {
                          "use strict";

                          var SELECTOR = "[data-marquee-viewport]:not([data-marquee-ready])";

                          function stripIds(root) {
                            if (root.id) root.removeAttribute("id");
                            var all = root.querySelectorAll("[id]");
                            for (var i = 0; i < all.length; i++) {
                              all[i].removeAttribute("id");
                            }
                          }

                          /**
                           * Encontra o nó da Collection List publicada (.w-dyn-list) dentro do viewport.
                           * querySelector não inclui o próprio elemento — tratamos viewport === .w-dyn-list.
                           */
                          function findWfCollectionList(viewport) {
                            if (!viewport || viewport.nodeType !== 1) return null;

                            if (viewport.classList && viewport.classList.contains("w-dyn-list")) {
                              return viewport.closest("[data-marquee-track]") ? null : viewport;
                            }

                            var list =
                              viewport.querySelector(":scope > .w-dyn-list") ||
                              viewport.querySelector(".w-dyn-list");

                            if (!list || !viewport.contains(list)) return null;
                            if (list.closest("[data-marquee-track]")) return null;

                            return list;
                          }

                          function initViewport(viewport) {
                            if (viewport.hasAttribute("data-marquee-ready")) return;

                            if (viewport.querySelector(":scope > [data-marquee-track]")) {
                              viewport.setAttribute("data-marquee-ready", "");
                              return;
                            }

                            var list = findWfCollectionList(viewport);
                            if (!list) return;

                            var holder = list.parentNode;
                            if (!holder || !holder.contains(list)) return;

                            var track = document.createElement("div");
                            track.setAttribute("data-marquee-track", "");

                            holder.insertBefore(track, list);
                            track.appendChild(list);

                            var duplicate = list.cloneNode(true);
                            duplicate.setAttribute("data-marquee-duplicate", "");
                            stripIds(duplicate);
                            track.appendChild(duplicate);

                            var sec = viewport.getAttribute("data-marquee-duration");
                            if (sec) {
                              var n = parseFloat(sec, 10);
                              if (!isNaN(n) && n > 0) {
                                track.style.setProperty("--marquee-duration", n + "s");
                              }
                            }

                            viewport.setAttribute("data-marquee-ready", "");
                          }

                          function scan() {
                            document.querySelectorAll(SELECTOR).forEach(initViewport);
                          }

                          if (document.readyState === "loading") {
                            document.addEventListener("DOMContentLoaded", scan);
                          } else {
                            scan();
                          }

                          var t;
                          var obs = new MutationObserver(function () {
                            clearTimeout(t);
                            t = setTimeout(scan, 80);
                          });
                          obs.observe(document.documentElement, { childList: true, subtree: true });
                        })();

                        (function () {
                          "use strict";

                          var OPEN = '"';
                          var CLOSE = '"';

                          function makeSpan() {
                            var s = document.createElement("span");
                            s.className = "wf-text-quote";
                            s.setAttribute("aria-hidden", "true");
                            return s;
                          }

                          function decorate(el) {
                            if (!el || el.nodeType !== 1) return;
                            if (el.classList.contains("wf-text-quotes--done")) return;
                            if (el.closest(".wf-text-quote")) return;

                            var open = makeSpan();
                            open.textContent = OPEN;
                            var close = makeSpan();
                            close.textContent = CLOSE;

                            if (el.firstChild) {
                              el.insertBefore(open, el.firstChild);
                            } else {
                              el.appendChild(open);
                            }
                            el.appendChild(close);
                            el.classList.add("wf-text-quotes--done");
                          }

                          function scan() {
                            document
                              .querySelectorAll("[data-text-quotes]:not(.wf-text-quotes--done)")
                              .forEach(decorate);
                          }

                          if (document.readyState === "loading") {
                            document.addEventListener("DOMContentLoaded", scan);
                          } else {
                            scan();
                          }

                          var t;
                          var obs = new MutationObserver(function () {
                            clearTimeout(t);
                            t = setTimeout(scan, 50);
                          });
                          obs.observe(document.documentElement, { childList: true, subtree: true });
                        })();
                      