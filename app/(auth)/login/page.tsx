import { LoginForm } from "./login-form";

export default async function LoginPage(
  props: {
    searchParams: Promise<{
      confirmacao?: string;
      redefinida?: string;
      plano?: string;
      erro?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <LoginForm
      confirmacaoPendente={searchParams.confirmacao === "pendente"}
      plano={searchParams.plano ?? ""}
      senhaRedefinida={searchParams.redefinida === "1"}
      erroDoLink={searchParams.erro ?? null}
    />
  );
}
