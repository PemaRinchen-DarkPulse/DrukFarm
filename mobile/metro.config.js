// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Get Expo's default Metro config
const config = getDefaultConfig(__dirname);

// Wrap it with NativeWind to enable Tailwind support
module.exports = withNativeWind(config, {
  input: "./global.css", // your main CSS file
});
