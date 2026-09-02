import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutro-muted"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          /*
            O campo é translúcido, e não `bg-fundo`.

            Com a cor do fundo ele virava um retângulo preto chapado no meio de
            uma tela de vidro — o mesmo defeito dos cartões antes: uma caixa
            opaca denuncia que aquele pedaço não pertence ao material do resto.
            Branco a 4% deixa a luz do fundo atravessar o campo como atravessa
            tudo em volta, e sobe para 8% no foco, que é a forma de dizer "é
            aqui que você está digitando" sem precisar de outra cor.
          */
          className={cn(
            "rounded-button border border-neutro-border bg-escuro/[0.04] px-3.5 py-3 text-base text-escuro placeholder:text-neutro-muted md:text-sm",
            "outline-none transition-colors focus:border-primary-forte focus:bg-escuro/[0.08]",
            className,
          )}
          {...props}
        />
        {helper && <p className="text-xs text-neutro-muted">{helper}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
