import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          primary: "#1351B4",
          secondary: "#2670E8",
          ink: "#0A2A5E",
          bg: "#F4F6FA",
          surface: "#FFFFFF",
          text: "#13213B",
          muted: "#5A6B82",
          line: "#E2E8F0",
          success: "#157A1F",
          warning: "#FFCD07",
          danger: "#C5221F"
        }
      },
      fontFamily: {
        sans: ['"Public Sans"', "system-ui", "Arial", "sans-serif"],
        display: ['"Libre Franklin"', '"Public Sans"', "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 33, 64, 0.04), 0 8px 24px -16px rgba(16, 33, 64, 0.25)",
        header: "0 1px 0 rgba(16, 33, 64, 0.06), 0 12px 30px -24px rgba(16, 33, 64, 0.45)"
      }
    }
  },
  plugins: []
} satisfies Config;
