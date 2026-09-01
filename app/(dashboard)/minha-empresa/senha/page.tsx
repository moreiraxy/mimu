"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TelaDeAjuste, CartaoAjuste } from "@/components/perfil/TelaDeAjuste";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Trocar a senha.
 *
 * Antes era um botão dentro do cartão "Conta", que só revelava os campos
 * depois de tocado, no meio de uma página de nove seções. Quem procurava isto
 * rolava a página inteira duas vezes.
 */
export default function SenhaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alterar() {
    setErro(null);

    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setEnviando(false);

    if (error) {
      setErro("Não consegui alterar a senha. Tenta de novo.");
      return;
    }

    showToast("Senha alterada!");
    setNovaSenha("");
    setConfirmarSenha("");
  }

  return (
    <TelaDeAjuste titulo="Alterar senha">
      <CartaoAjuste titulo="Sua conta" descricao={user?.email ?? "—"} />

      <CartaoAjuste>
        <div className="flex flex-col gap-3">
          <Input
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {erro && (
            <p className="rounded-button bg-erro-light px-3 py-2 text-xs text-erro-texto">
              {erro}
            </p>
          )}

          <Button disabled={enviando} onClick={alterar}>
            {enviando ? "Salvando..." : "Salvar nova senha"}
          </Button>
          <p className="text-center text-[12px] text-neutro-muted">
            Você continua conectada nos aparelhos onde já entrou.
          </p>
        </div>
      </CartaoAjuste>
    </TelaDeAjuste>
  );
}
