const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force single instances of core React packages.
// Expo SDK 51 + react-native-web 0.19.x require exact version alignment
// to avoid "Cannot set properties of undefined" crashes on web.
config.resolver.extraNodeModules = {
  'react':            path.resolve(__dirname, 'node_modules/react'),
  'react-dom':        path.resolve(__dirname, 'node_modules/react-dom'),
  'react-native':     path.resolve(__dirname, 'node_modules/react-native'),
  'react-native-web': path.resolve(__dirname, 'node_modules/react-native-web'),
};

module.exports = config;
