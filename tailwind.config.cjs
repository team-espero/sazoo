module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components.tsx',
    './context.tsx',
    './utils.ts',
    './components/**/*.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'base-light': '#FDFBF7',
        'base-dark': '#120B2E',
        'pastel-peach': '#FFDAB9',
        lavender: '#E6E6FA',
        mint: '#98FF98',
      },
      animation: {
        float: 'float 20s ease-in-out infinite',
        'float-delayed': 'float 25s ease-in-out 2s infinite',
        'float-slow': 'float 22s ease-in-out 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(30px, -50px) rotate(10deg)' },
          '66%': { transform: 'translate(-20px, 20px) rotate(-5deg)' },
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
};
