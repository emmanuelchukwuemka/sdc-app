// screens/Register.jsx
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
  Platform,
  Dimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const LIGHT_BG = '#F8FAF9';
const DARK = '#111827';
const GRAY = '#6B7280';

const InputField = ({ label, icon, value, onChange, placeholder, secure = false, error = '', showPassword, onTogglePassword, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, !!error && styles.inputError]}>
      <Ionicons name={icon} size={20} color={GRAY} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={GRAY}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure && !showPassword}
        {...props}
      />
      {secure && (
        <TouchableOpacity onPress={onTogglePassword}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY} />
        </TouchableOpacity>
      )}
    </View>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function Register({ role, onSuccess, onBack }) {
  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
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

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
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

      const { data: existing, error: checkErr } = await supabase
        .from('kyc_documents')
        .select('id')
        .or(`form_data->>email.eq.${email},form_data->>username.eq.${username}`)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('Email or username already registered.');
      }

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

      if (authErr) throw authErr;

      const { error: profileError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: authData.user.id,
          role: role,
          status: 'in_progress',
          form_data: {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            username: username,
            email: email,
            role: role
          },
          form_progress: 0
        });

      if (profileError) console.error('Profile creation warning:', profileError);

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (onSuccess) onSuccess(signInData.user);

    } catch (err) {
      showAlert('Registration Failed', err.message || 'Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.main}>
      <LinearGradient colors={[BRAND_GREEN, SECONDARY_GREEN]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="cover" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Joining as <Text style={styles.bold}>{role}</Text></Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField label="First Name *" icon="person-outline" value={firstName} onChange={setFirstName} placeholder="First" />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <InputField label="Last Name *" icon="person-outline" value={lastName} onChange={setLastName} placeholder="Last" />
              </View>
            </View>

            <InputField label="Middle Name" icon="person-outline" value={middleName} onChange={setMiddleName} placeholder="Optional" />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Account Information</Text>

            <InputField label="Username *" icon="at-outline" value={username} onChange={setUsername} placeholder="Unique username" autoCapitalize="none" />

            <InputField
              label="Email Address *"
              icon="mail-outline"
              value={email}
              onChange={(t) => { setEmail(t); setEmailError(''); }}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              error={emailError}
            />

            <InputField
              label="Password *"
              icon="lock-closed-outline"
              value={password}
              onChange={setPassword}
              placeholder="Enter password"
              secure
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Join Platform</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
              <Text style={styles.secondaryBtnText}>
                Already have an account? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </KeyboardAwareScrollView>
      </SafeAreaView>

      <AlertModal
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
        brandColor={BRAND_GREEN}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 25, flexGrow: 1 },

  header: { alignItems: 'center', marginBottom: 25, marginTop: 20 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 15,
    overflow: 'hidden'
  },
  logo: { width: '100%', height: '100%', borderRadius: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  bold: { fontWeight: '900', color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: DARK, marginBottom: 15, marginTop: 5 },
  row: { flexDirection: 'row' },

  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '800', color: GRAY, marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, height: '100%', marginLeft: 8, color: DARK, fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 5, marginLeft: 5 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

  primaryBtn: {
    backgroundColor: BRAND_GREEN,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  secondaryBtn: { alignItems: 'center', marginTop: 25 },
  secondaryBtnText: { fontSize: 14, color: GRAY, fontWeight: '600' },
  linkText: { color: BRAND_GREEN, fontWeight: '900' },
});
