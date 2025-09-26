const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// Optimize for Android builds
config.resolver.platforms = ['native', 'android', 'ios', 'web'];
config.resolver.assetExts.push('bin');

module.exports = withNativeWind(config, { input: './global.css' });