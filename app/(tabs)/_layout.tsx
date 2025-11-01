import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = colorScheme === 'dark' ? '#BB86FC' : '#6200ee';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
        },
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          // Hide explore from the tab bar
          href: null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'TeachEase Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          headerTitle: 'My Subjects',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="book-open-variant" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          headerTitle: 'Scan Attendance',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          headerTitle: 'Student Grades',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-box" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
