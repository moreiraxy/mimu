import { cn } from "@/lib/utils";

/**
 * Bloco de loading com shimmer. Nunca usar spinner genérico — todo estado de
 * carregamento do app usa esse componente.
 *
 * O gradiente sai de variáveis CSS e não de hex fixo: antes eram dois tons de
 * rosa escritos à mão, que sobreviveram à troca de paleta e deixavam a tela
 * de carregamento rosa num app verde. Acompanhar o tema sozinho continua
 * sendo a regra.
 *
 * O QUE MUDOU: o esqueleto era feito com o néon da marca (`--primary-light` e
 * `--primary-border`). Funcionava enquanto o fundo do app era preto liso. Com
 * o FundoAmbiente, que joga luz da marca por trás de tudo, os dois se somaram:
 * uma tela inteira de blocos verde-oliva sobre um fundo verde-oliva, que não
 * lê como "carregando" — lê como defeito, ou como tela estragada.
 *
 * Agora é neutro, e isso não é perder a marca: esqueleto é a AUSÊNCIA de
 * conteúdo. Ele tem que sumir da atenção assim que o conteúdo chega, e a cor
 * da marca faz o contrário — prende o olho no lugar onde ainda não há nada. A
 * marca aparece na tela de abertura, onde ela é o assunto.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-shimmer rounded-button bg-neutro-disabled", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(var(--neutro-disabled)) 25%, rgb(var(--neutro-border)) 37%, rgb(var(--neutro-disabled)) 63%)",
        backgroundSize: "400% 100%",
      }}
    />
  );
}
