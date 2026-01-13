// screens/AdminFinance.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

const SUB_FILTERS = ['all', 'pending', 'active', 'canceled'];
const TX_FILTERS  = ['all', 'held', 'released', 'failed'];

export default function AdminFinance({ onBack = () => {} }) {
  // Subscriptions state
  const [subs, setSubs] = useState([]);
  const [subsFilter, setSubsFilter] = useState('all');
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsRange, setSubsRange] = useState([0, 19]);

  // Transactions state
  const [txs, setTxs] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [txLoading, setTxLoading] = useState(true);
  const [txRange, setTxRange] = useState([0, 19]);

  // Summary state
  const [summary, setSummary] = useState({ subs: 0, volume: 0, commission: 0 });

  const loadSummary = useCallback(async () => {
    try {
      const { count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: txData, error: txError } = await supabase
        .from('escrow_transactions')
        .select('amount, type, status');
      if (txError) throw txError;

      let volume = 0, commission = 0;
      (txData || []).forEach(tx => {
        if (tx.status === 'released') volume += tx.amount || 0;
        if (tx.type === 'commission') commission += tx.amount || 0;
      });

      setSummary({ subs: subsCount || 0, volume, commission });
    } catch (e) {
      console.warn('Summary load error', e.message);
    }
  }, []);

  const loadSubs = useCallback(async (reset=false) => {
    try {
      setSubsLoading(true);
      let query = supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      if (subsFilter !== 'all') query = query.eq('status', subsFilter);
      const range = reset ? [0, 19] : subsRange;
      const { data, error } = await query.range(range[0], range[1]);
      if (error) throw error;
      setSubs(reset ? (data || []) : [...subs, ...(data || [])]);
      setSubsRange([0, (reset ? 19 : subsRange[1])]);
    } catch (e) {
      Alert.alert('Load subscriptions error', e?.message || String(e));
    } finally {
      setSubsLoading(false);
    }
  }, [subsFilter, subsRange, subs]);

  const loadTxs = useCallback(async (reset=false) => {
    try {
      setTxLoading(true);
      let query = supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
      if (txFilter !== 'all') query = query.eq('status', txFilter);
      const range = reset ? [0, 19] : txRange;
      const { data, error } = await query.range(range[0], range[1]);
      if (error) throw error;
      setTxs(reset ? (data || []) : [...txs, ...(data || [])]);
      setTxRange([0, (reset ? 19 : txRange[1])]);
    } catch (e) {
      Alert.alert('Load transactions error', e?.message || String(e));
    } finally {
      setTxLoading(false);
    }
  }, [txFilter, txRange, txs]);

  useEffect(() => { loadSubs(true); }, [subsFilter]);
  useEffect(() => { loadTxs(true); }, [txFilter]);
  useEffect(() => { loadSummary(); }, []);

  const moreSubs = () => setSubsRange(([a,b]) => [0, b+20]);
  const moreTxs  = () => setTxRange(([a,b]) => [0, b+20]);

  const StatusBadge = ({ status }) => {
    let bg = '#D1D5DB', color = '#111827'; // default gray
    if (['active','released'].includes(status)) { bg = '#DCFCE7'; color = '#16A34A'; }
    else if (['pending','held'].includes(status)) { bg = '#FEF9C3'; color = '#CA8A04'; }
    else if (['canceled','failed','rejected'].includes(status)) { bg = '#FEE2E2'; color = '#DC2626'; }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{status || '—'}</Text>
      </View>
    );
  };

  const renderSub = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Subscription</Text>
      <Text style={styles.meta}>User: <Text selectable>{item.user_id || '—'}</Text></Text>
      <Text style={styles.meta}>Plan: {item.plan || '—'} · Period: {item.period || '—'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Text style={styles.meta}>Status: </Text>
        <StatusBadge status={item.status} />
      </View>
      {item.renewal_date && <Text style={styles.meta}>Renewal: {new Date(item.renewal_date).toLocaleDateString()}</Text>}
      <Text style={styles.meta}>Created: {new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const renderTx = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Transaction</Text>
      <Text style={styles.meta}>User: <Text selectable>{item.user_id || '—'}</Text></Text>
      <Text style={styles.meta}>Type: {item.type || '—'} · Amount: {item.amount} {item.currency || ''}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Text style={styles.meta}>Status: </Text>
        <StatusBadge status={item.status} />
      </View>
      {item.reference && <Text style={styles.meta}>Ref: <Text selectable>{item.reference}</Text></Text>}
      <Text style={styles.meta}>Created: {new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header with Back */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Admin · Finance</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Subs</Text>
            <Text style={styles.summaryValue}>{summary.subs}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Released Vol.</Text>
            <Text style={styles.summaryValue}>{summary.volume}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Commissions</Text>
            <Text style={styles.summaryValue}>{summary.commission}</Text>
          </View>
        </View>

        {/* Subscriptions */}
        <Text style={styles.sectionTitle}>Subscriptions</Text>
        <View style={styles.filtersRow}>
          {SUB_FILTERS.map((f) => <TouchableOpacity key={f} onPress={() => setSubsFilter(f)} style={[styles.pill, subsFilter === f && styles.pillActive]}>
            <Text style={[styles.pillText, subsFilter === f && styles.pillTextActive]}>{f[0].toUpperCase()+f.slice(1)}</Text>
          </TouchableOpacity>)}
        </View>
        {subsLoading && subs.length === 0 ? (
          <ActivityIndicator size="small" color={BRAND_GREEN} />
        ) : (
          <>
            <FlatList
              data={subs}
              keyExtractor={(x, i) => x.id ?? `s-${i}`}
              renderItem={renderSub}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.empty}>No subscriptions.</Text>}
              contentContainerStyle={{ paddingBottom: 6 }}
            />
            {subs.length > 0 && (
              <TouchableOpacity style={styles.moreBtn} onPress={moreSubs}>
                <Text style={styles.moreText}>Load more</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Transactions */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Transactions</Text>
        <View style={styles.filtersRow}>
          {TX_FILTERS.map((f) => <TouchableOpacity key={f} onPress={() => setTxFilter(f)} style={[styles.pill, txFilter === f && styles.pillActive]}>
            <Text style={[styles.pillText, txFilter === f && styles.pillTextActive]}>{f[0].toUpperCase()+f.slice(1)}</Text>
          </TouchableOpacity>)}
        </View>
        {txLoading && txs.length === 0 ? (
          <ActivityIndicator size="small" color={BRAND_GREEN} />
        ) : (
          <>
            <FlatList
              data={txs}
              keyExtractor={(x, i) => x.id ?? `t-${i}`}
              renderItem={renderTx}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.empty}>No transactions.</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            {txs.length > 0 && (
              <TouchableOpacity style={styles.moreBtn} onPress={moreTxs}>
                <Text style={styles.moreText}>Load more</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { padding: 16, backgroundColor: '#F8FAF9' },

  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 22, fontWeight: '900', color: BRAND_GREEN, marginLeft: 12 },

  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backText: { color: '#fff', fontWeight: '800', marginLeft: 6 },

  summaryBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#E5F5EA', borderRadius: 12, marginBottom: 20 },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#374151' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: BRAND_GREEN },

  sectionTitle: { marginTop: 6, marginBottom: 6, color: '#111827', fontWeight: '800', fontSize: 16 },

  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  pill: { backgroundColor: '#E5F5EA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillActive: { backgroundColor: BRAND_GREEN },
  pillText: { color: BRAND_GREEN, fontWeight: '800' },
  pillTextActive: { color: '#fff' },

  card: {
    backgroundColor: ACCENT_WHITE, borderRadius: 16, padding: 14, marginTop: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6
  },
  cardTitle: { color: BRAND_GREEN, fontWeight: '900', fontSize: 16, marginBottom: 6 },
  meta: { color: '#374151', marginTop: 2 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontWeight: '700', textTransform: 'capitalize' },

  moreBtn: { alignSelf: 'center', marginTop: 12, backgroundColor: '#EEF2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  moreText: { color: BRAND_GREEN, fontWeight: '800' },

  empty: { color: '#6B7280' },
});
