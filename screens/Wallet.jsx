// screens/Wallet.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Removed Supabase import - using Flask API service instead
import { walletAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const LIGHT_BG = '#F8FAF9';

export default function Wallet({ route, navigation }) {
  const { userId } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [escrowTxs, setEscrowTxs] = useState([]);
  const [walletTxs, setWalletTxs] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);

        // Fetch wallet data from Flask API
        const [transactions, balance] = await Promise.all([
          walletAPI.getTransactions(),
          walletAPI.getBalance()
        ]);

        // Separate escrow and wallet transactions
        const escrowTxs = transactions.filter(tx => tx.type === 'surrogate_payment');
        const walletTxs = transactions.filter(tx => tx.type !== 'surrogate_payment');

        if (!mounted) return;
        setEscrowTxs(escrowTxs);
        setWalletTxs(walletTxs);
        setWallet(balance);
      } catch (e) {
        console.log('wallet load error', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Totals
  const heldTotal = useMemo(
    () =>
      (escrowTxs || [])
        .filter((t) => t.status === 'held')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [escrowTxs]
  );

  const referral = wallet ? Number(wallet.referral_balance || 0) : 0;

  // Merge + sort history
  const history = useMemo(() => {
    const esc = (escrowTxs || []).map((t) => ({
      id: `escrow:${t.id}`,
      source: 'escrow',
      kind: (t.type || '').toUpperCase(),
      type: t.type,
      status: t.status,
      reference: t.reference,
      amount: Number(t.amount || 0),
      commission_amount:
        t.commission_amount != null ? Number(t.commission_amount) : null,
      net_amount: t.net_amount != null ? Number(t.net_amount) : null,
      created_at: t.created_at,
    }));

    const wt = (walletTxs || []).map((t) => ({
      id: `wallet:${t.id}`,
      source: 'wallet',
      kind: (t.type || '').toUpperCase(),
      type: t.type,
      status: t.status || 'posted',
      reference: t.reference,
      amount: Number(t.amount || 0),
      commission_amount: null,
      net_amount: null,
      created_at: t.created_at,
    }));

    return [...esc, ...wt].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [escrowTxs, walletTxs]);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* ✅ TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ✅ Content */}
      <View style={styles.contentWrap}>

        {/* Modern Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>
              ₦{(heldTotal + referral).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.subLabel}>Escrow Held</Text>
              <Text style={styles.subValue}>₦{heldTotal.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.subLabel}>Rewards</Text>
              <Text style={styles.subValue}>₦{referral.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="add" size={24} color={BRAND_GREEN} />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="arrow-down" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Statement</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={BRAND_GREEN} />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isPlus = item.status === 'posted' || item.type === 'deposit';
              return (
                <View style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: isPlus ? '#DEF7EC' : '#FDE8E8' }]}>
                    <Ionicons
                      name={isPlus ? "arrow-down-outline" : "arrow-up-outline"}
                      size={18}
                      color={isPlus ? "#03543F" : "#9B1C1C"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>
                      {item.kind === 'MARKETPLACE_UNLOCK' ? 'Profile Unlock' : item.kind}
                    </Text>
                    <Text style={styles.txDate}>
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txAmount, { color: isPlus ? '#03543F' : '#1F2937' }]}>
                      {isPlus ? '+' : '-'}₦{Number(item.amount || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.txStatus}>{item.status}</Text>
                  </View>
                </View>
              )
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  contentWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  balanceCard: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', marginTop: 20, gap: 30 },
  subLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  subValue: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 2 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 10 },
  actionBtn: { alignItems: 'center', gap: 8 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txStatus: { fontSize: 11, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },

  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.6 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#6B7280', fontWeight: '500' },
});
