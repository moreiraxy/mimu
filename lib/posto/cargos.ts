/**
 * As cinco frentes, e o que cai em cada uma.
 *
 * Compilado de duas fontes, e a distinção entre elas é o ponto mais importante
 * deste arquivo: o documento de funções de 30/09/2026 (que descreve APENAS a
 * frente 3, ainda sem assinatura) e o que a operação mostra todo dia
 * (as frentes 1, 2 e 5, que não existem em documento nenhum).
 *
 * Por isso cada frente carrega `noPapel`. Uma tela que mostrasse as cinco como
 * iguais esconderia a conta que importa: o único cargo escrito é o de menor
 * alcance dos três, e é justamente o que é medido por seis indicadores
 * diários. Quando chegar a conversa com o Dyego, esta é a lista que mostra o
 * tamanho do que está fora do papel.
 */

import type { FrentePosto } from "@/types/database";

export interface Frente {
  id: FrentePosto;
  nome: string;
  contexto: string;
  /** Está descrita em documento assinado ou assinável? */
  noPapel: boolean;
  /** Por que está ou não no papel — aparece como nota na tela. */
  notaDoPapel: string;
  responsabilidades: string[];
}

export const FRENTES: Frente[] = [
  {
    id: "produto",
    nome: "Produto — CRM Fortis",
    contexto: "Sócia-fundadora e responsável pelo produto",
    noPapel: false,
    notaDoPapel:
      "Não está em documento nenhum. É o que o sistema registra: você é a dona da conta.",
    responsabilidades: [
      "Regras de negócio: roleta, corujão, cortes, bolsão, prazos de atendimento",
      "Quem enxerga o quê, por cargo e por equipe",
      "Prioriza o que entra e o que espera",
      "Aprova cada subida ao ar",
      "Testa na operação real e reporta os defeitos",
      "Limites de risco: teto de disparo, aquecimento de chip, antibloqueio",
      "Políticas de dado: descarte, descadastro, “não disparar”, LGPD",
      "Responde pelos custos: servidor, banco, e-mail, domínios",
      "Guarda as credenciais e decide quem recebe acesso",
      "Decide o que é defeito e o que é pedido novo",
    ],
  },
  {
    id: "comercial",
    nome: "Comercial — venda do CRM",
    contexto: "Sócia comercial e novos negócios",
    noPapel: false,
    notaDoPapel: "Também fora de documento.",
    responsabilidades: [
      "Prospecta incorporadoras para vender o CRM",
      "Define posicionamento e material de venda",
      "Conduz as reuniões de apresentação",
      "Define preço, margem e condição de implantação",
      "Define o formato do piloto e o que será comparado",
      "Decide quais clientes entram e em que ordem",
    ],
  },
  {
    id: "assistencia",
    nome: "Assistência à Gerência de Vendas",
    contexto: "Equipe Dyego Gomes",
    noPapel: true,
    notaDoPapel:
      "Documento de 30/09/2026, ainda sem assinatura. É o único cargo escrito — e o único medido por indicadores.",
    responsabilidades: [
      "Pré-atendimento e qualificação dos leads novos",
      "Disparo do dia: lista limpa, texto aprovado, resultado registrado",
      "Ativação de base e carteira (parados em Contato há 5 dias ou mais)",
      "Triagem de e-mail três vezes ao dia e agenda do gerente",
      "Fila e roleta: conferir depois de cada roleta e de cada corte",
      "Guardiã do SLA e indicação para rodízio",
      "Documentação de venda e cobrança de documento",
      "Relatório semanal por executivo, toda sexta",
      "Materiais, avisos, treinamentos e reuniões",
      "Pós-venda e pedido de indicação",
    ],
  },
  {
    id: "marketing",
    nome: "Marca Fortis 360 Capital",
    contexto: "Aparece no documento como uma linha só",
    noPapel: true,
    notaDoPapel:
      "Uma linha no documento (“apoio à Fortis 360”), mas na prática é frente própria.",
    responsabilidades: [
      "Agenda e publica os posts",
      "Responde as mensagens que chegam pelas redes",
      "Encaminha os leads que vêm da marca",
      "Cuida do site institucional",
    ],
  },
  {
    id: "operacao",
    nome: "Operação — o que não está em lista nenhuma",
    contexto: "44 pessoas, 33 números",
    noPapel: false,
    notaDoPapel:
      "Não está em lista nenhuma, e é o que mais interrompe o dia.",
    responsabilidades: [
      "Suporte diário à operação inteira: 44 pessoas, 33 números",
      "Reconectar número, retomar disparo, distribuir lead parado",
      "Ponte entre a equipe e o sistema: recebe a reclamação e traduz em correção",
    ],
  },
];

export function frentePorId(id: FrentePosto): Frente {
  // O `!` se sustenta porque FrentePosto é união fechada e FRENTES cobre os
  // cinco membros — há teste que falha se alguém adicionar um sexto na união
  // sem adicionar aqui (testes/posto-frentes-completas.test.ts).
  return FRENTES.find((f) => f.id === id)!;
}

/**
 * O limite da autonomia, do item 3.8 e 3.9 do documento.
 *
 * Isto não é enfeite de tela: é o que evita a conversa mais caro de desfazer,
 * que é ter respondido em nome do gerente algo que precisava dele. A tela
 * mostra as duas colunas lado a lado, e toda pendência do tipo "aprovação"
 * nasce apontando para cá.
 */
export const RESOLVE_SOZINHA: string[] = [
  "Resposta de e-mail de rotina e envio de material",
  "Agendamento e confirmação de reunião",
  "Qualificação e passagem de lead",
  "Atualização de etapa e registro no CRM",
  "Cobrança de SLA direto com o executivo",
  "Cobrança de documento do cliente",
];

export const PRECISA_DO_GERENTE: string[] = [
  "Desconto, condição especial ou exceção de tabela",
  "Texto novo de disparo ou de reativação",
  "Mensagem em nome do gerente para cliente",
  "Troca de lead entre executivos",
  "Mudança na fila fora da regra da roleta",
  "Reclamação de cliente e qualquer assunto de RH",
];

/** Horário acordado, para a tela saber quando está fora da jornada. */
export const JORNADA_ACORDADA = {
  dias: "Segunda a sexta",
  inicio: "09:30",
  fim: "18:00",
  observacoes: [
    "Almoço sem horário fixo, encaixado por você",
    "Sábado e domingo de casa, quando houver necessidade",
    "O corte das 19h fica com outro executivo",
  ],
};
