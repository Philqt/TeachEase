import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebaseService';
import { Student, Subject, Grade } from '../../types';
import { calculateFinalGrade, getGradeRemark, getGradeStatus, DEFAULT_WEIGHTS, DEFAULT_LABELS } from '../../utils/gradeCalculator';
import { generateUniqueId } from '../../utils/qrCodeGenerator';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function AddGradeScreen() {
  const { studentId, subjectId } = useLocalSearchParams<{ studentId: string; subjectId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [quiz, setQuiz] = useState('');
  const [assignment, setAssignment] = useState('');
  const [exam, setExam] = useState('');
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId, subjectId]);

  const loadData = async () => {
    try {
      const [students, subjects] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
      ]);

      const studentData = students.find((s) => s.id === studentId);
      const subjectData = subjects.find((s) => s.id === subjectId);

      setStudent(studentData || null);
      setSubject(subjectData || null);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const currentWeights = subject?.gradeSettings?.weights || DEFAULT_WEIGHTS;
  const currentLabels = subject?.gradeSettings?.labels || DEFAULT_LABELS;

  const handleSaveGrade = async () => {
    const quizNum = parseFloat(quiz);
    const assignmentNum = parseFloat(assignment);
    const examNum = parseFloat(exam);
    const projectNum = parseFloat(project);

    if (isNaN(quizNum) || isNaN(assignmentNum) || isNaN(examNum) || isNaN(projectNum)) {
      setAlertTitle('Error');
      setAlertMessage('Please enter valid numbers for all fields');
      setShowAlert(true);
      return;
    }

    if (
      quizNum < 0 || quizNum > 100 ||
      assignmentNum < 0 || assignmentNum > 100 ||
      examNum < 0 || examNum > 100 ||
      projectNum < 0 || projectNum > 100
    ) {
      setAlertTitle('Error');
      setAlertMessage('Grades must be between 0 and 100');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const finalGrade = calculateFinalGrade(quizNum, assignmentNum, examNum, projectNum, currentWeights);

      const newGrade: Grade = {
        id: generateUniqueId(),
        studentId: studentId!,
        subjectId: subjectId!,
        quarter,
        quiz: quizNum,
        assignment: assignmentNum,
        exam: examNum,
        project: projectNum,
        finalGrade,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.saveGrade(newGrade);
      // Attempt immediate cloud sync (optional)
      try {
        await FirebaseService.syncGrade(newGrade);
      } catch (e) {
        // Ignore sync errors; remains queued for later
      }

      setAlertTitle('Success');
      setAlertMessage(`Grade saved successfully!\nFinal Grade: ${finalGrade.toFixed(2)}\nStatus: ${getGradeStatus(finalGrade)}`);
      setShowAlert(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error saving grade:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to save grade');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const previewFinalGrade = () => {
    const quizNum = parseFloat(quiz) || 0;
    const assignmentNum = parseFloat(assignment) || 0;
    const examNum = parseFloat(exam) || 0;
    const projectNum = parseFloat(project) || 0;

    return calculateFinalGrade(quizNum, assignmentNum, examNum, projectNum, currentWeights);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'Students Grade' }} />
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title
            title="Add Grade"
            subtitle={`${student?.name || 'Unknown'} - ${subject?.name || 'Unknown'}`}
          />
          <Card.Content>
            <Text variant="titleMedium" style={styles.label}>
              Select Quarter
            </Text>
            <SegmentedButtons
              value={quarter.toString()}
              onValueChange={(value) => setQuarter(parseInt(value) as 1 | 2 | 3 | 4)}
              buttons={[
                { value: '1', label: 'Q1' },
                { value: '2', label: 'Q2' },
                { value: '3', label: 'Q3' },
                { value: '4', label: 'Q4' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="titleMedium" style={styles.label}>
              Enter Grades (0-100)
            </Text>

            <TextInput
              label={`${currentLabels.quiz} (${Math.round(currentWeights.quiz * 100)}%)`}
              value={quiz}
              onChangeText={setQuiz}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label={`${currentLabels.assignment} (${Math.round(currentWeights.assignment * 100)}%)`}
              value={assignment}
              onChangeText={setAssignment}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label={`${currentLabels.exam} (${Math.round(currentWeights.exam * 100)}%)`}
              value={exam}
              onChangeText={setExam}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label={`${currentLabels.project} (${Math.round(currentWeights.project * 100)}%)`}
              value={project}
              onChangeText={setProject}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              disabled={loading}
            />

            {/* Preview Final Grade */}
            <Card style={styles.previewCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.previewLabel}>
                  Preview Final Grade
                </Text>
                <Text variant="displayMedium" style={styles.previewGrade}>
                  {previewFinalGrade().toFixed(2)}
                </Text>
                <Text variant="bodyMedium" style={styles.previewRemark}>
                  {getGradeRemark(previewFinalGrade())}
                </Text>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleSaveGrade}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save Grade
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.button}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <AwesomeAlert
        show={showAlert}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor={alertTitle === 'Success' ? '#4caf50' : '#f44336'}
        onConfirmPressed={() => setShowAlert(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  previewCard: {
    marginVertical: 16,
    backgroundColor: '#f0f0f0',
  },
  previewLabel: {
    textAlign: 'center',
    marginBottom: 8,
  },
  previewGrade: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#6200ee',
  },
  previewRemark: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  button: {
    marginVertical: 8,
  },
});
