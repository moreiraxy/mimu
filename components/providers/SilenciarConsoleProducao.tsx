"use client";

if (process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.error = () => {};
}

/**
 * Componente sem renderização — só existe pra rodar o módulo acima uma vez
 * no bundle do navegador. Mutamos apenas o console do browser (visível a
 * qualquer pessoa que abra o DevTools); o console do servidor continua
 * ativo de propósito, porque é a única forma de ver erros de produção nos
 * logs da Vercel — mutá-lo também cegaria a operação sem ganho real de
 * segurança (usuário final nunca vê log de servidor).
 */
export function SilenciarConsoleProducao() {
  return null;
}
