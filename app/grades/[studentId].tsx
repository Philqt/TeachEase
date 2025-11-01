import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, List, SegmentedButtons, Text, Portal, Dialog, TextInput, IconButton } from 'react-native-paper';
import { StorageService } from '../../services/storageService';
import { Attendance, Grade, Student, Subject, Assessment, GradeCategoryKey } from '../../types';
import { DEFAULT_LABELS } from '../../utils/gradeCalculator';
import { generateUniqueId } from '../../utils/qrCodeGenerator';

function getQuarterFromDate(date: Date): 1 | 2 | 3 | 4 {
  const m = date.getMonth() + 1; // 1-12
  // Default school mapping (adjustable later if needed)
  if (m >= 8 && m <= 10) return 1; // Aug-Oct
  if (m >= 11 || m === 1) return 2; // Nov-Jan
  if (m >= 2 && m <= 4) return 3; // Feb-Apr
  return 4; // May-Jul
}

export default function StudentDetailsScreen() {
  const router = useRouter();
  const { studentId, subjectId } = useLocalSearchParams<{ studentId: string; subjectId?: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [selectedInfo, setSelectedInfo] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessDialog, setAssessDialog] = useState(false);
  const [assessCategory, setAssessCategory] = useState<GradeCategoryKey>('quiz');
  const [assessTitle, setAssessTitle] = useState('');
  const [assessScore, setAssessScore] = useState('');
  const [assessTotal, setAssessTotal] = useState('');
  const [assessDate, setAssessDate] = useState(''); // yyyy-mm-dd
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    (async () => {
      const [students, subjects, allGrades, allAttendance, allAssessments] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
        StorageService.getGrades(),
        StorageService.getAttendance(),
        StorageService.getAssessments(),
      ]);
      const s = students.find(x => x.id === studentId) || null;
      setStudent(s);
      const subjId = subjectId || s?.subjectId || '';
      const sub = subjects.find(x => x.id === subjId) || null;
      setSubject(sub);
      setGrades(allGrades.filter(g => g.studentId === studentId && g.subjectId === (sub?.id || '')));
      setAttendance(allAttendance.filter(a => a.studentId === studentId && a.subjectId === (sub?.id || '')));
      setAssessments(allAssessments.filter(x => x.studentId === studentId && x.subjectId === (sub?.id || '')));
    })();
  }, [studentId, subjectId]);

  const gradeForQuarter = useMemo(() => {
    return grades.find(g => g.quarter === quarter) || null;
  }, [grades, quarter]);

  const subjectLabels = useMemo(() => subject?.gradeSettings?.labels || DEFAULT_LABELS, [subject]);
  const subjectWeights = useMemo(() => subject?.gradeSettings?.weights, [subject]);

  const assessmentsForQuarter = useMemo(() => {
    return assessments.filter(a => a.quarter === quarter);
  }, [assessments, quarter]);

  const computedCategoryPercents = useMemo(() => {
    const byCat: Record<GradeCategoryKey, number[]> = { quiz: [], assignment: [], exam: [], project: [] };
    assessmentsForQuarter.forEach(a => {
      if (a.total > 0) byCat[a.category].push((a.score / a.total) * 100);
    });
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
    return {
      quiz: avg(byCat.quiz),
      assignment: avg(byCat.assignment),
      exam: avg(byCat.exam),
      project: avg(byCat.project),
    };
  }, [assessmentsForQuarter]);

  const computedFinal = useMemo(() => {
    const w = subjectWeights || { quiz: 0.2, assignment: 0.2, exam: 0.4, project: 0.2 };
    const c = computedCategoryPercents;
    return (c.quiz * w.quiz) + (c.assignment * w.assignment) + (c.exam * w.exam) + (c.project * w.project);
  }, [computedCategoryPercents, subjectWeights]);

  const openAddAssessment = () => {
    setAssessDialog(true);
    setAssessCategory('quiz');
    setAssessTitle('');
    setAssessScore('');
    setAssessTotal('');
    const today = new Date();
    setAssessDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
    setEditingAssessment(null);
  };

  const saveAssessment = async () => {
    if (!student || !subject) return;
    const total = parseFloat(assessTotal);
    const score = parseFloat(assessScore);
    if (!(total > 0) || score < 0 || score > total) return;
    const dateObj = new Date(assessDate || new Date());
    const now = new Date();
    const newAssessment: Assessment = {
      id: editingAssessment?.id || generateUniqueId(),
      studentId: student.id,
      subjectId: subject.id,
      quarter,
      date: dateObj,
      category: assessCategory,
      title: assessTitle || `${subjectLabels[assessCategory]} ${dateObj.toLocaleDateString()}`,
      score,
      total,
      createdAt: editingAssessment?.createdAt || now,
      updatedAt: now,
    };
    await StorageService.saveAssessment(newAssessment);
    const all = await StorageService.getAssessments();
    setAssessments(all.filter(x => x.studentId === student.id && x.subjectId === subject.id));
    setAssessDialog(false);
  };

  const onEditAssessment = (a: Assessment) => {
    setEditingAssessment(a);
    setAssessDialog(true);
    setAssessCategory(a.category);
    setAssessTitle(a.title);
    setAssessScore(String(a.score));
    setAssessTotal(String(a.total));
    setAssessDate(`${new Date(a.date).getFullYear()}-${String(new Date(a.date).getMonth()+1).padStart(2,'0')}-${String(new Date(a.date).getDate()).padStart(2,'0')}`);
  };

  const onDeleteAssessment = async (id: string) => {
    await StorageService.deleteAssessment(id);
    const all = await StorageService.getAssessments();
    if (student && subject) setAssessments(all.filter(x => x.studentId === student.id && x.subjectId === subject.id));
  };

  const saveFinalGrade = async () => {
    if (!student || !subject) return;
    const now = new Date();
    const grade: Grade = {
      id: `${student.id}-${subject.id}-q${quarter}`,
      studentId: student.id,
      subjectId: subject.id,
      quarter,
      quiz: computedCategoryPercents.quiz,
      assignment: computedCategoryPercents.assignment,
      exam: computedCategoryPercents.exam,
      project: computedCategoryPercents.project,
      finalGrade: computedFinal,
      createdAt: now,
      updatedAt: now,
    };
    await StorageService.saveGrade(grade);
    setSaveMsg('Final grade saved.');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const quarterAttendance = useMemo(() => {
    return attendance.filter(a => getQuarterFromDate(new Date(a.date)) === quarter);
  }, [attendance, quarter]);

  const heatmapWeeks = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const ranges: Record<1|2|3|4, { start: Date; end: Date }> = {
      1: { start: new Date(year, 7, 1), end: new Date(year, 10, 0) }, // Aug 1 - Oct 31
      2: { start: new Date(year, 10, 1), end: new Date(year + 1, 1, 31) }, // Nov 1 - Jan 31
      3: { start: new Date(year + 1, 1, 1), end: new Date(year + 1, 3, 30) }, // Feb 1 - Apr 30
      4: { start: new Date(year + 1, 4, 1), end: new Date(year + 1, 6, 31) }, // May 1 - Jul 31
    } as any;
    const { start, end } = ranges[quarter];

    // Align to the start of week (Monday)
    const startAligned = new Date(start);
    const startDow = startAligned.getDay();
    const startOffset = (startDow + 6) % 7; // 0 if Monday, 6 if Sunday
    startAligned.setDate(startAligned.getDate() - startOffset);
    const endAligned = new Date(end);
    const endDow = endAligned.getDay();
    const endOffset = (7 - ((endDow + 6) % 7) - 1); // days to reach Sunday when Monday is 0
    endAligned.setDate(endAligned.getDate() + endOffset);

    const weeks: Date[][] = [];
    const cursor = new Date(startAligned);
    while (cursor <= endAligned) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [quarter]);

  const quarterRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const ranges: Record<1|2|3|4, { start: Date; end: Date }> = {
      1: { start: new Date(year, 7, 1), end: new Date(year, 9, 31) },
      2: { start: new Date(year, 10, 1), end: new Date(year + 1, 0, 31) },
      3: { start: new Date(year + 1, 1, 1), end: new Date(year + 1, 3, 30) },
      4: { start: new Date(year + 1, 4, 1), end: new Date(year + 1, 6, 31) },
    } as any;
    return ranges[quarter];
  }, [quarter]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    quarterAttendance.forEach(a => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      map.set(key, a);
    });
    return map;
  }, [quarterAttendance]);

  const visibleWeeks = useMemo(() => {
    return heatmapWeeks.filter(week => week.some(d => d >= quarterRange.start && d <= quarterRange.end));
  }, [heatmapWeeks, quarterRange]);

  const monthSpans = useMemo(() => {
    // Group visible weeks into month spans and compute how many week columns each month occupies
    type Span = { label: string; span: number };
    const spans: Span[] = [];
    const fmt = (d: Date) => d.toLocaleString('en', { month: 'short' }).toUpperCase();
    let currentLabel: string | null = null;
    let currentSpan = 0;
    const inRange = (d: Date) => d >= quarterRange.start && d <= quarterRange.end;
    visibleWeeks.forEach(week => {
      // Determine the month for this week based on the first in-range day
      const firstInRange = week.find(inRange);
      const label = firstInRange ? fmt(firstInRange) : currentLabel || ' ';
      if (currentLabel === null) {
        currentLabel = label;
        currentSpan = 1;
      } else if (label === currentLabel) {
        currentSpan += 1;
      } else {
        spans.push({ label: currentLabel, span: currentSpan });
        currentLabel = label;
        currentSpan = 1;
      }
    });
    if (currentLabel) spans.push({ label: currentLabel, span: currentSpan });
    return spans;
  }, [visibleWeeks, quarterRange]);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge">{student?.name || 'Student'}</Text>
          <Text variant="bodyMedium">{subject?.name || 'Subject'}</Text>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={assessDialog} onDismiss={() => setAssessDialog(false)}>
          <Dialog.Title>Add Assessment</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={assessCategory}
              onValueChange={(v) => setAssessCategory(v as GradeCategoryKey)}
              buttons={[
                { value: 'quiz', label: subjectLabels.quiz },
                { value: 'assignment', label: subjectLabels.assignment },
                { value: 'exam', label: subjectLabels.exam },
                { value: 'project', label: subjectLabels.project },
              ]}
              style={{ marginBottom: 8 }}
            />
            <TextInput label="Title (optional)" value={assessTitle} onChangeText={setAssessTitle} mode="outlined" style={{ marginBottom: 8 }} />
            <TextInput label="Date (YYYY-MM-DD)" value={assessDate} onChangeText={setAssessDate} mode="outlined" style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput label="Score" value={assessScore} onChangeText={setAssessScore} mode="outlined" keyboardType="numeric" style={{ flex: 1 }} />
              <TextInput label="Total" value={assessTotal} onChangeText={setAssessTotal} mode="outlined" keyboardType="numeric" style={{ flex: 1 }} />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAssessDialog(false)}>Cancel</Button>
            <Button onPress={saveAssessment}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <SegmentedButtons
        value={quarter.toString()}
        onValueChange={v => setQuarter(parseInt(v) as 1 | 2 | 3 | 4)}
        buttons={[
          { value: '1', label: 'Q1' },
          { value: '2', label: 'Q2' },
          { value: '3', label: 'Q3' },
          { value: '4', label: 'Q4' },
        ]}
        style={styles.segmented}
      />

      <Card style={styles.card}>
        <Card.Title title={`Quarter ${quarter} Grade`} right={() => (
          <Button onPress={saveFinalGrade}>Save Final</Button>
        )} />
        <Card.Content>
          {true ? (
            <View>
              <View style={styles.row}>
                <Text>{subjectLabels.quiz}: {computedCategoryPercents.quiz.toFixed(1)}%</Text>
                <Text>{subjectLabels.assignment}: {computedCategoryPercents.assignment.toFixed(1)}%</Text>
              </View>
              <View style={styles.row}>
                <Text>{subjectLabels.exam}: {computedCategoryPercents.exam.toFixed(1)}%</Text>
                <Text>{subjectLabels.project}: {computedCategoryPercents.project.toFixed(1)}%</Text>
              </View>
              <Divider style={{ marginVertical: 8 }} />
              <Text variant="titleMedium">Final (auto): {computedFinal.toFixed(2)}%</Text>
              {!!saveMsg && <Text style={{ color: '#4caf50', marginTop: 6 }}>{saveMsg}</Text>}
            </View>
          ) : (
            <View>
              <Text>No grade recorded for this quarter.</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Assessments" right={() => (
          <Button onPress={openAddAssessment}>Add</Button>
        )} />
        <Card.Content>
          {assessmentsForQuarter.length === 0 ? (
            <Text>No assessments yet.</Text>
          ) : (
            assessmentsForQuarter.map(a => (
              <List.Item
                key={a.id}
                title={a.title}
                description={`${subjectLabels[a.category]} • ${a.score}/${a.total} • ${new Date(a.date).toLocaleDateString()}`}
                left={props => <List.Icon {...props} icon="file-document-outline" />}
                right={() => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" onPress={() => onEditAssessment(a)} />
                    <IconButton icon="delete" iconColor="#e53935" onPress={() => onDeleteAssessment(a.id)} />
                  </View>
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title={`Quarter ${quarter} Attendance`}
          subtitle={`${quarterRange.start.toLocaleString('en', { month: 'short' })} – ${quarterRange.end.toLocaleString('en', { month: 'short' })} ${quarterRange.end.getFullYear()}`}
        />
        <Card.Content>
          {/* GitHub-style heatmap */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View>
              {/* Month labels */}
              <View style={styles.monthRow}>
                <View style={{ width: 24 }} />
                <View style={{ flexDirection: 'row' }}>
                  {monthSpans.map((m, idx) => (
                    <Text
                      key={`ms-${idx}`}
                      style={[styles.monthSpan, { width: m.span * 16 }]}
                      numberOfLines={1}
                    >
                      {m.label}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                {/* Weekday labels */}
                <View style={styles.weekdayCol}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Text key={`w-${i}`} style={styles.weekdayLabel} numberOfLines={1}>
                      {i === 0 ? 'Mon' : i === 2 ? 'Wed' : i === 4 ? 'Fri' : ' '}
                    </Text>
                  ))}
                </View>
                {/* Grid */}
                <View style={{ flexDirection: 'row' }}>
                  {visibleWeeks.map((week, wi) => (
                    <View key={`c-${wi}`} style={styles.weekCol}>
                      {week.map((d, di) => {
                        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const rec = attendanceMap.get(key);
                        const inRange = d >= quarterRange.start && d <= quarterRange.end;
                        let bg = '#e0e0e0';
                        if (rec?.status === 'Present') bg = '#43a047';
                        if (rec?.status === 'Late') bg = '#fb8c00';
                        if (rec?.status === 'Absent') bg = '#e53935';
                        return (
                          <Pressable
                            key={`d-${wi}-${di}`}
                            style={[
                              styles.dayBox,
                              inRange ? { backgroundColor: bg, borderWidth: rec?.status ? 0 : 1, borderColor: '#ddd' } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#eee' },
                            ]}
                            disabled={!inRange}
                            onPress={() => {
                              if (!inRange) return;
                              const label = d.toLocaleDateString();
                              const status = rec?.status || 'No record';
                              setSelectedInfo(`${label} - ${status}`);
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {!!selectedInfo && (
            <Text style={styles.selectedInfo}>{selectedInfo}</Text>
          )}

          {quarterAttendance.length === 0 ? (
            <Text>No attendance records for this quarter.</Text>
          ) : (
            quarterAttendance.map(item => (
              <List.Item
                key={item.id}
                title={`${new Date(item.date).toLocaleDateString()} - ${item.status}`}
                left={props => <List.Icon {...props} icon={item.status === 'Present' ? 'check-circle' : item.status === 'Late' ? 'clock-outline' : 'close-circle'} />}
              />
            ))
          )}
        </Card.Content>
      </Card>

      {student && (
        <View style={{ padding: 16 }}>
          <Button
            mode="contained"
            onPress={() => router.push(`/grades/add?studentId=${student.id}&subjectId=${subject?.id}&quarter=${quarter}`)}
          >
            {gradeForQuarter ? 'Edit Grade' : 'Add Grade'} (Q{quarter})
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: { margin: 16 },
  segmented: { marginHorizontal: 16, marginBottom: 8 },
  card: { marginHorizontal: 16, marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  dayBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  monthLabel: {
    width: 16,
    textAlign: 'center',
    color: '#888',
    fontSize: 10,
    marginHorizontal: 1,
  },
  monthSpan: {
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 1,
  },
  weekdayCol: {
    width: 24,
    marginRight: 4,
  },
  weekdayLabel: {
    height: 14,
    color: '#888',
    fontSize: 10,
    textAlignVertical: 'center',
  },
  weekCol: {
    width: 16,
    marginHorizontal: 1,
    alignItems: 'center',
  },
  selectedInfo: {
    marginTop: 8,
    color: '#555',
  },
});
