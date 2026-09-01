import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-text hover:bg-primary-hover disabled:bg-neutro-disabled disabled:text-neutro-disabled-text",
  secondary:
    "bg-superficie text-primary-forte border-[1.5px] border-primary-forte disabled:border-neutro-disabled disabled:text-neutro-disabled-text",
  ghost: "bg-transparent text-primary-forte hover:bg-primary-light",
};

const BASE =
  "rounded-button font-bold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 motion-reduce:active:scale-100";

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-[22px] text-sm",
  sm: "h-9 px-4 text-[13px]",
};

/**
 * As classes do botão, sem o <button>.
 *
 * Existe para os casos em que o elemento precisa ser um <a> de verdade: link
 * externo, "abrir em nova aba", `target="_blank"`. Um <button> com
 * `onClick={() => window.open(...)}` parece a mesma coisa e não é — o menu do
 * toque longo não aparece, o leitor de tela anuncia "botão" onde vai haver
 * navegação, e nada disso dá erro que apareça em teste.
 */
export function classesBotao({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    BASE,
    variantClasses[variant],
    sizeClasses[size],
    // Um <a> não centraliza o próprio texto como o <button> faz.
    "inline-flex items-center justify-center",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        BASE,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
