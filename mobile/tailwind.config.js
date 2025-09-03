/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        sm: '0.375rem', // 0.625rem - 4px
        md: '0.5rem',   // 0.625rem - 2px
        lg: '0.625rem',
        xl: '0.875rem', // 0.625rem + 4px
      },
      colors: {
        background: '#F9F9F9',
        foreground: '#0B3B34',
        card: '#FFFFFF',
        primary: '#014D40',
        accent: '#A7E6C5',
        secondary: '#164E43',
        muted: '#F1F5F4',
        destructive: '#EF4444',
        border: '#E3ECE8',
        ring: '#A7E6C5',
        sidebar: '#FFFFFF',
        // ...add more colors from your web CSS
      },
    },
  },
  plugins: [],
};
