"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { URL_SITE } from "@/lib/site";
import {
  provedoresDisponiveis,
  ROTULO_DO_PROVEDOR,
  type ProvedorSocial,
} from "@/lib/login-social";

/**
 * Os botões de entrar com Apple e com Google.
 *
 * NÃO DESENHA NADA enquanto nenhum provedor estiver ligado em
 * lib/login-social.ts — que é o estado de hoje. O componente fica montado na
 * tela de login mesmo assim, para o dia de ligar ser só trocar um `false` por
 * `true`, sem ninguém precisar lembrar de mexer no formulário.
 *
 * Os ícones são desenhados à mão em SVG em vez de virem de uma biblioteca. A
 * Apple e o Google exigem a marca EXATA nos botões de login (é regra escrita
 * das duas), e um ícone genérico de biblioteca é justamente o que a revisão da
 * App Store devolve. O "G" colorido abaixo são as quatro cores oficiais.
 */
export function BotoesSociais({ plano = "" }: { plano?: string }) {
  const [supabase] = useState(() => createClient());
  const [carregando, setCarregando] = useState<ProvedorSocial | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const provedores = provedoresDisponiveis();
  if (provedores.length === 0) return null;

  async function entrar(provedor: ProvedorSocial) {
    setCarregando(provedor);
    setErro(null);

    /*
     * O retorno passa por /auth/callback, que troca o código por sessão.
     * O endereço vem de lib/site.ts e não de `window.location`: em app
     * empacotado o `location` é um esquema interno (capacitor://), e o
     * provedor recusa qualquer retorno que não esteja na lista dele.
     */
    const destino = new URL("/auth/callback", URL_SITE);
    if (plano) destino.searchParams.set("plano", plano);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provedor,
      options: { redirectTo: destino.toString() },
    });

    if (error) {
      setCarregando(null);
      setErro("Não consegui abrir esse login agora. Tenta de novo?");
    }
    // Sem erro, o navegador já está saindo para o provedor: manter o botão em
    // "carregando" evita um segundo toque no meio da troca de página.
  }

  return (
    <div className="flex flex-col gap-3">
      {provedores.map((provedor) => (
        <button
          key={provedor}
          type="button"
          onClick={() => entrar(provedor)}
          disabled={carregando !== null}
          className="vidro-card flex h-12 w-full items-center justify-center gap-3 rounded-full text-[15px] font-bold text-escuro disabled:opacity-60"
        >
          {provedor === "apple" ? <IconeApple /> : <IconeGoogle />}
          {carregando === provedor ? "Abrindo..." : ROTULO_DO_PROVEDOR[provedor]}
        </button>
      ))}

      {erro && (
        <p className="text-center text-[13px] text-neutro-muted">{erro}</p>
      )}
    </div>
  );
}

/** A maçã oficial, em `currentColor` para seguir o tema. */
function IconeApple() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.05 12.54c.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.71-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.18-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5zM14.86 5.6c.6-.73 1.01-1.75.9-2.76-.87.04-1.93.58-2.55 1.31-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.57-1.22z" />
    </svg>
  );
}

/** O "G" nas quatro cores oficiais — exigência da marca no botão de login. */
function IconeGoogle() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
