// components/SurrogateNavigator.jsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, View, Animated } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import SurrogateTopBar from './SurrogateTopBar';

// Screens

import Referral from '../screens/Referral';
import Dispute from '../screens/Dispute';
import SurrogateDashboard from '../screens/SurrogateDashboard';
import Chat from '../screens/Chat';
import SurrogateConnect from '../screens/SurrogateConnect';

const Tab = createBottomTabNavigator();
const BRAND_GREEN = '#16A34A';

export default function SurrogateNavigator({ userId, role = 'SURROGATE', onLogout }) {
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(BRAND_GREEN).catch(() => {});
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }} edges={['bottom', 'left', 'right']}>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerShown: true,
          header: (props) => (
            <SurrogateTopBar
              {...props}
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
            backgroundColor: BRAND_GREEN,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.2)', // subtle line
          },
          tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginBottom: 2 },
          tabBarIcon: ({ color, focused }) => {
            let name = 'ellipse-outline';
            switch (route.name) {
              case 'Connect':
                name = focused ? 'people' : 'people-outline';
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
              case 'Support':
                name = focused ? 'alert-circle' : 'alert-circle-outline';
                break;
            }

            // Ripple animation
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
          name="Connect"
          options={{ title: 'Connect' }}
        >
          {() => <SurrogateConnect userId={userId} />}
        </Tab.Screen>
        <Tab.Screen
          name="Dashboard"
          component={SurrogateDashboard}
          options={{ title: 'Dashboard' }}
          initialParams={{ role, userId }}
        />

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

        <Tab.Screen
          name="Support"
          component={Dispute}
          options={{ title: 'Support' }}
          initialParams={{ userId, role }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
