/* Gerado por tools/gen-app.mjs a partir do <script> inline #02
   do clone estatico. Componente de tabs (.tab_wrap_simple).
   ADAPTADO: o codigo original estava dentro de
   document.addEventListener("DOMContentLoaded", ...). Esse evento ja
   disparou quando o React hidrata, entao o embrulho foi removido e o
   corpo roda direto no useEffect. Logica interna intacta.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function Tabs() {
  useEffect(() => {
    document
                                .querySelectorAll(".tab_wrap_simple")
                                .forEach((tabWrap, componentIndex) => {
                                  // Previne inicialização duplicada
                                  if (tabWrap.dataset.scriptInitialized) return;
                                  tabWrap.dataset.scriptInitialized = "true";

                                  // Configurações básicas
                                  let duration = Number(tabWrap.getAttribute("data-duration")) || 0.3,
                                    buttonList = tabWrap.querySelector(".tab_button_list"),
                                    panelList = tabWrap.querySelector(".tab_content_list");

                                  // Processa estrutura do Webflow CMS
                                  function flattenDisplayContents(slot) {
                                    if (!slot) return;
                                    let child = slot.firstElementChild;
                                    while (child && child.classList.contains("u-display-contents")) {
                                      while (child.firstChild) {
                                        slot.insertBefore(child.firstChild, child);
                                      }
                                      slot.removeChild(child);
                                      child = slot.firstElementChild;
                                    }
                                  }
                                  flattenDisplayContents(buttonList);
                                  flattenDisplayContents(panelList);

                                  function removeCMSList(slot) {
                                    const dynList = Array.from(slot.children).find((child) =>
                                      child.classList.contains("w-dyn-list"),
                                    );
                                    if (!dynList) return;
                                    const nestedItems =
                                      dynList?.querySelector(".w-dyn-items")?.children;
                                    if (!nestedItems) return;
                                    const staticWrapper = [...slot.children];
                                    [...nestedItems].forEach((el) => {
                                      const c = [...el.children].find(
                                        (c) => !c.classList.contains("w-condition-invisible"),
                                      );
                                      c && slot.appendChild(c);
                                    });
                                    staticWrapper.forEach((el) => el.remove());
                                  }
                                  removeCMSList(buttonList);
                                  removeCMSList(panelList);

                                  let buttonItems = Array.from(buttonList.children);
                                  let panelItems = Array.from(panelList.children);

                                  // Validação
                                  if (
                                    !buttonList ||
                                    !panelList ||
                                    !buttonItems.length ||
                                    !panelItems.length
                                  ) {
                                    console.warn("Missing elements in:", tabWrap);
                                    return;
                                  }

                                  // Setup inicial - esconde todos os painéis
                                  panelItems.forEach((panel) => {
                                    panel.style.display = "none";
                                    panel.setAttribute("role", "tabpanel");
                                  });

                                  // Configura acessibilidade (ARIA)
                                  buttonList.setAttribute("role", "tablist");
                                  buttonItems.forEach((btn) => btn.setAttribute("role", "tab"));

                                  let activeIndex = -1; // Começa como -1 para permitir primeira ativação
                                  let animating = false;

                                  // Função principal - ativa uma tab
                                  const makeActive = (index, focus = false) => {
                                    if (animating) return;
                                    if (index === activeIndex) return; // Não faz nada se já estiver ativa

                                    // Atualiza classes e atributos ARIA nos botões
                                    buttonItems.forEach((btn, i) => {
                                      btn.classList.toggle("is-active", i === index);
                                      btn.setAttribute("aria-selected", i === index ? "true" : "false");
                                      btn.setAttribute("tabindex", i === index ? "0" : "-1");
                                    });

                                    // Atualiza classes nos painéis
                                    panelItems.forEach((panel, i) =>
                                      panel.classList.toggle("is-active", i === index),
                                    );

                                    // Move foco se necessário
                                    if (focus) buttonItems[index].focus();

                                    const previousPanel = panelItems[activeIndex];
                                    const currentPanel = panelItems[index];

                                    // Animação com GSAP (se disponível)
                                    if (typeof gsap !== "undefined") {
                                      animating = true;
                                      let tl = gsap.timeline({
                                        onComplete: () => {
                                          animating = false;
                                          if (typeof ScrollTrigger !== "undefined")
                                            ScrollTrigger.refresh();
                                        },
                                        defaults: { duration: duration, ease: "power1.out" },
                                      });

                                      // Fade out painel anterior
                                      if (previousPanel) tl.to(previousPanel, { opacity: 0 });
                                      if (previousPanel) tl.set(previousPanel, { display: "none" });

                                      // Fade in painel atual
                                      tl.set(currentPanel, { display: "block" });
                                      tl.fromTo(currentPanel, { opacity: 0 }, { opacity: 1 });
                                    } else {
                                      // Fallback sem GSAP
                                      if (previousPanel) previousPanel.style.display = "none";
                                      if (currentPanel) currentPanel.style.display = "block";
                                    }

                                    activeIndex = index;
                                  };

                                  // Ativa primeira tab
                                  makeActive(0, false);

                                  // Configura eventos nos botões
                                  buttonItems.forEach((btn, index) => {
                                    // IDs únicos para acessibilidade
                                    let tabId = tabWrap.getAttribute("data-tab-component-id");
                                    tabId = tabId
                                      ? tabId.toLowerCase().replaceAll(" ", "-")
                                      : "tab-" + (componentIndex + 1);
                                    let itemId = btn.getAttribute("data-tab-item-id");
                                    itemId = itemId
                                      ? itemId.toLowerCase().replaceAll(" ", "-")
                                      : "item-" + (index + 1);

                                    btn.setAttribute("id", "tab-button-" + tabId + "-" + itemId);
                                    btn.setAttribute(
                                      "aria-controls",
                                      "tab-panel-" + tabId + "-" + itemId,
                                    );
                                    panelItems[index]?.setAttribute(
                                      "id",
                                      "tab-panel-" + tabId + "-" + itemId,
                                    );
                                    panelItems[index]?.setAttribute("aria-labelledby", btn.id);

                                    // Deep linking via URL (opcional)
                                    if (
                                      new URLSearchParams(location.search).get("tab-id") ===
                                      tabId + "-" + itemId
                                    ) {
                                      makeActive(index);
                                      tabWrap.scrollIntoView({ behavior: "smooth", block: "start" });
                                      history.replaceState(
                                        {},
                                        "",
                                        ((u) => (u.searchParams.delete("tab-id"), u))(
                                          new URL(location.href),
                                        ),
                                      );
                                    }

                                    // Click nos botões
                                    btn.addEventListener("click", () => makeActive(index));

                                    // Navegação por teclado
                                    btn.addEventListener("keydown", (e) => {
                                      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                                        e.preventDefault();
                                        const nextIndex = (index + 1) % buttonItems.length;
                                        makeActive(nextIndex, true);
                                      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                                        e.preventDefault();
                                        const prevIndex =
                                          (index - 1 + buttonItems.length) % buttonItems.length;
                                        makeActive(prevIndex, true);
                                      }
                                    });
                                  });
                                });
  }, []);

  return null;
}
