/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
extend: {
  colors: {
    catering: {
      light: "#f0ddbf",   // 背景色
      accent: "#e4b326",  // 點綴黃
      primary: "#b22a2a", // 主色紅
    },
  },
}

  },
  plugins: [],
}
