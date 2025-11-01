import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Menu, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { StorageService } from '../../services/storageService';
import { Grade, Student, Subject } from '../../types';
import { DEFAULT_LABELS, getGradeRemark, getGradeStatus } from '../../utils/gradeCalculator';

export default function GradesScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorWidth, setAnchorWidth] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // reload whenever the screen comes into focus
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [studentsData, subjectsData, gradesData] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
        StorageService.getGrades(),
      ]);

      setStudents(studentsData);
      setSubjects(subjectsData);
      setGrades(gradesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStudentGrades = (studentId: string, subjectId: string) => {
    return grades.filter(
      (g) => g.studentId === studentId && g.subjectId === subjectId && g.quarter === selectedQuarter
    );
  };

  const filteredStudents = students
    .filter((student) => (student?.name ?? '').toLowerCase().includes((searchQuery ?? '').toLowerCase()))
    .filter((student) => (selectedSubjectId ? student.subjectId === selectedSubjectId : true));

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || '';
  };

  const getSubjectLabels = (subjectId: string) => {
    const subj = subjects.find((s) => s.id === subjectId);
    return subj?.gradeSettings?.labels || DEFAULT_LABELS;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search students..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Subject Selector */}
        <View style={styles.subjectSelector}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <View
                onLayout={(e) => setAnchorWidth(e.nativeEvent.layout.width)}
                style={{ width: '100%' }}
              >
                <Button
                  mode={selectedSubjectId ? 'outlined' : 'contained-tonal'}
                  icon={() => (
                    <MaterialCommunityIcons name="book-open-variant" size={18} color="#6200ee" />
                  )}
                  onPress={() => setMenuVisible(true)}
                  contentStyle={{ justifyContent: 'flex-start' }}
                  style={{ width: '100%' }}
                >
                  {selectedSubjectId ? getSubjectName(selectedSubjectId) : 'Select Subject'}
                </Button>
              </View>
            }
            anchorPosition="bottom"
            contentStyle={{ width: anchorWidth, borderRadius: 12, paddingVertical: 0 }}
          >
            <Menu.Item
              title={selectedSubjectId ? 'Clear selection' : 'All subjects'}
              leadingIcon={selectedSubjectId ? 'close' : 'check'}
              onPress={() => {
                setSelectedSubjectId(null);
                setMenuVisible(false);
              }}
            />
            <Divider />
            {subjects.map((s) => (
              <Menu.Item
                key={s.id}
                title={s.name}
                leadingIcon={selectedSubjectId === s.id ? 'check' : undefined}
                onPress={() => {
                  setSelectedSubjectId(s.id);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        {selectedSubjectId && (
          <SegmentedButtons
            value={selectedQuarter.toString()}
            onValueChange={(value) => setSelectedQuarter(parseInt(value) as 1 | 2 | 3 | 4)}
            buttons={[
              { value: '1', label: 'Q1' },
              { value: '2', label: 'Q2' },
              { value: '3', label: 'Q3' },
              { value: '4', label: 'Q4' },
            ]}
            style={styles.segmentedButtons}
          />
        )}
      </View>
      {(!selectedSubjectId || subjects.length === 0) ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="book-open-variant" size={64} color="#ccc" />
            <Text variant="titleLarge" style={styles.emptyText}>
              {subjects.length === 0 ? 'No subjects yet' : 'Select a subject to view students'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredStudents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="chart-box-outline" size={64} color="#ccc" />
              <Text variant="titleLarge" style={styles.emptyText}>
                No students found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredStudents.map((student) => {
            const studentGrades = getStudentGrades(student.id, student.subjectId);
            const grade = studentGrades[0];

            return (
              <Card key={student.id} style={styles.card}>
                <Card.Title
                  title={student.name}
                  subtitle={getSubjectName(student.subjectId)}
                  left={(props) => (
                    <MaterialCommunityIcons name="account" size={40} color="#6200ee" />
                  )}
                />
                <Card.Content>
                  {grade ? (
                    <View>
                      <View style={styles.gradeRow}>
                        <View style={styles.gradeItem}>
                          <Text variant="bodySmall">{getSubjectLabels(student.subjectId).quiz}</Text>
                          <Text variant="titleMedium">{grade.quiz}</Text>
                        </View>
                        <View style={styles.gradeItem}>
                          <Text variant="bodySmall">{getSubjectLabels(student.subjectId).assignment}</Text>
                          <Text variant="titleMedium">{grade.assignment}</Text>
                        </View>
                        <View style={styles.gradeItem}>
                          <Text variant="bodySmall">{getSubjectLabels(student.subjectId).exam}</Text>
                          <Text variant="titleMedium">{grade.exam}</Text>
                        </View>
                        <View style={styles.gradeItem}>
                          <Text variant="bodySmall">{getSubjectLabels(student.subjectId).project}</Text>
                          <Text variant="titleMedium">{grade.project}</Text>
                        </View>
                      </View>

                      <View style={styles.finalGradeContainer}>
                        <Text variant="titleLarge" style={styles.finalGradeLabel}>
                          Final Grade:
                        </Text>
                        <Text variant="displaySmall" style={styles.finalGrade}>
                          {grade.finalGrade?.toFixed(2) || '0.00'}
                        </Text>
                      </View>

                      <View style={styles.chipContainer}>
                        <Chip
                          icon="information"
                          style={[
                            styles.chip,
                            { backgroundColor: grade.finalGrade && grade.finalGrade >= 75 ? '#4caf50' : '#f44336' },
                          ]}
                          textStyle={{ color: '#fff' }}
                        >
                          {grade.finalGrade ? getGradeStatus(grade.finalGrade) : 'N/A'}
                        </Chip>
                        <Chip icon="star" style={styles.chip}>
                          {grade.finalGrade ? getGradeRemark(grade.finalGrade) : 'N/A'}
                        </Chip>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noGradeContainer}>
                      <Text variant="bodyMedium" style={styles.noGradeText}>
                        No grades recorded for Quarter {selectedQuarter}
                      </Text>
                      <Button
                        mode="outlined"
                        style={styles.addButton}
                        onPress={() =>
                          router.push({
                            pathname: '/grades/add',
                            params: {
                              studentId: student.id,
                              subjectId: student.subjectId,
                              quarter: String(selectedQuarter),
                            },
                          })
                        }
                      >
                        Add Grades
                      </Button>
                    </View>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button
                    mode="text"
                    onPress={() =>
                      router.push({
                        pathname: '/grades/[studentId]',
                        params: { studentId: student.id, subjectId: student.subjectId },
                      })
                    }
                  >
                    View Details
                  </Button>
                </Card.Actions>
              </Card>
            );
          })
        )}
      </ScrollView>
      )}
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
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  subjectSelector: {
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
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  gradeItem: {
    alignItems: 'center',
  },
  finalGradeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  finalGradeLabel: {
    marginBottom: 8,
  },
  finalGrade: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    marginHorizontal: 4,
  },
  noGradeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noGradeText: {
    color: '#666',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
});
