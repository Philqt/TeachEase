import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../services/firebaseService';
import { StorageService } from '../../services/storageService';
import { Student, Subject } from '../../types';
import { generateQRCodeData, generateUniqueId } from '../../utils/qrCodeGenerator';

export default function AddStudentScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [section, setSection] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadSubject();
  }, [subjectId]);

  const loadSubject = async () => {
    try {
      const subjects = await StorageService.getSubjects();
      const subjectData = subjects.find((s) => s.id === subjectId);
      setSubject(subjectData || null);
    } catch (error) {
      console.error('Error loading subject:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setAlertTitle('Error');
      setAlertMessage('Please provide at least First Name and Last Name');
      setShowAlert(true);
      return;
    }

    if (!subjectId) {
      setAlertTitle('Error');
      setAlertMessage('No subject selected');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const id = generateUniqueId();
      const qrCode = generateQRCodeData(id, subjectId);

      const newStudent: Student = {
        id,
        name: [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' '),
        studentId: studentId.trim(),
        subjectId,
        qrCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        gender: (gender as 'Male' | 'Female') || undefined,
        dob: dob ? new Date(dob) : null,
        section: section.trim() || undefined,
        yearLevel: yearLevel.trim() || undefined,
      };

      await StorageService.saveStudent(newStudent);
      // Attempt immediate cloud sync (optional)
      try {
        await FirebaseService.syncStudent(newStudent);
      } catch (e) {
        // Ignore sync errors; remains queued for later
      }

      setAlertTitle('Success');
      setAlertMessage('Student added successfully!');
      setShowAlert(true);

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error adding student:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to add student');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Student Information" subtitle={subject?.name || 'Unknown Subject'} />
          <Card.Content>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  style={styles.input}
                  disabled={loading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Middle Name"
                  value={middleName}
                  onChangeText={setMiddleName}
                  mode="outlined"
                  style={styles.input}
                  disabled={loading}
                />
              </View>
            </View>

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Student ID / LRN (optional)"
              value={studentId}
              onChangeText={setStudentId}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              placeholder="e.g., 2024-001"
            />

            <Text style={{ marginBottom: 8 }}>Gender</Text>
            <RadioButton.Group onValueChange={(val) => setGender(val as any)} value={gender}>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                  <RadioButton value="Male" />
                  <Text>Male</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value="Female" />
                  <Text>Female</Text>
                </View>
              </View>
            </RadioButton.Group>

            <TextInput
              label="Date of Birth (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              placeholder="e.g., 2009-05-21"
            />

            <TextInput
              label="Section / Class"
              value={section}
              onChangeText={setSection}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              placeholder="e.g., Section A"
            />

            <TextInput
              label="Year Level / Grade"
              value={yearLevel}
              onChangeText={setYearLevel}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              placeholder="e.g., 7, 8, 9, 10, 11, 12"
              keyboardType="number-pad"
            />

            <Text variant="bodySmall" style={styles.note}>
              A unique QR code will be automatically generated for this student.
            </Text>

            <Button
              mode="contained"
              onPress={handleAddStudent}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Add Student
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
  input: {
    marginBottom: 16,
  },
  note: {
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  button: {
    marginVertical: 8,
  },
});
