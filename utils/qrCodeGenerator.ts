export const generateQRCodeData = (studentId: string, subjectId: string): string => {
  // Format: TEACHEASE:STUDENT_ID:SUBJECT_ID
  return `TEACHEASE:${studentId}:${subjectId}`;
};

export const parseQRCodeData = (qrData: string): { studentId: string; subjectId: string } | null => {
  try {
    const parts = qrData.split(':');
    if (parts.length !== 3 || parts[0] !== 'TEACHEASE') {
      return null;
    }
    return {
      studentId: parts[1],
      subjectId: parts[2],
    };
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
