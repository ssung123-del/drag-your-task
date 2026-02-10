/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1B4F72", // Church Blue
                accent: "#2E86C1", // Light Blue
                highlight: "#FFF9C4", // Light Yellow
                bg: "#F8F9FA", // Light Gray
            },
        },
    },
    plugins: [],
}
