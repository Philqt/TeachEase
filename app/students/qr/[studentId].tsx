import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { StorageService } from '../../../services/storageService';
import { Student, Subject } from '../../../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function StudentQRScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const [students, subjects] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
      ]);

      const studentData = students.find((s) => s.id === studentId);
      if (studentData) {
        setStudent(studentData);
        const subjectData = subjects.find((s) => s.id === studentData.subjectId);
        setSubject(subjectData || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePrintQR = async () => {
    if (!student) return;

    setPrinting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>QR Code - ${student.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .qr-container {
                text-align: center;
                border: 3px solid #6200ee;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
              }
              h1 {
                color: #6200ee;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .info {
                color: #666;
                margin: 10px 0;
                font-size: 16px;
              }
              .qr-code {
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${student.name}</h1>
              <p class="info">Subject: ${subject?.name || 'Unknown'}</p>
              <p class="info">Student ID: ${student.studentId}</p>
              <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(student.qrCode)}" alt="QR Code" />
              </div>
              <p class="info" style="font-size: 14px; color: #999;">Scan this code for attendance</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        setAlertMessage('Sharing is not available on this device');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error printing QR code:', error);
      setAlertMessage('Failed to print QR code');
      setShowAlert(true);
    } finally {
      setPrinting(false);
    }
  };

  if (!student) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <Text variant="titleLarge">Student not found</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={student.name}
          subtitle={`${subject?.name || 'Unknown Subject'} - ${student.studentId}`}
        />
        <Card.Content style={styles.centerContent}>
          <View style={styles.qrContainer}>
            <QRCode value={student.qrCode} size={250} />
          </View>

          <Text variant="bodyMedium" style={styles.instructions}>
            Scan this QR code to mark attendance
          </Text>

          <Button
            mode="contained"
            icon="printer"
            onPress={handlePrintQR}
            loading={printing}
            disabled={printing}
            style={styles.button}
          >
            {printing ? 'Generating PDF...' : 'Print QR Code'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.button}
          >
            Back
          </Button>
        </Card.Content>
      </Card>

      <AwesomeAlert
        show={showAlert}
        title="Info"
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#6200ee"
        onConfirmPressed={() => setShowAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginTop: 20,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 24,
    elevation: 4,
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
    minWidth: 200,
  },
});
