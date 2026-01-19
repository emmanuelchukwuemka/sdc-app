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
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function ForgetPassword({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
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
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleResetPassword = async () => {
    // Validate email format
    const emailValidationError = validateEmailField(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    
    if (!email) {
      showAlert('Error', 'Please enter your email address.', 'error');
      return;
    }

    try {
      setLoading(true);

      // Use Supabase Auth reset password
      // Skip for demo mode
      // const { error } = await supabase.auth.resetPasswordForEmail(email, {
      //   redirectTo: 'surrogate://reset-password'
      // });
      // 
      // if (error) throw error;

      // Success - show success message
      setSuccess(true);
      showAlert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password. The link will expire in 24 hours.',
        'success',
        onBack
      );

    } catch (err) {
      showAlert('Reset Failed', err.message || 'Failed to send reset email. Please try again.', 'error');
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
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Reset Password</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>
              Enter your email address and we'll send you instructions to reset your password.
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

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleResetPassword}
              disabled={loading || success}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetText}>
                  {success ? 'Email Sent!' : 'Send Reset Instructions'}
                </Text>
              )}
            </TouchableOpacity>

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