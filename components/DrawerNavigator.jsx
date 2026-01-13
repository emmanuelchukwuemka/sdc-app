// components/DrawerNavigator.jsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import SurrogateNavigator from './SurrogateNavigator';

// Hidden / secondary screens
import SurrogateProfile from '../screens/SurrogateProfile';
import SurrogateKyc from '../screens/SurrogateKyc';
import SurrogateAppointments from '../screens/SurrogateAppointments';
import Wallet from '../screens/Wallet';
import Notifications from '../screens/Notifications';
import Tasks from '../screens/Tasks';

const Drawer = createDrawerNavigator();
const BRAND_GREEN = '#16A34A';

export default function DrawerNavigator({ userId, role, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: BRAND_GREEN,
        drawerLabelStyle: { fontWeight: '600' },
      }}
    >
      {/* Main bottom tab navigation */}
      <Drawer.Screen
        name="HomeTabs"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      >
        {() => <SurrogateNavigator userId={userId} role={role} onLogout={onLogout} />}
      </Drawer.Screen>

      {/* Drawer-only pages */}
      <Drawer.Screen
        name="Profile"
        options={{
          title: 'My Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <SurrogateProfile {...props} userId={userId} role={role} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="KYC"
        options={{
          title: 'KYC',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <SurrogateKyc {...props} userId={userId} role={role} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Appointments"
        options={{
          title: 'Appointments',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <SurrogateAppointments {...props} userId={userId} role={role} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Wallet"
        options={{
          title: 'Wallet',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <Wallet {...props} userId={userId} role={role} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Notifications"
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <Notifications {...props} userId={userId} role={role} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Tasks"
        options={{
          title: 'Tasks',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      >
        {(props) => <Tasks {...props} userId={userId} role={role} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
