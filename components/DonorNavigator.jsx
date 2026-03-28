// components/DonorNavigator.jsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, View, Animated } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import SurrogateTopBar from './SurrogateTopBar'; // We can rename this later to a generic TopBar if needed

// Screens
import Referral from '../screens/Referral';
import Dispute from '../screens/Dispute';
import DonorDashboard from '../screens/DonorDashboard';
import Chat from '../screens/Chat';
import Marketplace from '../screens/Marketplace';

const Tab = createBottomTabNavigator();
const BRAND_GREEN_DARK = '#15803D';

export default function DonorNavigator({ userId, role = 'DONOR', onLogout }) {
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(BRAND_GREEN_DARK).catch(() => {});
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN_DARK }} edges={['bottom', 'left', 'right']}>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerShown: true,
          header: (props) => (
            <SurrogateTopBar
              {...props}
              role={role}
              onLogout={onLogout}
              onOpenProfile={() =>
                navigation.navigate('My Profile', { userId, role })
              }
            />
          ),
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
          tabBarStyle: {
            height: 70,
            backgroundColor: BRAND_GREEN_DARK,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.2)',
          },
          tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginBottom: 2 },
          tabBarIcon: ({ color, focused }) => {
            let name = 'ellipse-outline';
            switch (route.name) {
              case 'Market':
                name = focused ? 'search' : 'search-outline';
                break;
              case 'Dashboard':
                name = focused ? 'speedometer' : 'speedometer-outline';
                break;
              case 'Earn':
                name = focused ? 'cash' : 'cash-outline';
                break;
              case 'Chat':
                name = focused ? 'chatbubbles' : 'chatbubbles-outline';
                break;
            }

            const rippleScale = React.useRef(new Animated.Value(0)).current;
            const rippleOpacity = React.useRef(new Animated.Value(0)).current;

            React.useEffect(() => {
              if (focused) {
                rippleScale.setValue(0);
                rippleOpacity.setValue(0.4);

                Animated.parallel([
                  Animated.timing(rippleScale, {
                    toValue: 1.8,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                  Animated.timing(rippleOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            }, [focused]);

            return (
              <View style={{ alignItems: 'center', justifyContent: 'center', height: 40, width: 40 }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  }}
                />
                <Ionicons name={name} size={24} color={color} />
              </View>
            );
          },
        })}
        initialRouteName="Dashboard"
      >
        <Tab.Screen
          name="Dashboard"
          component={DonorDashboard}
          options={{ title: 'Dashboard' }}
          initialParams={{ role, userId }}
        />

        <Tab.Screen
          name="Market"
          options={{ title: 'Market' }}
        >
          {({ navigation }) => <Marketplace userId={userId} navigation={navigation} />}
        </Tab.Screen>

        <Tab.Screen name="Earn" options={{ title: 'Earn' }}>
          {({ navigation }) => (
            <Referral userId={userId} onBack={() => navigation.goBack()} />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{ title: 'Chat' }}
          initialParams={{ userId, role }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
