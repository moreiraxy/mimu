#!/usr/bin/env python3
"""
Turns docs/fp-all-sections.json into one markdown spec per section.

Every number in the output came from getComputedStyle on the original page.
Nothing here is authored by hand, which is the whole point: an agent reading
these specs has no reason to estimate a value.
"""
import json
import os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "fp-all-sections.json")
OUT_DIR = os.path.join(ROOT, "docs", "sections")

TITLES = {
    "integrations": ("T06", "Integrations"),
    "who-we-serve": ("T07", "Who we serve"),
    "testimonials": ("T08", "Testimonials"),
    "customer-stories": ("T09", "Customer Stories"),
    "pricing": ("T10", "Pricing"),
    "security": ("T11a", "Security"),
    "faqs": ("T11b", "FAQs"),
    "cta": ("T11c", "CTA final"),
}

# Shared motion values pulled from the original's own bundles.
MOTION = """## Movimento

Valores extraídos dos bundles `.mjs` do original — use estes, não escolha outros:

- reveal de texto: tween `500ms`, `cubic-bezier(0.6, 0, 0.4, 1)`, stagger `50ms`
- spring padrão: `bounce 0.2`, `duration 0.4`
- spring alternativo: `stiffness 400`, `damping 50`, `mass 1`
- toda animação desliga em `prefers-reduced-motion`
"""


def fmt_pos(p):
    return f"{p['px']}×{p['py']}px @ x {p['x']}% y {p['y']}%"


def typography_table(texts):
    rows = ["| Texto | Tag | Tamanho / LH | Peso | Tracking | Cor | Família |",
            "| --- | --- | --- | --- | --- | --- | --- |"]
    for t in texts:
        label = t["text"].replace("|", "\\|")
        if len(label) > 52:
            label = label[:49] + "…"
        rows.append(
            f"| {label} | {t['tag']} | {t['size']} / {t['lh']} | {t['weight']} "
            f"| {t['ls']} | `{t['color']}` | {t['family']} |"
        )
    return "\n".join(rows)


def images_table(images):
    if not images:
        return "_Sem imagens._"
    rows = ["| Arquivo | Caixa renderizada | Raio | object-fit |",
            "| --- | --- | --- | --- |"]
    for i in images:
        rows.append(f"| `{i['file']}` | {fmt_pos(i['pos'])} | {i['radius']} | {i['fit']} |")
    return "\n".join(rows)


def surfaces_table(surfaces):
    rows = ["| Elemento | Caixa | Fundo | Raio | Borda | Extra |",
            "| --- | --- | --- | --- | --- | --- |"]
    for s in surfaces:
        extra = []
        if s.get("blur"):
            extra.append(f"blur `{s['blur']}`")
        if s.get("mask"):
            extra.append(f"mask `{s['mask'][:44]}…`")
        if s.get("bgSize") and s.get("bgImage"):
            extra.append(f"bg-size `{s['bgSize']}`")
        if s.get("opacity") and s["opacity"] != "1":
            extra.append(f"opacity `{s['opacity']}`")
        if s.get("afterBorder"):
            extra.append(f"::after `{s['afterBorder']}` r`{s['afterRadius']}`")
        if s.get("pad") and s["pad"] != "0px":
            extra.append(f"pad `{s['pad']}`")
        if s.get("gap") and s["gap"] not in ("normal", "0px"):
            extra.append(f"gap `{s['gap']}`")
        rows.append(
            f"| {s['name']} | {fmt_pos(s['pos'])} | `{s['bg']}` | {s['radius']} "
            f"| {s['border'] or '—'} | {', '.join(extra) or '—'} |"
        )
    return "\n".join(rows)


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    os.makedirs(OUT_DIR, exist_ok=True)
    written = []

    for key, sec in data.items():
        if "error" in sec:
            print(f"skip {key}: {sec['error']}")
            continue
        ticket, name = TITLES.get(key, ("T??", key))
        files = Counter(i["file"] for i in sec["images"])

        md = f"""# {ticket} — {name}

Medido em `getComputedStyle` na página original, viewport 1440px.
Seletor no original: `{sec['selector']}`.

## Caixa da seção

| Propriedade | Valor |
| --- | --- |
| Dimensões | {sec['box']['w']}×{sec['box']['h']}px |
| Padding | `{sec['padding']}` |
| Fundo | `{sec['bg']}` |
| Container | 1200px, centrado |

A altura de {sec['box']['h']}px é o critério de aceite: a seção implementada
precisa fechar nela (tolerância 1px) em 1440px de viewport.

## Tipografia

{typography_table(sec['texts'])}

## Imagens

{len(sec['images'])} imagens, {len(files)} arquivos distintos.
Todas já estão em `public/img/`.

{images_table(sec['images'])}

## Superfícies

Cada linha é um elemento com fundo, borda, raio, máscara ou blur. Se o original
tem, o clone precisa ter — inclusive os `::after`.

{surfaces_table(sec['surfaces'])}

{MOTION}
## Pronto quando

- altura da seção bate em 1440px (tolerância 1px)
- cada texto acima confere em tamanho, LH, peso, tracking, cor e família
- cada imagem confere em posição e tamanho (tolerância 1%) e no `border-radius`
- cada superfície acima existe, com o mesmo fundo, raio, borda e máscara
- funciona em `<744`, `744–1199` e `>=1200` (regras em `all.css`)
"""
        path = os.path.join(OUT_DIR, f"{key}.md")
        open(path, "w", encoding="utf-8").write(md)
        written.append((key, len(md)))

    for k, n in written:
        print(f"docs/sections/{k}.md  ({n} bytes)")


if __name__ == "__main__":
    main()
