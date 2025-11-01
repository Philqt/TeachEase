import { Grade, GradeLabels, GradeWeights } from '../types';

// Default grade weights (can be customized)
export const DEFAULT_WEIGHTS: GradeWeights = {
  quiz: 0.20,      // 20%
  assignment: 0.20, // 20%
  exam: 0.40,      // 40%
  project: 0.20,   // 20%
};

export const DEFAULT_LABELS: GradeLabels = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  exam: 'Exam',
  project: 'Project',
};

export const calculateFinalGrade = (
  quiz: number,
  assignment: number,
  exam: number,
  project: number,
  weights: GradeWeights = DEFAULT_WEIGHTS
): number => {
  const finalGrade = 
    (quiz * weights.quiz) +
    (assignment * weights.assignment) +
    (exam * weights.exam) +
    (project * weights.project);
  
  return Math.round(finalGrade * 100) / 100; // Round to 2 decimal places
};

export const getGradeRemark = (grade: number): string => {
  if (grade >= 90) return 'Outstanding';
  if (grade >= 85) return 'Very Satisfactory';
  if (grade >= 80) return 'Satisfactory';
  if (grade >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
};

export const getGradeStatus = (grade: number): 'Passed' | 'Failed' => {
  return grade >= 75 ? 'Passed' : 'Failed';
};

export const calculateQuarterAverage = (grades: Grade[]): number => {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + (grade.finalGrade || 0), 0);
  return Math.round((sum / grades.length) * 100) / 100;
};

export const calculateFinalRating = (quarterGrades: number[]): number => {
  if (quarterGrades.length === 0) return 0;
  const sum = quarterGrades.reduce((acc, grade) => acc + grade, 0);
  return Math.round((sum / quarterGrades.length) * 100) / 100;
};
