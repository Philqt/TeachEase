import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FirebaseService } from '../../services/firebaseService';
import { StorageService } from '../../services/storageService';
import { Attendance, Student, Subject } from '../../types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Reload when the tab/screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      return undefined;
    }, [])
  );

  // Subscribe to storage changes so counts update instantly without manual refresh
  useEffect(() => {
    const unsubStudents = StorageService.subscribe('students', loadData);
    const unsubSubjects = StorageService.subscribe('subjects', loadData);
    const unsubAttendance = StorageService.subscribe('attendance', loadData);
    return () => {
      unsubStudents?.();
      unsubSubjects?.();
      unsubAttendance?.();
    };
  }, []);

  useEffect(() => {
    const fetchName = async () => {
      try {
        if (!user?.uid) return;
        const ref = doc(db, 'teachers', user.uid);
        const snap = await getDoc(ref);
        const name = snap.data()?.name as string | undefined;
        setTeacherName(name || null);
      } catch (e) {
        setTeacherName(null);
      }
    };
    fetchName();
  }, [user?.uid]);

  const loadData = async () => {
    try {
      const [studentsData, subjectsData, attendanceData] = await Promise.all([
        StorageService.getStudents(),
        StorageService.getSubjects(),
        StorageService.getAttendance(),
      ]);

      setStudents(studentsData);
      setSubjects(subjectsData);

      // Filter today's attendance
      const today = new Date().toDateString();
      const todayRecords = attendanceData.filter(
        (record) => new Date(record.date).toDateString() === today
      );
      setTodayAttendance(todayRecords);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await FirebaseService.syncAll();
      await FirebaseService.fetchAll();
      await loadData();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
  const lateCount = todayAttendance.filter(a => a.status === 'Late').length;
  const absentCount = todayAttendance.filter(a => a.status === 'Absent').length;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeContent}>
              <Avatar.Icon size={60} icon="account-circle" />
              <View style={styles.welcomeText}>
                <Text variant="headlineSmall">Welcome back!</Text>
                <Text variant="bodyMedium">{teacherName || user?.email}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="account-group" size={32} color="#6200ee" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {students.length}
              </Text>
              <Text variant="bodyMedium">Total Students</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="book-open-variant" size={32} color="#03dac6" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {subjects.length}
              </Text>
              <Text variant="bodyMedium">Subjects</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Today's Attendance */}
        <Card style={styles.card}>
          <Card.Title
            title="Today's Attendance"
            left={(props) => <Avatar.Icon {...props} icon="calendar-check" />}
          />
          <Card.Content>
            <View style={styles.attendanceRow}>
              <View style={styles.attendanceItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4caf50" />
                <Text variant="titleMedium">{presentCount}</Text>
                <Text variant="bodySmall">Present</Text>
              </View>
              <View style={styles.attendanceItem}>
                <MaterialCommunityIcons name="clock-alert" size={24} color="#ff9800" />
                <Text variant="titleMedium">{lateCount}</Text>
                <Text variant="bodySmall">Late</Text>
              </View>
              <View style={styles.attendanceItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#f44336" />
                <Text variant="titleMedium">{absentCount}</Text>
                <Text variant="bodySmall">Absent</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Title
            title="Quick Actions"
            left={(props) => <Avatar.Icon {...props} icon="lightning-bolt" />}
          />
          <Card.Content>
            <Button
              mode="contained"
              icon="qrcode-scan"
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/attendance')}
            >
              Scan Attendance
            </Button>
            <Button
              mode="outlined"
              icon="account-plus"
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/subjects')}
            >
              Add Student
            </Button>
            <Button
              mode="outlined"
              icon="book-plus"
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/subjects')}
            >
              Add Subject
            </Button>
          </Card.Content>
        </Card>

        {/* Sync Button */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained-tonal"
              icon="cloud-sync"
              loading={syncing}
              disabled={syncing}
              onPress={handleSync}
            >
              {syncing ? 'Syncing...' : 'Sync with Cloud'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  welcomeText: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  attendanceItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    marginVertical: 6,
  },
});
