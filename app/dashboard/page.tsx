import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já bloqueia essa rota para quem não está logado, mas
  // revalidamos aqui porque Server Components não devem confiar cegamente
  // em decisões tomadas fora deles.
  if (!user) {
    redirect("/login");
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMark size="sm" />
          <div>
            <p className="text-xs text-neutro-muted">Bom te ver,</p>
            <p className="font-semibold text-escuro">
              {empresa?.nome ?? "seu negócio"}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
      <p className="text-sm text-neutro-muted">
        Logada como {user.email}. A partir daqui entram os módulos de vendas,
        agenda e clientes.
      </p>
    </main>
  );
}
