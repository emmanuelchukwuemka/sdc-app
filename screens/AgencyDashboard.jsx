// screens/AgencyDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAF9';
const DARK = '#111827';

export default function AgencyDashboard({ agencyId, onBack = () => { } }) {
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [referral, setReferral] = useState(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState('SURROGATE');
  const [newEmail, setNewEmail] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);

      // Roster
      const { data: rosterData, error: rosterErr } = await supabase
        .from('kyc_documents')
        .select('user_id as id, role, form_data->>username as username, form_data->>email as email, status')
        .eq('agency_id', agencyId)
        .in('role', ['SURROGATE', 'DONOR']);
      if (rosterErr) throw rosterErr;

      // Subscription
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .select('plan, period, status, renewal_date')
        .eq('user_id', agencyId)
        .single();
      if (subErr && subErr.code !== 'PGRST116') throw subErr;

      // Referral Rewards
      const { data: walletData, error: walletErr } = await supabase
        .from('wallets')
        .select('balance, referral_balance')
        .eq('user_id', agencyId)
        .single();
      if (walletErr && walletErr.code !== 'PGRST116') throw walletErr;

      setRoster(rosterData || []);
      setSubscription(subData || null);
      setReferral(walletData || { referral_balance: 0 });
    } catch (e) {
      console.error('Agency dashboard error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRoster = useMemo(() => {
    if (!search) return roster;
    const lower = search.toLowerCase();
    return roster.filter(r =>
      (r.username || '').toLowerCase().includes(lower) ||
      (r.email || '').toLowerCase().includes(lower) ||
      (r.role || '').toLowerCase().includes(lower)
    );
  }, [roster, search]);

  const toggleMemberStatus = async (item) => {
    try {
      const newStatus = item.status === 'active' ? 'suspended' : 'active';
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: newStatus })
        .eq('user_id', item.id);
      if (error) throw error;
      loadData();
    } catch (e) {
      console.error('Toggle status error', e);
    }
  };

  const renderRosterItem = ({ item }) => (
    <View style={styles.rosterCard}>
      <View style={[styles.roleIcon, { backgroundColor: item.role === 'SURROGATE' ? '#EEF2FF' : '#FFF7ED' }]}>
        <Ionicons
          name={item.role === 'SURROGATE' ? 'woman' : 'man'}
          size={20}
          color={item.role === 'SURROGATE' ? '#4F46E5' : '#EA580C'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rosterName}>{item.username || item.email || 'Unnamed'}</Text>
        <Text style={styles.rosterMeta}>{item.role} • {item.email}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? BRAND_GREEN : '#EF4444' }]} />
          <Text style={[styles.statusText, { color: item.status === 'active' ? BRAND_GREEN : '#EF4444' }]}>
            {item.status === 'active' ? 'Active' : 'Suspended'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, item.status === 'active' ? styles.suspendBtn : styles.activateBtn]}
        onPress={() => toggleMemberStatus(item)}
      >
        <Text style={[styles.actionBtnText, item.status === 'active' ? styles.suspendBtnText : styles.activateBtnText]}>
          {item.status === 'active' ? 'Suspend' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <LinearGradient
        colors={[BRAND_GREEN, SECONDARY_GREEN]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color={BRAND_GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agency Portal</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{roster.length}</Text>
            <Text style={styles.statLab}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{subscription?.plan || 'Free'}</Text>
            <Text style={styles.statLab}>Current Plan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>₦{referral?.referral_balance?.toLocaleString() || 0}</Text>
            <Text style={styles.statLab}>Earnings</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Manage Roster</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={GRAY} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surrogates or donors..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={GRAY}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredRoster}
            keyExtractor={(item) => item.id}
            renderItem={renderRosterItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={60} color="#E5E7EB" />
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Add Member Modal (Simplified placeholder implementation) */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Member</Text>
            <Text style={styles.modalHint}>Direct enrollment is available for verified agencies.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              placeholderTextColor={GRAY}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email Address"
              placeholderTextColor={GRAY}
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalSubmitText}>Save Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLab: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 3, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.3)' },

  content: { flex: 1, padding: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: DARK },
  addBtn: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, height: 45, fontSize: 15, color: DARK },

  rosterCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  roleIcon: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rosterName: { fontSize: 15, fontWeight: '800', color: DARK },
  rosterMeta: { fontSize: 12, color: GRAY, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  suspendBtn: { backgroundColor: '#FEF2F2' },
  activateBtn: { backgroundColor: '#F0FDF4' },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  suspendBtnText: { color: '#EF4444' },
  activateBtnText: { color: BRAND_GREEN },

  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: GRAY, fontSize: 14, fontWeight: '600', marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: DARK, marginBottom: 10 },
  modalHint: { color: GRAY, fontSize: 14, marginBottom: 20 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 15, color: DARK, borderWidth: 1, borderColor: '#E5E7EB' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: GRAY, fontWeight: '800' },
  modalSubmit: { flex: 2, backgroundColor: BRAND_GREEN, paddingVertical: 14, borderRadius: 15, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '900' },
});
