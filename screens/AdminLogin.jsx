// screens/AdminLogin.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AlertModal from '../components/AlertModal';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function AdminLogin({ onSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Credentials', 'Please enter both email and password.', 'error');
      return;
    }

    // Remove hardcoded credentials - use proper API authentication

    try {
      setLoading(true);

      // Use Flask API for admin login
      const loginResponse = await authAPI.login(email.trim(), password);
      
      // Check if user has admin role
      if (loginResponse.role === 'ADMIN') {
        showAlert('Success', 'Successfully logged in as administrator.', 'success', () => {
          if (onSuccess) {
            onSuccess({
              id: loginResponse.user_id,
              email: loginResponse.email,
              role: loginResponse.role,
              first_name: loginResponse.first_name,
              last_name: loginResponse.last_name
            });
          }
        });
      } else {
        // Not an admin
        await authAPI.logout();
        showAlert('Access Denied', 'This account does not have administrator privileges.', 'error');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      showAlert('Login Failed', err.message || 'Invalid credentials or insufficient privileges.', 'error');
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
              <View style={styles.logo}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </View>
            <Text style={styles.welcomeText}>Admin Access</Text>
            <Text style={styles.roleText}>Enter your admin credentials</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={GRAY}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={GRAY}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={GRAY}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={BRAND_GREEN} style={styles.backIcon} />
              <Text style={styles.backText}>Back to Role Selection</Text>
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
    textAlign: 'center',
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
  helperText: {
    fontSize: 12,
    color: GRAY,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
    lineHeight: 16,
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

  // Button Styles
  loginBtn: {
    backgroundColor: BRAND_GREEN,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    fontSize: 16,
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