/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'sfpro-regular': ['SFProDisplay-Regular'],
        'sfpro-medium': ['SFProDisplay-Medium'],
        'sfpro-semibold': ['SFProDisplay-Semibold'],
        'sfpro-light': ['SFProDisplay-Light'],
        'sfpro-bold': ['SFProDisplay-Bold'],
        'goudy': ['SortsMillGoudy-Regular'],
      },
    },
  },
  plugins: [],
}