/**
 * O site original usa um atributo HTML customizado `effect` (ex.
 * <div effect="fade-up">) como gancho de animacao. Ele NAO pode ser
 * renomeado para data-effect: o CSS o seleciona via [effect="fade-up"] e o
 * script de comportamento consulta [effect].
 *
 * Declaration merging permite o atributo no JSX sem alterar o markup,
 * mantendo o objetivo 1:1.
 */

import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    effect?: string;
    /**
     * O Webflow emite loading="lazy" tambem em <div> (ex. o container do QR
     * code no rodape), onde o atributo nao e padrao. Preservado como esta.
     */
    loading?: string;
  }
  interface SVGAttributes<T> {
    effect?: string;
  }
}
