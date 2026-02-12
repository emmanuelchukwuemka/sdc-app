// screens/DonorKycWizard.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { kycAPI } from '../services/api';


const BRAND_GREEN = '#16A34A';
const BRAND_GREEN_LIGHT = '#ECFDF5';
const GRAY_TEXT = '#6B7280';
const DARK_TEXT = '#111827';
const BG_COLOR = '#F3F4F6';

const STEPS = ['Personal', 'Medical', 'Reproductive', 'ID', 'Referral', 'Emergency'];

// Reusable Input Component
const CustomInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
    />
  </View>
);

export default function DonorKycWizard({ userId, onFinish, onSkip, route, navigation }) {
  const currentUserId = userId || route?.params?.userId;
  const handleFinish = onFinish || (() => navigation?.goBack());
  const handleSkip = onSkip || (() => navigation?.goBack());

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const documents = await kycAPI.getKycDocuments();
        const data = documents.find(doc => doc.user_id === currentUserId) || null;

        if (data?.form_data) {
          setFormData(data.form_data);
        }
      } catch (e) {
        console.log("Error loading KYC data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserId]);

  const saveStep = async (final = false) => {
    setSaving(true);
    try {
      const payload = {
        user_id: currentUserId,
        role: 'DONOR',
        status: final ? 'submitted' : 'in_progress',
        form_data: formData,
      };

      await kycAPI.submitKycDocument(payload);

      if (final) {
        handleFinish?.();
      } else {
        if (step < STEPS.length - 1) setStep(step + 1);
      }
    } catch (e) {
      console.error('Save error', e);
      alert('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <CustomInput label="First Name" placeholder="e.g. Jane" value={formData.first_name || ''} onChangeText={(t) => setFormData({ ...formData, first_name: t })} />
            <CustomInput label="Last Name" placeholder="e.g. Doe" value={formData.last_name || ''} onChangeText={(t) => setFormData({ ...formData, last_name: t })} />
            <CustomInput label="Date of Birth" placeholder="YYYY-MM-DD" value={formData.dob || ''} onChangeText={(t) => setFormData({ ...formData, dob: t })} />
            <CustomInput label="Phone Number" placeholder="+1234567890" value={formData.phone || ''} onChangeText={(t) => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" />
            <CustomInput label="Nationality" placeholder="e.g. American" value={formData.nationality || ''} onChangeText={(t) => setFormData({ ...formData, nationality: t })} />
          </>
        );
      case 1:
        return (
          <>
            <CustomInput label="Blood Group" placeholder="e.g. O+" value={formData.blood_group || ''} onChangeText={(t) => setFormData({ ...formData, blood_group: t })} />
            <CustomInput label="Genotype" placeholder="e.g. AA" value={formData.genotype || ''} onChangeText={(t) => setFormData({ ...formData, genotype: t })} />
            <CustomInput label="Height" placeholder="e.g. 5'7" value={formData.height || ''} onChangeText={(t) => setFormData({ ...formData, height: t })} />
            <CustomInput label="Weight" placeholder="e.g. 60kg" value={formData.weight || ''} onChangeText={(t) => setFormData({ ...formData, weight: t })} />
            <CustomInput label="Eye Color" placeholder="e.g. Brown" value={formData.eye_color || ''} onChangeText={(t) => setFormData({ ...formData, eye_color: t })} />
          </>
        );
      case 2:
        return (
          <>
            <CustomInput label="Donated Before?" placeholder="Yes / No" value={formData.donated_before || ''} onChangeText={(t) => setFormData({ ...formData, donated_before: t })} />
            <CustomInput label="Number of Donations" placeholder="e.g. 0" value={formData.num_donations || ''} onChangeText={(t) => setFormData({ ...formData, num_donations: t })} keyboardType="numeric" />
            <CustomInput label="Known Medical Conditions" placeholder="e.g. None" value={formData.conditions || ''} onChangeText={(t) => setFormData({ ...formData, conditions: t })} />
          </>
        );
      case 3:
        return (
          <>
            <CustomInput label="ID Type" placeholder="Passport / Driver's License" value={formData.id_type || ''} onChangeText={(t) => setFormData({ ...formData, id_type: t })} />
            <CustomInput label="ID Number" placeholder="Enter ID Number" value={formData.id_number || ''} onChangeText={(t) => setFormData({ ...formData, id_number: t })} />
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={32} color={BRAND_GREEN} />
              <Text style={styles.uploadText}>Upload ID Document (Optional)</Text>
            </View>
          </>
        );
      case 4:
        return (
          <>
            <CustomInput label="Source of Referral" placeholder="e.g. Friend, Google, Doctor" value={formData.referral || ''} onChangeText={(t) => setFormData({ ...formData, referral: t })} />
          </>
        );
      case 5:
        return (
          <>
            <CustomInput label="Emergency Contact Name" placeholder="Full Name" value={formData.emergency_name || ''} onChangeText={(t) => setFormData({ ...formData, emergency_name: t })} />
            <CustomInput label="Emergency Contact Phone" placeholder="+1234..." value={formData.emergency_phone || ''} onChangeText={(t) => setFormData({ ...formData, emergency_phone: t })} keyboardType="phone-pad" />
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={DARK_TEXT} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Donor Application</Text>
            <Text style={styles.stepIndicator}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>{STEPS[step]}</Text>
            {renderStepContent()}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.btnRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)} disabled={saving}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, saving && { opacity: 0.7 }]}
              onPress={() => saveStep(step === STEPS.length - 1)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextBtnText}>
                  {step === STEPS.length - 1 ? 'Submit Application' : 'Next Step'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>Save & Exit</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_COLOR },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BG_COLOR,
  },
  headerTextContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: DARK_TEXT },
  stepIndicator: { fontSize: 12, color: GRAY_TEXT, marginTop: 4 },
  closeBtn: { padding: 4 },

  // Progress
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: BRAND_GREEN,
  },

  // Content
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_GREEN,
    marginBottom: 20,
  },

  // Inputs
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK_TEXT,
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginTop: 10
  },
  uploadText: {
    marginTop: 10,
    color: GRAY_TEXT,
    fontSize: 14
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipLinkText: {
    color: GRAY_TEXT,
    fontSize: 14,
    fontWeight: '500',
  }
});
