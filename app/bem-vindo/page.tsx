import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";
import { BemVindoScreen } from "./bem-vindo-screen";

export default async function BemVindoPage() {
  const { user, empresa } = await getEmpresaAtual();

  if (!user) {
    redirect("/login");
  }

  const nomeCompleto = user.user_metadata?.nome_completo as
    | string
    | undefined;
  const primeiroNome =
    nomeCompleto?.split(" ")[0] ?? empresa?.nome ?? "por aqui";

  return <BemVindoScreen nome={primeiroNome} />;
}
