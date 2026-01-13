// screens/Dispute.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';

export default function Dispute({ route, navigation }) {
  const userId = route?.params?.userId;
  const [reason, setReason] = useState('');
  const [profileId, setProfileId] = useState(''); // optional reference (e.g., listing/profile)
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      if (!userId) {
        Alert.alert('Not Signed In', 'We could not determine your user. Please relogin.');
        return;
      }
      const trimmed = reason.trim();
      if (!trimmed) {
        Alert.alert('Missing', 'Please provide a brief description of your issue or dispute.');
        return;
      }
      setSubmitting(true);
      const payload = {
        user_id: userId,
        reason: trimmed,
        status: 'open',
      };
      if (profileId.trim()) payload.profile_id = profileId.trim();

      const { error } = await supabase.from('disputes').insert([payload]);
      if (error) throw error;

      setReason('');
      setProfileId('');
      Alert.alert('Submitted', 'Your report has been sent to admin. We will get back to you shortly.');
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert('Failed', e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Removed local header; using global top bar with title */}
      <View style={styles.container}>
        <Text style={styles.label}>Profile ID</Text>
        <TextInput style={styles.input} value={profileId} onChangeText={setProfileId} placeholder="e.g. 12345" />

        <Text style={styles.label}>Issue Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe the problem you’re facing"
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  header: { marginLeft: 8, fontSize: 20, fontWeight: '900', color: BRAND_GREEN },
  subtext: { color: '#374151', marginBottom: 16 },
  label: { fontWeight: '700', color: '#111827', marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  submitBtn: {
    marginTop: 16,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: { color: '#fff', fontWeight: '800' },
});