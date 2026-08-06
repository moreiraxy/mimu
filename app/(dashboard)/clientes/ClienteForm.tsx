"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatarTelefoneBR } from "@/lib/formatters";

export interface DadosFormularioCliente {
  nome: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  observacoes: string;
  saldoFiado: number;
}

export function ClienteForm({
  valoresIniciais,
  textoBotao = "Salvar cliente",
  enviando = false,
  erro,
  onSubmit,
}: {
  valoresIniciais?: Partial<DadosFormularioCliente>;
  textoBotao?: string;
  enviando?: boolean;
  erro?: string | null;
  onSubmit: (dados: DadosFormularioCliente) => void | Promise<void>;
}) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [telefone, setTelefone] = useState(valoresIniciais?.telefone ?? "");
  const [email, setEmail] = useState(valoresIniciais?.email ?? "");
  const [dataNascimento, setDataNascimento] = useState(
    valoresIniciais?.dataNascimento ?? "",
  );
  const [observacoes, setObservacoes] = useState(
    valoresIniciais?.observacoes ?? "",
  );
  const [centavosFiado, setCentavosFiado] = useState(
    valoresIniciais?.saldoFiado
      ? Math.round(valoresIniciais.saldoFiado * 100)
      : 0,
  );

  const podeConfirmar = nome.trim() !== "" && !enviando;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!podeConfirmar) return;

    onSubmit({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      dataNascimento,
      observacoes: observacoes.trim(),
      saldoFiado: centavosFiado / 100,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        required
      />
      <Input
        label="Telefone (opcional)"
        value={telefone}
        onChange={(event) => setTelefone(formatarTelefoneBR(event.target.value))}
        placeholder="(11) 91234-5678"
        inputMode="numeric"
      />
      <Input
        label="E-mail (opcional)"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="nome@email.com"
      />
      <Input
        label="Data de nascimento (opcional)"
        type="date"
        value={dataNascimento}
        onChange={(event) => setDataNascimento(event.target.value)}
        helper="Usamos pra lembrar do aniversário"
      />
      <Textarea
        label="Observações (opcional)"
        value={observacoes}
        onChange={(event) => setObservacoes(event.target.value)}
      />
      <Input
        label="Saldo fiado (opcional)"
        value={formatCurrency(centavosFiado / 100)}
        onChange={(event) => {
          const digitos = event.target.value.replace(/\D/g, "");
          setCentavosFiado(digitos ? Number(digitos) : 0);
        }}
        inputMode="numeric"
        helper="Se maior que zero, aparece um alerta no perfil"
      />

      {erro && (
        <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro">
          {erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!podeConfirmar}>
        {enviando ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
