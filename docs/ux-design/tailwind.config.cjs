/** @type {import('tailwindcss').Config} */
const lightTheme = require("daisyui/src/colors/themes")["[data-theme=light]"];
const darkTheme = require("daisyui/src/colors/themes")["[data-theme=dark]"];
const plugin = require("tailwindcss/plugin");

module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "node_modules/daisyui/dist/**/*.js",
        "node_modules/react-daisyui/dist/**/*.js",
    ],
    safelist: [
        "animate-fadeIn",
        "animate-fadeOut",
        "drop-shadow-md",
        "print:drop-shadow-none",
        "print:filter-none",
        "inline-block",
        "card",
        "card-up",
    ],
    theme: {
        extend: {
            colors: {
                // Mighty Decks color palette
                "kac-steel": "#B7C0CD",
                "kac-steel-light": "#F4F4F5",
                "kac-steel-dark": "#6F8098",
                "kac-iron": "#1F2937",
                "kac-iron-light": "#324457",
                "kac-iron-dark": "#101B26",
                "kac-blood": "#C1121F",
                "kac-blood-light": "#E82029",
                "kac-blood-lighter": "#FD7D7D",
                "kac-blood-lightest": "#FE9C9E",
                "kac-blood-dark": "#722538",
                "kac-fire": "#E45700",
                "kac-fire-light": "#FDAD19",
                "kac-fire-lightest": "#FEE58F",
                "kac-fire-dark": "#9D0F0C",
                "kac-bone": "#E8C9A6",
                "kac-bone-light": "#E8D1B6",
                "kac-bone-dark": "#AC8D6B",
                "kac-bone-darker": "#91765A",
                "kac-skin": "#F7B8C6",
                "kac-skin-light": "#F6D1D0",
                "kac-skin-dark": "#F1979A",
                "kac-gold": "#F7B500",
                "kac-gold-light": "#FEF3B6",
                "kac-gold-dark": "#F8A732",
                "kac-gold-darker": "#CC7E0D",
                "kac-cloth": "#2F6FED",
                "kac-cloth-light": "#82A1BA",
                "kac-cloth-lightest": "#D9E3EA",
                "kac-cloth-dark": "#3C598D",
                "kac-curse": "#E83E8C",
                "kac-curse-light": "#FD718C",
                "kac-curse-lighter": "#FEC7CA",
                "kac-curse-lightest": "#FEEEED",
                "kac-curse-dark": "#C6034C",
                "kac-monster": "#3CB371",
                "kac-monster-light": "#B5F3B7",
                "kac-monster-lightest": "#E5FCA7",
                "kac-monster-dark": "#28B13A",
            },
            fontSize: {
                "2xs": ["0.6rem", "0.75rem"],
                "3xs": ["0.5rem", "0.6rem"],
            },
            fontFamily: {
                // Mighty Decks fonts
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
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
                fadeOut: {
                    "0%": { opacity: 1 },
                    "100%": { opacity: 0 },
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
                "md-heavy": ["0 1px 2px rgb(0 0 0 / 0.25)", "0 1px 1px rgb(0 0 0 / 0.12)"],
                "lg-heavy": ["0 10px 8px rgb(0 0 0 / 0.25)", "0 4px 3px rgb(0 0 0 / 0.12)"],
                "xl-heavy": ["0 20px 13px rgb(0 0 0 / 0.25)", "0 8px 5px rgb(0 0 0 / 0.12)"],
                title: ["0px 1px 0px #1f081d", "0px 3px 0px #6d2648", "0px 3px 0px #1f081d"],
                emboss: ["0px 2px 0px #1f081d"],
            },
            textShadow: {
                sm: "0 1px 2px var(--tw-shadow-color)",
                DEFAULT: "0 2px 4px var(--tw-shadow-color)",
                lg: "0 8px 16px var(--tw-shadow-color)",
            },
        },
    },
    daisyui: {
        themes: [
            "light",
            "dark",
            {
                MightyDecks: {
                    ...darkTheme,
                    primary: "#EC7812",
                    secondary: "#4DBC7E",
                    accent: "#E6458B",
                    neutral: "#191d24",
                    "neutral-focus": "#111318",
                    "neutral-content": "#a6adbb",
                    "base-100": "#324457",
                    "base-200": "#2F3D4E",
                    "base-300": "#101B26",
                    "base-content": "#B5C1CE",
                    fontFamily: "'Shadows Into Light Two', cursive",
                },
            },
        ],
    },
    plugins: [
        require("@tailwindcss/typography"),
        require("tailwindcss-animate"),
        require("daisyui"),
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    "translate-z": (value) => ({
                        "--tw-translate-z": value,
                        transform: ` translate3d(var(--tw-translate-x), var(--tw-translate-y), var(--tw-translate-z)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))`,
                    }), // this is actual CSS
                },
                { values: theme("translate"), supportsNegativeValues: true }
            );
        }),
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    "text-shadow": (value) => ({
                        textShadow: value,
                    }),
                },
                { values: theme("textShadow") }
            );
        }),
    ],
};
