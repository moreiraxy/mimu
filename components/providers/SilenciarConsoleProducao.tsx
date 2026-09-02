"use client";

/*
 * SÓ NO NAVEGADOR. O `typeof window` não é zelo excessivo — é o conserto de um
 * defeito que cegou o servidor inteiro em produção.
 *
 * Um módulo `"use client"` também é EXECUTADO NO SERVIDOR durante a renderização
 * (é assim que o Next entrega o HTML pronto). Sem a guarda, este arquivo
 * silenciava o `console.error` do processo Node — ou seja, TODO erro de
 * servidor do produto sumia do log de produção: a Groq recusando, a
 * transcrição falhando, o push sem chave, a consulta que não voltou. O
 * comentário aqui embaixo sempre disse que o console do servidor continuava
 * ativo "de propósito, porque é a única forma de ver erros de produção"; o
 * código fazia o contrário havia meses, em silêncio — e o silêncio era
 * literalmente o defeito.
 *
 * Encontrado imprimindo a mesma linha por dois canais numa build de produção:
 * o `console.error` não apareceu, o `process.stdout.write` apareceu.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.error = () => {};
}

/**
 * Componente sem renderização — só existe pra rodar o módulo acima uma vez no
 * bundle do navegador. Mutamos apenas o console do BROWSER (visível a qualquer
 * pessoa que abra o DevTools); o console do servidor continua ativo de
 * propósito, porque é a única forma de ver erros de produção nos logs da
 * hospedagem — mutá-lo também cegaria a operação sem ganho real de segurança,
 * já que quem usa o app nunca vê log de servidor.
 */
export function SilenciarConsoleProducao() {
  return null;
}
