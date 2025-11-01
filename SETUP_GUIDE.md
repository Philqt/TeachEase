# 🚀 TeachEase Quick Setup Guide

## Step 1: Install Dependencies ✅

Your dependencies are already installed! The project includes:
- Firebase for backend
- Expo for React Native development
- React Native Paper for UI
- QR code libraries
- All necessary packages

## Step 2: Firebase Setup 🔥

**Your Firebase project is already configured!**
- Project ID: `teachease-efecc`
- Already connected in `config/firebase.ts`

### What you need to do:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/teachease-efecc

2. **Enable Authentication**:
   - Click "Authentication" in left sidebar
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

3. **Enable Firestore Database**:
   - Click "Firestore Database" in left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (we'll secure it next)
   - Select your region
   - Click "Enable"

4. **Set Security Rules**:
   - In Firestore, go to "Rules" tab
   - Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /teachers/{teacherId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == teacherId;
       }
     }
   }
   ```
   - Click "Publish"

## Step 3: Run the App 📱

```bash
# Start the development server
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Step 4: First Use 👩‍🏫

1. **Register Account**:
   - Open the app
   - Tap "Don't have an account? Register"
   - Enter your name, email, and password
   - Tap "Register"

2. **Add Your First Subject**:
   - Go to "Subjects" tab
   - Tap the + button
   - Enter subject name (e.g., "Math 10")
   - Tap "Add"

3. **Enroll Students**:
   - Tap on your subject
   - Tap the + button
   - Enter student name and ID
   - Tap "Add Student"
   - QR code is automatically generated!

4. **Print QR Codes**:
   - In the student list
   - Tap "Generate & Print All QR Codes"
   - Share or print the PDF

5. **Scan Attendance**:
   - Go to "Attendance" tab
   - Tap "Start Scanning"
   - Grant camera permission
   - Scan student QR codes
   - Attendance automatically recorded!

6. **Add Grades**:
   - Go to "Grades" tab
   - Find a student
   - Tap "Add Grades"
   - Select quarter
   - Enter scores
   - Final grade calculated automatically!

## 🎯 Quick Tips

### Offline Mode
- The app works offline!
- All data saved locally
- Syncs to cloud when online

### Backup Your Data
- Go to Settings → "Backup Data"
- Creates cloud backup
- Can restore anytime

### Print QR Codes
- Individual: Tap student → QR icon
- Bulk: In student list → "Generate & Print All"

### Camera Issues?
- Make sure to grant camera permission
- Check if camera works in other apps
- Restart the app if needed

## 📊 Data Structure

Your data is organized as:
```
Firebase Firestore
└── teachers/
    └── {your-user-id}/
        ├── subjects/
        ├── students/
        ├── attendance/
        └── grades/
```

## 🔒 Security Notes

- Each teacher can only access their own data
- Passwords must be at least 6 characters
- Data encrypted in transit and at rest
- Firestore rules prevent unauthorized access

## 🆘 Common Issues

### "No camera access"
- Go to phone Settings → Apps → Expo Go → Permissions
- Enable Camera permission

### "Sync failed"
- Check internet connection
- Verify Firebase is enabled
- Check Firestore security rules

### "Login failed"
- Verify email/password
- Check if Authentication is enabled in Firebase
- Try registering a new account

### Build errors
```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📱 Testing on Real Device

1. Install **Expo Go** app from:
   - Google Play Store (Android)
   - App Store (iOS)

2. Run `npm start`

3. Scan QR code with:
   - Expo Go app (Android)
   - Camera app (iOS)

## 🎨 Customization

Want to change colors or branding?
- UI colors: Check `app/(tabs)/_layout.tsx`
- Theme: React Native Paper theme in `app/_layout.tsx`
- Icons: MaterialCommunityIcons from `@expo/vector-icons`

## 📚 Next Steps

1. ✅ Set up Firebase (Authentication + Firestore)
2. ✅ Run the app
3. ✅ Register your account
4. ✅ Add subjects
5. ✅ Enroll students
6. ✅ Print QR codes
7. ✅ Start tracking attendance!

---

**Need Help?**
- Check `README_TEACHEASE.md` for detailed documentation
- Review Firebase Console for data
- Check Expo documentation: https://docs.expo.dev

**Happy Teaching! 👩‍🏫📚**
