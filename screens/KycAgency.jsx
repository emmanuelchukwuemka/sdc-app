// screens/KycAgency.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAF9';

const STEPS = [
  'Agency Details',
  'Operational Info',
  'Legal & Compliance',
  'Representative ID',
  'Referral',
  'Emergency Contacts',
];

export default function KycAgency({
  userId,
  onSkip = () => { },
  onDone = () => { },
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [form, setForm] = useState({
    role: 'AGENCY',
    details: {
      agency_name: '',
      registration_number: '',
      incorporation_date: '',
      org_type: '',
      primary_contact_name: '',
      primary_contact_title: '',
      phone1: '',
      phone2: '',
      official_email: '',
      website: '',
      hq_address: '',
      branch_offices: '',
    },
    ops: {
      service_surrogacy: false,
      service_egg_donation: false,
      service_sperm_donation: false,
      service_ivf_support: false,
      service_legal: false,
      service_counseling: false,
      service_other_text: '',
      staff_count: '',
      active_surrogates_count: '',
      active_donors_count: '',
      matched_ip_count: '',
      partner_clinics: '',
      years_experience: '',
    },
    compliance: {
      tin: '',
      insurance_has: null,
      insurance_details: '',
      proof_registration_url: '',
      operating_license_url: '',
    },
    representative_id: {
      passport: false,
      drivers_license: false,
      national_id: false,
      voters_card: false,
      company_id: false,
      representative_id_urls: [],
    },
    referral: {
      source_staff: false,
      source_partner_clinic: false,
      source_friend: false,
      source_website: false,
      source_facebook: false,
      source_instagram: false,
      source_whatsapp: false,
      source_linkedin: false,
      source_twitter: false,
      source_ngo: false,
      source_other: '',
    },
    emergency: {
      name1: '',
      designation1: '',
      phone1: '',
      email1: '',
      name2: '',
      designation2: '',
      phone2: '',
      email2: '',
    },
  });

  const stepsCount = STEPS.length;

  const stepCompleted = useMemo(() => {
    const nonEmpty = (v) => String(v || '').trim().length > 0;

    const s1 = Object.values(form.details).some((v) => nonEmpty(v));
    const s2 =
      form.ops.service_surrogacy ||
      form.ops.service_egg_donation ||
      form.ops.service_sperm_donation ||
      form.ops.service_ivf_support ||
      form.ops.service_legal ||
      form.ops.service_counseling ||
      nonEmpty(form.ops.service_other_text) ||
      nonEmpty(form.ops.staff_count);

    const s3 = nonEmpty(form.compliance.tin) || (form.compliance.proof_registration_url || '').length > 0;
    const s4 = (form.representative_id.representative_id_urls || []).length > 0;
    const s5 = Object.values(form.referral).some(v => v === true) || nonEmpty(form.referral.source_other);
    const s6 = nonEmpty(form.emergency.name1) || nonEmpty(form.emergency.phone1);

    return [s1, s2, s3, s4, s5, s6];
  }, [form]);

  const completedCount = stepCompleted.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / stepsCount) * 100);

  const mergeForm = (path, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });
  };

  const pickAndUpload = async (saveToPathArray) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Photo access required for uploads.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (res.canceled || !res.assets?.[0]) return;

    try {
      const asset = res.assets[0];
      const resp = await fetch(asset.uri);
      const arrayBuffer = await resp.arrayBuffer();
      const path = `kyc/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

      const up = await supabase.storage.from('kyc').upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
      });
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from('kyc').getPublicUrl(path);
      const publicUrl = pub?.publicUrl || '';

      setForm((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        let ref = next;
        for (let i = 0; i < saveToPathArray.length - 1; i++) {
          ref = ref[saveToPathArray[i]];
        }
        const last = saveToPathArray[saveToPathArray.length - 1];
        if (Array.isArray(ref[last])) {
          ref[last] = [...ref[last], publicUrl];
        } else {
          ref[last] = publicUrl;
        }
        return next;
      });
    } catch (e) {
      alert('Upload failed: ' + e.message);
    }
  };

  const saveStep = useCallback(
    async (finalize = false) => {
      try {
        setSaving(true);
        const status = (finalize || progressPercent === 100) ? 'submitted' : 'in_progress';

        const { error } = await supabase.from('kyc_documents').upsert({
          user_id: userId,
          role: 'AGENCY',
          status,
          form_data: form,
          form_progress: progressPercent,
        }, { onConflict: 'user_id' });

        if (error) throw error;
        if (finalize || progressPercent === 100) onDone();
      } catch (e) {
        console.error('KYC save error:', e.message);
      } finally {
        setSaving(false);
      }
    },
    [form, progressPercent, userId, onDone]
  );

  const loadExisting = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('form_data, form_progress, status')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (data?.form_data) {
        setForm(prev => ({ ...prev, ...data.form_data }));
      }
      if (data?.status === 'approved' || data?.status === 'submitted') {
        // Option to skip if already done, but let's allow editing for now
      }
    } catch (e) {
      console.error('Loader error', e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const goNext = async () => {
    await saveStep(false);
    setStep((s) => Math.min(stepsCount - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const finishAll = async () => await saveStep(true);

  // Components
  const FormInput = ({ icon, placeholder, value, onChangeText, ...props }) => (
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={18} color={BRAND_GREEN} style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );

  const SelectPill = ({ label, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : null]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );

  // Steps
  const renderDetails = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Agency Basic Information</Text>
      <FormInput
        icon="business-outline"
        placeholder="Official Agency Name"
        value={form.details.agency_name}
        onChangeText={(t) => mergeForm(['details', 'agency_name'], t)}
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormInput
            icon="document-text-outline"
            placeholder="Reg. Number"
            value={form.details.registration_number}
            onChangeText={(t) => mergeForm(['details', 'registration_number'], t)}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <FormInput
            icon="calendar-outline"
            placeholder="Date (DD/MM/YY)"
            value={form.details.incorporation_date}
            onChangeText={(t) => mergeForm(['details', 'incorporation_date'], t)}
          />
        </View>
      </View>
      <FormInput
        icon="briefcase-outline"
        placeholder="Primary Contact Full Name"
        value={form.details.primary_contact_name}
        onChangeText={(t) => mergeForm(['details', 'primary_contact_name'], t)}
      />
      <FormInput
        icon="mail-outline"
        placeholder="Official Email Address"
        value={form.details.official_email}
        onChangeText={(t) => mergeForm(['details', 'official_email'], t)}
        keyboardType="email-address"
      />
      <FormInput
        icon="location-outline"
        placeholder="Headquarters Address"
        value={form.details.hq_address}
        onChangeText={(t) => mergeForm(['details', 'hq_address'], t)}
        multiline
      />
    </View>
  );

  const renderOps = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Operational Scope</Text>
      <Text style={styles.label}>Select Services Provided:</Text>
      <View style={styles.pillGrid}>
        {[
          { key: 'service_surrogacy', label: 'Surrogacy' },
          { key: 'service_egg_donation', label: 'Egg Donation' },
          { key: 'service_sperm_donation', label: 'Sperm Donation' },
          { key: 'service_ivf_support', label: 'IVF Support' },
          { key: 'service_legal', label: 'Legal Support' },
          { key: 'service_counseling', label: 'Counseling' },
        ].map((svc) => (
          <SelectPill
            key={svc.key}
            label={svc.label}
            active={form.ops[svc.key]}
            onPress={() => mergeForm(['ops', svc.key], !form.ops[svc.key])}
          />
        ))}
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormInput
            icon="people-outline"
            placeholder="Staff Count"
            value={form.ops.staff_count}
            onChangeText={(t) => mergeForm(['ops', 'staff_count'], t)}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <FormInput
            icon="hourglass-outline"
            placeholder="Years Exp."
            value={form.ops.years_experience}
            onChangeText={(t) => mergeForm(['ops', 'years_experience'], t)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderCompliance = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Compliance & Legal</Text>
      <FormInput
        icon="key-outline"
        placeholder="Tax ID Number (TIN)"
        value={form.compliance.tin}
        onChangeText={(t) => mergeForm(['compliance', 'tin'], t)}
      />

      <Text style={styles.label}>Required Document Uploads:</Text>
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() => pickAndUpload(['compliance', 'proof_registration_url'])}
      >
        <Ionicons name="cloud-upload-outline" size={24} color={BRAND_GREEN} />
        <Text style={styles.uploadText}>
          {form.compliance.proof_registration_url ? 'Registration Uploaded' : 'Business Reg. Certificate'}
        </Text>
        {form.compliance.proof_registration_url && (
          <Ionicons name="checkmark-circle" size={18} color={BRAND_GREEN} style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() => pickAndUpload(['compliance', 'operating_license_url'])}
      >
        <Ionicons name="document-attach-outline" size={24} color={BRAND_GREEN} />
        <Text style={styles.uploadText}>
          {form.compliance.operating_license_url ? 'License Uploaded' : 'Operating License'}
        </Text>
        {form.compliance.operating_license_url && (
          <Ionicons name="checkmark-circle" size={18} color={BRAND_GREEN} style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRepId = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Representative ID</Text>
      <Text style={styles.label}>Upload valid identification for agency representative:</Text>
      <TouchableOpacity
        style={[styles.uploadBox, { height: 120, borderStyle: 'dashed' }]}
        onPress={() => pickAndUpload(['representative_id', 'representative_id_urls'])}
      >
        <Ionicons name="camera-outline" size={40} color={BRAND_GREEN} />
        <Text style={styles.uploadText}>Tap to add ID images</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15 }}>
        {(form.representative_id.representative_id_urls || []).map((u, i) => (
          <Image key={i} source={{ uri: u }} style={styles.thumb} />
        ))}
      </ScrollView>
    </View>
  );

  const renderReferral = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Discovery</Text>
      <Text style={styles.label}>How did you hear about us?</Text>
      <View style={styles.pillGrid}>
        {[
          { key: 'source_social', label: 'Social Media' },
          { key: 'source_friend', label: 'Word of Mouth' },
          { key: 'source_website', label: 'Our Website' },
          { key: 'source_clinics', label: 'Medical Clinics' },
        ].map(ref => (
          <SelectPill
            key={ref.key}
            label={ref.label}
            active={form.referral[ref.key]}
            onPress={() => mergeForm(['referral', ref.key], !form.referral[ref.key])}
          />
        ))}
      </View>
      <FormInput
        icon="create-outline"
        placeholder="Others (Specify)"
        value={form.referral.source_other}
        onChangeText={(t) => mergeForm(['referral', 'source_other'], t)}
      />
    </View>
  );

  const renderEmergency = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Emergency Contacts</Text>
      <FormInput
        icon="person-outline"
        placeholder="Primary Contact Name"
        value={form.emergency.name1}
        onChangeText={(t) => mergeForm(['emergency', 'name1'], t)}
      />
      <FormInput
        icon="call-outline"
        placeholder="Phone Number"
        value={form.emergency.phone1}
        onChangeText={(t) => mergeForm(['emergency', 'phone1'], t)}
      />
      <View style={styles.divider} />
      <FormInput
        icon="people-outline"
        placeholder="Secondary Contact Name"
        value={form.emergency.name2}
        onChangeText={(t) => mergeForm(['emergency', 'name2'], t)}
      />
      <FormInput
        icon="call-outline"
        placeholder="Phone Number"
        value={form.emergency.phone2}
        onChangeText={(t) => mergeForm(['emergency', 'phone2'], t)}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
        <Text style={styles.loaderText}>Syncing Credentials...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[BRAND_GREEN, SECONDARY_GREEN]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>KYC Registration</Text>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Later</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressPercent + '%' }]} />
            </View>
            <Text style={styles.progressText}>{progressPercent}% Complete</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.stepIndicator}>
            <Ionicons name="information-circle-outline" size={16} color={BRAND_GREEN} />
            <Text style={styles.stepLabel}>Step {step + 1} of {stepsCount}: {STEPS[step]}</Text>
          </View>

          {step === 0 && renderDetails()}
          {step === 1 && renderOps()}
          {step === 2 && renderCompliance()}
          {step === 3 && renderRepId()}
          {step === 4 && renderReferral()}
          {step === 5 && renderEmergency()}

          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={goBack}
              style={[styles.backAction, step === 0 && { opacity: 0 }]}
              disabled={step === 0}
            >
              <Text style={styles.backActionText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={step === stepsCount - 1 ? finishAll : goNext}
              style={styles.primaryAction}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryActionText}>
                    {step === stepsCount - 1 ? 'Finish Registration' : 'Continue'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, color: GRAY, fontWeight: '600' },

  header: {
    paddingTop: 40,
    paddingHorizontal: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  skipBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  skipText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  progressContainer: { marginTop: 5 },
  progressTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  progressText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'right' },

  scroll: { padding: 20, paddingBottom: 50 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
  stepLabel: { fontSize: 13, fontWeight: '800', color: BRAND_GREEN, marginLeft: 6, textTransform: 'uppercase' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  stepTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  row: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  pillActive: { backgroundColor: '#DCFCE7', borderColor: BRAND_GREEN },
  pillText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  pillTextActive: { color: BRAND_GREEN },

  uploadBox: {
    height: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  uploadText: { fontWeight: '800', color: BRAND_GREEN, fontSize: 14 },
  thumb: { width: 100, height: 100, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6' },

  footerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  backAction: { paddingHorizontal: 20, paddingVertical: 12 },
  backActionText: { color: GRAY, fontWeight: '800', fontSize: 16 },
  primaryAction: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
