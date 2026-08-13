import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin";

/**
 * Portão do painel admin.
 *
 * Este layout é Server Component — roda só no servidor, e envolve TODA rota
 * abaixo de /admin. Não existe versão client desta checagem: não há estado
 * de "sou admin" no navegador para alguém trocar no DevTools. Mesmo que a
 * pessoa force a URL, o HTML do painel nunca chega a ser gerado.
 *
 * Responde 404 e não 403 de propósito: 403 confirmaria que o painel existe
 * naquele endereço. Para quem não é admin, /admin simplesmente não existe.
 *
 * Isto é o portão da NAVEGAÇÃO. Cada rota /api/admin/* precisa repetir a
 * checagem por conta própria — um layout não protege chamadas diretas à API.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    notFound();
  }

  return <>{children}</>;
}
