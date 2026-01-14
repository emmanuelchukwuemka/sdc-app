// screens/AdminFinance.jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F8FAFC'; // Cool Gray 50
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'canceled', label: 'Canceled' },
];

const TX_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'released', label: 'Released' },
  { id: 'held', label: 'Held' },
  { id: 'failed', label: 'Failed' },
];

export default function AdminFinance({ onBack = () => { } }) {
  const [activeTab, setActiveTab] = useState('subs');

  const [subs, setSubs] = useState([]);
  const [subsFilter, setSubsFilter] = useState('all');
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsRange, setSubsRange] = useState([0, 19]);

  const [txs, setTxs] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [txLoading, setTxLoading] = useState(true);
  const [txRange, setTxRange] = useState([0, 19]);

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

  const loadSubs = useCallback(async (reset = false) => {
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

  const loadTxs = useCallback(async (reset = false) => {
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

  const moreSubs = () => setSubsRange(([a, b]) => [0, b + 20]);
  const moreTxs = () => setTxRange(([a, b]) => [0, b + 20]);

  const StatCard = ({ label, value, icon, subtext }) => (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIconCircle}>
          <Ionicons name={icon} size={20} color={ACCENT_WHITE} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtext && <Text style={styles.statSub}>{subtext}</Text>}
    </View>
  );

  const StatusPill = ({ status }) => {
    let color = '#94A3B8';
    let bg = '#F1F5F9';

    if (['active', 'released'].includes(status)) { color = '#16A34A'; bg = '#DCFCE7'; }
    if (['pending', 'held'].includes(status)) { color = '#D97706'; bg = '#FEF9C3'; }
    if (['canceled', 'failed'].includes(status)) { color = '#DC2626'; bg = '#FEE2E2'; }

    return (
      <View style={[styles.pill, { backgroundColor: bg }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.pillText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderSub = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.itemIcon}>
        <Ionicons name="card" size={24} color={BRAND_GREEN} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text style={styles.itemTitle}>{item.plan || 'Subscription'}</Text>
        <Text style={styles.itemMeta}>User: ...{item.user_id?.slice(-6)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <StatusPill status={item.status} />
        <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const renderTx = ({ item }) => {
    const isCommission = item.type === 'commission';
    return (
      <View style={styles.listItem}>
        <View style={[styles.itemIcon, isCommission && { backgroundColor: '#FDF2F8' }]}>
          <Ionicons
            name={isCommission ? 'pricetag' : 'swap-horizontal'}
            size={24}
            color={isCommission ? '#EC4899' : '#3B82F6'}
          />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.itemTitle}>{isCommission ? 'Commission' : 'Transaction'}</Text>
          <Text style={[styles.itemRef, { fontFamily: 'monospace' }]}>{item.reference?.slice(0, 10)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountText}>
            {isCommission ? '+' : ''}{item.amount} {item.currency}
          </Text>
          <StatusPill status={item.status} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[BRAND_GREEN, BRAND_DARK]}
        style={styles.headerArea}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={ACCENT_WHITE} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Financial Overview</Text>
          </View>

          {/* Stats Dashboard */}
          <View style={styles.statsContainer}>
            <StatCard
              label="Active Subs"
              value={summary.subs}
              icon="people-circle"
              subtext="+2 this week"
            />
            <View style={styles.vertDivider} />
            <StatCard
              label="Volume"
              value={`₦${summary.volume.toLocaleString()}`}
              icon="wallet"
            />
            <View style={styles.vertDivider} />
            <StatCard
              label="Revenue"
              value={`₦${summary.commission.toLocaleString()}`}
              icon="trending-up"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bodyContainer}>
        {/* Modern Tabs */}
        <View style={styles.tabContainer}>
          <View style={styles.tabTrack}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'subs' && styles.tabItemActive]}
              onPress={() => setActiveTab('subs')}
            >
              <Text style={[styles.tabLabel, activeTab === 'subs' && styles.tabLabelActive]}>Subscriptions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'txs' && styles.tabItemActive]}
              onPress={() => setActiveTab('txs')}
            >
              <Text style={[styles.tabLabel, activeTab === 'txs' && styles.tabLabelActive]}>Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters List */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={activeTab === 'subs' ? FILTERS : TX_FILTERS}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => {
              const current = activeTab === 'subs' ? subsFilter : txFilter;
              const setFn = activeTab === 'subs' ? setSubsFilter : setTxFilter;
              const isActive = current === item.id;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setFn(item.id)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              )
            }}
          />
        </View>

        {/* Main List */}
        <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
          {activeTab === 'subs' ? (
            <FlatList
              data={subs}
              keyExtractor={(x, i) => x.id || `s-${i}`}
              renderItem={renderSub}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={!subsLoading && <Text style={styles.emptyText}>No subscriptions found.</Text>}
              ListFooterComponent={
                subs.length > 0 && (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={moreSubs}>
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </TouchableOpacity>
                )
              }
            />
          ) : (
            <FlatList
              data={txs}
              keyExtractor={(x, i) => x.id || `t-${i}`}
              renderItem={renderTx}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={!txLoading && <Text style={styles.emptyText}>No transactions found.</Text>}
              ListFooterComponent={
                txs.length > 0 && (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={moreTxs}>
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </TouchableOpacity>
                )
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerArea: {
    height: 220,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: '#166534',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ACCENT_WHITE,
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    opacity: 0.9,
  },
  statIconCircle: {
    marginRight: 6,
    opacity: 0.8,
  },
  statLabel: {
    color: '#BBF7D0', // light green text
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: ACCENT_WHITE,
    fontSize: 20,
    fontWeight: '800',
  },
  statSub: {
    color: '#86EFAC',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  vertDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },

  bodyContainer: {
    flex: 1,
    marginTop: -30, // Pull up to overlap
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: BG_COLOR,
    overflow: 'hidden',
  },

  tabContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 25,
    padding: 4,
    width: '85%',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  tabItemActive: {
    backgroundColor: ACCENT_WHITE,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  tabLabelActive: {
    color: BRAND_GREEN,
    fontWeight: '700',
  },

  filtersContainer: {
    height: 40,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: ACCENT_WHITE,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  filterTextActive: {
    color: ACCENT_WHITE,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_WHITE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  itemMeta: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  itemRef: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  loadMoreBtn: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: TEXT_SECONDARY,
  },
});
