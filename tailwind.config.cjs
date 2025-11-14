// tailwind.config.cjs
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        joeticket: {
          primary: "#2563EB",
          "primary-content": "#F9FAFB",

          secondary: "#0F172A",
          "secondary-content": "#E5E7EB",

          accent: "#F97316",
          "accent-content": "#111827",

          neutral: "#1F2937",
          "neutral-content": "#F9FAFB",

          "base-100": "#F9FAFB",
          "base-200": "#E5E7EB",
          "base-300": "#D1D5DB",
          "base-content": "#0F172A",

          info: "#0EA5E9",
          success: "#22C55E",
          warning: "#FACC15",
          error: "#EF4444",
        },
      },
      "dark", // thème dark de base DaisyUI
    ],
  },
};
