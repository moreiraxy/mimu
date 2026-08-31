import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tentarAssumir, donoAtual } from "@/worker/whatsapp/exclusividade";

/*
 * A trava que impede duas cópias de falarem com o WhatsApp ao mesmo tempo.
 *
 * O problema que ela resolve foi observado em produção, não imaginado: a
 * hospedagem roda o app em mais de um processo, todos abriram conexão com as
 * mesmas credenciais, e o WhatsApp derrubou uma atrás da outra (código 440).
 * A Mimu ficou conectando e caindo a cada três segundos por meia hora, sem
 * entregar uma única mensagem — e, de fora, a página de estado dizia
 * "conectado", porque em cada instante alguma cópia realmente estava.
 */

let pasta: string;

beforeEach(() => {
  pasta = mkdtempSync(join(tmpdir(), "mimu-trava-"));
});

afterEach(() => {
  rmSync(pasta, { recursive: true, force: true });
});

describe("a trava de exclusividade", () => {
  it("deixa a primeira cópia assumir", () => {
    expect(tentarAssumir(pasta)).not.toBeNull();
  });

  it("recusa a segunda enquanto a primeira estiver viva", () => {
    const primeira = tentarAssumir(pasta);
    expect(primeira).not.toBeNull();

    // A segunda cópia é outro processo. Como o teste roda num só, o pid é o
    // mesmo — então simulamos o dono sendo outro, que é o caso real.
    const arquivo = join(pasta, "worker.lock");
    const dono = JSON.parse(readFileSync(arquivo, "utf8"));
    writeFileSync(arquivo, JSON.stringify({ ...dono, pid: dono.pid + 1 }));

    expect(tentarAssumir(pasta)).toBeNull();
  });

  it("libera quando a dona solta", () => {
    const primeira = tentarAssumir(pasta);
    primeira!.soltar();
    expect(tentarAssumir(pasta)).not.toBeNull();
  });

  it("assume quando a dona parou de dar sinal", () => {
    tentarAssumir(pasta);

    /*
     * Uma cópia morta não pode bloquear o canal para sempre.
     *
     * Processo morto não solta a trava — foi morto, não avisou. Sem a
     * expiração, o WhatsApp ficaria mudo até alguém apagar um arquivo à mão,
     * e ninguém saberia que é isso.
     */
    const arquivo = join(pasta, "worker.lock");
    const dono = JSON.parse(readFileSync(arquivo, "utf8"));
    writeFileSync(
      arquivo,
      JSON.stringify({ ...dono, pid: dono.pid + 1, batida: Date.now() - 60_000 }),
    );

    expect(donoAtual(pasta)).toBeNull();
    expect(tentarAssumir(pasta)).not.toBeNull();
  });

  it("não assume por causa de um atraso curto", () => {
    tentarAssumir(pasta);

    // 20 segundos de silêncio é uma pausa longa de coleta de lixo, ou um
    // servidor ocupado — não é morte. Roubar a trava aqui derrubaria quem está
    // atendendo, e criaria justamente a briga que a trava existe para evitar.
    const arquivo = join(pasta, "worker.lock");
    const dono = JSON.parse(readFileSync(arquivo, "utf8"));
    writeFileSync(
      arquivo,
      JSON.stringify({ ...dono, pid: dono.pid + 1, batida: Date.now() - 20_000 }),
    );

    expect(tentarAssumir(pasta)).toBeNull();
    expect(donoAtual(pasta)).not.toBeNull();
  });

  it("sobrevive a um arquivo de trava corrompido", () => {
    // Uma cópia que morre no meio da escrita deixa lixo. Se isso travasse o
    // canal, o conserto exigiria alguém entrar no servidor e apagar um arquivo
    // — sem nenhuma pista de que é isso que precisa ser feito.
    writeFileSync(join(pasta, "worker.lock"), "{ isto não é json");
    expect(tentarAssumir(pasta)).not.toBeNull();
  });
});
