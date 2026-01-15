module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'quest-purple': '#0ea5e9', // Replaced with Sky Blue (keeping var name for easier refactor first, or should I rename?) -> Let's rename for clarity if I can batch replace. Actuall, let's add new ones and map old ones to new ones to avoid breaking builds immediately, then refactor.
        // Better: Redefine the palette.
        'neon-blue': '#0ea5e9', // Sky 500
        'neon-cyan': '#06b6d4', // Cyan 500
        'obsidian': '#020617', // Slate 950 (Deep Blue-Black)
        'quest-gold': '#fbbf24', // Keeping for accents/rewards
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px #0ea5e9, 0 0 20px #0ea5e9' },
          'to': { boxShadow: '0 0 20px #0ea5e9, 0 0 30px #0ea5e9' },
        }
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.neon-blue"), 0 0 20px theme("colors.neon-blue")',
        'neon-hover': '0 0 10px theme("colors.neon-blue"), 0 0 40px theme("colors.neon-blue")',
      }
    },
  },
  plugins: [],
}
