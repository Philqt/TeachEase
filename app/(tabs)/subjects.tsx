import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Button, Card, Dialog, Divider, FAB, IconButton, Menu, Portal, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../services/firebaseService';
import { StorageService } from '../../services/storageService';
import { Subject } from '../../types';
import { DEFAULT_LABELS, DEFAULT_WEIGHTS } from '../../utils/gradeCalculator';
import { generateUniqueId } from '../../utils/qrCodeGenerator';

export default function SubjectsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [labelQuiz, setLabelQuiz] = useState('');
  const [labelAssignment, setLabelAssignment] = useState('');
  const [labelExam, setLabelExam] = useState('');
  const [labelProject, setLabelProject] = useState('');
  const [wQuiz, setWQuiz] = useState('20');
  const [wAssignment, setWAssignment] = useState('20');
  const [wExam, setWExam] = useState('40');
  const [wProject, setWProject] = useState('20');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await StorageService.getSubjects();
      const deleted = await StorageService.getDeletedSubjects();
      const visible = data.filter(s => !deleted.includes(s.id));
      setSubjects(visible);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubjects();
    setRefreshing(false);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) {
      setAlertMessage('Please enter a subject name');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const newSubject: Subject = {
        id: generateUniqueId(),
        name: subjectName.trim(),
        teacherId: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.saveSubject(newSubject);
      // Try to sync to Firebase immediately (optional)
      try {
        await FirebaseService.syncSubject(newSubject);
      } catch (e) {
        // Ignore errors; data remains queued for sync
      }
      await loadSubjects();
      setSubjectName('');
      setDialogVisible(false);
      setAlertMessage('Subject added successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error adding subject:', error);
      setAlertMessage('Failed to add subject');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const openSettings = (subject: Subject) => {
    setEditingSubject(subject);
    const labels = subject.gradeSettings?.labels || DEFAULT_LABELS;
    const weights = subject.gradeSettings?.weights || DEFAULT_WEIGHTS;
    setLabelQuiz(labels.quiz);
    setLabelAssignment(labels.assignment);
    setLabelExam(labels.exam);
    setLabelProject(labels.project);
    setWQuiz(String(Math.round(weights.quiz * 100)));
    setWAssignment(String(Math.round(weights.assignment * 100)));
    setWExam(String(Math.round(weights.exam * 100)));
    setWProject(String(Math.round(weights.project * 100)));
    setSettingsVisible(true);
  };

  const saveSettings = async () => {
    if (!editingSubject) return;
    const q = parseFloat(wQuiz) || 0;
    const a = parseFloat(wAssignment) || 0;
    const e = parseFloat(wExam) || 0;
    const p = parseFloat(wProject) || 0;
    const total = q + a + e + p;
    if (total !== 100) {
      setAlertMessage('Weights must sum to 100%');
      setShowAlert(true);
      return;
    }
    const updated: Subject = {
      ...editingSubject,
      updatedAt: new Date(),
      gradeSettings: {
        labels: {
          quiz: labelQuiz || DEFAULT_LABELS.quiz,
          assignment: labelAssignment || DEFAULT_LABELS.assignment,
          exam: labelExam || DEFAULT_LABELS.exam,
          project: labelProject || DEFAULT_LABELS.project,
        },
        weights: {
          quiz: q / 100,
          assignment: a / 100,
          exam: e / 100,
          project: p / 100,
        },
      },
    };
    try {
      await StorageService.saveSubject(updated);
      try {
        await FirebaseService.syncSubject(updated);
      } catch {}
      await loadSubjects();
      setSettingsVisible(false);
      setEditingSubject(null);
      setAlertMessage('Grade settings saved');
      setShowAlert(true);
    } catch (err) {
      setAlertMessage('Failed to save grade settings');
      setShowAlert(true);
    }
  };

  const deleteLocalOnly = async (id: string) => {
    try {
      await StorageService.deleteSubject(id);
      await StorageService.addDeletedSubject(id);
      await loadSubjects();
      setAlertMessage('Subject deleted locally. You can restore from cloud.');
      setShowAlert(true);
    } catch (error) {
      console.error('Error deleting subject locally:', error);
      setAlertMessage('Failed to delete subject locally');
      setShowAlert(true);
    }
  };

  const deleteEverywhere = async (id: string) => {
    try {
      await StorageService.deleteSubject(id);
      try {
        await FirebaseService.deleteSubject(id);
      } catch (e) {
        // If cloud fails, subject may return on restore
        console.error('Cloud delete subject error:', e);
      }
      await loadSubjects();
      setAlertMessage('Subject deleted locally and in cloud');
      setShowAlert(true);
    } catch (error) {
      console.error('Error deleting subject:', error);
      setAlertMessage('Failed to delete subject');
      setShowAlert(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {subjects.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color="#ccc" />
              <Text variant="titleLarge" style={styles.emptyText}>
                No subjects yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Tap the + button to add your first subject
              </Text>
            </Card.Content>
          </Card>
        ) : (
          subjects.map((subject) => (
            <Card key={subject.id} style={styles.card}>
              <Card.Title
                title={subject.name}
                subtitle={`Created: ${new Date(subject.createdAt).toLocaleDateString()}`}
                left={(props) => (
                  <MaterialCommunityIcons name="book-open-variant" size={40} color="#6200ee" />
                )}
                right={(props) => (
                  <Menu
                    visible={openMenuId === subject.id}
                    onDismiss={() => setOpenMenuId(null)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => setOpenMenuId(subject.id)}
                        accessibilityLabel="More options"
                      />
                    }
                    anchorPosition="bottom"
                    contentStyle={{ borderRadius: 12 }}
                  >
                    <Menu.Item title="Grade Settings" leadingIcon="cog" onPress={() => { setOpenMenuId(null); openSettings(subject); }} />
                    <Divider />
                    <Menu.Item title="Delete" leadingIcon="trash-can" onPress={() => { setOpenMenuId(null); handleDeleteSubject(subject.id); }} />
                  </Menu>
                )}
              />
              <Card.Actions style={styles.actionsRow}>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/students/add?subjectId=${subject.id}`)}
                  icon="account-plus"
                  contentStyle={{ height: 40 }}
                  style={styles.primaryBtn}
                >
                  Add Student
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.push(`/students/${subject.id}`)}
                  icon="account-group"
                  contentStyle={{ height: 40 }}
                  style={styles.secondaryBtn}
                >
                  View Students
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Add New Subject</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Subject Name"
              value={subjectName}
              onChangeText={setSubjectName}
              mode="outlined"
              placeholder="e.g., Math 10, English 8"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddSubject} loading={loading} disabled={loading}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Grade Settings</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Label 1" value={labelQuiz} onChangeText={setLabelQuiz} mode="outlined" style={{ marginBottom: 8 }} />
            <TextInput label="Weight 1 (%)" value={wQuiz} onChangeText={setWQuiz} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
            <TextInput label="Label 2" value={labelAssignment} onChangeText={setLabelAssignment} mode="outlined" style={{ marginBottom: 8 }} />
            <TextInput label="Weight 2 (%)" value={wAssignment} onChangeText={setWAssignment} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
            <TextInput label="Label 3" value={labelExam} onChangeText={setLabelExam} mode="outlined" style={{ marginBottom: 8 }} />
            <TextInput label="Weight 3 (%)" value={wExam} onChangeText={setWExam} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
            <TextInput label="Label 4" value={labelProject} onChangeText={setLabelProject} mode="outlined" style={{ marginBottom: 8 }} />
            <TextInput label="Weight 4 (%)" value={wProject} onChangeText={setWProject} mode="outlined" keyboardType="numeric" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>Cancel</Button>
            <Button onPress={saveSettings} loading={loading} disabled={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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

      {/* Confirm subject deletion Dialog (reliable on Web and Native) */}
      <Portal>
        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
          <Dialog.Title>Delete Subject</Dialog.Title>
          <Dialog.Content>
            <Text>
              Do you want to delete this subject only on this device, or delete everywhere?
              {'\n'}
              {'\n'}Tip: Choose "Delete locally only" so Restore from Cloud can bring it back. Choose
              "Delete everywhere" to remove it from cloud too.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="outlined"
              onPress={async () => {
                setShowDeleteConfirm(false);
                if (pendingDeleteId) await deleteLocalOnly(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete locally only
            </Button>
            <Button
              mode="contained"
              buttonColor="#f44336"
              onPress={async () => {
                setShowDeleteConfirm(false);
                if (pendingDeleteId) await deleteEverywhere(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete everywhere
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  actionsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  primaryBtn: {
    borderRadius: 10,
  },
  secondaryBtn: {
    borderRadius: 10,
  },
});
