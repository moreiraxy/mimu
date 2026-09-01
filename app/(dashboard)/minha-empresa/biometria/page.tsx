"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TelaDeAjuste } from "@/components/perfil/TelaDeAjuste";
import { Toggle } from "@/components/ui/Toggle";
import { SectionCard } from "../SectionCard";
import {
  biometriaDisponivel,
  biometriaLigada,
  desligarBiometria,
  ligarBiometria,
} from "@/lib/biometria";

export default function BiometriaPage() {
  const { user, empresa } = useAuth();
  const { showToast } = useToast();

  /*
   * Três estados, e não um booleano: "ainda não perguntei ao aparelho" não é
   * a mesma coisa que "este aparelho não tem". Tratar os dois como `false`
   * faria a tela dizer "seu aparelho não tem biometria" durante o instante
   * em que ela ainda não sabe — que é a mentira que a pessoa lê primeiro.
   */
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [ligada, setLigada] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    biometriaDisponivel().then(setDisponivel);
    setLigada(biometriaLigada(user?.id));
  }, [user?.id]);

  async function alternar() {
    if (!user?.id) return;
    setOcupado(true);

    if (ligada) {
      desligarBiometria();
      setLigada(false);
      setOcupado(false);
      showToast("Biometria desligada.");
      return;
    }

    const deuCerto = await ligarBiometria(
      user.id,
      empresa?.nome ?? user.email ?? "Mimu",
    );
    setOcupado(false);

    if (!deuCerto) {
      // Cancelar cai aqui junto com falha de verdade, e a mensagem serve para
      // os dois: quem cancelou não precisa de explicação, e quem falhou não
      // fica com um interruptor ligado que não tranca nada.
      showToast("Não consegui ligar a biometria.");
      return;
    }

    setLigada(true);
    showToast("Pronto! Vou pedir a biometria ao abrir.");
  }

  return (
    <TelaDeAjuste titulo="Biometria">

      <SectionCard
        icone={Fingerprint}
        titulo="Cadeado da Mimu"
        descricao="Vale só neste aparelho."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-button border border-neutro-border p-3.5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-escuro">
                Pedir Face ID ou digital ao abrir
              </p>
              <p className="mt-0.5 text-xs text-neutro-muted">
                {disponivel === null
                  ? "Verificando o aparelho..."
                  : disponivel
                    ? "Ninguém abre a Mimu no seu celular sem ser você."
                    : "Este aparelho não tem digital nem reconhecimento facial configurado."}
              </p>
            </div>
            <Toggle
              checked={ligada}
              onChange={alternar}
              disabled={!disponivel || ocupado}
              label="Pedir biometria ao abrir a Mimu"
            />
          </div>

          {/*
            O que o cadeado faz e o que ele NÃO faz.
            Prometer "seus dados estão protegidos" seria mais bonito e seria
            mentira: quem tira a senha do celular de alguém não é impedido por
            uma tela. O que este cadeado resolve é o caso real — o celular na
            bancada, alguém curioso abre o app.
          */}
          <p className="rounded-button bg-fundo px-3.5 py-3 text-xs leading-relaxed text-neutro-muted">
            O cadeado esconde a Mimu até você confirmar quem é. Ele não troca
            a sua senha nem protege a conta em outro aparelho — para isso vale
            a senha, e o bloqueio de tela do próprio celular.
          </p>
        </div>
      </SectionCard>
    </TelaDeAjuste>
  );
}
