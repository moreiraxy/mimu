import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { confirmacao?: string; redefinida?: string };
}) {
  return (
    <LoginForm
      confirmacaoPendente={searchParams.confirmacao === "pendente"}
      senhaRedefinida={searchParams.redefinida === "1"}
    />
  );
}
