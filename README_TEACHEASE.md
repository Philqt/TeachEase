# 👩‍🏫 TeachEase - Personal Teacher Management App

A comprehensive mobile application designed for individual teachers to manage their students, track attendance, record grades, and generate QR codes - all with offline capability and cloud backup.

## ✨ Features

### 🔐 Authentication
- Firebase Authentication for secure login
- Email/Password registration and login
- Persistent authentication state

### 📚 Subject Management
- Create and manage multiple subjects
- Organize students by subject
- Delete subjects when needed

### 👥 Student Enrollment
- Add students to specific subjects
- Automatic QR code generation for each student
- Student ID management
- Delete students when needed

### 📱 QR Code System
- **Automatic Generation**: Unique QR code for each student
- **Bulk Printing**: Generate PDF with all student QR codes
- **Individual QR Codes**: View and print individual student QR codes
- QR codes include student name, subject, and ID

### ✅ Attendance Tracking
- **QR Code Scanning**: Scan student QR codes to mark attendance
- Real-time attendance recording
- Automatic date and timestamp
- Status tracking (Present/Late/Absent)
- Duplicate prevention (can't mark same student twice per day)
- Recent scans history

### 📊 Grade Management
- **Quarter-based Grading**: Support for 4 quarters
- **Component Grades**:
  - Quiz (20%)
  - Assignment (20%)
  - Exam (40%)
  - Project (20%)
- **Automatic Calculation**: Final grade computed automatically
- **Grade Remarks**: Outstanding, Very Satisfactory, Satisfactory, etc.
- **Pass/Fail Status**: Automatic determination (75% passing)
- Search students by name
- Filter by quarter

### 📈 Dashboard
- Welcome screen with teacher info
- Total students count
- Total subjects count
- Today's attendance summary (Present/Late/Absent)
- Quick action buttons
- Cloud sync status

### ☁️ Cloud Sync & Backup
- **Firebase Firestore**: Cloud storage for all data
- **Offline Support**: Works without internet connection
- **Auto Sync**: Optional automatic synchronization
- **Manual Sync**: Sync data on demand
- **Backup**: Create cloud backups
- **Restore**: Restore data from cloud

### ⚙️ Settings
- Account information
- Sync settings
- Data management
- Clear all data option
- App version info
- Logout functionality

## 🛠️ Tech Stack

| Purpose | Package |
|---------|---------|
| **Framework** | React Native with Expo |
| **Navigation** | Expo Router |
| **Backend/Database** | Firebase (Firestore) |
| **Authentication** | Firebase Auth |
| **QR Code Generator** | react-native-qrcode-svg |
| **QR Code Scanner** | expo-barcode-scanner, expo-camera |
| **PDF Generation** | expo-print, expo-sharing |
| **Local Storage** | @react-native-async-storage/async-storage |
| **UI Components** | react-native-paper |
| **Icons** | @expo/vector-icons (MaterialCommunityIcons) |
| **Alerts** | react-native-awesome-alerts |
| **Animations** | lottie-react-native |

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Android Studio (for Android) or Xcode (for iOS)

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
cd TeachEase
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Get your Firebase config from Project Settings
6. Update `config/firebase.ts` with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4. Firestore Security Rules

Set up the following security rules in Firebase Console:

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

### 5. Run the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web (limited functionality)
npm run web
```

## 📱 App Structure

```
TeachEase/
├── app/
│   ├── (tabs)/              # Main tab screens
│   │   ├── index.tsx        # Dashboard
│   │   ├── subjects.tsx     # Subjects management
│   │   ├── attendance.tsx   # QR scanner
│   │   ├── grades.tsx       # Grade viewing
│   │   └── settings.tsx     # Settings
│   ├── auth/                # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── students/            # Student management
│   │   ├── [subjectId].tsx  # Student list
│   │   ├── add.tsx          # Add student
│   │   └── qr/
│   │       └── [studentId].tsx  # QR code display
│   └── grades/
│       └── add.tsx          # Add grades
├── config/
│   └── firebase.ts          # Firebase configuration
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── services/
│   ├── storageService.ts    # Local storage operations
│   └── firebaseService.ts   # Firebase operations
├── types/
│   └── index.ts             # TypeScript interfaces
└── utils/
    ├── gradeCalculator.ts   # Grade computation
    └── qrCodeGenerator.ts   # QR code utilities
```

## 🔄 Data Flow

### Offline-First Architecture
1. **Create/Update**: Data saved to AsyncStorage first
2. **Sync Queue**: Changes marked for sync
3. **Auto Sync**: When online, data syncs to Firebase
4. **Fetch**: On login, latest data fetched from Firebase

### QR Code Flow
1. **Generation**: Student enrolled → QR code auto-generated
2. **Format**: `TEACHEASE:STUDENT_ID:SUBJECT_ID`
3. **Scanning**: Camera scans QR → Parse data → Verify student → Record attendance
4. **Printing**: Generate PDF with QR codes → Share/Print

### Grade Calculation
- **Formula**: `(Quiz × 0.20) + (Assignment × 0.20) + (Exam × 0.40) + (Project × 0.20)`
- **Passing**: 75 or above
- **Remarks**: Based on grade ranges (90+, 85+, 80+, 75+, <75)

## 🎨 UI/UX Features

- **Material Design**: Using React Native Paper
- **Responsive**: Works on various screen sizes
- **Dark Mode**: Supports system theme
- **Haptic Feedback**: Tab navigation with haptic response
- **Pull to Refresh**: All list screens support refresh
- **Loading States**: Clear loading indicators
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful messages when no data

## 📸 Camera Permissions

The app requires camera permission for QR code scanning. Permissions are requested at runtime when accessing the attendance scanner.

## 🔒 Security

- Firebase Authentication for user management
- Firestore security rules restrict access to user's own data
- No hardcoded credentials
- Secure password requirements (min 6 characters)

## 🐛 Troubleshooting

### Camera Not Working
- Ensure camera permissions are granted
- Check device camera functionality
- Restart the app

### Sync Issues
- Check internet connection
- Verify Firebase configuration
- Check Firestore security rules

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

## 📝 Usage Guide

### First Time Setup
1. Register with email and password
2. Add your subjects
3. Enroll students in each subject
4. Generate and print QR codes
5. Start scanning attendance!

### Daily Workflow
1. Open app → Dashboard shows today's stats
2. Go to Attendance tab
3. Tap "Start Scanning"
4. Scan student QR codes
5. View recent scans

### Grading Workflow
1. Go to Grades tab
2. Select quarter
3. Search for student
4. Tap "Add Grades"
5. Enter component grades
6. Preview final grade
7. Save

### Backup Workflow
1. Go to Settings
2. Tap "Backup Data"
3. Wait for confirmation
4. Data safely stored in cloud

## 🎯 Future Enhancements

- [ ] Export grade sheets to Excel
- [ ] Attendance reports and analytics
- [ ] Parent portal access
- [ ] Push notifications
- [ ] Bulk student import (CSV)
- [ ] Custom grade weights
- [ ] Multiple teachers support
- [ ] Class schedule management

## 📄 License

This project is for personal use by individual teachers.

## 👨‍💻 Support

For issues or questions, please check:
- Firebase documentation
- Expo documentation
- React Native Paper documentation

---

**Made with ❤️ for Teachers**
