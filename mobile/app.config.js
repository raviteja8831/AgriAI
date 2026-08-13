require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = {
  expo: {
    name: 'AgriAI',
    slug: 'agri-ai',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android', 'web'],
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
    },
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#2e7d32',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.agriAI.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'AgriAI needs your location to show farm-specific weather and map your field.',
        NSLocationAlwaysUsageDescription: 'AgriAI needs your location for automatic weather updates.',
        NSCameraUsageDescription: 'AgriAI needs camera access to photograph crop conditions.',
        NSPhotoLibraryUsageDescription: 'AgriAI needs photo library access to upload crop images.',
      },
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2e7d32',
      },
      package: 'com.agriAI.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      'expo-location',
      'expo-image-picker',
      'expo-font',
      'expo-asset',
      'expo-splash-screen',
      'expo-status-bar',
    ],
  },
};
