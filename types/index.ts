export interface Student {
  id: string;
  name: string;
  studentId: string;
  subjectId: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female';
  dob?: Date | null;
  section?: string;
  yearLevel?: string; // e.g., '7', '8', '9', '10', '11', '12'
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  gradeSettings?: GradeSettings;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: Date;
  status: 'Present' | 'Late' | 'Absent';
  timestamp: Date;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  quarter: 1 | 2 | 3 | 4;
  quiz: number;
  assignment: number;
  exam: number;
  project: number;
  finalGrade?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeWeights {
  quiz: number;
  assignment: number;
  exam: number;
  project: number;
}

export interface GradeLabels {
  quiz: string;
  assignment: string;
  exam: string;
  project: string;
}

export interface GradeSettings {
  labels: GradeLabels;
  weights: GradeWeights; // weights are expressed as 0-1 fractions (e.g., 0.2 for 20%)
}

export interface Teacher {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type GradeCategoryKey = keyof GradeLabels; // 'quiz' | 'assignment' | 'exam' | 'project'

export interface Assessment {
  id: string;
  studentId: string;
  subjectId: string;
  quarter: 1 | 2 | 3 | 4;
  date: Date;
  category: GradeCategoryKey;
  title: string;
  score: number; // numerator, e.g., 5
  total: number; // denominator, e.g., 10
  createdAt: Date;
  updatedAt: Date;
}
