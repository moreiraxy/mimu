"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useValores } from "@/hooks/useValores";
import { Widget } from "./Widget";
import { MenuDoWidget } from "./MenuDoWidget";
import { FolhaDeWidgets } from "./FolhaDeWidgets";
import {
  CLASSES_TAMANHO,
  definicaoDe,
  gravarPainel,
  lerPainel,
  type IdWidget,
  type TamanhoWidget,
  type WidgetNoPainel,
} from "@/lib/widgets";
import { cn } from "@/lib/utils";

/**
 * O painel montável.
 *
 * Ele guarda a LISTA (quais widgets, em que ordem, de que tamanho) e nada mais:
 * quem desenha cada widget é a função `conteudo`, que o painel recebe pronta.
 * Assim acrescentar um widget novo é acrescentar uma entrada no catálogo e um
 * caso naquela função — sem tocar em gesto, menu, edição ou persistência.
 */
export function PainelDeWidgets({
  modulos,
  conteudo,
}: {
  modulos: readonly string[];
  conteudo: (id: IdWidget, tamanho: TamanhoWidget) => React.ReactNode;
}) {
  const { alternar: alternarValores } = useValores();

  /*
   * Nasce vazio e é preenchido num efeito.
   *
   * `localStorage` não existe no servidor: ler no estado inicial faria o HTML
   * do servidor e o do navegador discordarem na hidratação, e o React apagaria
   * e redesenharia a árvore. O piscar de um quadro é melhor que isso.
   */
  const [painel, setPainel] = useState<WidgetNoPainel[] | null>(null);
  const [editando, setEditando] = useState(false);
  const [menuDe, setMenuDe] = useState<IdWidget | null>(null);
  const [ancora, setAncora] = useState<{ x: number; y: number } | null>(null);
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    setPainel(lerPainel(modulos));
  }, [modulos]);

  function salvar(novo: WidgetNoPainel[]) {
    setPainel(novo);
    gravarPainel(novo);
  }

  function mover(id: IdWidget, passo: number) {
    if (!painel) return;
    const i = painel.findIndex((w) => w.id === id);
    const j = i + passo;
    if (i < 0 || j < 0 || j >= painel.length) return;
    const novo = [...painel];
    [novo[i], novo[j]] = [novo[j]!, novo[i]!];
    salvar(novo);
  }

  if (!painel) return null;

  const emMenu = menuDe ? definicaoDe(menuDe) : null;
  const tamanhoNoMenu = painel.find((w) => w.id === menuDe)?.tamanho ?? "medio";

  return (
    <>
      {editando && (
        /*
          O cabeçalho da edição, como na referência: o que está acontecendo à
          esquerda e a saída à direita. Fica grudado no topo porque a lista é
          longa — sem isso, quem rolar até o fim perde o "Concluído" de vista e
          fica sem saber como sair.
        */
        <div className="gruda-no-topo z-20 -mx-4 mb-1 flex items-center justify-between px-4 py-3">
          <p className="text-[22px] font-bold text-escuro">Editar widgets</p>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-text"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Concluído
          </button>
        </div>
      )}

      {/* Espaço de 16px entre widgets — medido na referência (58px de
          aparelho a 3×). Estava em 12 e as peças se encostavam. */}
      <div className="grid grid-cols-2 gap-4">
        {painel.map((w, i) => (
          <Widget
            key={w.id}
            className={CLASSES_TAMANHO[w.tamanho]}
            editando={editando}
            podeSubir={i > 0}
            podeDescer={i < painel.length - 1}
            aoSegurar={(ponto) => {
              setAncora(ponto);
              setMenuDe(w.id);
            }}
            aoRemover={() => salvar(painel.filter((x) => x.id !== w.id))}
            aoSubir={() => mover(w.id, -1)}
            aoDescer={() => mover(w.id, 1)}
          >
            {conteudo(w.id, w.tamanho)}
          </Widget>
        ))}
      </div>

      {/*
        "Adicionar widgets" fica SEMPRE, no fim da lista — não só no modo de
        edição.

        No vídeo da referência ele é uma pílula permanente depois do último
        widget, e faz sentido: para acrescentar algo, ninguém pensa "primeiro
        preciso entrar num modo". Escondê-lo atrás do modo de edição
        transformava a montagem do painel num recurso que só quem já sabe que
        existe encontra.
      */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setAdicionando(true)}
          className="vidro-card flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold text-escuro"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
          Adicionar widgets
        </button>
      </div>

      <MenuDoWidget
        aberto={menuDe !== null}
        aoFechar={() => setMenuDe(null)}
        ancora={ancora}
        tamanhoAtual={tamanhoNoMenu}
        tamanhos={emMenu?.tamanhos ?? []}
        aoTrocarTamanho={(t) => {
          salvar(
            painel.map((w) => (w.id === menuDe ? { ...w, tamanho: t } : w)),
          );
          setMenuDe(null);
        }}
        aoRemover={() => {
          salvar(painel.filter((w) => w.id !== menuDe));
          setMenuDe(null);
        }}
        aoEditar={() => {
          setEditando(true);
          setMenuDe(null);
        }}
        aoOcultar={() => {
          alternarValores();
          setMenuDe(null);
        }}
      />

      <FolhaDeWidgets
        aberta={adicionando}
        aoFechar={() => setAdicionando(false)}
        modulos={modulos}
        jaNoPainel={painel.map((w) => w.id)}
        aoAdicionar={(id) => {
          const def = definicaoDe(id)!;
          salvar([...painel, { id, tamanho: def.tamanhos[0]! }]);
          setAdicionando(false);
        }}
      />
    </>
  );
}
