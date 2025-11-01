import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Card, Text, Button, List, Switch, Divider, Avatar, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { FirebaseService } from '../../services/firebaseService';
import { useRouter } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [autoSync, setAutoSync] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const autoSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const AUTO_SYNC_KEY = '@auto_sync_enabled';

  // Load persisted auto-sync preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTO_SYNC_KEY);
        if (saved != null) setAutoSync(saved === 'true');
      } catch {}
    })();
  }, []);

  // Persist preference and manage interval
  useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem(AUTO_SYNC_KEY, autoSync ? 'true' : 'false'); } catch {}
    })();

    if (autoSync) {
      // Clear existing
      if (autoSyncTimer.current) clearInterval(autoSyncTimer.current as any);
      // Attempt sync every 60s
      autoSyncTimer.current = setInterval(async () => {
        try {
          await FirebaseService.syncAll();
          await FirebaseService.fetchAll();
        } catch {}
      }, 60000);
    } else {
      if (autoSyncTimer.current) {
        clearInterval(autoSyncTimer.current as any);
        autoSyncTimer.current = null;
      }
    }
    return () => {
      if (autoSyncTimer.current) clearInterval(autoSyncTimer.current as any);
    };
  }, [autoSync]);

  const handleLogout = async () => {
    // RN Web doesn't support multi-button Alert as expected; directly logout
    if (Platform.OS === 'web') {
      try {
        await logout();
        router.replace('/auth/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await FirebaseService.syncAll();
      await FirebaseService.fetchAll();
      setAlertTitle('Success');
      setAlertMessage('Data synced successfully with cloud');
      setShowAlert(true);
    } catch (error) {
      console.error('Sync error:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to sync data. Please check your internet connection.');
      setShowAlert(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = () => {
    setShowConfirmClear(true);
  };

  const executeClear = async () => {
      setSyncing(true);
      try {
        // Delete all cloud data for current user
        await FirebaseService.deleteAllUserData();
      } catch (e) {
        // If cloud deletion fails (offline), still proceed to clear local
        console.error('Cloud delete error:', e);
      }
      try {
        // Clear all local data
        await StorageService.clearAll();
      } catch (e) {
        console.error('Local clear error:', e);
      }
      setSyncing(false);
      // Logout since teacher doc is removed
      try {
        await logout();
      } catch {}
      router.replace('/auth/login');
      setAlertTitle('Success');
      setAlertMessage('All data for this account has been removed (cloud and local).');
      setShowAlert(true);
  };

  const handleBackup = async () => {
    setSyncing(true);
    try {
      await FirebaseService.syncAll();
      setAlertTitle('Success');
      setAlertMessage('Backup completed successfully');
      setShowAlert(true);
    } catch (error) {
      console.error('Backup error:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to backup data');
      setShowAlert(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async () => {
    setShowConfirmRestore(true);
  };

  const executeRestore = async () => {
    setSyncing(true);
    try {
      await StorageService.clearDeletedSubjects();
      await FirebaseService.fetchAll();
      setAlertTitle('Success');
      setAlertMessage('Data restored successfully from cloud');
      setShowAlert(true);
    } catch (error) {
      console.error('Restore error:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to restore data');
      setShowAlert(true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Account Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.accountHeader}>
              <Avatar.Icon size={60} icon="account-circle" />
              <View style={styles.accountInfo}>
                <Text variant="titleLarge">Account</Text>
                <Text variant="bodyMedium">{user?.email}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Sync Settings */}
        <Card style={styles.card}>
          <Card.Title
            title="Sync & Backup"
            left={(props) => <Avatar.Icon {...props} icon="cloud-sync" />}
          />

      {/* Confirm Restore from Cloud (Dialog to avoid web overlay glitches) */}
      <Portal>
        <Dialog visible={showConfirmRestore} onDismiss={() => setShowConfirmRestore(false)}>
          <Dialog.Title>Restore from Cloud</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will replace all local data with data from the cloud. Continue?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmRestore(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={async () => {
                setShowConfirmRestore(false);
                await executeRestore();
              }}
            >
              Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
          <Card.Content>
            <List.Item
              title="Auto Sync"
              description="Automatically sync data when online"
              left={(props) => <List.Icon {...props} icon="sync" />}
              right={() => (
                <Switch value={autoSync} onValueChange={setAutoSync} />
              )}
            />
            <Divider />
            <List.Item
              title="Sync Now"
              description="Manually sync all data with cloud"
              left={(props) => <List.Icon {...props} icon="cloud-upload" />}
              onPress={handleSync}
              disabled={syncing}
            />
            <Divider />
            <List.Item
              title="Backup Data"
              description="Create a backup in the cloud"
              left={(props) => <List.Icon {...props} icon="backup-restore" />}
              onPress={handleBackup}
              disabled={syncing}
            />
            <Divider />
            <List.Item
              title="Restore from Cloud"
              description="Restore data from cloud backup"
              left={(props) => <List.Icon {...props} icon="cloud-download" />}
              onPress={handleRestore}
              disabled={syncing}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Title
            title="Data Management"
            left={(props) => <Avatar.Icon {...props} icon="database" />}
          />
          <Card.Content>
            <List.Item
              title="Clear All Data"
              description="Delete all local data"
              left={(props) => <List.Icon {...props} icon="delete-forever" color="#f44336" />}
              onPress={handleClearData}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Card.Title
            title="About"
            left={(props) => <Avatar.Icon {...props} icon="information" />}
          />
          <Card.Content>
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information-outline" />}
            />
            <Divider />
            <List.Item
              title="TeachEase"
              description="Personal Teacher Management App"
              left={(props) => <List.Icon {...props} icon="school" />}
            />
            <Divider />
            <List.Item
              title="Developer"
              description="JK DevWorkz"
              left={(props) => (
                <Avatar.Image {...props} source={require('../../dev.jpg')} />
              )}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              icon="logout"
              onPress={handleLogout}
              buttonColor="#f44336"
              style={styles.logoutButton}
            >
              Logout
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
        confirmButtonColor="#6200ee"
        onConfirmPressed={() => setShowAlert(false)}
      />

      {/* Confirm Clear All Data (works on Web and Native) */}
      <AwesomeAlert
        show={showConfirmClear}
        title="Confirm Deletion"
        message="This will delete ALL your data (cloud and local). Are you sure?"
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="No"
        confirmText="Yes, delete"
        confirmButtonColor="#f44336"
        onCancelPressed={() => setShowConfirmClear(false)}
        onConfirmPressed={async () => {
          setShowConfirmClear(false);
          await executeClear();
        }}
      />
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
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  accountInfo: {
    flex: 1,
  },
  logoutButton: {
    marginTop: 8,
  },
});
