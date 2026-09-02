import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { excedeuLimite, registrarTentativa } from "@/lib/rate-limit";
import type { Database } from "@/types/database";

/**
 * O vínculo entre um número de WhatsApp e uma conta da Mimu.
 *
 * Ver o cabeçalho de 20260830140000_whatsapp_links.sql para o desenho e o
 * porquê de o vínculo sempre nascer de dentro do app.
 */

type Supabase = SupabaseClient<Database>;

/**
 * Alfabeto sem caractere ambíguo.
 *
 * Fora: O e 0, I e 1 e L, S e 5. A pessoa lê o código na tela do app e digita
 * no WhatsApp, muitas vezes numa tela pequena e com pressa. Cada par ambíguo
 * vira uma tentativa perdida — e tentativa perdida gasta o teto do rate limit,
 * que é o que protege o vínculo.
 */
const ALFABETO = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
const TAMANHO_CODIGO = 6;

/**
 * Dez minutos.
 *
 * Tempo de sair da tela do app, abrir o WhatsApp e digitar, com folga para
 * quem se distrai no meio. Prazo longo aumentaria a janela em que um código
 * chutado ainda vale.
 */
const VALIDADE_MINUTOS = 10;

function gerarCodigo(): string {
  // crypto.getRandomValues e não Math.random: o código é a única credencial
  // do vínculo, e Math.random é previsível o bastante para ser chutado por
  // quem conhece a semente.
  const bytes = new Uint8Array(TAMANHO_CODIGO);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/**
 * Só dígitos, com DDI.
 *
 * O WhatsApp entrega o número em formatos diferentes conforme o aparelho e a
 * origem ("5511999999999", "+55 11 99999-9999"). Comparar formatos diferentes
 * é não achar o vínculo que existe — e o sintoma seria a Mimu tratar uma
 * cliente vinculada como desconhecida.
 */
export function normalizarTelefone(bruto: string): string {
  return bruto.replace(/\D/g, "");
}

export interface CodigoDeVinculo {
  codigo: string;
  expiraEm: string;
}

/**
 * Passo 1: a pessoa pede, de dentro do app, para conectar o WhatsApp.
 *
 * Recebe o `supabase` COM sessão de propósito. É o RLS de `whatsapp_links` que
 * garante que ninguém crie vínculo para a empresa de outro — e é por isso que
 * esta função não pode usar service role, nem por conveniência.
 */
export async function criarCodigoDeVinculo(
  supabase: Supabase,
  empresaId: string,
  userId: string,
): Promise<CodigoDeVinculo | null> {
  const expiraEm = new Date(Date.now() + VALIDADE_MINUTOS * 60_000);

  /*
   * Os pendentes anteriores da empresa são revogados antes.
   *
   * Sem isso, cada toque em "conectar" deixaria mais um código válido no ar, e
   * todos funcionariam. O certo é o último pedido ser o único que vale — é o
   * que a pessoa está vendo na tela.
   */
  await supabase
    .from("whatsapp_links")
    .update({ revogado_em: new Date().toISOString() })
    .eq("empresa_id", empresaId)
    .is("verificado_em", null)
    .is("revogado_em", null);

  const { data, error } = await supabase
    .from("whatsapp_links")
    .insert({
      empresa_id: empresaId,
      user_id: userId,
      codigo: gerarCodigo(),
      codigo_expira_em: expiraEm.toISOString(),
    })
    .select("codigo, codigo_expira_em")
    .single();

  if (error || !data) return null;
  return { codigo: data.codigo, expiraEm: data.codigo_expira_em };
}

export interface VinculoAtivo {
  empresaId: string;
  userId: string;
}

/**
 * De quem é este número?
 *
 * Usa service role, e é uma das DUAS operações do canal que podem: quem manda
 * mensagem no WhatsApp não tem sessão, então não existe identidade para o RLS
 * usar — descobrir a identidade é justamente o que esta função faz.
 *
 * O escopo é estreito de propósito: lê uma linha de `whatsapp_links` e devolve
 * dois ids. Nenhum dado de negócio passa por aqui. Quem lê venda, cliente e
 * faturamento é o client de `createClientComoUsuario`, com o RLS ligado.
 */
export async function buscarVinculoAtivo(
  telefone: string,
): Promise<VinculoAtivo | null> {
  const { data } = await createServiceClient()
    .from("whatsapp_links")
    .select("empresa_id, user_id")
    .eq("telefone", normalizarTelefone(telefone))
    .not("verificado_em", "is", null)
    .is("revogado_em", null)
    .maybeSingle();

  if (!data) return null;
  return { empresaId: data.empresa_id, userId: data.user_id };
}

export type ResultadoConfirmacao =
  | { ok: true; empresaId: string }
  | { ok: false; motivo: "codigo_invalido" | "muitas_tentativas" };

/**
 * Passo 3: o código chegou pelo WhatsApp. Casa com o pedido e fecha o vínculo.
 *
 * A segunda (e última) operação do canal que roda com service role, pela mesma
 * razão: é ela que CRIA a identidade, então não pode depender de já existir uma.
 *
 * O rate limit é por número, e é o que sustenta a segurança do código curto.
 * Seis caracteres num alfabeto de 29 dão ~600 milhões de combinações; com
 * cinco tentativas por hora, chutar é inviável. Sem o teto, seria questão de
 * tempo — e o prêmio seria enxergar o negócio de outra pessoa.
 */
/**
 * Esta sequência é um código que a Mimu já emitiu alguma vez?
 *
 * EXISTE PARA A MIMU PODER FICAR CALADA. O formato do código — seis
 * caracteres de um alfabeto sem I, L, O, S, 0, 1 e 5 — parecia não casar com
 * palavra do português, e não é verdade: "ajudar", "fechar", "chamar",
 * "quarta" e "mandar" casam todas. Como o número é o mesmo da prospecção,
 * qualquer prospect que respondesse "pode me ajudar?" recebia um automático
 * dizendo que o código dele tinha expirado — e ele nunca teve código nenhum.
 *
 * Com esta pergunta o canal separa dois casos que antes eram um só: uma
 * sequência que NUNCA foi código é uma palavra, e merece silêncio; uma que já
 * foi merece a explicação sobre os dez minutos.
 *
 * Olha em qualquer estado — expirado, já usado, revogado. O que importa aqui
 * não é se ele vale, e sim se ele um dia existiu.
 */
export async function codigoConhecido(codigoBruto: string): Promise<boolean> {
  const codigo = codigoBruto.trim().toUpperCase();

  const { data } = await createServiceClient()
    .from("whatsapp_links")
    .select("id")
    .eq("codigo", codigo)
    .limit(1);

  return Boolean(data?.length);
}

export async function confirmarVinculo(
  telefoneBruto: string,
  codigoBruto: string,
): Promise<ResultadoConfirmacao> {
  const telefone = normalizarTelefone(telefoneBruto);
  const codigo = codigoBruto.trim().toUpperCase();

  if (await excedeuLimite("whatsapp_vinculo", telefone)) {
    return { ok: false, motivo: "muitas_tentativas" };
  }
  await registrarTentativa("whatsapp_vinculo", telefone);

  const service = createServiceClient();

  const { data: pendente } = await service
    .from("whatsapp_links")
    .select("id, empresa_id")
    .eq("codigo", codigo)
    .is("verificado_em", null)
    .is("revogado_em", null)
    .gt("codigo_expira_em", new Date().toISOString())
    .maybeSingle();

  if (!pendente) return { ok: false, motivo: "codigo_invalido" };

  const agora = new Date().toISOString();

  /*
   * Um número só pertence a uma conta por vez.
   *
   * Trocar de conta no mesmo número é legítimo (vendeu o negócio, abriu outro),
   * mas os dois vínculos não podem coexistir: o índice único do banco recusaria
   * o segundo, e a pessoa veria um erro sem entender. Revogar o anterior aqui
   * torna a troca explícita — e deixa no histórico que houve troca.
   */
  await service
    .from("whatsapp_links")
    .update({ revogado_em: agora })
    .eq("telefone", telefone)
    .not("verificado_em", "is", null)
    .is("revogado_em", null);

  /*
   * E uma conta só tem um número por vez.
   *
   * O índice único do banco cobre o outro sentido (um telefone, uma conta), mas
   * não este: sem isto, conectar um segundo aparelho deixava os DOIS válidos.
   * Duas consequências, ambas ruins. A tela mostra um número só e oferece
   * "desconectar este número", então o segundo ficaria lendo o financeiro sem
   * aparecer em lugar nenhum. E a rota que lê o vínculo usa `maybeSingle()`,
   * que estoura quando vem mais de uma linha — a tela quebraria justamente
   * para quem tem dois.
   *
   * Número de WhatsApp é autenticação fraca (ver 4.6 do brief). Quanto menos
   * números puderem ler o negócio ao mesmo tempo, menor a superfície.
   */
  await service
    .from("whatsapp_links")
    .update({ revogado_em: agora })
    .eq("empresa_id", pendente.empresa_id)
    .not("verificado_em", "is", null)
    .is("revogado_em", null);

  const { error } = await service
    .from("whatsapp_links")
    .update({ telefone, verificado_em: agora })
    .eq("id", pendente.id);

  if (error) return { ok: false, motivo: "codigo_invalido" };
  return { ok: true, empresaId: pendente.empresa_id };
}
