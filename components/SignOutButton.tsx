"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleClick() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      Sair
    </Button>
  );
}
