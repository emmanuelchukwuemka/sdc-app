// screens/KycUpload.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function KycUpload({ userId, role = 'SURROGATE', onNext, onBack }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Load saved progress if exists
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('form_data, progress')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.form_data) {
        setFormData(data.form_data);
      }
    };
    fetchData();
  }, [userId]);

  const steps = [
    {
      title: 'Personal Details',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'surname', label: 'Surname' },
        { key: 'first_name', label: 'First Name' },
        { key: 'middle_name', label: 'Middle Name' },
        { key: 'dob', label: 'Date of Birth (DD/MM/YYYY)' },
        { key: 'tel1', label: 'Telephone (1)' },
        { key: 'tel2', label: 'Telephone (2)' },
        { key: 'nationality', label: 'Nationality' },
        { key: 'state_of_birth', label: 'State of Birth' },
        { key: 'place_of_birth', label: 'Place of Birth' },
        { key: 'email', label: 'Email Address' },
        { key: 'home_address', label: 'Home Address' },
        { key: 'office_address', label: 'Office Address' },
      ],
    },
    {
      title: 'Medical Information',
      fields: [
        { key: 'blood_group', label: 'Blood Group' },
        { key: 'genotype', label: 'Genotype' },
        { key: 'num_children', label: 'Number of Children' },
        { key: 'had_cs', label: 'Had CS before? (Yes/No)' },
        { key: 'been_surrogate', label: 'Been surrogate before? (Yes/No)' },
        { key: 'height', label: 'Height' },
        { key: 'weight', label: 'Weight' },
        { key: 'occupation', label: 'Occupation' },
      ],
    },
    {
      title: 'Identification',
      fields: [
        { key: 'passport', label: 'International Passport (Yes/No)' },
        { key: 'driver_license', label: 'Driver’s License (Yes/No)' },
        { key: 'national_id', label: 'National ID (Yes/No)' },
        { key: 'voter_card', label: 'Voter’s Card (Yes/No)' },
        { key: 'company_id', label: 'Company ID (Yes/No)' },
      ],
    },
    {
      title: 'Referral Information',
      fields: [
        { key: 'referral_source', label: 'Source of referral' },
        { key: 'doctor_referral', label: 'Doctor referral? (Yes/No)' },
        { key: 'doctor_name', label: 'Doctor’s name & contact' },
        { key: 'doctor_phone', label: 'Referral Doctor Phone' },
      ],
    },
    {
      title: 'Emergency Contacts',
      fields: [
        { key: 'kin1_name', label: 'Name (1)' },
        { key: 'kin1_phone', label: 'Mobile (1)' },
        { key: 'kin2_name', label: 'Name (2)' },
        { key: 'kin2_phone', label: 'Mobile (2)' },
      ],
    },
  ];

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const saveStep = async (final = false) => {
    try {
      setSaving(true);
      const progress = final ? 100 : Math.round(((step + 1) / steps.length) * 100);

      const { error } = await supabase.from('kyc_documents').upsert(
        {
          user_id: userId,
          form_data: formData,
          progress,
          status: final ? 'submitted' : 'in_progress',
        },
        { onConflict: 'user_id' }
      );
      if (error) throw error;

      if (final) {
        onNext(); // go to dashboard
      } else {
        setStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    } catch (err) {
      console.error('KYC save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={26} color={BRAND_GREEN} />
          </TouchableOpacity>
          <Text style={styles.header}>{steps[step].title}</Text>
        </View>

        {/* Form fields */}
        {steps[step].fields.map((field) => (
          <TextInput
            key={field.key}
            style={styles.input}
            placeholder={field.label}
            value={formData[field.key] || ''}
            onChangeText={(val) => handleChange(field.key, val)}
          />
        ))}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => setStep((prev) => prev - 1)}
            >
              <Text style={styles.ghostText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            disabled={saving}
            onPress={() => saveStep(step === steps.length - 1)}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {step === steps.length - 1 ? 'Submit' : 'Save & Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip for now */}
        <TouchableOpacity onPress={onNext} style={{ marginTop: 12 }}>
          <Text style={{ color: GRAY, textAlign: 'center' }}>Skip for now →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  header: { fontSize: 20, fontWeight: '800', color: BRAND_GREEN },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  ghostBtn: {
    backgroundColor: '#EEF2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ghostText: { color: BRAND_GREEN, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryText: { color: ACCENT_WHITE, fontWeight: '700' },
});
