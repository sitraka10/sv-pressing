import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontFamily: {
        sans: [
          "Quicksand",
          "ui-sans-serif",
          "system-ui",
          "-apple-system"
        ],
        display: ["Pacifico", "cursive"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        cyan: {
          50: "#E9F6F7",
          100: "#D2EEF0",
          200: "#A6DEE1",
          300: "#79CDD2",
          400: "#55BDC3",
          500: "#389FA4",
          600: "#2F8A8E",
          700: "#257075",
          800: "#1D585C",
          900: "#153F42",
        },
        blue: {
          50: "#E9F0F1",
          100: "#D3E1E3",
          200: "#A6C3C6",
          300: "#79A5AA",
          400: "#4C878E",
          500: "#0B676E",
          600: "#09555B",
          700: "#074349",
          800: "#053538",
          900: "#042628",
        },
        brand: {
          main: "#0B676E",
          secondary: "#389FA4",
          accent: "#EF761B",
          surfaceSoft: "#D0EBF4",
        },
        amber: {
          50: "#FFF2E8",
          100: "#FFDCC3",
          200: "#FFBE8E",
          300: "#FF9F58",
          400: "#FF8833",
          500: "#EF761B",
          600: "#D56817",
          700: "#B15713",
          800: "#8C460F",
          900: "#5D2F0A",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;