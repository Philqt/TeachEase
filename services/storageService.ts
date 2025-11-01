import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, Subject, Attendance, Grade, Assessment } from '../types';

const KEYS = {
  STUDENTS: '@students',
  SUBJECTS: '@subjects',
  ATTENDANCE: '@attendance',
  GRADES: '@grades',
  ASSESSMENTS: '@assessments',
  SYNC_PENDING: '@sync_pending',
  DELETED_SUBJECTS: '@deleted_subjects_local',
};

export class StorageService {
  // Simple change subscription per collection
  private static listeners: Record<string, Set<() => void>> = {};
  static subscribe(collection: 'students' | 'subjects' | 'attendance' | 'grades' | 'assessments', cb: () => void) {
    if (!this.listeners[collection]) this.listeners[collection] = new Set();
    this.listeners[collection].add(cb);
    return () => this.listeners[collection].delete(cb);
  }
  private static notify(collection: string) {
    const set = this.listeners[collection];
    if (set) set.forEach((fn) => {
      try { fn(); } catch {}
    });
  }
  // Students
  static async getStudents(): Promise<Student[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  static async saveStudent(student: Student, options?: { skipSync?: boolean }): Promise<void> {
    try {
      const students = await this.getStudents();
      const index = students.findIndex(s => s.id === student.id);
      if (index >= 0) {
        students[index] = student;
      } else {
        students.push(student);
      }
      await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
      this.notify('students');
      if (!options?.skipSync) {
        await this.markForSync('students', student.id);
      }
    } catch (error) {
      console.error('Error saving student:', error);
      throw error;
    }
  }

  static async deleteStudent(id: string): Promise<void> {
    try {
      const students = await this.getStudents();
      const filtered = students.filter(s => s.id !== id);
      await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(filtered));
      this.notify('students');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Subjects
  static async getSubjects(): Promise<Subject[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SUBJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }

  static async saveSubject(subject: Subject, options?: { skipSync?: boolean }): Promise<void> {
    try {
      const subjects = await this.getSubjects();
      const index = subjects.findIndex(s => s.id === subject.id);
      if (index >= 0) {
        subjects[index] = subject;
      } else {
        subjects.push(subject);
      }
      await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
      this.notify('subjects');
      if (!options?.skipSync) {
        await this.markForSync('subjects', subject.id);
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      throw error;
    }
  }

  static async deleteSubject(id: string): Promise<void> {
    try {
      const subjects = await this.getSubjects();
      const filtered = subjects.filter(s => s.id !== id);
      await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(filtered));
      this.notify('subjects');
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  // Attendance
  static async getAttendance(): Promise<Attendance[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting attendance:', error);
      return [];
    }
  }

  static async saveAttendance(attendance: Attendance, options?: { skipSync?: boolean }): Promise<void> {
    try {
      const records = await this.getAttendance();
      const index = records.findIndex(a => a.id === attendance.id);
      if (index >= 0) {
        records[index] = attendance;
      } else {
        records.push(attendance);
      }
      await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
      this.notify('attendance');
      if (!options?.skipSync) {
        await this.markForSync('attendance', attendance.id);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  }

  // Grades
  static async getGrades(): Promise<Grade[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.GRADES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  }

  static async saveGrade(grade: Grade, options?: { skipSync?: boolean }): Promise<void> {
    try {
      const grades = await this.getGrades();
      const index = grades.findIndex(g => g.id === grade.id);
      if (index >= 0) {
        grades[index] = grade;
      } else {
        grades.push(grade);
      }
      await AsyncStorage.setItem(KEYS.GRADES, JSON.stringify(grades));
      this.notify('grades');
      if (!options?.skipSync) {
        await this.markForSync('grades', grade.id);
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      throw error;
    }
  }

  static async deleteGradesByStudent(studentId: string): Promise<void> {
    try {
      const grades = await this.getGrades();
      const filtered = grades.filter(g => g.studentId !== studentId);
      await AsyncStorage.setItem(KEYS.GRADES, JSON.stringify(filtered));
      this.notify('grades');
    } catch (error) {
      console.error('Error deleting grades by student:', error);
      throw error;
    }
  }

  // Assessments
  static async getAssessments(): Promise<Assessment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ASSESSMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting assessments:', error);
      return [];
    }
  }

  static async saveAssessment(assessment: Assessment, options?: { skipSync?: boolean }): Promise<void> {
    try {
      const list = await this.getAssessments();
      const idx = list.findIndex(a => a.id === assessment.id);
      if (idx >= 0) {
        list[idx] = assessment;
      } else {
        list.push(assessment);
      }
      await AsyncStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(list));
      this.notify('assessments');
      if (!options?.skipSync) {
        await this.markForSync('assessments', assessment.id);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }
  }

  static async deleteAssessment(id: string): Promise<void> {
    try {
      const list = await this.getAssessments();
      const filtered = list.filter(a => a.id !== id);
      await AsyncStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(filtered));
      this.notify('assessments');
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }

  // Sync tracking
  private static async markForSync(collection: string, id: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SYNC_PENDING);
      const pending = data ? JSON.parse(data) : {};
      if (!pending[collection]) {
        pending[collection] = [];
      }
      if (!pending[collection].includes(id)) {
        pending[collection].push(id);
      }
      await AsyncStorage.setItem(KEYS.SYNC_PENDING, JSON.stringify(pending));
    } catch (error) {
      console.error('Error marking for sync:', error);
    }
  }

  static async getPendingSync(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SYNC_PENDING);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting pending sync:', error);
      return {};
    }
  }

  static async clearPendingSync(collection: string, id: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SYNC_PENDING);
      const pending = data ? JSON.parse(data) : {};
      if (pending[collection]) {
        pending[collection] = pending[collection].filter((i: string) => i !== id);
      }
      await AsyncStorage.setItem(KEYS.SYNC_PENDING, JSON.stringify(pending));
    } catch (error) {
      console.error('Error clearing pending sync:', error);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.STUDENTS,
        KEYS.SUBJECTS,
        KEYS.ATTENDANCE,
        KEYS.GRADES,
        KEYS.ASSESSMENTS,
        KEYS.SYNC_PENDING,
        KEYS.DELETED_SUBJECTS,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Local-only delete tracking for subjects
  static async addDeletedSubject(id: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DELETED_SUBJECTS);
      const list: string[] = data ? JSON.parse(data) : [];
      if (!list.includes(id)) list.push(id);
      await AsyncStorage.setItem(KEYS.DELETED_SUBJECTS, JSON.stringify(list));
    } catch (error) {
      console.error('Error tracking deleted subject:', error);
    }
  }

  static async getDeletedSubjects(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DELETED_SUBJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting deleted subjects:', error);
      return [];
    }
  }

  static async clearDeletedSubjects(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.DELETED_SUBJECTS);
    } catch (error) {
      console.error('Error clearing deleted subjects:', error);
    }
  }
}
