/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm, silk-inspired primary colors (golden milk palette)
        primary: {
          50: '#fefdf8',   // Cream silk
          100: '#fef7e0',  // Light golden milk
          200: '#fdecc8',  // Soft golden
          300: '#f9d71c',  // Golden honey
          400: '#f5c842',  // Rich golden
          500: '#e6a23c',  // Deep golden
          600: '#d69e2e',  // Warm amber
          700: '#b7791f',  // Dark amber
          800: '#975a16',  // Bronze
          900: '#744210',  // Deep bronze
        },
        // Enhanced neutrals for better dark mode
        neutral: {
          50: '#faf9f7',   // Warm white
          100: '#f5f4f1',  // Off-white
          200: '#e8e6e0',  // Light warm gray
          300: '#d6d3cc',  // Soft gray
          400: '#a8a29e',  // Medium gray
          500: '#78716c',  // Reading gray
          600: '#57534e',  // Dark reading gray
          700: '#44403c',  // Charcoal
          800: '#292524',  // Dark charcoal
          900: '#1c1917',  // Almost black
        },
        // Dark mode specific colors
        dark: {
          50: '#f8fafc',   // Very light
          100: '#f1f5f9',  // Light
          200: '#e2e8f0',  // Light gray
          300: '#cbd5e1',  // Medium light
          400: '#94a3b8',  // Medium
          500: '#64748b',  // Medium dark
          600: '#475569',  // Dark
          700: '#334155',  // Darker
          800: '#1e293b',  // Very dark
          900: '#0f172a',  // Almost black
        },
        // Accent colors for variety
        accent: {
          rose: '#f43f5e',     // For hearts/likes
          emerald: '#10b981',  // For success states
          amber: '#f59e0b',    // For warnings/highlights
          blue: '#3b82f6',     // For links/info
        },
        // Reading-specific colors
        reading: {
          bg: '#fefdf8',       // Warm reading background
          text: '#292524',     // Comfortable reading text
          muted: '#57534e',    // Secondary text
          border: '#e8e6e0',   // Subtle borders
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-source-sans)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-libre-baskerville)', 'Libre Baskerville', 'Georgia', 'Times New Roman', 'serif'],
        reading: ['var(--font-libre-baskerville)', 'Libre Baskerville', 'Georgia', 'Times New Roman', 'serif'],
        display: ['var(--font-inter)', 'var(--font-source-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'reading-sm': ['16px', '24px'],
        'reading-base': ['18px', '28px'],
        'reading-lg': ['20px', '32px'],
        'reading-xl': ['22px', '36px'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};