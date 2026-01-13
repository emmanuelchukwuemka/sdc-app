// screens/Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  // KeyboardAvoidingView, // removed
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function Login({ role, onLogin, onBack, onGoRegister, onGoForgetPassword }) {
  // Animation state
  const glow = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Continuous glow animation
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    glowAnimation.start();

    return () => {
      glowAnimation.stop();
    };
  }, []);

  // Auto-simulate login on mount
  // Auto-simulate login removed

  const [identifier, setIdentifier] = useState(''); // can be email OR username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');

  // Themed modal alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'info' | 'success' | 'error'
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    if (typeof alertOnConfirm === 'function') {
      alertOnConfirm();
    }
    setAlertVisible(false);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  const handleIdentifierChange = (text) => {
    setIdentifier(text);
    // Clear error when user starts typing
    if (identifierError) {
      setIdentifierError('');
    }
  };

  const handleLogin = async () => {
    // Validate email format if identifier contains '@'
    if (identifier.includes('@')) {
      const emailValidationError = validateEmailField(identifier);
      if (emailValidationError) {
        setIdentifierError(emailValidationError);
        return;
      }
    }
    setIdentifierError('');

    if (!identifier || !password) {
      showAlert('Error', 'Please enter your email/username and password.', 'error');
      return;
    }

    try {
      setLoading(true);

      let emailToUse = identifier;
      if (!identifier.includes('@')) {
        // Treat identifier as username → lookup email in users table
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('username', identifier)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error('No user found with that username. If you just registered, please log in using your email to complete setup.');
        }
        emailToUse = data.email;
      }

      // Use Supabase Auth signInWithPassword with email + password
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (loginErr) {
        // Handle unconfirmed email case for clarity
        const msg = loginErr.message || '';
        if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email_confirm')) {
          throw new Error('Your email is not confirmed yet. Please check your inbox for the confirmation link.');
        }
        throw loginErr;
      }

      const user = loginData.user;
      if (!user) throw new Error('Login failed, no user returned.');

      // Ensure profile exists (backfill for users created while confirmations were ON)
      try {
        const { data: profileRow, error: profileFetchErr } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (profileFetchErr) throw profileFetchErr;

        if (!profileRow) {
          const meta = user.user_metadata || {};
          const payload = {
            id: user.id,
            first_name: meta.first_name || null,
            middle_name: meta.middle_name || null,
            last_name: meta.last_name || null,
            email: user.email,
            username: meta.username || null,
            role: meta.role || role,
            status: 'active',
          };
          const { error: upsertErr } = await supabase
            .from('users')
            .upsert(payload, { onConflict: 'id' });
          if (upsertErr) throw upsertErr;
        }
      } catch (ensureErr) {
        // Non-fatal: we still proceed to fetch role; errors will surface then if needed
        console.log('ensureProfile warning:', ensureErr?.message || ensureErr);
      }

      // Fetch role from users table
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id, role, status')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) throw new Error('User profile not found.');

      // Check if user is active
      if (profile.status !== 'active') {
        throw new Error('Your account is not active. Please contact support.');
      }

      // Pass role + id to App.js
      // Fixed → always use Supabase Auth user.id
      onLogin(profile.role, user.id);
    } catch (err) {
      showAlert('Login failed', err.message || String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: '#16A34A' }]}>
      <SafeAreaView style={styles.safeContent}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraHeight={100}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Animated.View
                style={[
                  styles.logo,
                  {
                    transform: [{ scale: pulse }],
                    shadowOpacity: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.6]
                    }),
                    elevation: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 12]
                    })
                  }
                ]}
              >
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
                <Animated.View
                  style={[
                    styles.glow,
                    {
                      opacity: glow,
                      transform: [{
                        scale: glow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2]
                        })
                      }]
                    }
                  ]}
                />
              </Animated.View>
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.roleText}>Login as {role}</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign In</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, identifierError && styles.inputError]}
                placeholder="Email or Username"
                placeholderTextColor={GRAY}
                autoCapitalize="none"
                value={identifier}
                onChangeText={handleIdentifierChange}
              />
            </View>
            {identifierError ? (
              <Text style={styles.errorText}>{identifierError}</Text>
            ) : null}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={GRAY}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={GRAY}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onGoForgetPassword} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onGoRegister} style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerLink}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={BRAND_GREEN} style={styles.backIcon} />
            <Text style={styles.backText}>Back to Role Selection</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* Reusable Themed Alert Modal */}
      <AlertModal
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onConfirm={handleAlertConfirm}
        onRequestClose={handleAlertClose}
        brandColor={BRAND_GREEN}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#16A34A' },
  safeContent: { flex: 1, justifyContent: 'center' },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },

  // Form Styles
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },

  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },

  // Error Styles
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 16,
  },

  // Button Styles
  loginBtn: {
    backgroundColor: BRAND_GREEN,
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    fontSize: 18,
  },

  // Register Link
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    color: GRAY,
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    color: BRAND_GREEN,
    fontWeight: '700',
  },

  // Forgot Password Link
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: BRAND_GREEN,
    fontSize: 14,
    fontWeight: '600',
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
  },
  backIcon: {
    marginRight: 8,
  },
  backText: {
    color: BRAND_GREEN,
    fontWeight: '600',
    fontSize: 14,
  },
});
