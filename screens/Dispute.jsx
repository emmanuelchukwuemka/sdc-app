// screens/Dispute.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { disputesAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';

export default function Dispute({ route, navigation }) {
  const userId = route?.params?.userId;
  const [reason, setReason] = useState('');
  const [profileId, setProfileId] = useState(''); // optional reference (e.g., listing/profile)
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
    { id: 'tech', label: 'Technical', icon: 'hammer-outline' },
    { id: 'billing', label: 'Billing', icon: 'card-outline' },
    { id: 'report', label: 'Report', icon: 'flag-outline' },
  ];

  const submit = async () => {
    try {
      if (!userId) {
        Alert.alert('Not Signed In', 'We could not determine your user. Please relogin.');
        return;
      }
      const trimmed = reason.trim();
      if (!trimmed) {
        Alert.alert('Missing Description', 'Please provide a brief description of your issue.');
        return;
      }
      setSubmitting(true);
      const payload = {
        user_id: userId,
        reason: trimmed,
        status: 'open',
      };
      if (profileId.trim()) payload.profile_id = profileId.trim();

      await disputesAPI.submitDispute(payload);

      setReason('');
      setProfileId('');
      Alert.alert('Inquiry Submitted', 'Your report has been sent to our team. We will respond shortly.');
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert('Submission Failed', e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Support Header */}
          <LinearGradient
            colors={[BRAND_GREEN, SECONDARY_GREEN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support Center</Text>
            <Text style={styles.headerSubtitle}>How can we assist you today?</Text>

            <View style={styles.helpSearch}>
              <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.6)" />
              <Text style={styles.searchPlaceholder}>Search for help...</Text>
            </View>
          </LinearGradient>

          {/* Support Categories */}
          <View style={styles.categoryWrap}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={cat.icon} size={22} color={BRAND_GREEN} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Report Form */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={BRAND_GREEN} style={{ marginRight: 8 }} />
              <Text style={styles.formTitle}>Submit a Request</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile/Case ID (Optional)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="pricetag-outline" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={profileId}
                  onChangeText={setProfileId}
                  placeholder="e.g. #SDC-12345"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Describe the issue you're facing in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submit}
              disabled={submitting}
            >
              <LinearGradient
                colors={[BRAND_GREEN, SECONDARY_GREEN]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>Send Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
              <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.footerText}>Typically responds within 24 hours</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { paddingBottom: 40 },

  // Header
  headerCard: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: { marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 25 },
  helpSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: { color: 'rgba(255,255,255,0.6)', marginLeft: 10, fontWeight: '500' },

  // Categories
  categoryWrap: { paddingHorizontal: 24, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16, marginLeft: 2 },
  categoryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  categoryItem: { alignItems: 'center' },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  categoryLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Form
  formCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  formTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 2 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  textarea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    height: 140,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    textAlignVertical: 'top',
  },

  submitBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
});