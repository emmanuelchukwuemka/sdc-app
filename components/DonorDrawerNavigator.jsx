// components/DonorDrawerNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { supabase } from '../lib/supabase';
import CustomDrawerContent from './CustomDrawerContent';
import SurrogateNavigator from './SurrogateNavigator'; // reuse bottom tabs for now
import SurrogateProfile from '../screens/SurrogateProfile';
import Wallet from '../screens/Wallet';
import Notifications from '../screens/Notifications';

const Drawer = createDrawerNavigator();

export default function DonorDrawerNavigator({ userId, onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setUser(data);
      }
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
        {() => <SurrogateProfile userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Wallet">
        {() => <Wallet userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Notifications">
        {() => <Notifications userId={userId} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
