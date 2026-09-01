"use client";

import { TelaDeAjuste } from "@/components/perfil/TelaDeAjuste";
import { WhatsAppSection } from "../WhatsAppSection";

/**
 * Conectar o número da pessoa à conta, para ela falar com a Mimu por lá.
 *
 * Ganhou tela própria porque é a única coisa dos ajustes que se resolve fora
 * do app: o toque leva ao WhatsApp e a pessoa volta depois. Espremida no meio
 * de uma página longa, ela saía do app no meio de outra tarefa e voltava sem
 * saber onde estava.
 */
export default function WhatsAppPage() {
  return (
    <TelaDeAjuste titulo="Mimu no WhatsApp">
      <WhatsAppSection />
    </TelaDeAjuste>
  );
}
