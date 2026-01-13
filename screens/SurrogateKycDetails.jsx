// screens/SurrogateKycDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';

export default function SurrogateKycDetails({ route, navigation }) {
  const { formData } = route.params || {};

  if (!formData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={BRAND_GREEN} />
          <Text style={styles.emptyText}>No KYC data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderSection = (title, data) => {
    if (!data) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Object.entries(data).map(([key, value]) => (
          <View style={styles.row} key={key}>
            <Text style={styles.label}>{formatLabel(key)}</Text>
            <Text style={styles.value}>{formatValue(value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BRAND_GREEN} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submitted KYC</Text>
        <View style={{ width: 50 }} /> {/* spacer for symmetry */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderSection('Personal Details', formData.personal)}
        {renderSection('Medical Information', formData.medical)}
        {renderSection('Identification', formData.identification)}
        {renderSection('Referral Information', formData.referral)}
        {renderSection('Emergency Contacts', formData.emergency)}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: LIGHT_BG },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_GREEN },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { marginLeft: 4, color: BRAND_GREEN, fontWeight: '600' },

  content: { padding: 16 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_GREEN,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  label: { fontSize: 13, color: '#374151', flex: 1 },
  value: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
});
