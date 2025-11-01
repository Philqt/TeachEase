import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Attendance, Grade, Student, Subject } from '../types';
import { StorageService } from './storageService';

export class FirebaseService {
  // Students
  static async syncStudent(student: Student): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const studentRef = doc(db, 'teachers', userId, 'students', student.id);
      await setDoc(studentRef, {
        ...student,
        createdAt: Timestamp.fromDate(new Date(student.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(student.updatedAt)),
        dob: student.dob ? Timestamp.fromDate(new Date(student.dob)) : null,
      });
    } catch (error) {
      console.error('Error syncing student:', error);
      throw error;
    }
  }

  // Danger: Permanently delete all Firestore data for the current user
  static async deleteAllUserData(): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    try {
      // collections under teachers/{uid}
      const collections = ['students', 'subjects', 'attendance', 'grades'] as const;
      for (const col of collections) {
        const colRef = collection(db, 'teachers', userId, col);
        const snap = await getDocs(colRef);
        const deletions = snap.docs.map(d => deleteDoc(doc(db, 'teachers', userId, col, d.id)));
        await Promise.all(deletions);
      }
      // finally, delete the teacher profile document itself
      await deleteDoc(doc(db, 'teachers', userId));
    } catch (error) {
      console.error('Error deleting all user data:', error);
      throw error;
    }
  }

  static async deleteGradesByStudent(studentId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const gradesRef = collection(db, 'teachers', userId, 'grades');
      const q = query(gradesRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, 'teachers', userId, 'grades', d.id)));
      await Promise.all(deletions);
    } catch (error) {
      console.error('Error deleting grades by student in cloud:', error);
      throw error;
    }
  }

  static async deleteStudent(studentId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const studentRef = doc(db, 'teachers', userId, 'students', studentId);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error('Error deleting student in cloud:', error);
      throw error;
    }
  }

  static async deleteSubject(subjectId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const subjectRef = doc(db, 'teachers', userId, 'subjects', subjectId);
      await deleteDoc(subjectRef);
    } catch (error) {
      console.error('Error deleting subject in cloud:', error);
      throw error;
    }
  }

  static async fetchStudents(): Promise<Student[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const studentsRef = collection(db, 'teachers', userId, 'students');
      const snapshot = await getDocs(studentsRef);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dob: doc.data().dob ? doc.data().dob.toDate() : null,
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Subjects
  static async syncSubject(subject: Subject): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const subjectRef = doc(db, 'teachers', userId, 'subjects', subject.id);
      await setDoc(subjectRef, {
        ...subject,
        createdAt: Timestamp.fromDate(new Date(subject.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(subject.updatedAt)),
      });
    } catch (error) {
      console.error('Error syncing subject:', error);
      throw error;
    }
  }

  static async fetchSubjects(): Promise<Subject[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const subjectsRef = collection(db, 'teachers', userId, 'subjects');
      const snapshot = await getDocs(subjectsRef);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Subject[];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  // Attendance
  static async syncAttendance(attendance: Attendance): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const attendanceRef = doc(db, 'teachers', userId, 'attendance', attendance.id);
      await setDoc(attendanceRef, {
        ...attendance,
        date: Timestamp.fromDate(new Date(attendance.date)),
        timestamp: Timestamp.fromDate(new Date(attendance.timestamp)),
      });
    } catch (error) {
      console.error('Error syncing attendance:', error);
      throw error;
    }
  }

  static async fetchAttendance(): Promise<Attendance[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const attendanceRef = collection(db, 'teachers', userId, 'attendance');
      const snapshot = await getDocs(attendanceRef);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Attendance[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  }

  // Grades
  static async syncGrade(grade: Grade): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const gradeRef = doc(db, 'teachers', userId, 'grades', grade.id);
      await setDoc(gradeRef, {
        ...grade,
        createdAt: Timestamp.fromDate(new Date(grade.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(grade.updatedAt)),
      });
    } catch (error) {
      console.error('Error syncing grade:', error);
      throw error;
    }
  }

  static async fetchGrades(): Promise<Grade[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const gradesRef = collection(db, 'teachers', userId, 'grades');
      const snapshot = await getDocs(gradesRef);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Grade[];
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
  }

  // Full sync
  static async syncAll(): Promise<void> {
    try {
      const pending = await StorageService.getPendingSync();
      
      // Sync students
      if (pending.students) {
        const students = await StorageService.getStudents();
        for (const id of pending.students) {
          const student = students.find(s => s.id === id);
          if (student) {
            await this.syncStudent(student);
            await StorageService.clearPendingSync('students', id);
          }
        }
      }

      // Sync subjects
      if (pending.subjects) {
        const subjects = await StorageService.getSubjects();
        for (const id of pending.subjects) {
          const subject = subjects.find(s => s.id === id);
          if (subject) {
            await this.syncSubject(subject);
            await StorageService.clearPendingSync('subjects', id);
          }
        }
      }

      // Sync attendance
      if (pending.attendance) {
        const attendance = await StorageService.getAttendance();
        for (const id of pending.attendance) {
          const record = attendance.find(a => a.id === id);
          if (record) {
            await this.syncAttendance(record);
            await StorageService.clearPendingSync('attendance', id);
          }
        }
      }

      // Sync grades
      if (pending.grades) {
        const grades = await StorageService.getGrades();
        for (const id of pending.grades) {
          const grade = grades.find(g => g.id === id);
          if (grade) {
            await this.syncGrade(grade);
            await StorageService.clearPendingSync('grades', id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing all:', error);
      throw error;
    }
  }

  // Fetch all data from Firebase
  static async fetchAll(): Promise<void> {
    try {
      const [students, subjects, attendance, grades] = await Promise.all([
        this.fetchStudents(),
        this.fetchSubjects(),
        this.fetchAttendance(),
        this.fetchGrades(),
      ]);

      // Save to local storage (skip marking for sync)
      for (const student of students) {
        await StorageService.saveStudent(student, { skipSync: true });
      }
      // Respect local-only deletions: skip blacklisted subject ids
      const deletedSubjectIds = await StorageService.getDeletedSubjects();
      for (const subject of subjects.filter(s => !deletedSubjectIds.includes(s.id))) {
        await StorageService.saveSubject(subject, { skipSync: true });
      }
      for (const record of attendance) {
        await StorageService.saveAttendance(record, { skipSync: true });
      }
      for (const grade of grades) {
        await StorageService.saveGrade(grade, { skipSync: true });
      }
    } catch (error) {
      console.error('Error fetching all:', error);
      throw error;
    }
  }
}
