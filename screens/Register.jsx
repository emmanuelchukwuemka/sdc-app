// screens/Register.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function Register({ role, onSuccess, onBack }) {
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
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

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

  const handleEmailChange = (text) => {
    setEmail(text);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleRegister = async () => {
    // Validate email format
    const emailValidationError = validateEmailField(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    setEmailError('');

    if (!firstName || !lastName || !username || !email || !password) {
      showAlert('Missing Information', 'Please fill in all required fields.', 'error');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create Auth user with metadata (email confirmation enabled)
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            username,
            role,
          },
        },
      });
      if (authErr) {
        if (authErr.message.includes('duplicate key')) {
          throw new Error('This account already exists. Try logging in instead.');
        }
        throw authErr;
      }

      // With email confirmations ON, a session is not established and RLS may block client inserts.
      // We defer profile creation until after first confirmed login.
      // Replacing alert with onVerify navigation
      setAlertVisible(false);
      if (onSuccess) {
        // Pass email to onSuccess to navigate to verify screen
        onSuccess(email);
      }
    } catch (err) {
      console.error('Registration error:', err);

      // Check for duplicate email or username errors and provide user-friendly messages
      let errorMessage = 'Please try again.';

      if (err.message && err.message.includes('duplicate key value')) {
        if (err.message.includes('users_email_key')) {
          errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
        } else if (err.message.includes('users_username_key')) {
          errorMessage = 'This username is already taken. Please choose a different username.';
        } else {
          errorMessage = 'This account information is already in use. Please check your email and username.';
        }
      } else {
        errorMessage = err.message || 'Please try again.';
      }

      showAlert('Registration Failed', errorMessage, 'error');
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
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.roleText}>Register as {role}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name *"
                placeholderTextColor={GRAY}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Middle Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Middle Name"
                placeholderTextColor={GRAY}
                value={middleName}
                onChangeText={setMiddleName}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name *"
                placeholderTextColor={GRAY}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username *"
                placeholderTextColor={GRAY}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Email *"
                placeholderTextColor={GRAY}
                autoCapitalize="none"
                value={email}
                onChangeText={handleEmailChange}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Password *"
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
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={BRAND_GREEN} style={styles.backIcon} />
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>

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
      </SafeAreaView>
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
  },

  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
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
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  logoIcon: {
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
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
    padding: 8,
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
  registerBtn: {
    backgroundColor: BRAND_GREEN,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    fontSize: 16
  },

  // Back Button Styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backIcon: {
    marginRight: 8,
  },
  backText: {
    color: BRAND_GREEN,
    fontWeight: '600',
    fontSize: 16,
  },
});
