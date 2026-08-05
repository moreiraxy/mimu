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
        // Cores de marca — ver brand/ para o brand book original
        coral: {
          DEFAULT: "#FF6B5B", // cor principal: CTAs, ícone, contato direto com a Mimu
          hover: "#E85A4A",
          light: "#FFF5F4", // fundos e cards de destaque suave
          border: "#FFD8D4",
        },
        verde: {
          DEFAULT: "#2DBE8C", // entradas, sucesso, faturamento positivo
          light: "#E6F7EF",
          dark: "#1C7A54",
        },
        ambar: {
          DEFAULT: "#F4A653", // alertas, pendências, contas a pagar
          light: "#FEF6EB",
          soft: "#FDF0DD",
          dark: "#8A5A1C",
          text: "#B9762A",
        },
        fundo: "#F7F6F3", // background do app
        escuro: "#1E1E2E", // texto principal / modo escuro — nunca preto puro
        erro: {
          DEFAULT: "#E8564A",
          light: "#FDEAEA",
          dark: "#C2453F",
        },
        neutro: {
          border: "#E4E1DA",
          muted: "#9A9690",
          "muted-strong": "#6F6B64",
          disabled: "#EDEBE6",
          "disabled-text": "#B3AFA7",
        },
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
