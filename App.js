// App.js
import './config/env';
import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Removed Supabase import - using Flask API service instead
import { authAPI, userAPI, kycAPI } from './services/api';
import { useLocalhost, useMobileDev, getApiBaseUrl } from './services/api-config';

// Components
import SplashScreen from './components/SplashScreen';
import SurrogateTopBar from './components/SurrogateTopBar';
import AppNavigator from './components/AppNavigator'; // ✅ Surrogate combined stack+tabs

// Screens
import RoleSelection from './screens/RoleSelection';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgetPassword from './screens/ForgetPassword';
import PasswordResetConfirm from './screens/PasswordResetConfirm';
import AdminLogin from './screens/AdminLogin';

import KycSurrogate from './screens/KycSurrogate';
import KycDonor from './screens/KycDonor';
import DonorKycWizard from './screens/DonorKycWizard';
import KycIntendingParent from './screens/KycIntendingParent';
import KycAgency from './screens/KycAgency';

import AgencySubscription from './screens/AgencySubscription';
import Marketplace from './screens/Marketplace';
import Wallet from './screens/Wallet';
import Chat from './screens/Chat';
import Referral from './screens/Referral';

import AdminCommissions from './screens/AdminCommissions';
import AdminContracts from './screens/AdminContracts';
import AdminConsole from './screens/AdminConsole';
import AdminFinance from './screens/AdminFinance';
import AdminBadges from './screens/AdminBadges';
import AdminDisputes from './screens/AdminDisputes';
import AdminReports from './screens/AdminReports';
import AdminAgencies from './screens/AdminAgencies';
import AgencyDashboard from './screens/AgencyDashboard';
import Profile from './screens/Profile';
import Favorites from './screens/Favorites';
import Notifications from './screens/Notifications';

// ✅ New: import IP dashboard
import IpDashboard from './screens/IpDashboard';
import IpDrawerNavigator from './components/IpDrawerNavigator';
import SurrogateDrawerNavigator from './components/SurrogateDrawerNavigator';
import DonorDrawerNavigator from './components/DonorDrawerNavigator';
import AgencyProfile from './screens/AgencyProfile';
import DonorProfile from './screens/DonorProfile';
import EditAgencyProfile from './screens/EditAgencyProfile';

const BRAND_GREEN = '#16A34A';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeFallback({ role = 'IP' }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Home</Text>
      <Text style={styles.fallbackText}>
        Welcome, {role} — your dashboard is in the next tab.
      </Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [kycChecked, setKycChecked] = useState(false); // Start false to ensure we check
  const [kycApproved, setKycApproved] = useState(false); // Start false

  // Debug utility - uncomment to switch API configuration
  // useEffect(() => {
  //   // For mobile device testing, uncomment the line below:
  //   // useMobileDev(); // Uses your computer's IP: 10.195.159.131:5000
  //   
  //   // For localhost/web testing, uncomment the line below:
  //   // useLocalhost(); // Uses localhost:5000
  //   
  //   console.log('Current API URL:', getApiBaseUrl());
  // }, []);

  const [subscription, setSubscription] = useState(null);
  const [adminView, setAdminView] = useState('commissions');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Auto-login on app start
  // Auto-login / Session Check on app start
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if we have a stored auth token
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Fetch current user profile
          const profile = await authAPI.getCurrentUser();
          if (profile) {
            await handleLoginSuccess(profile);
          }
        }
      } catch (e) {
        console.log('Session check error:', e);
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
    };
    initSession();
  }, []);

  const handleSplashDone = useCallback(() => setReady(true), []);

  // Handle deep link for password reset
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      if (url.includes('reset-password')) {
        const urlObj = new URL(url);
        const accessToken = urlObj.searchParams.get('access_token');
        const tokenType = urlObj.searchParams.get('token_type');
        if (accessToken && tokenType === 'bearer') {
          setResetToken(accessToken);
          setShowPasswordResetConfirm(true);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('reset-password')) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription?.remove?.();
  }, []);

  // After successful login
  const handleLoginSuccess = async (profile) => {
    setUser(profile);
    setRole(profile.role);

    if (profile.role === 'ADMIN') return;

    // KYC check logic for authenticated users
    try {
      const kycStatus = await kycAPI.getStatus();
      if (kycStatus && (kycStatus.status === 'approved' || kycStatus.status === 'submitted')) {
        setKycApproved(true);
      } else {
        setKycApproved(false);
      }
    } catch (err) {
      console.log('KYC check error', err.message);
      setKycApproved(false);
    } finally {
      setKycChecked(true);
    }
  };

  // Auto-login function removed for V1 delivery

  let content;

  if (!ready) {
    content = <SplashScreen onDone={handleSplashDone} />;
  } else if (!role) {
    if (showAdminLogin) {
      content = (
        <AdminLogin
          onSuccess={(profile) => {
            setUser(profile);
            setRole(profile.role);
            setShowAdminLogin(false);
          }}
          onBack={() => {
            setShowAdminLogin(false);
          }}
        />
      );
    } else {
      content = (
        <RoleSelection onSelect={(selected) => {
          if (selected === 'ADMIN_LOGIN') {
            setShowAdminLogin(true);
          } else {
            setRole(selected);
          }
        }} />
      );
    }
  } else if (!user) {
    if (showPasswordResetConfirm) {
      content = (
        <PasswordResetConfirm
          route={{ params: { access_token: resetToken } }}
          onBack={() => {
            setShowPasswordResetConfirm(false);
            setResetToken(null);
          }}
        />
      );
    } else if (showForgetPassword) {
      content = (
        <ForgetPassword
          onBack={() => setShowForgetPassword(false)}
          onSuccess={() => setShowForgetPassword(false)}
        />
      );
    } else if (showRegister) {
      content = (
        <Register
          role={role}
          onSuccess={async (regUser) => {
            setShowRegister(false);
            if (regUser) {
              const profile = {
                id: regUser.id,
                user_id: regUser.id,
                role: regUser.role || role,
                email: regUser.email,
                first_name: regUser.first_name,
                last_name: regUser.last_name,
              };
              handleLoginSuccess(profile);
            }
          }}
          onBack={() => setShowRegister(false)}
        />
      );
    } else {
      content = (
        <Login
          role={role}
          onLogin={(roleArg, idArg) => handleLoginSuccess({ id: idArg, role: roleArg })}
          onGoRegister={() => setShowRegister(true)}
          onBack={() => setRole(null)}
          onGoForgetPassword={() => setShowForgetPassword(true)}
        />
      );
    }
  } else if (user.role === 'ADMIN') {
    if (adminView === 'contracts') {
      content = <AdminContracts onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'console') {
      content = <AdminConsole onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'finance') {
      content = <AdminFinance onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'badges') {
      content = <AdminBadges onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'disputes') {
      content = <AdminDisputes onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'reports') {
      content = <AdminReports onBack={() => setAdminView('commissions')} />;
    } else if (adminView === 'agencies') {
      content = (
        <AdminAgencies
          onBack={() => setAdminView('commissions')}
          onOpenAgency={(agencyId) => setAdminView({ mode: 'agencyDashboard', agencyId })}
        />
      );
    } else if (typeof adminView === 'object' && adminView.mode === 'agencyDashboard') {
      content = (
        <AgencyDashboard
          agencyId={adminView.agencyId}
          onBack={() => setAdminView('agencies')}
        />
      );
    } else {
      content = (
        <AdminCommissions
          onOpenContracts={() => setAdminView('contracts')}
          onOpenConsole={() => setAdminView('console')}
          onOpenFinance={() => setAdminView('finance')}
          onOpenBadges={() => setAdminView('badges')}
          onOpenDisputes={() => setAdminView('disputes')}
          onOpenReports={() => setAdminView('reports')}
          onOpenAgencies={() => setAdminView('agencies')}
          onLogout={async () => {
            setUser(null);
            setRole(null);
          }}
        />
      );
    }
  } else if (!kycChecked) {
    content = (
      <View style={styles.fallback}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
        <Text style={{ marginTop: 10, color: '#374151' }}>Checking your account status...</Text>
      </View>
    );
  } else if (!kycApproved) {
    const currentUserId = user?.id;
    if (user.role === 'SURROGATE') {
      content = <KycSurrogate userId={currentUserId} onSkip={() => setKycApproved(true)} onDone={async () => setKycApproved(true)} />;
    } else if (user.role === 'DONOR') {
      content = <KycDonor userId={currentUserId} onSkip={() => setKycApproved(true)} onDone={async () => setKycApproved(true)} />;
    } else if (user.role === 'IP') {
      content = <KycIntendingParent userId={currentUserId} onSkip={() => setKycApproved(true)} onDone={async () => setKycApproved(true)} />;
    } else if (user.role === 'AGENCY') {
      content = <KycAgency userId={currentUserId} onSkip={() => setKycApproved(true)} onDone={async () => setKycApproved(true)} />;
    }
  } else if (user.role === 'AGENCY' && !subscription) {
    content = <AgencySubscription 
      userId={user.id} 
      onSelect={(plan) => setSubscription(plan)} 
      onBack={() => { setUser(null); setRole(null); }} 
    />;
  } else if (user.role === 'AGENCY' && subscription) {
    content = (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AgencyDashboard">
            {(props) => (
              <AgencyDashboard
                {...props}
                agencyId={user.id}
                onBack={() => {
                  setUser(null);
                  setRole(null);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="AgencyProfile" component={AgencyProfile} />
          <Stack.Screen name="EditAgencyProfile" component={EditAgencyProfile} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } else if (user.role === 'SURROGATE' && kycApproved) {
    content = (
      <NavigationContainer>
        <SurrogateDrawerNavigator
          userId={user.id}
          onLogout={async () => {
            setUser(null);
            setRole(null);
            setKycApproved(false);
          }}
        />
      </NavigationContainer>
    );
  } else if (user.role === 'IP' && kycApproved) {
    content = (
      <NavigationContainer>
        <IpDrawerNavigator
          userId={user.id}
          onLogout={async () => {
            setUser(null);
            setRole(null);
          }}
        />
      </NavigationContainer>
    );
  } else if (user.role === 'DONOR' && kycApproved) {
    content = (
      <NavigationContainer>
        <DonorDrawerNavigator
          userId={user.id}
          onLogout={async () => {
            setUser(null);
            setRole(null);
            setKycApproved(false);
          }}
        />
      </NavigationContainer>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>{content}</View>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_GREEN,
    marginBottom: 8,
  },
  fallbackText: {
    color: '#374151',
    textAlign: 'center',
  },
});
