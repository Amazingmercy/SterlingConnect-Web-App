/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '760px', // exact breakpoint from test index.css:1901
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      colors: {
        'sterling-navy': '#102641',
        'sterling-gold': '#c59b27',
        navy: {
          DEFAULT: '#102641',
          head: '#112440',
          head2: '#122642',
          ink: '#10223c',
        },
        green: {
          DEFAULT: '#087b63',
          dark: '#05644f',
          light: '#0c9a76',
          brand: '#078368',
          signin: '#086b58',
        },
        mint: {
          DEFAULT: '#e3f4ed',
          soft: '#f0f6f4',
          bg: '#dff5eb',
          ring: '#90cfc0',
          border: '#bddbd1',
          dot: '#d8eee6',
        },
        muted: '#627086',
        mutedDark: '#526078',
        line: '#e4eaf0',
        lineLight: '#edf0f3',
        paper: '#ffffff',
        accent: {
          peach: '#fff0e4',
          peachText: '#b66b25',
          blue: '#e9f0ff',
          blueText: '#4164bd',
          lilac: '#f0eaff',
          lilacText: '#8054c8',
          yellow: '#fff6d9',
          yellowText: '#b28722',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        brand: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        btnPrimary: '0 7px 16px rgba(8, 123, 99, 0.20)',
        float: '0 16px 42px rgba(16, 38, 65, 0.15)',
        heroImage: '0 22px 55px rgba(25, 59, 49, 0.18)',
        tile: '0 3px 10px rgba(17, 36, 64, 0.04)',
        tileHover: '0 12px 25px rgba(16, 38, 65, 0.08)',
      },
      borderRadius: {
        hero: '170px 170px 22px 22px',
      },
    },
  },
  plugins: [],
}
