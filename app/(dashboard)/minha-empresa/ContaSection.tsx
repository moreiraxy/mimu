"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MODULOS } from "@/lib/modulos";
import { SectionCard } from "./SectionCard";
import type { Empresa } from "@/types";

export function ContaSection({ empresa }: { empresa: Empresa }) {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [enviandoSenha, setEnviandoSenha] = useState(false);

  const modulosLabels = MODULOS.filter((m) =>
    m.chaves.some((chave) => empresa.modulos_ativos.includes(chave)),
  ).map((m) => m.label);

  async function handleAlterarSenha() {
    setErroSenha(null);

    if (novaSenha.length < 6) {
      setErroSenha("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas não são iguais.");
      return;
    }

    setEnviandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setEnviandoSenha(false);

    if (error) {
      setErroSenha("Não consegui alterar a senha. Tenta de novo.");
      return;
    }

    showToast("Senha alterada!");
    setTrocandoSenha(false);
    setNovaSenha("");
    setConfirmarSenha("");
  }

  return (
    <SectionCard icone={UserCircle} titulo="Conta">
      <div className="flex flex-col gap-4">
        <div className="rounded-button border border-neutro-border p-3.5">
          <p className="text-xs text-neutro-muted">E-mail</p>
          <p className="text-sm font-semibold text-escuro">
            {user?.email ?? "—"}
          </p>
        </div>

        {!trocandoSenha ? (
          <button
            type="button"
            onClick={() => setTrocandoSenha(true)}
            className="flex items-center justify-center gap-2 rounded-button border border-neutro-border py-3 text-sm font-semibold text-escuro transition-colors hover:bg-fundo"
          >
            <KeyRound className="h-4 w-4" strokeWidth={2.25} />
            Alterar senha
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-button border border-neutro-border p-3.5">
            <Input
              label="Nova senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoFocus
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            {erroSenha && (
              <p className="rounded-button bg-erro-light px-3 py-2 text-xs text-erro-texto">
                {erroSenha}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setTrocandoSenha(false);
                  setErroSenha(null);
                  setNovaSenha("");
                  setConfirmarSenha("");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={enviandoSenha}
                onClick={handleAlterarSenha}
              >
                {enviandoSenha ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-button border border-neutro-border p-3.5">
          <p className="text-xs text-neutro-muted">Plano atual</p>
          <p className="text-sm font-semibold text-escuro">Gratuito</p>
          <p className="mt-2 text-xs text-neutro-muted">Módulos ativos</p>
          <p className="text-sm text-escuro">
            {modulosLabels.length > 0 ? modulosLabels.join(", ") : "Nenhum"}
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/login");
            router.refresh();
          }}
          className="flex items-center justify-center gap-2 rounded-button border border-erro py-3 text-sm font-semibold text-erro-texto transition-colors hover:bg-erro-light"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.25} />
          Sair da conta
        </button>
      </div>
    </SectionCard>
  );
}
