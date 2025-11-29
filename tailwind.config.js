/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                humanea: {
                    bordeaux: '#7C1653',
                    rose: '#C51F84',
                    violet: '#3B2257',
                }
            }
        },
    },
    plugins: [],
}
