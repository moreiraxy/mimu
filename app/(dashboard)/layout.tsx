import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/supabase";
import { ehAdmin } from "@/lib/admin";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Fab } from "@/components/dashboard/Fab";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DesktopQuickActions } from "@/components/dashboard/DesktopQuickActions";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { PushPermissionPrompt } from "@/components/PushPermissionPrompt";

// Layout raiz de toda página autenticada (Home, Agenda, Financeiro, Clientes,
// Mimu) — concentra aqui o gate de auth/onboarding para as páginas dentro do
// grupo não precisarem repetir essa checagem cada uma.
//
// Responsivo: mobile usa bottom nav + FAB (comportamento original, intocado
// abaixo de md). A partir de md entra a sidebar lateral (compacta, só ícone;
// larga com labels a partir de lg) e o bottom nav some. O FAB flutuante some
// a partir de lg, substituído pelas ações rápidas no topo do conteúdo.
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, empresa } = await getEmpresaAtual();

  if (!user) {
    redirect("/login");
  }
  if (!empresa?.onboarding_concluido) {
    redirect("/onboarding");
  }

  // Só decide se MOSTRA o atalho do painel. A autorização de verdade continua
  // no servidor (app/admin/layout.tsx e cada rota /api/admin/*), então forçar
  // esse valor no navegador não abre nada — só faz aparecer um link que leva
  // a um 404.
  const admin = await ehAdmin(user.id);

  // Os módulos vão daqui para a navegação como valor inicial.
  //
  // Antes, a barra de baixo e a sidebar liam `empresa.modulos_ativos` do
  // AuthProvider, que busca a empresa DE NOVO no navegador. Na primeira
  // visita esse dado só chegava depois de uma ida ao servidor, então a
  // navegação nascia com a lista vazia e mostrava só Home e Empresa. Recarregar
  // "resolvia" porque a resposta já estava no cache — foi o "só funciona na
  // segunda vez".
  //
  // Aqui o servidor já tem a empresa em mãos: é só entregar.
  const modulos = empresa.modulos_ativos ?? [];

  return (
    <div className="min-h-screen bg-fundo">
      <Sidebar admin={admin} modulosIniciais={modulos} />

      <div className="md:ml-[72px] lg:ml-60">
        <div className="flex justify-end gap-3 px-4 pt-4 md:px-8 md:pt-6">
          <GlobalSearch />
          <DesktopQuickActions />
        </div>

        <div className="mx-auto max-w-[430px] px-4 pb-36 pt-4 md:max-w-none md:px-6 md:pb-10 md:pt-6 lg:px-8 lg:pb-10 lg:pt-2">
          <PushPermissionPrompt />
          {children}
        </div>
      </div>

      <Fab />
      <BottomNav admin={admin} modulosIniciais={modulos} />
    </div>
  );
}
