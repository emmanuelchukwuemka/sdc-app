// components/AdminDrawerNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { supabase } from '../lib/supabase';
import CustomDrawerContent from './CustomDrawerContent';
import SurrogateNavigator from './SurrogateNavigator'; // Admin may get its own dashboard later
import SurrogateProfile from '../screens/SurrogateProfile';
import Tasks from '../screens/Tasks';
import Notifications from '../screens/Notifications';
import Wallet from '../screens/Wallet';

const Drawer = createDrawerNavigator();

export default function AdminDrawerNavigator({ userId, onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('user_id as id, role, form_data')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        // Extract user info from form_data
        setUser({
          id: data.id,
          full_name: `${data.form_data?.first_name || ''} ${data.form_data?.last_name || ''}`.trim(),
          role: data.role,
          avatar_url: data.form_data?.profile_image || null
        });
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
      <Drawer.Screen name="Tasks">
        {() => <Tasks userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Wallet">
        {() => <Wallet userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Notifications">
        {() => <Notifications userId={userId} />}
      </Drawer.Screen>
      <Drawer.Screen name="Profile">
        {() => <SurrogateProfile userId={userId} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
