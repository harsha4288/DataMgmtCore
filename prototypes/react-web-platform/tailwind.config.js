/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        // Table-specific colors from CSS variables
        "table-container": "hsl(var(--table-container))",
        "table-container-elevated": "hsl(var(--table-container-elevated))",
        "table-header": "hsl(var(--table-header))",
        "table-header-elevated": "hsl(var(--table-header-elevated))",
        "table-frozen-column": "hsl(var(--table-frozen-column))",
        "table-group-header": "hsl(var(--table-group-header))",
        "table-group-header-line": "hsl(var(--table-group-header-line))",
        "table-row": "hsl(var(--table-row))",
        "table-row-hover": "hsl(var(--table-row-hover))",
        "table-border": "hsl(var(--table-border))",
        // Table border variants
        "table": "hsl(var(--table-border))",
      },
      borderColor: {
        DEFAULT: "hsl(var(--border))",
        // Table-specific border colors
        "table": "hsl(var(--table-border))",
        "table-group-header-line": "hsl(var(--table-group-header-line))",
      },
      boxShadow: {
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        // Table-specific shadows
        "table": "var(--table-shadow)",
        "table-elevated": "var(--table-shadow-elevated)",
        "table-freeze": "var(--table-freeze-shadow)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
}