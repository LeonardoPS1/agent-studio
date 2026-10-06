import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,tsx,tsx}",
    "./app/**/*.css",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        ok: "var(--ok)",
        bad: "var(--bad)",
        thinking: "var(--thinking)",
        tool: "var(--tool)",
        waiting: "var(--waiting)",
      },
    },
  },
  plugins: [],
} satisfies Config;