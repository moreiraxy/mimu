"use client";

import { usePathname } from "next/navigation";

import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { modulosLiberados } from "@/lib/planos";
import { planoEfetivo } from "@/lib/assinatura";
import type { Empresa, ModuloAtivo } from "@/types";
import type {
  OrigemPagamento,
  PlanoAssinatura,
  StatusAssinatura,
} from "@/types/database";

/** O que a tela de plano precisa saber da assinatura. */
export interface AssinaturaResumo {
  status: StatusAssinatura;
  plano: PlanoAssinatura;
  trial_fim: string | null;
  proxima_cobranca: string | null;
  /**
   * Por onde a assinatura foi comprada.
   *
   * Decide para onde vai o cancelamento: quem assinou pela Apple só cancela
   * na Apple, em Ajustes → Assinaturas, e oferecer aqui um botão que não
   * funcionaria seria pior do que não oferecer nada.
   */
  origem: OrigemPagamento | null;
}

export interface AuthContextValue {
  user: User | null;
  empresa: Empresa | null;
  /**
   * O plano da conta ("free", "pro", "premium"...), ou null enquanto carrega.
   *
   * Serve para as telas falarem do plano. Para decidir o que mostrar, use
   * `modulos` — ver o porquê logo abaixo.
   */
  plano: string | null;
  /**
   * O estado da assinatura, para a tela de plano falar dele.
   *
   * Só os campos que a tela usa, e não a linha inteira: `valor_mensal` e os
   * ids de provedor não têm o que fazer no navegador.
   */
  assinatura: AssinaturaResumo | null;
  /**
   * Os módulos que a conta pode usar DE VERDADE: o que ela escolheu no
   * onboarding, limitado ao teto do plano dela.
   *
   * É esta lista que a navegação e as telas devem ler, e nunca
   * `empresa.modulos_ativos` cru. A diferença entre as duas é justamente o
   * que o plano gratuito não inclui: ler a lista crua mostra agenda, estoque
   * e a Mimu para quem não paga por eles.
   *
   * Vem pronta de propósito, e não como `plano` + uma função para cada tela
   * chamar. Teto que depende de cada consumidor lembrar de aplicar é teto que
   * uma tela nova vai furar sem ninguém perceber.
   */
  modulos: ModuloAtivo[];
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  /**
   * Troca a empresa em memória depois de uma alteração salva.
   *
   * Existe porque a tela de Minha Empresa guardava o resultado num estado
   * dela mesma. O banco era atualizado, a tela mostrava o novo valor, e o
   * resto do app seguia com a lista velha: quem ligava o módulo da Mimu
   * depois de entrar não via o item aparecer no menu, e ficava sem caminho
   * para o chat até recarregar a página inteira.
   *
   * Recebe a empresa já pronta em vez de buscar de novo: quem salvou acabou
   * de escrever esses dados e não precisa perguntar ao banco o que ela mesma
   * mandou gravar.
   */
  atualizarEmpresa: (empresa: Empresa) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  /**
   * De quem é a empresa que já está carregada.
   *
   * Sem isto, a empresa era buscada duas vezes em todo carregamento: o
   * `getUser()` e o `onAuthStateChange` disparam os dois na montagem, e cada
   * um chamava `loadEmpresa`. Pior que o pedido repetido era a consequência:
   * cada resposta criava um OBJETO novo de empresa, e quem depende dela (o
   * painel inteiro) refazia as próprias consultas. Medido num celular médio,
   * eram 15 idas ao Supabase para montar o painel, com as mesmas quatro
   * tabelas buscadas três vezes cada.
   */
  const donoCarregado = useRef<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [plano, setPlano] = useState<string | null>(null);
  const [assinatura, setAssinatura] = useState<AssinaturaResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresa = useCallback(
    async (userId: string) => {
      if (donoCarregado.current === userId) return;
      donoCarregado.current = userId;

      /*
       * A assinatura vem junto, num join, e não numa segunda consulta.
       *
       * O plano decide o que a navegação mostra: buscá-lo depois faria o menu
       * nascer com o teto errado e se corrigir sozinho um instante depois —
       * exatamente o piscar que o comentário do layout do dashboard conta
       * ter acontecido com os módulos.
       *
       * A RLS deixa: a política "Usuárias leem a própria assinatura" permite
       * a leitura, e só a escrita foi revogada.
       */
      const { data, error: fetchError } = await supabase
        .from("empresas")
        .select(
          "*, assinaturas(status, plano, trial_fim, proxima_cobranca, origem)",
        )
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        // Volta a marcar como não carregada: falhou, então a próxima tentativa
        // precisa realmente tentar de novo em vez de achar que já tem.
        donoCarregado.current = null;
        setEmpresa(null);
        setPlano(null);
        setAssinatura(null);
        setError("Não foi possível carregar os dados da empresa.");
        return;
      }

      // O join é separado da empresa para o tipo `Empresa` continuar sendo o
      // da tabela. Quem consome `empresa` não deve nem saber que houve join.
      const { assinaturas, ...dadosDaEmpresa } = data;
      const assinatura = Array.isArray(assinaturas)
        ? (assinaturas[0] ?? null)
        : (assinaturas ?? null);

      setEmpresa(dadosDaEmpresa as Empresa);
      setPlano(assinatura?.plano ?? null);
      setAssinatura((assinatura as AssinaturaResumo | null) ?? null);
      setError(null);
    },
    [supabase],
  );

  /*
   * `getSession()` E NÃO `getUser()`. Esta linha é a diferença entre o painel
   * abrir em meio segundo e abrir em cinco.
   *
   * `getUser()` vai à REDE a cada chamada: ele pede ao servidor de auth do
   * Supabase que valide o token. Medido aqui, com o banco na própria máquina,
   * cada chamada levou entre 1,5 e 2,9 SEGUNDOS — e nada do app começa antes
   * dela, porque é ela que diz de quem são os dados a buscar. Num celular em
   * rede de bairro é pior.
   *
   * `getSession()` lê a sessão do cookie que já está no navegador. Zero rede,
   * resposta imediata.
   *
   * ISSO NÃO ABRE BURACO DE SEGURANÇA, e vale ser explícito: aqui a sessão só
   * decide o que DESENHAR. Quem decide o que a pessoa pode LER é o RLS do
   * Postgres, que valida o token a cada consulta, no servidor. Uma sessão
   * forjada no navegador não devolve uma linha sequer de outra empresa — ela
   * só faria o app desenhar um nome errado para quem já está mexendo no
   * próprio navegador. As rotas de servidor e o middleware seguem usando
   * `getUser()`, que é onde a verificação importa.
   */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const usuario = data.session?.user ?? null;
      setUser(usuario);
      if (usuario) {
        await loadEmpresa(usuario.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadEmpresa(session.user.id);
      } else {
        donoCarregado.current = null;
        setEmpresa(null);
        setPlano(null);
        setAssinatura(null);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadEmpresa]);

  /*
   * A SEGUNDA pergunta: "e agora, já tem sessão?"
   *
   * ISTO CONSERTA O "SÓ FUNCIONA RECARREGANDO DUAS VEZES".
   *
   * O login acontece no SERVIDOR: a Server Action chama
   * `signInWithPassword` e grava o cookie da sessão, depois manda para o
   * painel. Mas quem carrega os dados aqui é o cliente do navegador, e ele foi
   * construído lá atrás, na tela de login, quando cookie nenhum existia. O
   * efeito acima pergunta `getUser()` uma única vez, na montagem — e o
   * redirecionamento pós-login é navegação DE DENTRO do app, então este
   * provider nunca desmonta e nunca volta a perguntar.
   *
   * Resultado: a pessoa entrava, caía no painel, e o painel ficava em esqueleto
   * para sempre, porque `empresa` era null. Recarregar "resolvia" porque a
   * recarga monta o provider de novo, agora com o cookie no lugar. Era o
   * "sempre preciso abrir duas vezes".
   *
   * `onAuthStateChange` não cobre este caso: ele avisa sobre logins feitos
   * pelo NAVEGADOR, e este foi feito pelo servidor.
   *
   * A pergunta é refeita a cada troca de endereço enquanto não houver
   * ninguém — e só nesse caso. Com sessão em mãos, o `if` corta antes de
   * qualquer ida à rede, então navegar dentro do app continua não custando
   * nada.
   *
   * Este efeito e o de cima disparavam JUNTOS na montagem (o `user` ainda é
   * null no primeiro render), então eram DUAS idas à rede de uma vez, cada uma
   * de segundos. Lendo o cookie, as duas passaram a custar nada — e a repetida
   * deixou de importar.
   */
  const pathname = usePathname();

  useEffect(() => {
    if (user) return;
    let cancelado = false;

    supabase.auth.getSession().then(async ({ data }) => {
      const usuario = data.session?.user ?? null;
      if (cancelado || !usuario) return;
      setUser(usuario);
      await loadEmpresa(usuario.id);
      setLoading(false);
    });

    return () => {
      cancelado = true;
    };
  }, [pathname, user, supabase, loadEmpresa]);

  /*
   * Sem empresa carregada a lista é vazia, e não "tudo".
   *
   * Enquanto carrega, mostrar de menos e completar depois é um menu que
   * cresce; mostrar de mais e cortar depois é um item que some debaixo do
   * dedo de quem já ia tocar nele.
   */
  const modulos = useMemo(
    () =>
      modulosLiberados(
        // O efetivo, igual ao servidor: 'pendente' e 'cancelada' guardam um
        // plano pago que nunca valeu, e o menu não pode acreditar nele.
        planoEfetivo(assinatura),
        (empresa?.modulos_ativos ?? []) as ModuloAtivo[],
      ),
    [assinatura, empresa?.modulos_ativos],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        empresa,
        plano,
        assinatura,
        modulos,
        loading,
        error,
        signOut,
        atualizarEmpresa: setEmpresa,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
