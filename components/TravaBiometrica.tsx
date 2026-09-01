"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import {
  biometriaLigada,
  confirmarBiometria,
  desligarBiometria,
} from "@/lib/biometria";

/**
 * O cadeado, na hora de abrir o app.
 *
 * Trava uma vez por abertura, e não a cada troca de tela: pedir a digital de
 * novo porque a pessoa foi do Financeiro para a Agenda não protege nada e
 * ensina a odiar o recurso.
 *
 * A COBERTURA COMEÇA ANTES DESTE COMPONENTE. Um overlay React só existe
 * depois da hidratação, e até lá o painel já estaria pintado na tela — o
 * faturamento apareceria por um instante justamente para quem o cadeado
 * existe para esconder. Quem cobre esse instante é o script de app/layout.tsx,
 * que marca o <html> com `trancado` antes de qualquer JS do app rodar; o
 * CSS pinta a tela de fundo por cima de tudo, e é este componente que tira a
 * marca quando a pessoa se identifica.
 */
export function TravaBiometrica() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [trancado, setTrancado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [perguntando, setPerguntando] = useState(false);

  const destrancar = useCallback(() => {
    document.documentElement.classList.remove("trancado");
    setTrancado(false);
  }, []);

  const pedir = useCallback(async () => {
    setPerguntando(true);
    setFalhou(false);
    const passou = await confirmarBiometria(user?.id);
    setPerguntando(false);

    if (passou) {
      destrancar();
      return;
    }
    setFalhou(true);
  }, [user?.id, destrancar]);

  useEffect(() => {
    /*
     * Enquanto o AuthProvider não trouxe a pessoa, não dá para decidir nada —
     * o cadeado é por conta, e agir sem saber de quem é destrancaria a marca
     * do <html> para a conta errada.
     */
    if (!user?.id) return;

    if (!biometriaLigada(user.id)) {
      // A marca pode ter sobrado do script quando o cadeado é de OUTRA conta
      // que já usou este aparelho. Tirar aqui é o que impede a tela preta
      // permanente depois de trocar de login.
      destrancar();
      return;
    }

    setTrancado(true);
    void pedir();
    // Roda uma vez por abertura: `pedir` é estável e `user.id` não muda dentro
    // de uma sessão.
  }, [user?.id, pedir, destrancar]);

  if (!trancado) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-fundo px-8"
      role="dialog"
      aria-modal="true"
      aria-label="Mimu trancada"
    >
      <LogoMark size="lg" />

      <div className="text-center">
        <p className="text-lg font-semibold text-escuro">Mimu trancada</p>
        <p className="mt-1 text-sm text-neutro-muted">
          {falhou
            ? "Não deu certo. Tenta de novo."
            : "Confirme que é você para abrir."}
        </p>
      </div>

      <div className="flex w-full max-w-[280px] flex-col gap-2.5">
        <Button onClick={pedir} disabled={perguntando}>
          <span className="flex items-center justify-center gap-2">
            <Fingerprint className="h-4 w-4" strokeWidth={2.25} />
            {perguntando ? "Aguardando..." : "Desbloquear"}
          </span>
        </Button>

        {/*
          A saída de emergência, e ela não é opcional.
          Um leitor de digital que para de funcionar, um Face ID redefinido no
          sistema, um aparelho novo restaurado de backup — em qualquer um
          desses casos, sem este botão a pessoa fica presa do lado de fora da
          própria conta, sem nem conseguir chegar no suporte. Sair e entrar com
          a senha sempre funciona.
        */}
        <Button
          variant="ghost"
          onClick={async () => {
            desligarBiometria();
            destrancar();
            await signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          Entrar com a senha
        </Button>
      </div>
    </div>
  );
}
