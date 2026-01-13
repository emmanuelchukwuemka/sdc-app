// components/RoleBasedDrawer.jsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import CustomDrawerContent from './CustomDrawerContent';

// Role-specific navigators
import SurrogateNavigator from './SurrogateNavigator';
import DonorNavigator from './DonorNavigator';
import AgencyNavigator from './AgencyNavigator';
import IpNavigator from './IpNavigator';   // ✅ new IP navigator
import AdminNavigator from './AdminNavigator';

const Drawer = createDrawerNavigator();

export default function RoleBasedDrawer({ userId, role, onLogout }) {
  const getNavigator = () => {
    switch (role) {
      case 'SURROGATE':
        return SurrogateNavigator;
      case 'DONOR':
        return DonorNavigator;
      case 'AGENCY':
        return AgencyNavigator;
      case 'IP': // ✅ use new IP navigator
        return IpNavigator;
      case 'ADMIN':
        return AdminNavigator;
      default:
        return SurrogateNavigator;
    }
  };

  const Navigator = getNavigator();

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} userId={userId} role={role} onLogout={onLogout} />
      )}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#16A34A',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#111',
        drawerLabelStyle: { marginLeft: -16, fontSize: 15 },
      }}
    >
      <Drawer.Screen
        name={`${role} Dashboard`}
        component={Navigator}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
