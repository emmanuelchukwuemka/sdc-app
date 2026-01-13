// screens/AdminCommissions.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const SOFT_BG = '#F8FAF9';
const SOFT_CARD = '#F5FBF7'; // subtle green-tinted card background

export default function AdminCommissions({
  onOpenContracts,
  onOpenConsole,
  onOpenFinance,
  onOpenBadges,
  onOpenDisputes,
  onOpenAgencyDashboard,
  onOpenAgencies,
  onOpenReports,
}) {
  const [loading, setLoading] = useState(true);
  const [unlockPct, setUnlockPct] = useState('10');
  const [subPct, setSubPct] = useState('10');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('commission_settings')
          .select('category, percent');
        if (error) throw error;
        const map = Object.fromEntries((data || []).map(r => [r.category, Number(r.percent)]));
        if (!on) return;
        if (Number.isFinite(map.unlock)) setUnlockPct(String(map.unlock));
        if (Number.isFinite(map.subscription)) setSubPct(String(map.subscription));
      } catch (e) {
        console.log('load commissions error', e?.message || e);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const upsertCommission = async (category, percentNumber) => {
    const { error } = await supabase
      .from('commission_settings')
      .upsert({ category, percent: percentNumber }, { onConflict: 'category' });
    if (error) throw error;
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setMsg('');
      const u = Number(unlockPct);
      const s = Number(subPct);
      if (!Number.isFinite(u) || u < 0 || u > 100) return Alert.alert('Invalid', 'Unlock % must be 0–100');
      if (!Number.isFinite(s) || s < 0 || s > 100) return Alert.alert('Invalid', 'Subscription % must be 0–100');

      await upsertCommission('unlock', u);
      await upsertCommission('subscription', s);

      setMsg('Saved successfully.');
    } catch (e) {
      Alert.alert('Save failed', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const QuickPill = ({ title, onPress }) => (
    <TouchableOpacity style={styles.quickPill} onPress={onPress}>
      <Text style={styles.quickPillText}>{title}</Text>
    </TouchableOpacity>
  );

  const CommissionCard = ({ label, value, onChangeText, helpText, placeholder }) => (
    <View style={styles.cardWrap}>
      <View style={styles.cardTopLabelWrap}>
        <Text style={styles.cardTopLabel}>{label}</Text>
      </View>
      <View style={styles.card}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          style={styles.input}
        />
        <Text style={styles.help}>{helpText}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Commissions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          <QuickPill title="📑 Contracts" onPress={onOpenContracts} />
          <QuickPill title="🛡️ KYC Console" onPress={onOpenConsole} />
          <QuickPill title="💰 Finance" onPress={onOpenFinance} />
          <QuickPill title="🏷️ Badges" onPress={onOpenBadges} />
          <QuickPill title="⚖️ Disputes" onPress={onOpenDisputes} />
          <QuickPill title="Agency Dashboard" onPress={onOpenAgencyDashboard} />
          <QuickPill title="📊 Reports" onPress={onOpenReports} />
          <QuickPill title="🏢 Agencies" onPress={onOpenAgencies} />
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 24 }} />
        ) : (
          <>
            {/* Unlock commission */}
            <CommissionCard
              label="Marketplace Unlock Commission (%)"
              value={unlockPct}
              onChangeText={setUnlockPct}
              placeholder="e.g. 10"
              helpText={(
                <>This percentage is deducted from <Text style={{ fontWeight: 'bold' }}>Unlock</Text> payments before release.</>
              )}
            />

            {/* Subscription commission */}
            <CommissionCard
              label="Agency Subscription Commission (%)"
              value={subPct}
              onChangeText={setSubPct}
              placeholder="e.g. 10"
              helpText={(
                <>This percentage is deducted from <Text style={{ fontWeight: 'bold' }}>Subscription</Text> payments.</>
              )}
            />
          </>
        )}

        {/* Spacer to avoid overlap with floating save */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Save & Toast */}
      <View style={styles.saveBar} pointerEvents="box-none">
        {!!msg && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{msg}</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.saveFab, saving && { opacity: 0.85 }]} onPress={saveAll} disabled={saving}>
          <Text style={styles.saveFabText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SOFT_BG },
  headerBar: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: '#FFFFFF', opacity: 0.85, marginTop: 2, fontSize: 14, fontWeight: '600' },

  container: { padding: 16, paddingBottom: 32 },
  sectionTitle: { color: '#111827', fontSize: 14, fontWeight: '800', marginBottom: 10 },

  quickRow: { paddingRight: 16 },
  quickPill: {
    backgroundColor: '#E9F7EE',
    borderColor: '#DCEFE2',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  quickPillText: { color: BRAND_GREEN, fontWeight: '800', fontSize: 13 },

  cardWrap: { marginTop: 14 },
  cardTopLabelWrap: { paddingHorizontal: 6, marginBottom: 8 },
  cardTopLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAFBF1',
    color: BRAND_GREEN,
    borderColor: '#DCEFE2',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: '900',
    fontSize: 12,
  },
  card: {
    backgroundColor: SOFT_CARD,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  help: { color: '#6B7280', marginTop: 8, fontSize: 13 },

  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  saveFab: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  saveFabText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  toast: {
    backgroundColor: '#065F46',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  toastText: { color: '#FFFFFF', fontWeight: '700' },
});

