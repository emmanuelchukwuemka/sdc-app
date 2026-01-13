// screens/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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

export default function AdminReports({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // "7d" | "30d" | "all"
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
      const since = getDateRange();

      // helper fn to apply filter
      const rangeFilter = (query) =>
        since ? query.gte('created_at', since) : query;

      // Matches
      const { count: matches } = await rangeFilter(
        supabase.from('journeys').select('*', { count: 'exact', head: true })
      );

      // Escrow inflow
      const { data: inflowData } = await rangeFilter(
        supabase.from('escrow_transactions').select('amount').in('status', ['held', 'paid'])
      );
      const inflow = inflowData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // Escrow outflow
      const { data: outflowData } = await rangeFilter(
        supabase.from('escrow_transactions').select('amount').eq('status', 'released')
      );
      const outflow = outflowData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // Commission
      const { data: commData } = await rangeFilter(
        supabase.from('escrow_transactions').select('commission_amount')
      );
      const commission =
        commData?.reduce((sum, r) => sum + (r.commission_amount || 0), 0) || 0;

      // Funnel
      const { count: signups } = await rangeFilter(
        supabase.from('users').select('*', { count: 'exact', head: true })
      );

      const { count: approved } = await rangeFilter(
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      );

      const { count: unlocked } = await rangeFilter(
        supabase.from('marketplace_unlocks').select('*', { count: 'exact', head: true })
      );

      const { count: matched } = await rangeFilter(
        supabase.from('journeys').select('*', { count: 'exact', head: true })
      );

      setStats({
        matches: matches || 0,
        inflow,
        outflow,
        commission,
        funnel: { signups, approved, unlocked, matched },
      });
    } catch (e) {
      console.error('Reports error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filter]);

  const SmallCard = ({ icon, label, value }) => (
    <View style={styles.card}>
      <Ionicons name={icon} size={20} color={BRAND_GREEN} />
      <Text style={styles.cardValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );

  const FunnelRow = ({ label, value, max }) => {
    const widthPct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <View style={styles.funnelRow}>
        <Text style={styles.funnelLabel}>
          {label}: {value}
        </Text>
        <View style={styles.funnelBar}>
          <View style={[styles.funnelFill, { width: `${widthPct}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top bar with Back + Title */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={BRAND_GREEN} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Reports</Text>
        </View>

        {/* Date Filter */}
        <View style={styles.filterRow}>
          {[
            { key: '7d', label: 'Last 7 days' },
            { key: '30d', label: 'Last 30 days' },
            { key: 'all', label: 'All time' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterBtn, filter === opt.key && styles.filterBtnActive]}
              onPress={() => setFilter(opt.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === opt.key && styles.filterTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Compact Stats in Grid */}
            <View style={styles.cardRow}>
              <SmallCard icon="people" label="Matches" value={stats.matches} />
              <SmallCard
                icon="trending-up"
                label="Inflow"
                value={`₦${stats.inflow.toLocaleString()}`}
              />
              <SmallCard
                icon="trending-down"
                label="Outflow"
                value={`₦${stats.outflow.toLocaleString()}`}
              />
            </View>
            <View style={styles.cardRow}>
              <SmallCard
                icon="cash"
                label="Commission"
                value={`₦${stats.commission.toLocaleString()}`}
              />
            </View>

            {/* Funnel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Funnel</Text>
              <FunnelRow
                label="Signups"
                value={stats.funnel.signups}
                max={stats.funnel.signups}
              />
              <FunnelRow
                label="Approved"
                value={stats.funnel.approved}
                max={stats.funnel.signups}
              />
              <FunnelRow
                label="Unlocked"
                value={stats.funnel.unlocked}
                max={stats.funnel.signups}
              />
              <FunnelRow
                label="Matched"
                value={stats.funnel.matched}
                max={stats.funnel.signups}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { padding: 16, backgroundColor: '#F8FAF9' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: { marginLeft: 6, color: BRAND_GREEN, fontWeight: '700' },
  header: { fontSize: 20, fontWeight: '900', color: BRAND_GREEN },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: BRAND_GREEN },
  filterText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff' },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  cardValue: { fontSize: 14, fontWeight: '800', color: BRAND_GREEN, marginTop: 4 },

  section: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: BRAND_GREEN, marginBottom: 8 },

  funnelRow: { marginBottom: 10 },
  funnelLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  funnelBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  funnelFill: {
    height: 8,
    backgroundColor: BRAND_GREEN,
    borderRadius: 6,
  },
});