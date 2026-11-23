import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F2E9",
        shell: "#EFE7D8",
        card: "#FFFDF8",
        ink: "#191710",
        muted: "#7C7466",
        line: "#E3DACA",
        gold: "#D9A93C",
        blue: "#2F6079",
        green: "#467850",
        red: "#B44628",
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino", "Didot", "Georgia", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(25,23,16,.04), 0 12px 30px -24px rgba(25,23,16,.35)",
      },
    },
  },
  plugins: [],
};

export default config;
