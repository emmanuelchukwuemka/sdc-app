// components/SurrogateDrawerNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from './CustomDrawerContent';
import SurrogateNavigator from './SurrogateNavigator'; // bottom tabs (dashboard)
import SurrogateKyc from '../screens/KycSurrogate';
import SurrogateAppointments from '../screens/SurrogateAppointments';
import SurrogateProfile from '../screens/SurrogateProfile';
import EditSurrogateProfile from '../screens/EditSurrogateProfile';
import Wallet from '../screens/Wallet';
import Tasks from '../screens/Tasks';
import Notifications from '../screens/Notifications';
import Dispute from '../screens/Dispute';
import Favorites from '../screens/Favorites';

const Drawer = createDrawerNavigator();
const BRAND_GREEN = '#16A34A';

export default function SurrogateDrawerNavigator({ userId, onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      // User data now passed from parent component
      // setUser() will be called with profile prop
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          userId={userId}
          role={user?.role}
          profile={user}
          onLogout={onLogout}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: BRAND_GREEN,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#111',
        drawerLabelStyle: { marginLeft: -8, fontSize: 15 },
        drawerItemStyle: { marginVertical: -2 }, // ✅ tighter spacing
      }}
    >
      {/* Dashboard */}
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      >
        {() => <SurrogateNavigator userId={userId} onLogout={onLogout} />}
      </Drawer.Screen>

      {/* Profile */}
      <Drawer.Screen
        name="My Profile"
        component={SurrogateProfile}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Edit Profile */}
      <Drawer.Screen
        name="EditSurrogateProfile"
        component={EditSurrogateProfile}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
          title: 'Edit Profile',
        }}
      />

      {/* KYC */}
      <Drawer.Screen
        name="My KYC"
        component={SurrogateKyc}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Appointments */}
      <Drawer.Screen
        name="Appointments"
        component={SurrogateAppointments}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Wallet */}
      <Drawer.Screen
        name="Wallet"
        component={Wallet}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Favorites */}
      <Drawer.Screen
        name="Favorites"
        component={Favorites}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tasks */}
      <Drawer.Screen
        name="Tasks"
        component={Tasks}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Notifications */}
      <Drawer.Screen
        name="Notifications"
        component={Notifications}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Dispute */}
      <Drawer.Screen
        name="Dispute"
        component={Dispute}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="headset-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
