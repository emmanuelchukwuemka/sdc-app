import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../services/api';
import AlertModal from '../components/AlertModal';

// Constants
const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#9CA3AF';

export default function PasswordResetConfirm({ route }) {
  const navigation = useNavigation();

  // Extract access token from route params (from deep link)
  const accessToken = route?.params?.access_token;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    if (alertType === 'success') {
      navigation.navigate('Login');
    }
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handlePasswordChange = (text) => {
    setNewPassword(text);
    setPasswordError(validatePassword(text));
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (text !== newPassword) {
      setConfirmError('Passwords do not match');
    } else {
      setConfirmError('');
    }
  };

  const handleResetPassword = async () => {
    // Validate inputs
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    if (!accessToken) {
      showAlert('Error', 'Invalid reset link. Please request a new password reset email.', 'error');
      return;
    }

    try {
      setLoading(true);

      // Update password via Flask API
      await authAPI.updatePassword(newPassword);

      // Success
      showAlert(
        'Password Reset Successful',
        'Your password has been successfully updated. You can now log in with your new password.',
        'success'
      );

    } catch (err) {
      showAlert('Reset Failed', err.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.safe, { backgroundColor: BRAND_GREEN }]}>
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
              <Text style={styles.title}>Set New Password</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>
              Enter your new password below. Make sure it's at least 6 characters long.
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={[styles.input, passwordError && styles.inputError]}
                placeholder="Enter new password"
                placeholderTextColor={GRAY}
                value={newPassword}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
              />
              {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, confirmError && styles.inputError]}
                placeholder="Confirm new password"
                placeholderTextColor={GRAY}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
              />
              {confirmError && <Text style={styles.errorText}>{confirmError}</Text>}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backToLoginContainer}>
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