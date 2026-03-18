// components/DonorDrawerNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from './CustomDrawerContent';
import SurrogateNavigator from './SurrogateNavigator'; // reuse bottom tabs for now
import DonorProfile from '../screens/DonorProfile';
import EditDonorProfile from '../screens/EditDonorProfile';
import Wallet from '../screens/Wallet';
import Notifications from '../screens/Notifications';
import Dispute from '../screens/Dispute';

const Drawer = createDrawerNavigator();

export default function DonorDrawerNavigator({ userId, onLogout }) {
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
        drawerActiveBackgroundColor: '#16A34A',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#111',
        drawerLabelStyle: { marginLeft: -16, fontSize: 15 },
      }}
    >
      <Drawer.Screen name="Dashboard">
        {() => <SurrogateNavigator userId={userId} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen name="My Profile">
        {() => <DonorProfile userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="EditDonorProfile"
        component={EditDonorProfile}
        initialParams={{ userId }}
        options={{
          drawerItemStyle: { display: 'none' } // Hide from drawer menu but keep in stack
        }}
      />
      <Drawer.Screen name="Wallet">
        {() => <Wallet userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Notifications">
        {() => <Notifications userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Support"
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="headset-outline" size={size || 20} color={color} />
          ),
        }}
      >
        {(props) => <Dispute {...props} userId={userId} role="DONOR" />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
