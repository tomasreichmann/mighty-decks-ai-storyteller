import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: [
    "animate-fadeIn",
    "animate-fadeOut",
    "drop-shadow-md",
    "print:drop-shadow-none",
    "print:filter-none",
    "inline-block",
  ],
  theme: {
    extend: {
      colors: {
        // Mighty Decks color palette
        "kac-steel": "#abb4c3",
        "kac-steel-light": "#f3f3f4",
        "kac-steel-dark": "#65738b",
        "kac-iron": "#121b23",
        "kac-iron-light": "#23303d",
        "kac-iron-dark": "#090f15",
        "kac-blood": "#7b001d",
        "kac-blood-light": "#e3132c",
        "kac-blood-lighter": "#ff6b6b",
        "kac-blood-lightest": "#ff9494",
        "kac-blood-dark": "#541423",
        "kac-fire": "#f50000",
        "kac-fire-light": "#f88b00",
        "kac-fire-lightest": "#ffe79b",
        "kac-fire-dark": "#950101",
        "kac-bone": "#ecb87b",
        "kac-bone-light": "#e4ceb3",
        "kac-bone-dark": "#a3835f",
        "kac-bone-darker": "#856a4c",
        "kac-skin": "#f7adae",
        "kac-skin-light": "#f2ced1",
        "kac-skin-dark": "#e6848c",
        "kac-gold": "#ffd23b",
        "kac-gold-light": "#fff5c0",
        "kac-gold-dark": "#f59d20",
        "kac-gold-darker": "#c37509",
        "kac-cloth": "#5c77b2",
        "kac-cloth-light": "#80a0bc",
        "kac-cloth-lightest": "#d8e2ea",
        "kac-cloth-dark": "#32497b",
        "kac-curse": "#f20170",
        "kac-curse-light": "#ff6883",
        "kac-curse-lighter": "#ffc8d1ff",
        "kac-curse-lightest": "#fff2f2",
        "kac-curse-dark": "#c10045",
        "kac-monster": "#4ec342",
        "kac-monster-light": "#a4e9a4",
        "kac-monster-lightest": "#d7ffab",
        "kac-monster-dark": "#1aa62b",
        ink: "#111827",
        paper: "#f8fafc",
        accent: "#0f766e",
      },
      fontSize: {
        "2xs": ["0.6rem", "0.75rem"],
        "3xs": ["0.5rem", "0.6rem"],
      },
      fontFamily: {
        kacBody: ["Shantell Sans", "cursive"],
        kacLogo: ["Kalam", "cursive"],
        kacTitle: ["Passion One", "sans-serif"],
        kacHeading: ["Kalam", "cursive"],
      },
      backgroundPosition: {
        "1/3": "center 33%",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        wave: {
          "0%": { transform: "rotate(0.0deg)" },
          "10%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "30%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10.0deg)" },
          "60%": { transform: "rotate(0.0deg)" },
          "100%": { transform: "rotate(0.0deg)" },
        },
        breathe: {
          "0%": { transform: "scale(0.9)" },
          "25%": { transform: "scale(1)" },
          "60%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(0.9)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.6s ease-in-out",
        fadeOut: "fadeOut 0.6s ease-in-out",
        wave: "wave 0.6s linear infinite",
        breathe: "breathe 1s ease-in-out infinite",
      },
      animationDelay: {
        2000: "2000ms",
        3000: "3000ms",
        4000: "4000ms",
        5000: "5000ms",
      },
      animationDuration: {
        2000: "2000ms",
        3000: "3000ms",
        4000: "4000ms",
        5000: "5000ms",
      },
      dropShadow: {
        "md-heavy": [
          "0 1px 2px rgb(0 0 0 / 0.25)",
          "0 1px 1px rgb(0 0 0 / 0.12)",
        ],
        "lg-heavy": [
          "0 10px 8px rgb(0 0 0 / 0.25)",
          "0 4px 3px rgb(0 0 0 / 0.12)",
        ],
        "xl-heavy": [
          "0 20px 13px rgb(0 0 0 / 0.25)",
          "0 8px 5px rgb(0 0 0 / 0.12)",
        ],
        title: [
          "0px 1px 0px #1f081d",
          "0px 3px 0px #6d2648",
          "0px 3px 0px #1f081d",
        ],
        emboss: ["0px 2px 0px #1f081d"],
      },
      textShadow: {
        sm: "0 1px 2px var(--tw-shadow-color)",
        DEFAULT: "0 2px 4px var(--tw-shadow-color)",
        lg: "0 8px 16px var(--tw-shadow-color)",
      },
    },
  },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "translate-z": (value) => ({
            "--tw-translate-z": value,
            transform:
              "translate3d(var(--tw-translate-x), var(--tw-translate-y), var(--tw-translate-z)) " +
              "rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) " +
              "scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))",
          }),
        },
        { values: theme("translate"), supportsNegativeValues: true },
      );
    }),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") },
      );
    }),
    require("@designbycode/tailwindcss-text-stroke"),
  ],
} satisfies Config;
