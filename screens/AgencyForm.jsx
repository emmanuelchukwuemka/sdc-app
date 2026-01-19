// screens/AgencyForm.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API

const BRAND_GREEN = '#16A34A';
const GRAY = '#6B7280';
const ACCENT_WHITE = '#FFFFFF';

export default function AgencyForm({ userId, onSkip, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const stepsTotal = 6;
  const progress = Math.round((step / stepsTotal) * 100);

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const saveStep = async (final = false) => {
    try {
      setSaving(true);
      await supabase.from('kyc_documents').upsert(
        {
          user_id: userId,
          status: final ? 'submitted' : 'in_progress',
          form_data: formData,
          form_completed: final,
        },
        { onConflict: 'user_id' }
      );
      if (final) onComplete();
      else setStep(step + 1);
    } catch (e) {
      alert('Save failed, try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.sectionTitle}>Agency Details</Text>
            <TextInput style={styles.input} placeholder="Agency Name" onChangeText={(v) => handleChange('agency_name', v)} />
            <TextInput style={styles.input} placeholder="Registration Number" onChangeText={(v) => handleChange('registration_number', v)} />
            <TextInput style={styles.input} placeholder="Contact Person" onChangeText={(v) => handleChange('contact_person', v)} />
            <TextInput style={styles.input} placeholder="Telephone" onChangeText={(v) => handleChange('telephone', v)} />
            <TextInput style={styles.input} placeholder="Email" onChangeText={(v) => handleChange('email', v)} />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>Operational Info</Text>
            <TextInput style={styles.input} placeholder="Services Provided" onChangeText={(v) => handleChange('services', v)} />
            <TextInput style={styles.input} placeholder="Number of Staff" onChangeText={(v) => handleChange('staff_count', v)} />
            <TextInput style={styles.input} placeholder="Active Surrogates" onChangeText={(v) => handleChange('active_surrogates', v)} />
            <TextInput style={styles.input} placeholder="Active Donors" onChangeText={(v) => handleChange('active_donors', v)} />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.sectionTitle}>Legal & Compliance</Text>
            <TextInput style={styles.input} placeholder="Business Certificate Ref" onChangeText={(v) => handleChange('business_certificate', v)} />
            <TextInput style={styles.input} placeholder="TIN" onChangeText={(v) => handleChange('tin', v)} />
            <TextInput style={styles.input} placeholder="Insurance Coverage" onChangeText={(v) => handleChange('insurance', v)} />
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.sectionTitle}>Identification</Text>
            <TextInput style={styles.input} placeholder="ID Type" onChangeText={(v) => handleChange('id_type', v)} />
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.sectionTitle}>Referral Info</Text>
            <TextInput style={styles.input} placeholder="Source of referral" onChangeText={(v) => handleChange('referral_source', v)} />
          </>
        );
      case 6:
        return (
          <>
            <Text style={styles.sectionTitle}>Compliance Contact</Text>
            <TextInput style={styles.input} placeholder="Name 1" onChangeText={(v) => handleChange('compliance_name1', v)} />
            <TextInput style={styles.input} placeholder="Telephone 1" onChangeText={(v) => handleChange('compliance_tel1', v)} />
            <TextInput style={styles.input} placeholder="Email 1" onChangeText={(v) => handleChange('compliance_email1', v)} />
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]}>
          <Text style={styles.progressLabel}>{progress}%</Text>
        </View>
      </View>
      <ScrollView style={styles.container}>
        {renderStep()}
        <View style={styles.btnRow}>
          {step < stepsTotal && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={() => saveStep(step === stepsTotal)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{step === stepsTotal ? 'Submit' : 'Next'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: '800', fontSize: 18, color: BRAND_GREEN, marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 10, marginBottom: 10 },
  progressBar: { height: 20, backgroundColor: '#E5E7EB', margin: 10, borderRadius: 10, overflow: 'hidden' },
  progressFill: { backgroundColor: BRAND_GREEN, height: '100%', justifyContent: 'center' },
  progressLabel: { color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  skipBtn: { padding: 12 },
  skipText: { color: GRAY, fontWeight: '700' },
  nextBtn: { backgroundColor: BRAND_GREEN, padding: 12, borderRadius: 10 },
  nextText: { color: ACCENT_WHITE, fontWeight: '700' },
});
