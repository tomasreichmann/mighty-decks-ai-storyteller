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
                "kac-steel": "#C1CEDA",
                "kac-steel-light": "#F7F8F9",
                "kac-steel-dark": "#7B8EA6",
                "kac-iron": "#121B23",
                "kac-iron-light": "#354B5F",
                "kac-iron-dark": "#0B141C",
                "kac-blood": "#CE2225",
                "kac-blood-light": "#EC2A34",
                "kac-blood-lighter": "#FD8286",
                "kac-blood-lightest": "#FDA2A8",
                "kac-blood-dark": "#7F2D42",
                "kac-fire": "#F38112",
                "kac-fire-light": "#FDB20E",
                "kac-fire-lightest": "#FEEB95",
                "kac-fire-dark": "#A6110E",
                "kac-bone": "#EFD9BB",
                "kac-bone-light": "#EEDEC8",
                "kac-bone-dark": "#B59A79",
                "kac-bone-darker": "#9A7F63",
                "kac-skin": "#FEC7DF",
                "kac-skin-light": "#FBD8DE",
                "kac-skin-dark": "#F4A4AC",
                "kac-gold": "#FDCD37",
                "kac-gold-light": "#FEF8C4",
                "kac-gold-dark": "#FAAE2F",
                "kac-gold-darker": "#D98904",
                "kac-cloth": "#3C83FC",
                "kac-cloth-light": "#8DACC5",
                "kac-cloth-lightest": "#E2EBF0",
                "kac-cloth-dark": "#415F93",
                "kac-curse": "#AB58E4",
                "kac-curse-light": "#C778FC",
                "kac-curse-lighter": "#E8BCFD",
                "kac-curse-lightest": "#FBF0FE",
                "kac-curse-dark": "#7202AF",
                "kac-monster": "#54BD8C",
                "kac-monster-light": "#BDF5C1",
                "kac-monster-lightest": "#EAFDBD",
                "kac-monster-dark": "#32C045",
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
