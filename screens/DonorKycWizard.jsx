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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const GRAY = '#6B7280';

export default function DonorKycWizard({ userId, onFinish, onSkip }) {
  const steps = ['Personal', 'Medical', 'Reproductive', 'ID', 'Referral', 'Emergency'];
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Load any existing progress
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('form_data, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.form_data) {
        setFormData(data.form_data);
      }
    };
    load();
  }, [userId]);

  const saveStep = async (final = false) => {
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        role: 'DONOR',
        status: final ? 'submitted' : 'in_progress',
        form_data: formData,
      };

      // Upsert (insert if not exists, update if exists)
      const { error } = await supabase.from('kyc_documents').upsert(payload, {
        onConflict: 'user_id',
      });

      if (error) throw error;

      if (final) {
        onFinish?.();
      } else {
        if (step < steps.length - 1) setStep(step + 1);
      }
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  // --- STEP FORMS ---
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={formData.first_name || ''}
              onChangeText={(t) => setFormData({ ...formData, first_name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={formData.last_name || ''}
              onChangeText={(t) => setFormData({ ...formData, last_name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth"
              value={formData.dob || ''}
              onChangeText={(t) => setFormData({ ...formData, dob: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={formData.phone || ''}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Nationality"
              value={formData.nationality || ''}
              onChangeText={(t) => setFormData({ ...formData, nationality: t })}
            />
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.sectionTitle}>Medical & Genetic</Text>
            <TextInput
              style={styles.input}
              placeholder="Blood Group"
              value={formData.blood_group || ''}
              onChangeText={(t) => setFormData({ ...formData, blood_group: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Genotype"
              value={formData.genotype || ''}
              onChangeText={(t) => setFormData({ ...formData, genotype: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Height"
              value={formData.height || ''}
              onChangeText={(t) => setFormData({ ...formData, height: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Weight"
              value={formData.weight || ''}
              onChangeText={(t) => setFormData({ ...formData, weight: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Eye Color"
              value={formData.eye_color || ''}
              onChangeText={(t) => setFormData({ ...formData, eye_color: t })}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>Reproductive & Screening</Text>
            <TextInput
              style={styles.input}
              placeholder="Donated before? (Yes/No)"
              value={formData.donated_before || ''}
              onChangeText={(t) => setFormData({ ...formData, donated_before: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Number of donations"
              value={formData.num_donations || ''}
              onChangeText={(t) => setFormData({ ...formData, num_donations: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Known conditions?"
              value={formData.conditions || ''}
              onChangeText={(t) => setFormData({ ...formData, conditions: t })}
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.sectionTitle}>Identification</Text>
            <TextInput
              style={styles.input}
              placeholder="ID Type (Passport / Driver’s License / NIN / etc)"
              value={formData.id_type || ''}
              onChangeText={(t) => setFormData({ ...formData, id_type: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={formData.id_number || ''}
              onChangeText={(t) => setFormData({ ...formData, id_number: t })}
            />
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.sectionTitle}>Referral Info</Text>
            <TextInput
              style={styles.input}
              placeholder="Source of referral"
              value={formData.referral || ''}
              onChangeText={(t) => setFormData({ ...formData, referral: t })}
            />
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.emergency_name || ''}
              onChangeText={(t) => setFormData({ ...formData, emergency_name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={formData.emergency_phone || ''}
              onChangeText={(t) => setFormData({ ...formData, emergency_phone: t })}
            />
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {renderStep()}

        <View style={styles.btnRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
            onPress={() => saveStep(step === steps.length - 1)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {step === steps.length - 1 ? 'Submit' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip option */}
        <TouchableOpacity onPress={onSkip} style={{ marginTop: 10 }}>
          <Text style={{ color: GRAY, textAlign: 'center' }}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: BRAND_GREEN, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  primaryBtn: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
  },
  secondaryText: { color: '#374151', fontWeight: '700' },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: BRAND_GREEN,
  },
});
