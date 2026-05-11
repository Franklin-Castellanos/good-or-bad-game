import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        mint: "#2fbf8f",
        coral: "#ff6b6b",
        lemon: "#ffd166",
        sky: "#64b5f6",
      },
      boxShadow: {
        soft: "0 18px 55px rgba(31, 41, 51, 0.12)",
      },
    },
  },
  plugins: [forms],
};

export default config;
