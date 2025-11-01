import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Button, Card, FAB, IconButton, List, Searchbar, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { FirebaseService } from '../../services/firebaseService';
import { StorageService } from '../../services/storageService';
import { Student, Subject } from '../../types';

export default function StudentListScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [printing, setPrinting] = useState(false);
  const shotRefs = useRef<Record<string, ViewShot | null>>({});

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    try {
      const [studentsData, subjectsData] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
      ]);

      const subjectStudents = studentsData.filter((s) => s.subjectId === subjectId);
      const subjectData = subjectsData.find((s) => s.id === subjectId);

      setStudents(subjectStudents);
      setSubject(subjectData || null);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      // Delete from cloud first so it won't come back on next cloud fetch
      try {
        await FirebaseService.deleteGradesByStudent(id);
        await FirebaseService.deleteStudent(id);
      } catch (e) {
        // proceed to local delete even if cloud delete fails; user might be offline
      }
      await StorageService.deleteGradesByStudent(id);
      await StorageService.deleteStudent(id);
      await loadData();
      setAlertMessage('Student deleted successfully');
      setShowAlert(true);
    } catch (error) {
      console.error('Error deleting student:', error);
      setAlertMessage('Failed to delete student');
      setShowAlert(true);
    }
  };

  const generateQRCodesPDF = async () => {
    if (students.length === 0) {
      setAlertMessage('No students to print');
      setShowAlert(true);
      return;
    }

    setPrinting(true);
    try {
      const qrCodesHTML = students
        .map(
          (student) => `
        <div style="page-break-inside: avoid; margin: 20px; padding: 15px; border: 2px solid #6200ee; border-radius: 8px; display: inline-block; width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #6200ee;">${student.name}</h3>
          <p style="margin: 5px 0; color: #666;">Subject: ${subject?.name || 'Unknown'}</p>
          <p style="margin: 5px 0; color: #666;">Student ID: ${student.studentId}</p>
          <div style="text-align: center; margin-top: 15px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(student.qrCode)}" alt="QR Code" />
          </div>
        </div>
      `
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Student QR Codes - ${subject?.name || 'Unknown Subject'}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              h1 {
                color: #6200ee;
                text-align: center;
                margin-bottom: 30px;
              }
              .container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
              }
              img { display: block; }
            </style>
          </head>
          <body>
            <h1>Student QR Codes - ${subject?.name || 'Unknown Subject'}</h1>
            <div class="container">
              ${qrCodesHTML}
            </div>
            <script>
              (function(){
                var imgs = Array.prototype.slice.call(document.images || []);
                var pending = imgs.length;
                function done(){ pending--; if(pending <= 0){ setTimeout(function(){ window.print(); }, 200); } }
                if (pending === 0) { setTimeout(function(){ window.print(); }, 200); return; }
                imgs.forEach(function(img){
                  if (img.complete) { done(); }
                  else {
                    img.addEventListener('load', done);
                    img.addEventListener('error', done);
                  }
                });
              })();
            </script>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        // Web: open a new window with the QR HTML and trigger print so only QR codes + names appear
        const win = window.open('', '_blank');
        if (win) {
          win.document.open();
          win.document.write(html);
          win.document.close();
          // Ensure images load before printing
          const onLoad = () => {
            win.focus();
            win.print();
          };
          // If DOM is already ready, print; else wait
          if (win.document.readyState === 'complete') {
            onLoad();
          } else {
            win.onload = onLoad as any;
          }
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });

      const fileName = `QR_Codes_${(subject?.name || 'Subject').replace(/\s+/g, '_')}.pdf`;

      if (Platform.OS === 'android') {
        try {
          const saf = (FileSystem as any).StorageAccessFramework;
          const permissions = await saf.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const destUri = await saf.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf'
            );
            const pdfData = await (FileSystem as any).readAsStringAsync(uri, { encoding: 'base64' });
            await saf.writeAsStringAsync(destUri, pdfData, { encoding: 'base64' });
            setAlertMessage(`Saved to selected folder as ${fileName}`);
            setShowAlert(true);
          } else if (await Sharing.isAvailableAsync()) {
            // Fallback to share sheet if user cancels folder selection
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
          } else {
            setAlertMessage('Unable to save file. Please grant folder access or enable sharing.');
            setShowAlert(true);
          }
        } catch (err) {
          console.error('Android save error:', err);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
          } else {
            setAlertMessage('Failed to save PDF');
            setShowAlert(true);
          }
        }
      } else {
        // iOS and others: present share sheet so user can Save to Files
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
        } else {
          setAlertMessage('Sharing is not available on this device');
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertMessage('Failed to generate PDF');
      setShowAlert(true);
    } finally {
      setPrinting(false);
    }
  };

  const saveAllQRCodesToGallery = async () => {
    if (students.length === 0) {
      setAlertMessage('No students to save');
      setShowAlert(true);
      return;
    }
    setPrinting(true);
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        setAlertMessage('Permission required to save images to Gallery');
        setShowAlert(true);
        return;
      }

      let saved = 0;
      for (const s of students) {
        const ref = shotRefs.current[s.id];
        if (!ref) continue;
        const uri = await ref.capture?.();
        if (uri) {
          await MediaLibrary.saveToLibraryAsync(uri);
          saved++;
        }
      }
      setAlertMessage(`Saved ${saved} QR image${saved === 1 ? '' : 's'} to Gallery`);
      setShowAlert(true);
    } catch (e) {
      console.error('Save to Gallery error:', e);
      setAlertMessage('Failed to save images');
      setShowAlert(true);
    } finally {
      setPrinting(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Students' }} />
      <View style={styles.header}>
        <Text variant="headlineSmall">{subject?.name || 'Students'}</Text>
        <Text variant="bodyMedium">{students.length} students enrolled</Text>
      </View>

      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredStudents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="account-group" size={64} color="#ccc" />
              <Text variant="titleLarge" style={styles.emptyText}>
                No students found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Tap the + button to add students
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                {Platform.OS === 'web' ? (
                  <Button
                    mode="contained"
                    icon="qrcode"
                    onPress={generateQRCodesPDF}
                    loading={printing}
                    disabled={printing}
                  >
                    {printing ? 'Preparing…' : 'Download All QR Codes (PDF)'}
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    icon="qrcode"
                    onPress={saveAllQRCodesToGallery}
                    loading={printing}
                    disabled={printing}
                  >
                    {printing ? 'Saving…' : 'Save All QR Codes to Gallery'}
                  </Button>
                )}
              </Card.Content>
            </Card>

            {filteredStudents.map((student) => (
              <Card key={student.id} style={styles.card}>
                <List.Item
                  title={student.name}
                  description={`Student ID: ${student.studentId}`}
                  left={(props) => (
                    <MaterialCommunityIcons name="account" size={40} color="#6200ee" />
                  )}
                  right={(props) => (
                    <View style={styles.actions}>
                      <IconButton
                        icon="qrcode"
                        onPress={() => router.push(`/students/qr/${student.id}`)}
                      />
                      <IconButton
                        icon="delete"
                        iconColor="#f44336"
                        onPress={() => handleDeleteStudent(student.id)}
                      />
                    </View>
                  )}
                />
              </Card>
            ))}

            {/* Hidden render area for capturing QR images as PNGs */}
            <View style={{ position: 'absolute', left: -10000, top: -10000 }}>
              {students.map((s) => (
                <ViewShot
                  key={`shot-${s.id}`}
                  ref={(ref: ViewShot | null) => {
                    shotRefs.current[s.id] = ref;
                  }}
                  options={{ format: 'png', quality: 1.0, result: 'tmpfile' as any }}
                >
                  <View style={{ backgroundColor: '#fff', padding: 24, width: 600 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
                      {s.name}
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#555', marginBottom: 12 }}>
                      Student ID: {s.studentId}
                    </Text>
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <QRCode value={s.qrCode} size={380} />
                    </View>
                    <Text style={{ textAlign: 'center', color: '#666' }}>
                      Subject: {subject?.name || 'Unknown'}
                    </Text>
                  </View>
                </ViewShot>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push(`/students/add?subjectId=${subjectId}`)}
      />

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
  },
  header: {
    padding: 16,
    backgroundColor: '#6200ee',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  emptyCard: {
    margin: 16,
    marginTop: 100,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});
