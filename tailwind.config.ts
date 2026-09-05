import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores de marca — ver brand/ para o brand book original. DEFAULT/hover/
        // dark/text ficam fixos entre os temas (identidade visual não muda);
        // os tons "light"/"soft" (fundos suaves) e os neutros/superficie são
        // var(--x) — ver .dark em app/globals.css — porque esses sim precisam
        // escurecer no tema escuro.
        // Cor principal do brand book. Três papéis distintos de propósito:
        //   primary       preenchimento (botão, selo, ícone cheio)
        //   primary-text  o que vai EM CIMA do preenchimento — preto, porque
        //                 branco sobre o néon dá 1.18:1 e desaparece
        //   primary-forte texto/ícone/borda soltos na página; no tema claro é
        //                 um verde escurecido da mesma família (5.37:1 sobre
        //                 branco), no escuro é o próprio néon
        primary: {
          DEFAULT: "#CCFF00",
          hover: "#B8E600",
          text: "#0A0A0A",
          forte: "rgb(var(--primary-forte) / <alpha-value>)",
          light: "rgb(var(--primary-light) / <alpha-value>)",
          border: "rgb(var(--primary-border) / <alpha-value>)",
        },
        // Mesma separação da primary: DEFAULT é PREENCHIMENTO (fica igual nos
        // dois temas, é identidade), `texto` é a versão legível que troca de
        // claridade com o tema.
        verde: {
          DEFAULT: "#2DBE8C", // entradas, sucesso, faturamento positivo
          light: "rgb(var(--verde-light) / <alpha-value>)",
          texto: "rgb(var(--verde-texto) / <alpha-value>)",
          dark: "rgb(var(--verde-texto) / <alpha-value>)",
        },
        ambar: {
          DEFAULT: "#F4A653", // alertas, pendências, contas a pagar
          light: "rgb(var(--ambar-light) / <alpha-value>)",
          soft: "rgb(var(--ambar-soft) / <alpha-value>)",
          texto: "rgb(var(--ambar-texto) / <alpha-value>)",
          dark: "rgb(var(--ambar-texto) / <alpha-value>)",
          text: "rgb(var(--ambar-texto) / <alpha-value>)",
        },
        fundo: "rgb(var(--fundo) / <alpha-value>)", // background do app
        superficie: "rgb(var(--superficie) / <alpha-value>)", // cards, modais, inputs — era bg-white fixo
        escuro: "rgb(var(--escuro) / <alpha-value>)", // texto principal / modo escuro — nunca preto puro
        erro: {
          DEFAULT: "#E8564A",
          light: "rgb(var(--erro-light) / <alpha-value>)",
          texto: "rgb(var(--erro-texto) / <alpha-value>)",
          dark: "rgb(var(--erro-texto) / <alpha-value>)",
        },
        neutro: {
          border: "rgb(var(--neutro-border) / <alpha-value>)",
          muted: "rgb(var(--neutro-muted) / <alpha-value>)",
          "muted-strong": "rgb(var(--neutro-muted-strong) / <alpha-value>)",
          disabled: "rgb(var(--neutro-disabled) / <alpha-value>)",
          "disabled-text": "rgb(var(--neutro-disabled-text) / <alpha-value>)",
          icon: "#9CA3AF", // ícones inativos na bottom nav
        },
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        confete: {
          "0%": { transform: "translateY(-6px) rotate(0deg)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": {
            transform: "translateY(26px) rotate(140deg)",
            opacity: "0",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-11px) rotate(0.6deg)" },
        },
        "pulse-badge": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-4px)" },
        },
        /*
         * A respiração da marca na tela de abertura.
         *
         * Não é uma roda girando, e a diferença importa: a roda promete
         * "estou trabalhando" e, quando demora, vira a medida do quanto
         * está demorando. A marca que respira não mede nada — ela ocupa o
         * tempo sem cobrar dele.
         *
         * Amplitude curta de propósito (4% de escala): mais que isso e o
         * logo pulsa, o que lê como alerta.
         */
        /*
         * A abertura, em três tempos.
         *
         * A marca assenta com mola e o nome sobe. Duas animações e não uma
         * porque cada uma tem duração e curva próprias — o assentamento
         * precisa de `cubic-bezier` com overshoot, que no nome ficaria
         * saltitante demais.
         */
        /*
         * A entrada de uma tela.
         *
         * TERMINA EM `none` E `1` DE PROPÓSITO, e isso é o que a torna
         * possível aqui. `transform` ou `opacity < 1` num ancestral de um
         * elemento `.vidro` cria um backdrop root e achata o `backdrop-filter`
         * de tudo abaixo — é a razão de a `motion` estar instalada e não ser
         * usada dentro do app.
         *
         * Ao fechar em valores neutros, o navegador desfaz a camada e o vidro
         * volta ao normal. O achatamento existe, mas dura os 280ms da entrada,
         * enquanto o conteúdo ainda está surgindo — que é exatamente quando
         * ninguém olha para o desfoque do fundo.
         *
         * Por isso também NÃO tem `will-change`: ele manteria a camada viva
         * depois do fim, e aí o vidro ficaria achatado para sempre.
         */
        "entrar-tela": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "assentar-marca": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.09)" },
          "100%": { transform: "scale(1)" },
        },
        "subir-nome": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        respirar: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        /*
         * O balanço do modo de edição, igual ao da tela de início do iPhone.
         *
         * Amplitude minúscula (0,6 grau) e ritmo curto: é um sinal de estado,
         * não uma animação. Mais que isso e a tela inteira parece tremendo,
         * o que atrapalha justamente quem está tentando mirar um botão de
         * remover.
         */
        balancar: {
          "0%, 100%": { transform: "rotate(-0.6deg)" },
          "50%": { transform: "rotate(0.6deg)" },
        },
        "blink-erro": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        confete: "confete 1.8s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-badge": "pulse-badge 2s ease-in-out infinite",
        "typing-dot": "typing-dot 1.2s infinite",
        // `both` segura o estado inicial durante o atraso — sem ele, o nome
        // pisca visível antes de começar a subir.
        "entrar-tela": "entrar-tela 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        "assentar-marca":
          "assentar-marca 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "subir-nome": "subir-nome 0.36s ease-out 0.12s both",
        respirar: "respirar 2.4s ease-in-out infinite",
        balancar: "balancar 0.35s ease-in-out infinite",
        "blink-erro": "blink-erro 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
