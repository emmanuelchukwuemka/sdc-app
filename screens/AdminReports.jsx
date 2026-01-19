// screens/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const FILTERS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

export default function AdminReports({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    matches: 0,
    inflow: 0,
    outflow: 0,
    commission: 0,
    funnel: { signups: 0, approved: 0, unlocked: 0, matched: 0 },
  });

  const getDateRange = () => {
    if (filter === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (filter === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    return null; // all time
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Convert filter to days for API
      let days = 30; // default
      if (filter === '7d') days = 7;
      else if (filter === '30d') days = 30;
      else days = 365; // all time
      
      // Get reports data from admin API
      const reportsData = await adminAPI.getReports(days);
      
      // Get financial data from admin API
      const financialData = await adminAPI.getFinancialData(days);
      
      setStats({
        matches: reportsData.profile_unlocks || 0,
        inflow: financialData.escrow_held || 0,
        outflow: financialData.escrow_released || 0,
        commission: financialData.commission_earned || 0,
        funnel: { 
          signups: reportsData.registrations || 0, 
          approved: reportsData.kyc_approved || 0, 
          unlocked: reportsData.profile_unlocks || 0, 
          matched: reportsData.favorites_added || 0 
        },
      });
    } catch (e) {
      console.error('Reports error', e);
      // Set fallback data
      setStats({
        matches: 0,
        inflow: 0,
        outflow: 0,
        commission: 0,
        funnel: { signups: 0, approved: 0, unlocked: 0, matched: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filter]);

  const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );

  const FunnelRow = ({ label, value, max, color }) => {
    const widthPct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <View style={styles.funnelRow}>
        <View style={styles.funnelHeader}>
          <Text style={styles.funnelLabel}>{label}</Text>
          <Text style={styles.funnelValue}>{value}</Text>
        </View>
        <View style={styles.funnelTrack}>
          <LinearGradient
            colors={[color, color]} // Gradient can be added here if needed
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.funnelFill, { width: `${widthPct}%`, backgroundColor: color }]}
          />
        </View>
        <Text style={styles.funnelPct}>{widthPct}% conversion</Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[BRAND_GREEN, BRAND_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerContent}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={ACCENT_WHITE} />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Analytics Reports</Text>
                <Text style={styles.headerSubtitle}>System Performance</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Time Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTrack}>
          {FILTERS.map((opt) => {
            const isActive = filter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setFilter(opt.key)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
            </View>
            <View style={styles.grid}>
              <StatCard
                icon="people"
                label="Matches"
                value={stats.matches}
                color="#3B82F6"
              />
              <StatCard
                icon="cash"
                label="Commission"
                value={`₦${stats.commission.toLocaleString()}`}
                color="#8B5CF6"
              />
            </View>
            <View style={styles.grid}>
              <StatCard
                icon="arrow-down-circle"
                label="Inflow"
                value={`₦${stats.inflow.toLocaleString()}`}
                color="#10B981"
              />
              <StatCard
                icon="arrow-up-circle"
                label="Outflow"
                value={`₦${stats.outflow.toLocaleString()}`}
                color="#F59E0B"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>User Funnel</Text>
            </View>
            <View style={styles.funnelCard}>
              <FunnelRow
                label="Total Signups"
                value={stats.funnel.signups}
                max={stats.funnel.signups}
                color="#94A3B8"
              />
              <FunnelRow
                label="Approved Users"
                value={stats.funnel.approved}
                max={stats.funnel.signups}
                color="#3B82F6"
              />
              <FunnelRow
                label="Marketplace Unlocked"
                value={stats.funnel.unlocked}
                max={stats.funnel.signups}
                color="#F59E0B"
              />
              <FunnelRow
                label="Matched Success"
                value={stats.funnel.matched}
                max={stats.funnel.signups}
                color="#16A34A"
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerContainer: {
    backgroundColor: BRAND_GREEN,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT_WHITE,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  filterContainer: {
    alignItems: 'center',
    marginTop: -20, // Overlap header slightly
    marginBottom: 10,
  },
  filterTrack: {
    flexDirection: 'row',
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  filterBtnActive: {
    backgroundColor: BRAND_GREEN,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  filterTextActive: {
    color: ACCENT_WHITE,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },

  funnelCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 20,
  },
  funnelRow: {

  },
  funnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  funnelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  funnelValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  funnelTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  funnelFill: {
    height: '100%',
    borderRadius: 5,
  },
  funnelPct: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'right',
  },
});