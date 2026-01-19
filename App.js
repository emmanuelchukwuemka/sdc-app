// App.js
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
      if (kycStatus && (kycStatus.status === 'approved' || (kycStatus.form_progress ?? 0) >= 100)) {
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

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SplashScreen onDone={handleSplashDone} />
      </SafeAreaProvider>
    );
  }

  if (!role) {
    if (showAdminLogin) {
      return (
        <SafeAreaProvider>
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
        </SafeAreaProvider>
      );
    }
    return (
      <SafeAreaProvider>
        <RoleSelection onSelect={(selected) => {
          if (selected === 'ADMIN_LOGIN') {
            setShowAdminLogin(true);
          } else {
            setRole(selected);
          }
        }} />
      </SafeAreaProvider>
    );
  }

  if (!user) {
    // This shouldn't happen due to auto-login, but keeping for safety
    if (showPasswordResetConfirm) {
      return (
        <SafeAreaProvider>
          <PasswordResetConfirm
            route={{ params: { access_token: resetToken } }}
            onBack={() => {
              setShowPasswordResetConfirm(false);
              setResetToken(null);
            }}
          />
        </SafeAreaProvider>
      );
    }
    if (showForgetPassword) {
      return (
        <SafeAreaProvider>
          <ForgetPassword
            onBack={() => setShowForgetPassword(false)}
            onSuccess={() => setShowForgetPassword(false)}
          />
        </SafeAreaProvider>
      );
    }
    if (showRegister) {
      return (
        <SafeAreaProvider>
          <Register
            role={role}
            onSuccess={async (user) => {
              setShowRegister(false);
              if (user) {
                // Auto-login after registration
                // Fetch the complete profile from database
                // Profile data now comes from registration/login flow
                const profile = null;
                const error = null;

                if (profile && !error) {
                  // Extract profile data from form_data
                  const completeProfile = {
                    id: profile.id,
                    role: profile.role,
                    first_name: profile.form_data?.first_name,
                    last_name: profile.form_data?.last_name,
                    username: profile.form_data?.username,
                    email: profile.form_data?.email
                  };
                  handleLoginSuccess(completeProfile);
                } else {
                  // Fallback to user metadata if database fetch fails
                  const fallbackProfile = {
                    id: user.id,
                    role: role,
                    first_name: user.user_metadata?.first_name,
                    last_name: user.user_metadata?.last_name,
                    username: user.user_metadata?.username,
                    email: user.email
                  };
                  handleLoginSuccess(fallbackProfile);
                }
              }
            }}
            onBack={() => setShowRegister(false)}
          />
        </SafeAreaProvider>
      );
    }

    return (
      <SafeAreaProvider>
        <Login
          role={role}
          onLogin={(roleArg, idArg) => handleLoginSuccess({ id: idArg, role: roleArg })}
          onGoRegister={() => setShowRegister(true)}
          onBack={() => setRole(null)}
          onGoForgetPassword={() => setShowForgetPassword(true)}
        />
      </SafeAreaProvider>
    );
  }

  // ADMIN FLOW (unchanged)
  if (user.role === 'ADMIN') {
    if (adminView === 'contracts')
      return (
        <SafeAreaProvider>
          <AdminContracts onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'console')
      return (
        <SafeAreaProvider>
          <AdminConsole onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'finance')
      return (
        <SafeAreaProvider>
          <AdminFinance onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'badges')
      return (
        <SafeAreaProvider>
          <AdminBadges onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'disputes')
      return (
        <SafeAreaProvider>
          <AdminDisputes onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'reports')
      return (
        <SafeAreaProvider>
          <AdminReports onBack={() => setAdminView('commissions')} />
        </SafeAreaProvider>
      );
    if (adminView === 'agencies')
      return (
        <SafeAreaProvider>
          <AdminAgencies
            onBack={() => setAdminView('commissions')}
            onOpenAgency={(agencyId) => setAdminView({ mode: 'agencyDashboard', agencyId })}
          />
        </SafeAreaProvider>
      );
    if (typeof adminView === 'object' && adminView.mode === 'agencyDashboard')
      return (
        <SafeAreaProvider>
          <AgencyDashboard
            agencyId={adminView.agencyId}
            onBack={() => setAdminView('agencies')}
          />
        </SafeAreaProvider>
      );

    return (
      <SafeAreaProvider>
        <AdminCommissions
          onOpenContracts={() => setAdminView('contracts')}
          onOpenConsole={() => setAdminView('console')}
          onOpenFinance={() => setAdminView('finance')}
          onOpenBadges={() => setAdminView('badges')}
          onOpenDisputes={() => setAdminView('disputes')}
          onOpenReports={() => setAdminView('reports')}
          onOpenAgencies={() => setAdminView('agencies')}
          onLogout={async () => {
            try {
              // Skip actual logout since we're bypassing auth for non-admin
              // await supabase.auth.signOut();
            } catch (e) {
              console.log('Logout error', e?.message || e);
            } finally {
              // Reset to null to show role selection
              setUser(null);
              setRole(null);
              // Logout handled by state management
            }
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Show loading until KYC check completes
  if (!kycChecked) {
    return (
      <SafeAreaProvider>
        <View style={styles.fallback}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={{ marginTop: 10, color: '#374151' }}>
            Checking your account status...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Role-based KYC flow
  if (!kycApproved) {
    const currentUserId = user?.id;
    if (user.role === 'SURROGATE') {
      return (
        <SafeAreaProvider>
          <KycSurrogate
            userId={currentUserId}
            onSkip={() => setKycApproved(true)}
            onDone={async () => {
              // KYC completion handled by API service
              setKycApproved(true);
            }}
          />
        </SafeAreaProvider>
      );
    }
    if (user.role === 'DONOR') {
      return (
        <SafeAreaProvider>
          <KycDonor
            userId={currentUserId}
            onSkip={() => setKycApproved(true)}
            onDone={async () => {
              // KYC completion handled by API service
              setKycApproved(true);
            }}
          />
        </SafeAreaProvider>
      );
    }
    if (user.role === 'IP') {
      return (
        <SafeAreaProvider>
          <KycIntendingParent
            userId={currentUserId}
            onSkip={() => setKycApproved(true)}
            onDone={async () => {
              // KYC completion handled by API service
              // ✅ IP now goes to IpDashboard after KYC
              setKycApproved(true);
            }}
          />
        </SafeAreaProvider>
      );
    }
    if (user.role === 'AGENCY') {
      return (
        <SafeAreaProvider>
          <KycAgency
            userId={currentUserId}
            onSkip={() => setKycApproved(true)}
            onDone={async () => {
              // KYC completion handled by API service
              setKycApproved(true);
            }}
          />
        </SafeAreaProvider>
      );
    }
  }

  // Agency subscription gate (after KYC complete)
  if (user.role === 'AGENCY' && !subscription) {
    return (
      <SafeAreaProvider>
        <AgencySubscription
          userId={user.id}
          onSelect={(plan) => setSubscription(plan)}
        />
      </SafeAreaProvider>
    );
  }

  if (user.role === 'AGENCY' && subscription) {
    return (
      <SafeAreaProvider>
        <AgencyDashboard
          agencyId={user.id}
          onBack={() => {
            setUser(null);
            setRole(null);
          }}
        />
      </SafeAreaProvider>
    );
  }

  const currentUserId = user?.id;

  // ✅ Surrogate Flow (uses SurrogateDrawerNavigator directly)
  if (user.role === 'SURROGATE' && kycApproved) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <SurrogateDrawerNavigator
            userId={currentUserId}
            onLogout={async () => {
              try {
                // Skip actual logout since we're bypassing auth for non-admin
                // await supabase.auth.signOut();
              } catch (e) {
                console.log('Logout error', e?.message || e);
              } finally {
                // Reset to null to show role selection
                setUser(null);
                setRole(null);
                setKycApproved(false); // Reset KYC too if they logout
                // Only sign out if it's a real authenticated user (admin)
                if (user?.role === 'ADMIN') {
                  await supabase.auth.signOut();
                }
              }
            }}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  // Non-surrogate main flow (Donor, IP)
  if (user.role === 'IP' && kycApproved) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <IpDrawerNavigator
            userId={currentUserId}
            onLogout={async () => {
              try {
                // Skip actual logout since we're bypassing auth for non-admin
                // await supabase.auth.signOut();
              } catch (e) {
                console.log('Logout error', e?.message || e);
              } finally {
                // Reset to null to show role selection
                setUser(null);
                setRole(null);
                // Only sign out if it's a real authenticated user (admin)
                if (user?.role === 'ADMIN') {
                  await supabase.auth.signOut();
                }
              }
            }}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (user.role === 'DONOR' && kycApproved) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DonorTabs">
              {() => (
                <Tab.Navigator
                  screenOptions={({ route }) => ({
                    tabBarActiveTintColor: BRAND_GREEN,
                    tabBarInactiveTintColor: '#9CA3AF',
                    tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
                    tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
                    tabBarIcon: ({ color, focused }) => {
                      let name = 'ellipse';
                      switch (route.name) {
                        case 'Home':
                          name = focused ? 'home' : 'home-outline';
                          break;
                        case 'Dashboard':
                          name = focused ? 'speedometer' : 'speedometer-outline';
                          break;
                        case 'Wallet':
                          name = focused ? 'card' : 'card-outline';
                          break;
                        case 'Chat':
                          name = focused ? 'chatbubbles' : 'chatbubbles-outline';
                          break;
                      }
                      return <Ionicons name={name} size={22} color={color} />;
                    },
                  })}
                  initialRouteName="Dashboard"
                >
                  <Tab.Screen
                    name="Home"
                    component={Marketplace}
                    options={{ title: 'Market' }}
                    initialParams={{ userId: currentUserId }}
                  />

                  <Tab.Screen
                    name="Dashboard"
                    component={require('./screens/DonorDashboard').default}
                    options={{
                      title: 'Dashboard',
                      headerRight: () => (
                        <Ionicons
                          name="log-out-outline"
                          size={24}
                          color={BRAND_GREEN}
                          style={{ marginRight: 10 }}
                          onPress={() => {
                            // Trigger logout function
                            try {
                              setUser(null);
                              setRole(null);
                              if (user?.role === 'ADMIN') {
                                // Logout handled by state management
                              }
                            } catch (e) {
                              console.log('Logout error', e?.message || e);
                            }
                          }}
                        />
                      )
                    }}
                    initialParams={{ role: user.role, userId: currentUserId }}
                  />

                  <Tab.Screen name="Wallet" options={{ title: 'Wallet' }}>
                    {({ navigation }) => (
                      <Wallet userId={currentUserId} onBack={() => navigation.goBack()} />
                    )}
                  </Tab.Screen>

                  <Tab.Screen name="Chat" options={{ title: 'Chat' }}>
                    {({ navigation }) => (
                      <Chat
                        userId={currentUserId}
                        onBack={() => navigation.goBack()}
                        conversationId="dddddddd-dddd-dddd-dddd-dddddddddddd"
                      />
                    )}
                  </Tab.Screen>
                </Tab.Navigator>
              )}
            </Stack.Screen>

            {/* Screens accessible from Dashboard */}
            <Stack.Screen name="DonorKycWizard" component={DonorKycWizard} />
            <Stack.Screen name="Profile">
              {(props) => (
                <Profile
                  {...props}
                  onLogout={() => {
                    setUser(null);
                    setRole(null);
                    setKycApproved(false);
                    // Logout handled by state management
                  }}
                />
              )}
            </Stack.Screen>

          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }
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
