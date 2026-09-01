import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

/**
 * Registrar entrada e registrar saída.
 *
 * Eram uma pílula de néon CHAPADO e outra com borda néon de 1,5px — as duas
 * únicas áreas de cor saturada da tela, e o oposto exato da proporção da
 * referência, onde a cor aparece em traço e nunca em bloco. Sobre o papel de
 * parede néon, o botão preenchido ainda sumia dentro do próprio brilho do
 * fundo.
 *
 * Agora são as mesmas superfícies de vidro do resto da tela, e a cor mora onde
 * ela informa: no ícone. As duas ficam com o MESMO peso visual porque as duas
 * têm a mesma importância — quem fecha o caixa registra as duas coisas.
 */
export function AcoesFinanceiro() {
  return (
    <div className="flex gap-3">
      <Acao
        href="/financeiro/nova-entrada"
        icone={ArrowUpRight}
        label="Entrada"
      />
      <Acao
        href="/financeiro/nova-saida"
        icone={ArrowDownLeft}
        label="Saída"
      />
    </div>
  );
}

function Acao({
  href,
  icone: Icone,
  label,
}: {
  href: string;
  icone: typeof ArrowUpRight;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="vidro-card flex flex-1 items-center justify-center gap-2 rounded-[16px] py-3.5 text-[15px] font-bold text-escuro"
    >
      <Icone
        className="h-[18px] w-[18px] text-primary-forte"
        strokeWidth={2.5}
      />
      {label}
    </Link>
  );
}
