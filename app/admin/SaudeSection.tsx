"use client";

import { useEffect, useState } from "react";

/**
 * O que aconteceu no produto nas últimas 24 horas.
 *
 * Existe por causa de três apagões que ninguém viu acontecer: o cadastro
 * quebrado por três dias devolvendo 500, a Mimu muda por horas depois que a
 * Groq aposentou o modelo, e o aviso de novo cadastro que nunca chegou. Nos
 * três casos o erro existia e morria no log do servidor.
 *
 * A leitura pretendida é de dois segundos: se há número vermelho, alguma
 * coisa está quebrada agora. As linhas abaixo dizem o quê.
 */

interface Evento {
  id: string;
  tipo: string;
  detalhe: Record<string, unknown> | null;
  created_at: string;
}

const ROTULO: Record<string, string> = {
  cadastro: "Cadastros",
  cadastro_falhou: "Cadastros que falharam",
  login: "Acessos",
  login_falhou: "Logins recusados",
  email_confirmado: "E-mails confirmados",
  mimu_respondeu: "Respostas da Mimu",
  mimu_falhou: "Mimu falhou",
  push_falhou: "Notificações que não saíram",
};

/** Os que significam problema. São os únicos que ganham destaque. */
const FALHAS = new Set([
  "cadastro_falhou",
  "mimu_falhou",
  "push_falhou",
]);

/**
 * Login recusado fica de fora das falhas de propósito: senha errada é o
 * sistema funcionando. Só vira sinal quando é muito, e para isso o número
 * está lá para ser lido.
 */
const ORDEM = [
  "cadastro",
  "login",
  "cadastro_falhou",
  "mimu_falhou",
  "push_falhou",
  "login_falhou",
];

function quando(iso: string): string {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min atrás`;
  const horas = Math.floor(minutos / 60);
  return `${horas}h atrás`;
}

export function SaudeSection() {
  const [contagem, setContagem] = useState<Record<string, number> | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/eventos")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!ativo) return;
        setContagem(d.contagem);
        setEventos(d.eventos);
      })
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) return null;

  const falhasRecentes = eventos.filter((e) => FALHAS.has(e.tipo)).slice(0, 6);
  const semNada = contagem !== null && Object.keys(contagem).length === 0;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-escuro">
          Últimas 24 horas
        </h2>
        {semNada && (
          <span className="text-xs text-neutro-muted">
            Nada registrado ainda
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ORDEM.map((tipo) => {
          const valor = contagem?.[tipo] ?? 0;
          const ruim = FALHAS.has(tipo) && valor > 0;
          return (
            <div
              key={tipo}
              className={`rounded-card border p-3 ${
                ruim
                  ? "border-erro-texto/30 bg-erro-light"
                  : "border-neutro-border bg-superficie"
              }`}
            >
              <p className="text-xs text-neutro-muted">{ROTULO[tipo]}</p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  ruim ? "text-erro-texto" : "text-escuro"
                }`}
              >
                {contagem === null ? "—" : valor}
              </p>
            </div>
          );
        })}
      </div>

      {falhasRecentes.length > 0 && (
        <div className="mt-3 rounded-card border border-neutro-border bg-superficie">
          {falhasRecentes.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-4 border-b border-neutro-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-erro-texto">
                  {ROTULO[e.tipo] ?? e.tipo}
                </p>
                {/* O motivo cru, sem tradução: quem lê aqui é quem vai
                    consertar, e a mensagem original é o que serve para
                    procurar. */}
                <p className="mt-0.5 break-words text-xs text-neutro-muted">
                  {String(
                    (e.detalhe as { motivo?: unknown } | null)?.motivo ??
                      JSON.stringify(e.detalhe ?? {}),
                  ).slice(0, 160)}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-neutro-muted">
                {quando(e.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
