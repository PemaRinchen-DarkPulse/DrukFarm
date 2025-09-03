// tailwind.config.js
module.exports = {
  content: ["./App.js", "./components/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#014D40",
        primaryDark: "#A7E6C5",
        secondary: "#164E43",
        accent: "#A7E6C5",
        background: "#F9F9F9",
        foreground: "#0B3B34",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.563rem",
        lg: "0.625rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
