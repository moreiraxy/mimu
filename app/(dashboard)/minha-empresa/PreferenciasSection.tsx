"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useTema } from "@/hooks/useTema";
import { Toggle } from "@/components/ui/Toggle";
import {
  CartaoAjuste,
  TituloDeBloco,
} from "@/components/perfil/TelaDeAjuste";
import { useTipoGrafico } from "@/hooks/useTipoGrafico";
import { lerConfigAlertas } from "@/lib/config-alertas";
import type { Empresa, ConfigAlertas } from "@/types";
import type { Json } from "@/types/database";

const HORAS = Array.from({ length: 24 }, (_, h) => h);

/**
 * As preferências, uma decisão por cartão.
 *
 * Eram um cartão grande com um ícone néon e o título repetido, contendo outros
 * cartões com borda — cartão dentro de cartão, que é o que fazia esta tela
 * parecer de outro app. Agora cada ajuste é uma caixa de vidro solta, igual às
 * opções do perfil.
 */
export function PreferenciasSection({
  empresa,
  onAtualizado,
}: {
  empresa: Empresa;
  onAtualizado: (empresa: Empresa) => void;
}) {
  const ehPosto = (empresa.modulos_ativos ?? []).includes("posto");
  const { tema, alternarTema } = useTema();
  const { tipo, alternar: alternarGrafico } = useTipoGrafico();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [config, setConfig] = useState<ConfigAlertas>(() =>
    lerConfigAlertas(empresa.config_alertas),
  );

  async function salvarConfig(novaConfig: ConfigAlertas) {
    setConfig(novaConfig);
    const { error } = await supabase
      .from("empresas")
      .update({ config_alertas: novaConfig as unknown as Json })
      .eq("id", empresa.id);

    if (error) {
      showToast("Não consegui salvar as notificações.");
      return;
    }
    onAtualizado({ ...empresa, config_alertas: novaConfig as unknown as Json });
  }

  return (
    <>
      <CartaoAjuste
        titulo="Tema escuro"
        descricao="Muda a aparência do app inteiro."
        controle={
          <div className="flex items-center gap-2.5">
            {tema === "escuro" ? (
              <Moon className="h-4 w-4 text-neutro-muted" strokeWidth={2} />
            ) : (
              <Sun className="h-4 w-4 text-neutro-muted" strokeWidth={2} />
            )}
            <Toggle
              checked={tema === "escuro"}
              onChange={alternarTema}
              label="Tema escuro"
            />
          </div>
        }
      />

      {/*
        A escolha entre linha e barra mora aqui, e não só escondida num botão
        da tela de faturamento: preferência que só existe onde ela é usada é
        preferência que ninguém acha de novo depois.
      */}
      <CartaoAjuste
        titulo="Gráficos em barras"
        descricao="Desligado, os gráficos aparecem como linha."
        controle={
          <Toggle
            checked={tipo === "barra"}
            onChange={alternarGrafico}
            label="Gráficos em barras"
          />
        }
      />

      <TituloDeBloco>Alertas da Mimu</TituloDeBloco>

      {/*
        OS AVISOS DO POSTO TÊM OUTRA LISTA, E OUTRO RELÓGIO.
        "Sem venda no dia" e "Agendamentos pendentes" são do produto de salão:
        na conta dela nenhum dos dois dispara, e oferecer o botão de ligar e
        desligar algo que não existe é pior que não mostrar nada — ela liga,
        espera o aviso, e ele nunca vem.
        Os dela nascem nos horários da rotina (ver a migration
        20261015030000); o que aparece aqui é QUANDO, porque é a pergunta que
        a pessoa faz ao abrir esta tela.
      */}
      {ehPosto ? (
        <CartaoAjuste
          titulo="Avisos da sua rotina"
          descricao="Chegam 9:35, 9:50, 12:05, 14:50, 17:05 e 17:50, de segunda a sexta — bloco atrasado, prazo vencendo, assunto parado com o gerente, compromisso chegando, resumo não enviado e indicador sem anotar. Um de cada por dia."
          controle={null}
        />
      ) : (
      <>
      <CartaoAjuste
        titulo="Sem venda no dia"
        descricao="Avisa se você ainda não registrou nenhuma venda."
        controle={
          <Toggle
            checked={config.sem_venda.ativo}
            onChange={(ativo) =>
              salvarConfig({ ...config, sem_venda: { ...config.sem_venda, ativo } })
            }
            label="Aviso de dia sem venda"
          />
        }
      >
        {config.sem_venda.ativo && (
          <SeletorDeHora
            valor={config.sem_venda.hora}
            aoMudar={(hora) =>
              salvarConfig({ ...config, sem_venda: { ...config.sem_venda, hora } })
            }
          />
        )}
      </CartaoAjuste>

      <CartaoAjuste
        titulo="Agendamentos pendentes"
        descricao="Avisa se tem atendimento sem marcar como concluído."
        controle={
          <Toggle
            checked={config.agendamento_pendente.ativo}
            onChange={(ativo) =>
              salvarConfig({
                ...config,
                agendamento_pendente: { ...config.agendamento_pendente, ativo },
              })
            }
            label="Aviso de agendamento pendente"
          />
        }
      >
        {config.agendamento_pendente.ativo && (
          <SeletorDeHora
            valor={config.agendamento_pendente.hora}
            aoMudar={(hora) =>
              salvarConfig({
                ...config,
                agendamento_pendente: { ...config.agendamento_pendente, hora },
              })
            }
          />
        )}
      </CartaoAjuste>
      </>
      )}
    </>
  );
}

/**
 * A hora do aviso.
 *
 * O `<select>` nativo aparecia como uma caixa preta chapada no meio do vidro —
 * o navegador desenha o dele e ignora a tela em volta. Aqui ele fica
 * transparente por cima de uma pílula nossa: o menu que abre continua sendo o
 * do sistema (que é o certo no celular), mas a caixa fechada pertence ao app.
 */
function SeletorDeHora({
  valor,
  aoMudar,
}: {
  valor: number;
  aoMudar: (hora: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[13px] text-neutro-muted">A partir de</span>
      <span className="relative inline-flex items-center rounded-full border border-neutro-border px-3.5 py-1.5">
        <select
          value={valor}
          onChange={(e) => aoMudar(Number(e.target.value))}
          className="appearance-none bg-transparent pr-4 text-[13px] font-semibold text-escuro outline-none"
        >
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {h}h
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 text-[10px] text-neutro-muted"
        >
          ▼
        </span>
      </span>
    </label>
  );
}
