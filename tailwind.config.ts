import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf9ef",
          100: "#f9efd5",
          200: "#f2dda6",
          300: "#eac66d",
          400: "#e3ae41",
          500: "#d99a26",
          600: "#c07d1d",
          700: "#a05f1b",
          800: "#834b1d",
          900: "#6c3e1b",
          950: "#3d200c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
