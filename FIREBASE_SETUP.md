# 🔥 Firebase Setup Guide for TeachEase

## Quick Overview

Your Firebase project is already configured! Here's what you need to do to activate it.

**Project Details:**
- Project ID: `teachease-efecc`
- Project Name: TeachEase
- Configuration: Already in `config/firebase.ts`

## Step-by-Step Setup

### 1. Access Firebase Console

Go to: https://console.firebase.google.com/project/teachease-efecc

Or create a new project if needed at: https://console.firebase.google.com/

### 2. Enable Authentication

1. Click **Authentication** in the left sidebar
2. Click **Get Started** button
3. Click **Email/Password** under Sign-in providers
4. Toggle **Enable** switch ON
5. Click **Save**

**Screenshot Guide:**
```
Firebase Console
├── Authentication
│   ├── Sign-in method
│   │   └── Email/Password [Enable this]
```

### 3. Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database** button
3. Select **Start in production mode**
4. Choose your region (closest to your location)
5. Click **Enable**

**Wait for database creation (30-60 seconds)**

### 4. Set Security Rules

1. In Firestore Database, click **Rules** tab
2. Replace ALL existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow teachers to access only their own data
    match /teachers/{teacherId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == teacherId;
    }
  }
}
```

3. Click **Publish**

**Important:** This ensures each teacher can only access their own data!

### 5. Verify Configuration

Your `config/firebase.ts` already has the correct configuration:

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

✅ **No changes needed!**

## 📊 Firestore Data Structure

Your data will be organized like this:

```
Firestore Database
└── teachers/
    └── {teacher-user-id}/
        ├── subjects/
        │   └── {subject-id}
        │       ├── id: string
        │       ├── name: string
        │       ├── teacherId: string
        │       ├── createdAt: timestamp
        │       └── updatedAt: timestamp
        │
        ├── students/
        │   └── {student-id}
        │       ├── id: string
        │       ├── name: string
        │       ├── studentId: string
        │       ├── subjectId: string
        │       ├── qrCode: string
        │       ├── createdAt: timestamp
        │       └── updatedAt: timestamp
        │
        ├── attendance/
        │   └── {attendance-id}
        │       ├── id: string
        │       ├── studentId: string
        │       ├── subjectId: string
        │       ├── date: timestamp
        │       ├── status: string
        │       └── timestamp: timestamp
        │
        └── grades/
            └── {grade-id}
                ├── id: string
                ├── studentId: string
                ├── subjectId: string
                ├── quarter: number
                ├── quiz: number
                ├── assignment: number
                ├── exam: number
                ├── project: number
                ├── finalGrade: number
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

## 🔒 Security Rules Explained

```javascript
match /teachers/{teacherId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == teacherId;
}
```

**What this means:**
- `request.auth != null` → User must be logged in
- `request.auth.uid == teacherId` → User can only access their own data
- `{document=**}` → Applies to all subcollections (students, subjects, etc.)

**Example:**
- Teacher A (UID: abc123) can only access `/teachers/abc123/*`
- Teacher A CANNOT access `/teachers/xyz789/*` (Teacher B's data)

## 🧪 Testing Firebase Connection

### Test Authentication

1. Run the app: `npm start`
2. Register a new account
3. Check Firebase Console → Authentication → Users
4. You should see your new user!

### Test Firestore

1. In the app, add a subject
2. Check Firebase Console → Firestore Database
3. Navigate to: `teachers/{your-uid}/subjects`
4. You should see your subject!

## 🚨 Common Issues & Solutions

### Issue: "Permission denied" error

**Solution:**
- Check if Authentication is enabled
- Verify security rules are published
- Make sure user is logged in
- Check that user is accessing their own data

### Issue: "Firebase not initialized"

**Solution:**
- Verify `config/firebase.ts` has correct configuration
- Check internet connection
- Restart the app

### Issue: "Cannot read from Firestore"

**Solution:**
- Ensure Firestore Database is created
- Check security rules
- Verify user is authenticated

### Issue: "Quota exceeded"

**Solution:**
- Firebase free tier limits:
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
- Upgrade to Blaze (pay-as-you-go) if needed

## 💰 Firebase Pricing

### Spark Plan (FREE)
- **Authentication:** Unlimited users
- **Firestore:**
  - 1 GB storage
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
- **Perfect for:** Single teacher use

### Blaze Plan (Pay-as-you-go)
- **First tier is FREE** (same as Spark)
- Only pay if you exceed free tier
- **Cost:** ~$0.06 per 100,000 reads
- **Recommended for:** Multiple teachers or heavy usage

## 📈 Monitoring Usage

1. Go to Firebase Console
2. Click **Usage and billing**
3. View current usage
4. Set up budget alerts

## 🔐 Additional Security (Optional)

### Enable App Check (Recommended)

1. Go to Firebase Console → App Check
2. Register your app
3. Enable reCAPTCHA for web
4. Enable SafetyNet for Android
5. Enable DeviceCheck for iOS

### Enable Multi-Factor Authentication

1. Go to Authentication → Sign-in method
2. Click **Multi-factor authentication**
3. Enable SMS or TOTP

## 🎯 Quick Checklist

Before using the app, ensure:

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Security rules published
- [ ] Configuration verified in `config/firebase.ts`
- [ ] Test user registered
- [ ] Test data synced

## 📞 Support

If you encounter issues:

1. **Firebase Status:** https://status.firebase.google.com/
2. **Documentation:** https://firebase.google.com/docs
3. **Stack Overflow:** Tag questions with `firebase`
4. **Firebase Support:** https://firebase.google.com/support

## 🎉 You're Ready!

Once you complete these steps:

1. ✅ Authentication is enabled
2. ✅ Firestore is set up
3. ✅ Security rules are in place
4. ✅ App is configured

**You can now:**
- Register teacher accounts
- Store data in the cloud
- Sync across devices
- Backup and restore data

---

**Next Step:** Run `npm start` and test the app!
