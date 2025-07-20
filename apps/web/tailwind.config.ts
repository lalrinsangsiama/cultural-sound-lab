import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cultural Sound Lab Design System
        obsidian: "#0A0A0A",
        champagne: "#D4AF37",
        
        // Accent Colors
        emerald: "#10B981",
        sapphire: "#0EA5E9", 
        amber: "#F59E0B",
        ruby: "#DC2626",
        
        // Neutral Spectrum
        black: "#000000",
        graphite: "#111111",
        charcoal: "#1C1C1C",
        slate: "#2A2A2A",
        iron: "#404040",
        steel: "#525252",
        silver: "#737373",
        ash: "#A3A3A3",
        pearl: "#E5E5E5",
        snow: "#F5F5F5",
        
        // Metallic Accents
        gold: "#D4AF37",
        bronze: "#CD7F32",
        platinum: "#E5E5E4",
        
        // Backwards compatibility with shadcn/ui
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["Neue Montreal", "Suisse Int'l", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["PP Neue Machina", "sans-serif"],
        mono: ["IBM Plex Mono", "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        hero: ["80px", { lineHeight: "80px", letterSpacing: "-0.04em" }],
        display: ["56px", { lineHeight: "60px", letterSpacing: "-0.03em" }],
        h1: ["40px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        h2: ["32px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
        h3: ["24px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        h4: ["18px", { lineHeight: "24px", letterSpacing: "0" }],
        body: ["16px", { lineHeight: "24px", letterSpacing: "0" }],
        small: ["14px", { lineHeight: "20px", letterSpacing: "0.01em" }],
        caption: ["12px", { lineHeight: "16px", letterSpacing: "0.02em" }],
      },
      spacing: {
        micro: "2px",
        micro2: "4px",
        13: "3.25rem", // 52px for large buttons
        15: "3.75rem", // 60px for extra large elements
        18: "4.5rem",  // 72px for hero elements
      },
      height: {
        13: "3.25rem", // 52px for large buttons
        15: "3.75rem", // 60px
        18: "4.5rem",  // 72px
      },
      borderRadius: {
        small: "4px",
        medium: "8px", 
        large: "12px",
        round: "9999px",
        // Backwards compatibility
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.3)",
        medium: "0 4px 12px rgba(0,0,0,0.4)",
        elevated: "0 8px 24px rgba(0,0,0,0.5)",
        gold: "0 0 24px rgba(212,175,55,0.2)",
      },
      transitionTimingFunction: {
        refined: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gold-glow": {
          "0%": { boxShadow: "0 0 0 rgba(212,175,55,0)" },
          "50%": { boxShadow: "0 0 24px rgba(212,175,55,0.2)" },
          "100%": { boxShadow: "0 0 0 rgba(212,175,55,0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gold-glow": "gold-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;