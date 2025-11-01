import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Button, Card, List, Text } from 'react-native-paper';
import { FirebaseService } from '../../services/firebaseService';
import { StorageService } from '../../services/storageService';
import { Attendance } from '../../types';
import { generateUniqueId, parseQRCodeData } from '../../utils/qrCodeGenerator';

export default function AttendanceScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<Attendance[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    requestCameraPermission();
    loadRecentAttendance();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadRecentAttendance = async () => {
    try {
      const attendance = await StorageService.getAttendance();
      const today = new Date().toDateString();
      const todayRecords = attendance
        .filter((record) => new Date(record.date).toDateString() === today)
        .slice(-10)
        .reverse();
      setRecentScans(todayRecords);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);

    try {
      const qrData = parseQRCodeData(data);
      if (!qrData) {
        setAlertTitle('Invalid QR Code');
        setAlertMessage('This QR code is not a valid TeachEase student code');
        setShowAlert(true);
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      const students = await StorageService.getStudents();
      const student = students.find(
        (s) => s.id === qrData.studentId && s.subjectId === qrData.subjectId
      );

      if (!student) {
        setAlertTitle('Student Not Found');
        setAlertMessage('No student found with this QR code');
        setShowAlert(true);
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      // Check if already marked present today
      const attendance = await StorageService.getAttendance();
      const today = new Date().toDateString();
      const alreadyMarked = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.subjectId === student.subjectId &&
          new Date(a.date).toDateString() === today
      );

      if (alreadyMarked) {
        setAlertTitle('Already Marked');
        setAlertMessage(`${student.name} is already marked ${alreadyMarked.status} today`);
        setShowAlert(true);
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      // Record attendance
      const newAttendance: Attendance = {
        id: generateUniqueId(),
        studentId: student.id,
        subjectId: student.subjectId,
        date: new Date(),
        status: 'Present',
        timestamp: new Date(),
      };

      await StorageService.saveAttendance(newAttendance);
      // Attempt immediate cloud sync (optional)
      try {
        await FirebaseService.syncAttendance(newAttendance);
      } catch (e) {
        // Ignore sync errors; record stays queued and will sync later
      }
      await loadRecentAttendance();

      setAlertTitle('Success');
      setAlertMessage(`${student.name} marked as Present`);
      setShowAlert(true);
      setTimeout(() => setScanning(true), 1500);
    } catch (error) {
      console.error('Error processing QR code:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to record attendance');
      setShowAlert(true);
      setTimeout(() => setScanning(true), 2000);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#f44336" />
            <Text variant="titleLarge" style={styles.errorText}>
              No Camera Access
            </Text>
            <Text variant="bodyMedium" style={styles.errorSubtext}>
              Please grant camera permission to scan QR codes
            </Text>
            <Button
              mode="contained"
              onPress={requestCameraPermission}
              style={styles.button}
            >
              Grant Permission
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>Scan Student QR Code</Text>
            </View>
          </CameraView>
          <Button
            mode="contained"
            onPress={() => setScanning(false)}
            style={styles.stopButton}
          >
            Stop Scanning
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content style={styles.centerContent}>
              <MaterialCommunityIcons name="qrcode-scan" size={80} color="#6200ee" />
              <Text variant="headlineSmall" style={styles.title}>
                Scan Attendance
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Tap the button below to start scanning student QR codes
              </Text>
              <Button
                mode="contained"
                icon="qrcode-scan"
                onPress={() => setScanning(true)}
                style={styles.button}
              >
                Start Scanning
              </Button>
            </Card.Content>
          </Card>

          {recentScans.length > 0 && (
            <Card style={styles.card}>
              <Card.Title title="Recent Scans (Today)" />
              <Card.Content>
                {recentScans.map((record) => (
                  <List.Item
                    key={record.id}
                    title={`Student ID: ${record.studentId}`}
                    description={`${record.status} at ${new Date(record.timestamp).toLocaleTimeString()}`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="check-circle"
                        color="#4caf50"
                      />
                    )}
                  />
                ))}
              </Card.Content>
            </Card>
          )}
        </View>
      )}

      <AwesomeAlert
        show={showAlert}
        title={alertTitle}
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
  stopButton: {
    margin: 16,
  },
  card: {
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#f44336',
  },
  errorSubtext: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
});
