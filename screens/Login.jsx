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
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';
import { validateEmailField } from '../utils/validation';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const LIGHT_BG = '#F8FAF9';
const DARK = '#111827';
const GRAY = '#6B7280';

export default function Login({ role, onLogin, onBack, onGoRegister, onGoForgetPassword }) {
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

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');

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

  const handleLogin = async () => {
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
        const { data, error } = await supabase
          .from('kyc_documents')
          .select('form_data->>email as email')
          .eq('form_data->>username', identifier)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error('No user found with that username.');
        }
        emailToUse = data.email;
      }

      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (loginErr) throw loginErr;
      const user = loginData.user;
      if (!user) throw new Error('Login failed.');

      const { data: profile, error: profileErr } = await supabase
        .from('kyc_documents')
        .select('role, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) throw new Error('Profile not found.');
      if (profile.status === 'rejected') throw new Error('Your account has been rejected. Please contact support.');

      onLogin(profile.role, user.id);
    } catch (err) {
      showAlert('Login failed', err.message || String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.main}>
      <LinearGradient
        colors={[BRAND_GREEN, SECONDARY_GREEN]}
        style={StyleSheet.absoluteFill}
      />

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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in as <Text style={styles.bold}>{role}</Text></Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Username</Text>
              <View style={[styles.inputContainer, identifierError && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={GRAY} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or username"
                  placeholderTextColor={GRAY}
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); setIdentifierError(''); }}
                />
              </View>
              {!!identifierError && <Text style={styles.error}>{identifierError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={GRAY} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={GRAY}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={GRAY} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={onGoForgetPassword} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onGoRegister}>
              <Text style={styles.secondaryBtnText}>
                New here? <Text style={styles.linkText}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backBtnText}>Change Role</Text>
          </TouchableOpacity>
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
  scroll: { padding: 30, flexGrow: 1, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 20,
    overflow: 'hidden'
  },
  logo: { width: '100%', height: '100%', borderRadius: 50 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  bold: { fontWeight: '900', color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 58,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, height: '100%', marginLeft: 10, color: DARK, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 5 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 13 },

  primaryBtn: {
    backgroundColor: BRAND_GREEN,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25, opacity: 0.3 },
  line: { flex: 1, height: 1, backgroundColor: GRAY },
  dividerText: { marginHorizontal: 15, color: GRAY, fontSize: 12, fontWeight: '700' },

  secondaryBtn: { alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, color: GRAY, fontWeight: '600' },
  linkText: { color: BRAND_GREEN, fontWeight: '900' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
