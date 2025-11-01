# 📚 TeachEase API Documentation

## Overview

TeachEase uses a dual-layer data architecture:
1. **Local Storage** (AsyncStorage) - Primary data store, works offline
2. **Cloud Storage** (Firebase Firestore) - Backup and sync

## 🗄️ Data Models

### Student
```typescript
interface Student {
  id: string;              // Unique identifier
  name: string;            // Student full name
  studentId: string;       // Student ID number
  subjectId: string;       // Reference to subject
  qrCode: string;          // QR code data (TEACHEASE:studentId:subjectId)
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Subject
```typescript
interface Subject {
  id: string;              // Unique identifier
  name: string;            // Subject name (e.g., "Math 10")
  teacherId: string;       // Reference to teacher (user ID)
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Attendance
```typescript
interface Attendance {
  id: string;              // Unique identifier
  studentId: string;       // Reference to student
  subjectId: string;       // Reference to subject
  date: Date;              // Attendance date
  status: 'Present' | 'Late' | 'Absent';  // Attendance status
  timestamp: Date;         // Exact time of recording
}
```

### Grade
```typescript
interface Grade {
  id: string;              // Unique identifier
  studentId: string;       // Reference to student
  subjectId: string;       // Reference to subject
  quarter: 1 | 2 | 3 | 4;  // Academic quarter
  quiz: number;            // Quiz score (0-100)
  assignment: number;      // Assignment score (0-100)
  exam: number;            // Exam score (0-100)
  project: number;         // Project score (0-100)
  finalGrade?: number;     // Computed final grade
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Teacher
```typescript
interface Teacher {
  id: string;              // Firebase Auth UID
  email: string;           // Teacher email
  name: string;            // Teacher name
  createdAt: Date;         // Account creation date
}
```

## 📦 Storage Service API

Location: `services/storageService.ts`

### Students

#### `getStudents(): Promise<Student[]>`
Retrieves all students from local storage.

**Returns:** Array of Student objects

**Example:**
```typescript
const students = await StorageService.getStudents();
console.log(students); // [{ id: '...', name: 'Juan Dela Cruz', ... }]
```

#### `saveStudent(student: Student): Promise<void>`
Saves or updates a student in local storage and marks for sync.

**Parameters:**
- `student`: Student object to save

**Example:**
```typescript
const newStudent: Student = {
  id: generateUniqueId(),
  name: 'Juan Dela Cruz',
  studentId: '2024-001',
  subjectId: 'subject-123',
  qrCode: 'TEACHEASE:student-123:subject-123',
  createdAt: new Date(),
  updatedAt: new Date()
};
await StorageService.saveStudent(newStudent);
```

#### `deleteStudent(id: string): Promise<void>`
Deletes a student from local storage.

**Parameters:**
- `id`: Student ID to delete

**Example:**
```typescript
await StorageService.deleteStudent('student-123');
```

### Subjects

#### `getSubjects(): Promise<Subject[]>`
Retrieves all subjects from local storage.

#### `saveSubject(subject: Subject): Promise<void>`
Saves or updates a subject in local storage.

#### `deleteSubject(id: string): Promise<void>`
Deletes a subject from local storage.

### Attendance

#### `getAttendance(): Promise<Attendance[]>`
Retrieves all attendance records from local storage.

#### `saveAttendance(attendance: Attendance): Promise<void>`
Saves an attendance record in local storage.

### Grades

#### `getGrades(): Promise<Grade[]>`
Retrieves all grade records from local storage.

#### `saveGrade(grade: Grade): Promise<void>`
Saves a grade record in local storage.

### Sync Management

#### `getPendingSync(): Promise<any>`
Gets all items pending synchronization with cloud.

**Returns:** Object with collections and IDs pending sync
```typescript
{
  students: ['id1', 'id2'],
  subjects: ['id3'],
  attendance: ['id4', 'id5'],
  grades: ['id6']
}
```

#### `clearPendingSync(collection: string, id: string): Promise<void>`
Removes an item from the sync queue after successful sync.

#### `clearAll(): Promise<void>`
Clears all local data (use with caution).

## ☁️ Firebase Service API

Location: `services/firebaseService.ts`

### Students

#### `syncStudent(student: Student): Promise<void>`
Syncs a student to Firebase Firestore.

**Path:** `teachers/{userId}/students/{studentId}`

**Example:**
```typescript
await FirebaseService.syncStudent(student);
```

#### `fetchStudents(): Promise<Student[]>`
Fetches all students from Firebase for current user.

### Subjects

#### `syncSubject(subject: Subject): Promise<void>`
Syncs a subject to Firebase Firestore.

**Path:** `teachers/{userId}/subjects/{subjectId}`

#### `fetchSubjects(): Promise<Subject[]>`
Fetches all subjects from Firebase for current user.

### Attendance

#### `syncAttendance(attendance: Attendance): Promise<void>`
Syncs an attendance record to Firebase.

**Path:** `teachers/{userId}/attendance/{attendanceId}`

#### `fetchAttendance(): Promise<Attendance[]>`
Fetches all attendance records from Firebase.

### Grades

#### `syncGrade(grade: Grade): Promise<void>`
Syncs a grade record to Firebase.

**Path:** `teachers/{userId}/grades/{gradeId}`

#### `fetchGrades(): Promise<Grade[]>`
Fetches all grade records from Firebase.

### Bulk Operations

#### `syncAll(): Promise<void>`
Syncs all pending changes to Firebase.

**Process:**
1. Gets pending sync queue
2. For each collection (students, subjects, attendance, grades):
   - Fetches items from local storage
   - Syncs each item to Firebase
   - Clears from sync queue

**Example:**
```typescript
await FirebaseService.syncAll();
```

#### `fetchAll(): Promise<void>`
Fetches all data from Firebase and saves to local storage.

**Process:**
1. Fetches students, subjects, attendance, grades in parallel
2. Saves each item to local storage

**Example:**
```typescript
await FirebaseService.fetchAll();
```

## 🔐 Authentication API

Location: `contexts/AuthContext.tsx`

### `signUp(email: string, password: string, name: string): Promise<void>`
Creates a new user account.

**Parameters:**
- `email`: User email
- `password`: Password (min 6 characters)
- `name`: Teacher name

**Example:**
```typescript
const { signUp } = useAuth();
await signUp('teacher@school.com', 'password123', 'Ms. Teacher');
```

### `signIn(email: string, password: string): Promise<void>`
Signs in an existing user.

**Example:**
```typescript
const { signIn } = useAuth();
await signIn('teacher@school.com', 'password123');
```

### `logout(): Promise<void>`
Signs out the current user.

**Example:**
```typescript
const { logout } = useAuth();
await logout();
```

### `user: User | null`
Current authenticated user object.

### `loading: boolean`
Authentication loading state.

## 🧮 Grade Calculator API

Location: `utils/gradeCalculator.ts`

### `calculateFinalGrade(quiz, assignment, exam, project, weights?): number`
Calculates weighted final grade.

**Parameters:**
- `quiz`: Quiz score (0-100)
- `assignment`: Assignment score (0-100)
- `exam`: Exam score (0-100)
- `project`: Project score (0-100)
- `weights`: Optional custom weights (default: quiz=20%, assignment=20%, exam=40%, project=20%)

**Returns:** Final grade (0-100)

**Example:**
```typescript
const finalGrade = calculateFinalGrade(85, 90, 88, 92);
console.log(finalGrade); // 88.60
```

### `getGradeRemark(grade: number): string`
Gets grade remark based on score.

**Returns:**
- 90+: "Outstanding"
- 85-89: "Very Satisfactory"
- 80-84: "Satisfactory"
- 75-79: "Fairly Satisfactory"
- <75: "Did Not Meet Expectations"

### `getGradeStatus(grade: number): 'Passed' | 'Failed'`
Determines if student passed (75% or higher).

### `calculateQuarterAverage(grades: Grade[]): number`
Calculates average of multiple grades.

### `calculateFinalRating(quarterGrades: number[]): number`
Calculates final rating from all quarters.

## 🔲 QR Code API

Location: `utils/qrCodeGenerator.ts`

### `generateQRCodeData(studentId: string, subjectId: string): string`
Generates QR code data string.

**Format:** `TEACHEASE:studentId:subjectId`

**Example:**
```typescript
const qrData = generateQRCodeData('student-123', 'subject-456');
console.log(qrData); // "TEACHEASE:student-123:subject-456"
```

### `parseQRCodeData(qrData: string): { studentId, subjectId } | null`
Parses scanned QR code data.

**Returns:** Object with studentId and subjectId, or null if invalid

**Example:**
```typescript
const parsed = parseQRCodeData('TEACHEASE:student-123:subject-456');
console.log(parsed); // { studentId: 'student-123', subjectId: 'subject-456' }
```

### `generateUniqueId(): string`
Generates a unique ID for new records.

**Format:** `{timestamp}-{random}`

**Example:**
```typescript
const id = generateUniqueId();
console.log(id); // "1698765432000-a1b2c3d4e"
```

## 📄 PDF Generation

Uses `expo-print` and `expo-sharing`

### Individual QR Code
```typescript
const html = `
  <!DOCTYPE html>
  <html>
    <body>
      <h1>${student.name}</h1>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrCode}" />
    </body>
  </html>
`;
const { uri } = await Print.printToFileAsync({ html });
await Sharing.shareAsync(uri);
```

### Bulk QR Codes
```typescript
const qrCodesHTML = students.map(student => `
  <div>
    <h3>${student.name}</h3>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${student.qrCode}" />
  </div>
`).join('');
```

## 🔄 Data Flow Examples

### Adding a Student
```typescript
// 1. Generate unique ID
const id = generateUniqueId();

// 2. Generate QR code
const qrCode = generateQRCodeData(id, subjectId);

// 3. Create student object
const student: Student = {
  id,
  name: 'Juan Dela Cruz',
  studentId: '2024-001',
  subjectId,
  qrCode,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 4. Save to local storage (marks for sync)
await StorageService.saveStudent(student);

// 5. Sync to cloud (when online)
await FirebaseService.syncAll();
```

### Recording Attendance
```typescript
// 1. Scan QR code
const qrData = scannedData; // "TEACHEASE:student-123:subject-456"

// 2. Parse QR code
const parsed = parseQRCodeData(qrData);

// 3. Verify student exists
const students = await StorageService.getStudents();
const student = students.find(s => s.id === parsed.studentId);

// 4. Create attendance record
const attendance: Attendance = {
  id: generateUniqueId(),
  studentId: student.id,
  subjectId: student.subjectId,
  date: new Date(),
  status: 'Present',
  timestamp: new Date()
};

// 5. Save attendance
await StorageService.saveAttendance(attendance);
```

### Adding Grades
```typescript
// 1. Get component scores
const quiz = 85;
const assignment = 90;
const exam = 88;
const project = 92;

// 2. Calculate final grade
const finalGrade = calculateFinalGrade(quiz, assignment, exam, project);

// 3. Create grade record
const grade: Grade = {
  id: generateUniqueId(),
  studentId: 'student-123',
  subjectId: 'subject-456',
  quarter: 1,
  quiz,
  assignment,
  exam,
  project,
  finalGrade,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 4. Save grade
await StorageService.saveGrade(grade);
```

## 🔒 Security Considerations

### Firestore Rules
```javascript
// Only authenticated users can access their own data
match /teachers/{teacherId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == teacherId;
}
```

### Best Practices
- Never store sensitive data in QR codes
- Always validate user input
- Use Firebase Auth for authentication
- Keep Firebase config secure
- Implement proper error handling

## 📊 Performance Tips

1. **Batch Operations**: Use `syncAll()` instead of individual syncs
2. **Lazy Loading**: Load data only when needed
3. **Caching**: Use local storage as cache
4. **Pagination**: Implement for large datasets
5. **Offline First**: Always save locally first

---

**API Version: 1.0.0**
