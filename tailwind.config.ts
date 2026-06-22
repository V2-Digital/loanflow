import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          600: "#2b59c3",
          700: "#234aa3",
          800: "#1c3c82",
        },
      },
    },
  },
  plugins: [],
};
export default config;
