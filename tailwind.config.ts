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
        coral: {
          DEFAULT: "#FF6B5B", // cor principal: CTAs, ícone, contato direto com a Mimu
          hover: "#E85A4A",
          light: "rgb(var(--coral-light) / <alpha-value>)", // fundos e cards de destaque suave
          border: "rgb(var(--coral-border) / <alpha-value>)",
        },
        verde: {
          DEFAULT: "#2DBE8C", // entradas, sucesso, faturamento positivo
          light: "rgb(var(--verde-light) / <alpha-value>)",
          dark: "#1C7A54",
        },
        ambar: {
          DEFAULT: "#F4A653", // alertas, pendências, contas a pagar
          light: "rgb(var(--ambar-light) / <alpha-value>)",
          soft: "rgb(var(--ambar-soft) / <alpha-value>)",
          dark: "#8A5A1C",
          text: "#B9762A",
        },
        fundo: "rgb(var(--fundo) / <alpha-value>)", // background do app
        superficie: "rgb(var(--superficie) / <alpha-value>)", // cards, modais, inputs — era bg-white fixo
        escuro: "rgb(var(--escuro) / <alpha-value>)", // texto principal / modo escuro — nunca preto puro
        erro: {
          DEFAULT: "#E8564A",
          light: "rgb(var(--erro-light) / <alpha-value>)",
          dark: "#C2453F",
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
          "100%": { transform: "translateY(26px) rotate(140deg)", opacity: "0" },
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
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        confete: "confete 1.8s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-badge": "pulse-badge 2s ease-in-out infinite",
        "typing-dot": "typing-dot 1.2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
