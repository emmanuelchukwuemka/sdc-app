// components/AppNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
// Removed unused Supabase import

// Import all drawer navigators
import SurrogateDrawerNavigator from './SurrogateDrawerNavigator';
import DonorDrawerNavigator from './DonorDrawerNavigator';
import AgencyDrawerNavigator from './AgencyDrawerNavigator';
import ParentDrawerNavigator from './ParentDrawerNavigator';
import AdminDrawerNavigator from './AdminDrawerNavigator';

// Import surrogate screens
import SurrogateKyc from '../screens/SurrogateKyc';
import SurrogateKycDetails from '../screens/SurrogateKycDetails';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ userId, role, onLogout }) {
  if (!role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === 'SURROGATE' && (
        <>
          {/* Main Drawer (unchanged) */}
          <Stack.Screen name="SurrogateDrawer">
            {() => <SurrogateDrawerNavigator userId={userId} onLogout={onLogout} />}
          </Stack.Screen>

          {/* ✅ New: Surrogate KYC page */}
          <Stack.Screen
            name="SurrogateKyc"
            options={{ headerShown: false }}
          >
            {(props) => <SurrogateKyc {...props} userId={userId} />}
          </Stack.Screen>

          {/* ✅ New: Surrogate KYC Details page */}
          <Stack.Screen
            name="SurrogateKycDetails"
            component={SurrogateKycDetails}
            options={{ headerShown: true, title: 'Submitted KYC' }}
          />
        </>
      )}

      {role === 'DONOR' && (
        <Stack.Screen name="DonorDrawer">
          {() => <DonorDrawerNavigator userId={userId} onLogout={onLogout} />}
        </Stack.Screen>
      )}

      {role === 'AGENCY' && (
        <Stack.Screen name="AgencyDrawer">
          {() => <AgencyDrawerNavigator userId={userId} onLogout={onLogout} />}
        </Stack.Screen>
      )}

      {role === 'IP' && (
        <Stack.Screen name="ParentDrawer">
          {() => <ParentDrawerNavigator userId={userId} onLogout={onLogout} />}
        </Stack.Screen>
      )}

      {role === 'ADMIN' && (
        <Stack.Screen name="AdminDrawer">
          {() => <AdminDrawerNavigator userId={userId} onLogout={onLogout} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
