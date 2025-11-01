module.exports = {
  expo: {
    name: 'TeachEase',
    slug: 'teachease',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'com.librarian1.teachease',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    extra: {
      eas: {
        projectId: '091ba7f6-db58-4081-99e7-9e1c82da627d',
      },
    },
    plugins: ['expo-router'],

    // Only target mobile platforms
    platforms: ['android', 'ios'],
  },
};
