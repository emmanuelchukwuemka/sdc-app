// App.js
import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { supabase } from './lib/supabase';

// Components
import SplashScreen from './components/SplashScreen';
import SurrogateTopBar from './components/SurrogateTopBar';
import AppNavigator from './components/AppNavigator'; // ✅ Surrogate combined stack+tabs

// Screens
import RoleSelection from './screens/RoleSelection';
import Login from './screens/Login';
import Register from './screens/Register';
import VerifyEmail from './screens/VerifyEmail';
import ForgetPassword from './screens/ForgetPassword';
import PasswordResetConfirm from './screens/PasswordResetConfirm';

import KycSurrogate from './screens/KycSurrogate';
import KycDonor from './screens/KycDonor';
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

const BRAND_GREEN = '#16A34A';
const Tab = createBottomTabNavigator();

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

  const [subscription, setSubscription] = useState(null);
  const [adminView, setAdminView] = useState('commissions');
  const [showRegister, setShowRegister] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // Auto-login on app start
  // Auto-login / Session Check on app start
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from DB to get role
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            await handleLoginSuccess(profile);
          }
        }
      } catch (e) {
        console.log('Session check error:', e);
      } finally {
        // Keep splash screen visible for at least 2s for branding
        // or let the splash animation finish calling onDone ?
        // actually, we set ready=true via onDone callback in JSX,
        // but we need to ensure we don't show login screen momentarily if session exists.

        // Wait for splash animation to call onDone.
        // But we can pre-load data here.
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

    try {
      const { data: kycRow, error } = await supabase
        .from('kyc_documents')
        .select('status, form_progress')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) throw error;

      if (kycRow && (kycRow.status === 'approved' || (kycRow.form_progress ?? 0) >= 100)) {
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
    return (
      <SafeAreaProvider>
        <RoleSelection onSelect={(selected) => setRole(selected)} />
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
            onSuccess={(email) => {
              setShowRegister(false);
              if (email) {
                setVerifyEmail(email);
                setShowVerify(true);
              }
            }}
            onBack={() => setShowRegister(false)}
          />
        </SafeAreaProvider>
      );
    }
    if (showVerify) {
      return (
        <SafeAreaProvider>
          <VerifyEmail
            email={verifyEmail}
            onSuccess={async (user) => {
              setShowVerify(false);
              setVerifyEmail('');

              if (user) {
                // Auto-login after verification
                // Refresh profile to be sure
                const { data: profile } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', user.id)
                  .single();

                if (profile) {
                  handleLoginSuccess(profile);
                } else {
                  // Fallback if profile create trigger is slow, use metadata
                  const meta = user.user_metadata || {};
                  handleLoginSuccess({
                    id: user.id,
                    role: meta.role || role,
                    ...meta
                  });
                }
              }
            }}
            onBack={() => setShowVerify(false)}
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
              await supabase
                .from('kyc_documents')
                .update({ form_progress: 100, status: 'submitted' })
                .eq('user_id', currentUserId);
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
              await supabase
                .from('kyc_documents')
                .update({ form_progress: 100, status: 'submitted' })
                .eq('user_id', currentUserId);
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
              await supabase
                .from('kyc_documents')
                .update({ form_progress: 100, status: 'submitted' })
                .eq('user_id', currentUserId);
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
              await supabase
                .from('kyc_documents')
                .update({ form_progress: 100, status: 'submitted' })
                .eq('user_id', currentUserId);
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

  // ✅ Surrogate Flow (uses AppNavigator)
  if (user.role === 'SURROGATE' && kycApproved) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator
            userId={currentUserId}
            role={user.role}
            onLogout={async () => {
              try {
                // Skip actual logout since we're bypassing auth
                // await supabase.auth.signOut();
              } catch (e) {
                console.log('Logout error', e?.message || e);
              } finally {
                // Reset to null to show role selection
                setUser(null);
                setRole(null);
                await supabase.auth.signOut();
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
                // Skip actual logout since we're bypassing auth
                // await supabase.auth.signOut();
              } catch (e) {
                console.log('Logout error', e?.message || e);
              } finally {
                // Reset to null to show role selection
                setUser(null);
                setRole(null);
                await supabase.auth.signOut();
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
              options={{ title: 'Dashboard' }}
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
                  conversationId="donor-chat"
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
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
