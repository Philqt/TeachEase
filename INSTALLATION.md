# 📦 TeachEase Installation & Deployment Guide

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Expo CLI** - Install globally:
  ```bash
  npm install -g expo-cli
  ```

### For Android Development
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API 33 or higher)
- **Android Emulator** or physical Android device

### For iOS Development (Mac only)
- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** - Install:
  ```bash
  sudo gem install cocoapods
  ```
- **iOS Simulator** or physical iOS device

### Firebase Account
- Create a free account at [Firebase Console](https://console.firebase.google.com/)

## 📥 Installation Steps

### Step 1: Navigate to Project Directory
```bash
cd c:\Users\Admin\OneDrive\Documents\TeachEase
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Firebase
- Expo packages
- React Native Paper
- QR code libraries
- Navigation libraries
- And more...

### Step 3: Firebase Setup

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use existing project "teachease-efecc"
3. Follow the setup wizard

#### 3.2 Enable Authentication
1. In Firebase Console, click **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Click **Save**

#### 3.3 Create Firestore Database
1. Click **Firestore Database** in sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your preferred region
5. Click **Enable**

#### 3.4 Set Firestore Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Teachers can only access their own data
    match /teachers/{teacherId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == teacherId;
    }
  }
}
```

3. Click **Publish**

#### 3.5 Verify Firebase Configuration
The Firebase config is already set in `config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBhoRRDK6uKylS-D21EAkZ9nGwt2RwGW_o",
  authDomain: "teachease-efecc.firebaseapp.com",
  projectId: "teachease-efecc",
  storageBucket: "teachease-efecc.firebasestorage.app",
  messagingSenderId: "43351007947",
  appId: "1:43351007947:web:b7871b88f2a1d4c6eab14e",
  measurementId: "G-YPXJ2QPN6J"
};
```

**Note:** This configuration is already correct for your project!

## 🚀 Running the App

### Development Mode

#### Start Expo Development Server
```bash
npm start
```

This will:
- Start the Metro bundler
- Show a QR code
- Provide options to run on different platforms

#### Run on Android
```bash
npm run android
```
Or press `a` in the terminal after `npm start`

#### Run on iOS (Mac only)
```bash
npm run ios
```
Or press `i` in the terminal after `npm start`

#### Run on Web (Limited functionality)
```bash
npm run web
```
Or press `w` in the terminal after `npm start`

### Testing on Physical Device

#### Android Device
1. Install **Expo Go** from Google Play Store
2. Run `npm start`
3. Open Expo Go app
4. Tap "Scan QR code"
5. Scan the QR code from terminal

#### iOS Device
1. Install **Expo Go** from App Store
2. Run `npm start`
3. Open Camera app
4. Scan the QR code from terminal
5. Tap the notification to open in Expo Go

## 🏗️ Building for Production

### Android APK/AAB

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure EAS Build
```bash
eas build:configure
```

#### 4. Build APK (for testing)
```bash
eas build --platform android --profile preview
```

#### 5. Build AAB (for Play Store)
```bash
eas build --platform android --profile production
```

### iOS IPA

#### 1. Build for iOS
```bash
eas build --platform ios --profile production
```

#### 2. Submit to App Store
```bash
eas submit --platform ios
```

## 📱 App Store Deployment

### Google Play Store

1. **Create Developer Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay $25 one-time fee

2. **Create App**
   - Click "Create app"
   - Fill in app details
   - Upload screenshots

3. **Upload AAB**
   - Go to Production → Releases
   - Create new release
   - Upload the AAB file from EAS build
   - Fill in release notes
   - Submit for review

### Apple App Store

1. **Create Developer Account**
   - Go to [Apple Developer](https://developer.apple.com/)
   - Pay $99/year

2. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - Click "My Apps" → "+"
   - Fill in app information

3. **Upload IPA**
   - Use EAS Submit or Transporter app
   - Fill in app metadata
   - Submit for review

## 🔧 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

#### Camera not working
- Check permissions in device settings
- Ensure `expo-camera` and `expo-barcode-scanner` are installed
- Grant camera permission when prompted

#### Firebase connection issues
- Verify Firebase config in `config/firebase.ts`
- Check internet connection
- Ensure Authentication and Firestore are enabled

#### Build failures
```bash
# Clear Expo cache
expo start -c

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Platform-Specific Issues

#### Android
- **Gradle build failed**: Update Android Studio and SDK
- **Emulator not starting**: Allocate more RAM in AVD Manager
- **App crashes on startup**: Check logcat for errors

#### iOS
- **Pod install failed**: Run `cd ios && pod install`
- **Code signing error**: Configure signing in Xcode
- **Simulator not found**: Install iOS Simulator in Xcode

## 🔐 Environment Variables (Optional)

For additional security, you can use environment variables:

1. Create `.env` file:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
```

2. Install dotenv:
```bash
npm install react-native-dotenv
```

3. Update `config/firebase.ts` to use env variables

## 📊 Performance Optimization

### Reduce Bundle Size
```bash
# Analyze bundle
npx expo-cli export --dev

# Remove unused dependencies
npm prune
```

### Optimize Images
- Use WebP format for images
- Compress images before adding to assets
- Use appropriate image sizes

### Enable Hermes (Android)
Already enabled in `app.json` with `newArchEnabled: true`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Register new account
- [ ] Login/Logout
- [ ] Add subject
- [ ] Add student
- [ ] Generate QR code
- [ ] Scan QR code
- [ ] Record attendance
- [ ] Add grades
- [ ] Sync to cloud
- [ ] Test offline mode

### Automated Testing (Optional)
```bash
# Install Jest
npm install --save-dev jest @testing-library/react-native

# Run tests
npm test
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)

## 🆘 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Search [Expo Forums](https://forums.expo.dev/)
3. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
4. Review Firebase Console for backend issues
5. Check device logs (logcat for Android, Console for iOS)

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Test on multiple devices
- [ ] Test all features offline
- [ ] Verify Firebase security rules
- [ ] Test camera permissions
- [ ] Test QR code generation and scanning
- [ ] Verify grade calculations
- [ ] Test sync functionality
- [ ] Update app version in `app.json`
- [ ] Create app screenshots
- [ ] Write app description
- [ ] Prepare privacy policy
- [ ] Test on both Android and iOS

## 🎉 Success!

Your TeachEase app is now ready to use! 

**Next Steps:**
1. Run `npm start`
2. Test on your device
3. Register your teacher account
4. Start managing your students!

---

**Happy Teaching! 👩‍🏫📚**
