import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          primary: "#1351B4",
          secondary: "#2670E8",
          bg: "#F8F8F8",
          text: "#1B1B1B",
          muted: "#555555",
          success: "#168821",
          warning: "#FFCD07",
          danger: "#E52207"
        }
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
