// screens/ForgetPassword.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function ForgetPassword({ onBack, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Themed modal alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
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
    if (emailError) setEmailError('');
  };

  const handleGetCode = async () => {
    console.log('--- ForgetPassword Step 1: Requesting Code ---');
    console.log('Email:', email);
    
    const emailValidationError = validateEmailField(email);
    if (emailValidationError) {
      console.log('Validation Error:', emailValidationError);
      setEmailError(emailValidationError);
      return;
    }

    if (!email) {
      showAlert('Error', 'Please enter your email address.', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling authAPI.resetPassword...');
      const response = await authAPI.resetPassword(email);
      console.log('API Response:', response);
      setStep(2);
      showAlert(
        'Code Sent',
        'A 6-digit reset code has been sent to your email. Please check your inbox.',
        'success'
      );
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      showAlert('Request Failed', err.response?.data?.msg || err.message || 'Failed to send reset code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    console.log('--- ForgetPassword Step 2: Resetting Password ---');
    console.log('Email:', email);
    console.log('Code:', code);
    
    if (!code || code.length !== 6) {
      console.log('Code Validation Error: Invalid code length');
      setCodeError('Please enter the 6-digit code');
      return;
    }
    if (newPassword.length < 6) {
      console.log('Password Validation Error: Too short');
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      console.log('Password Validation Error: Passwords do not match');
      setConfirmError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling authAPI.resetPasswordWithCode...');
      const response = await authAPI.resetPasswordWithCode(email, code, newPassword);
      console.log('API Response:', response);
      setSuccess(true);
      showAlert(
        'Success',
        'Your password has been reset successfully. You can now log in.',
        'success',
        onBack
      );
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      showAlert('Reset Failed', err.response?.data?.msg || err.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: '#16A34A' }]}>
      <SafeAreaView style={styles.safeContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 500 })}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={step === 1 ? onBack : () => setStep(1)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Reset Password</Text>
            </View>

            {step === 1 ? (
              <>
                {/* Instructions */}
                <Text style={styles.instructions}>
                  Enter your email address and we'll send you a 6-digit code to reset your password.
                </Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, emailError && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor={GRAY}
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                </View>

                {/* Get Code Button */}
                <TouchableOpacity
                  style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
                  onPress={handleGetCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#16A34A" />
                  ) : (
                    <Text style={styles.resetText}>Get Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Instructions */}
                <Text style={styles.instructions}>
                  Enter the 6-digit code sent to {email} and your new password.
                </Text>

                {/* Code Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Reset Code</Text>
                  <TextInput
                    style={[styles.input, codeError && styles.inputError]}
                    placeholder="6-digit code"
                    placeholderTextColor={GRAY}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (codeError) setCodeError('');
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {codeError && <Text style={styles.errorText}>{codeError}</Text>}
                </View>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={[styles.input, passwordError && styles.inputError]}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={GRAY}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    secureTextEntry
                  />
                  {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={[styles.input, confirmError && styles.inputError]}
                    placeholder="Confirm new password"
                    placeholderTextColor={GRAY}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmError) setConfirmError('');
                    }}
                    secureTextEntry
                  />
                  {confirmError && <Text style={styles.errorText}>{confirmError}</Text>}
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                  style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#16A34A" />
                  ) : (
                    <Text style={styles.resetText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Back to Login */}
            <TouchableOpacity onPress={onBack} style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>
                Remember your password? <Text style={styles.backToLoginLink}>Back to Login</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Alert Modal */}
        <AlertModal
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onConfirm={handleAlertConfirm}
          onClose={handleAlertClose}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  safeContent: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: ACCENT_WHITE,
  },
  instructions: {
    fontSize: 16,
    color: ACCENT_WHITE,
    marginBottom: 30,
    lineHeight: 22,
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_WHITE,
    marginBottom: 8,
  },
  input: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
    marginTop: 5,
  },
  resetBtn: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetBtnDisabled: {
    opacity: 0.6,
  },
  resetText: {
    color: BRAND_GREEN,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: ACCENT_WHITE,
    fontSize: 16,
  },
  backToLoginLink: {
    color: ACCENT_WHITE,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});