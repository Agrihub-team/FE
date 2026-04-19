/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#047857", // Xanh Agri
        secondary: "#facc15", // Vàng Flash Sale
        admin: "#14532D", // Xanh Admin đậm
        lime: "#A3E635" // Xanh chuối Active
      },
    },
  },
  plugins: [],
}