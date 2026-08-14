"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPronto(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);

    if (error) {
      setErro("Não foi possível atualizar sua senha. Peça um novo link.");
      return;
    }

    router.push("/login?redefinida=1");
  }

  if (!pronto) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-neutro-muted">
          Esse link de recuperação é inválido ou expirou.
        </p>
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-primary-forte"
        >
          Pedir um novo link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-escuro">Nova senha</h1>
        <p className="mt-1 text-sm text-neutro-muted">
          Escolha uma senha nova para a sua conta.
        </p>
      </div>
      <Input
        label="Nova senha"
        type="password"
        value={senha}
        onChange={(event) => setSenha(event.target.value)}
        minLength={6}
        required
      />
      <Input
        label="Confirmar nova senha"
        type="password"
        value={confirmar}
        onChange={(event) => setConfirmar(event.target.value)}
        minLength={6}
        required
      />
      {erro && (
        <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro-texto">
          {erro}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
