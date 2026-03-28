// components/DonorDrawerNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from './CustomDrawerContent';
import DonorNavigator from './DonorNavigator';
import DonorProfile from '../screens/DonorProfile';
import EditDonorProfile from '../screens/EditDonorProfile';
import Wallet from '../screens/Wallet';
import Notifications from '../screens/Notifications';
import Dispute from '../screens/Dispute';
import DonorKycWizard from '../screens/DonorKycWizard';

const Drawer = createDrawerNavigator();
const BRAND_GREEN_DARK = '#15803D';

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
        drawerActiveBackgroundColor: BRAND_GREEN_DARK,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#111',
        drawerLabelStyle: { marginLeft: -16, fontSize: 15 },
      }}
    >
      <Drawer.Screen name="Dashboard">
        {(props) => <DonorNavigator {...props} userId={userId} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen 
        name="My Profile" 
        component={DonorProfile}
        initialParams={{ userId }}
      />
      <Drawer.Screen
        name="EditDonorProfile"
        component={EditDonorProfile}
        initialParams={{ userId }}
        options={{
          drawerItemStyle: { display: 'none' } // Hide from drawer menu but keep in stack
        }}
      />
      <Drawer.Screen
        name="My KYC"
        component={DonorKycWizard}
        initialParams={{ userId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen name="Wallet">
        {(props) => <Wallet {...props} userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Notifications">
        {(props) => <Notifications {...props} userId={userId} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
