/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sido: {
          green: '#007A41',
          'green-dark': '#005A2E',
          yellow: '#FFD100',
          white: '#FFFFFF',
          bg: '#F6F8F7',
          blue: '#1976D2',
          error: '#D32F2F',
          success: '#4CAF50',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
