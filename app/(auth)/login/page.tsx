import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: {
    confirmacao?: string;
    redefinida?: string;
    plano?: string;
    erro?: string;
  };
}) {
  return (
    <LoginForm
      confirmacaoPendente={searchParams.confirmacao === "pendente"}
      plano={searchParams.plano ?? ""}
      senhaRedefinida={searchParams.redefinida === "1"}
      erroDoLink={searchParams.erro ?? null}
    />
  );
}
