// screens/AdminCommissions.jsx (Acting as AdminDashboard)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9'; // Slate 100
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const { width } = Dimensions.get('window');

// Mock Stats Data (Replace with real queries later if needed)
const MOCK_STATS = [
  { label: 'Total Users', value: '1,248', icon: 'people', color: '#3B82F6' },
  { label: 'Pending KYC', value: '12', icon: 'document-text', color: '#F59E0B' },
  { label: 'Revenue', value: '$45k', icon: 'cash', color: '#10B981' },
];

const ModuleCard = ({ title, icon, color, onPress, description }) => (
  <TouchableOpacity
    style={styles.moduleCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.moduleContent}>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleDesc}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

export default function AdminCommissions({
  onOpenContracts,
  onOpenConsole,
  onOpenFinance,
  onOpenBadges,
  onOpenDisputes,
  onOpenAgencyDashboard,
  onOpenAgencies,
  onOpenReports,
  onLogout,
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
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      Alert.alert('Save failed', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <LinearGradient
        colors={[BRAND_GREEN, BRAND_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerTitle}>Administrator</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileBtn}>
                <Image source={require('../assets/logo.png')} style={styles.avatar} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {MOCK_STATS.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </ScrollView>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Management Modules</Text>

          <View style={styles.grid}>
            <ModuleCard
              title="KYC Console"
              desc="Verify User Docs"
              icon="shield-checkmark"
              color="#F59E0B"
              onPress={onOpenConsole}
              description="Review & Approve"
            />
            <ModuleCard
              title="Contracts"
              desc="Templates & Agreements"
              icon="document-text"
              color="#3B82F6"
              onPress={onOpenContracts}
              description="Manage Templates"
            />
            <ModuleCard
              title="Finance"
              desc="Payouts & Fees"
              icon="wallet"
              color="#10B981"
              onPress={onOpenFinance}
              description="Monitor Revenue"
            />
            <ModuleCard
              title="Agencies"
              desc="Manage Partners"
              icon="business"
              color="#8B5CF6"
              onPress={onOpenAgencies}
              description="Partner Oversight"
            />
            <ModuleCard
              title="Disputes"
              desc="Resolve Issues"
              icon="scale"
              color="#EF4444"
              onPress={onOpenDisputes}
              description="Case Management"
            />
            <ModuleCard
              title="Reports"
              desc="System Analytics"
              icon="bar-chart"
              color="#EC4899"
              onPress={onOpenReports}
              description="View Analytics"
            />
            <ModuleCard
              title="Badges"
              desc="Verification Levels"
              icon="ribbon"
              color="#6366F1"
              onPress={onOpenBadges}
              description="User Verifications"
            />
          </View>
        </View>

        {/* Configuration Section */}
        <View style={styles.configSection}>
          <View style={styles.configHeader}>
            <Ionicons name="settings-sharp" size={20} color={BRAND_GREEN} />
            <Text style={styles.configTitle}>System Configuration</Text>
          </View>

          <View style={styles.configCard}>
            <Text style={styles.configSubtitle}>Commission Rates (%)</Text>

            {loading ? (
              <ActivityIndicator color={BRAND_GREEN} />
            ) : (
              <>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Unlock Fee</Text>
                    <TextInput
                      value={unlockPct}
                      onChangeText={setUnlockPct}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Subscription Fee</Text>
                    <TextInput
                      value={subPct}
                      onChangeText={setSubPct}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={saveAll}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Update Settings'}</Text>
                </TouchableOpacity>

                {!!msg && <Text style={styles.successMsg}>{msg}</Text>}
              </>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: ACCENT_WHITE,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Stats
  statsRow: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 20,
  },
  statCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 16,
    width: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },

  // Modules
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },

  // Config
  configSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  configCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  saveBtn: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    fontSize: 14,
  },
  successMsg: {
    textAlign: 'center',
    color: '#16A34A',
    marginTop: 12,
    fontWeight: '600',
  },
});
