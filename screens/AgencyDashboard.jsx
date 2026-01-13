// screens/AgencyDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAF9';

export default function AgencyDashboard({ agencyId, onBack = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [referral, setReferral] = useState(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState('SURROGATE');
  const [newEmail, setNewEmail] = useState('');

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'info' | 'success' | 'error'
  const [alertOnConfirm, setAlertOnConfirm] = useState(null);

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    if (typeof alertOnConfirm === 'function') {
      alertOnConfirm();
    }
    setAlertVisible(false);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Roster
      const { data: rosterData, error: rosterErr } = await supabase
        .from('users')
        .select('id, role, username, email, status')
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
      showAlert('Could not load data', 'Something went wrong. Please check your internet and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleMemberStatus = async (item) => {
    try {
      const newStatus = item.status === 'active' ? 'suspended' : 'active';
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', item.id);
      if (error) throw error;

      loadData();
      showAlert(
        newStatus === 'active' ? 'Member Activated' : 'Member Suspended',
        newStatus === 'active'
          ? `${item.username || item.email} can now access their account again.`
          : `${item.username || item.email} has been suspended and cannot log in.`,
        'success'
      );
    } catch (e) {
      console.error('Toggle member status error:', e);
      showAlert('Action failed', 'We couldn\'t update this member. Please try again.', 'error');
    }
  };

  const addMember = async () => {
    if (!newEmail) {
      showAlert('Missing Information', 'Please type the new member\'s email.', 'error');
      return;
    }
    try {
      const { error } = await supabase.from('users').insert([
        {
          email: newEmail,
          role: newRole,
          agency_id: agencyId,
          status: 'active',
        },
      ]);
      if (error) throw error;

      setShowAddModal(false);
      setNewEmail('');
      loadData();
      showAlert('Member Added', 'The new member has been successfully added to your agency.', 'success');
    } catch (e) {
      console.error('Add member error:', e);
      showAlert(
        'Could not add member',
        'This email might already be registered. Try using a different email.',
        'error'
      );
    }
  };

  const renderRosterItem = ({ item }) => (
    <View style={styles.rosterCard}>
      <Ionicons
        name={item.role === 'SURROGATE' ? 'female' : 'male'}
        size={16}
        color={BRAND_GREEN}
        style={{ marginRight: 6 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.rosterName}>{item.username || item.email || 'Unnamed'}</Text>
        <Text style={styles.rosterMeta}>
          {item.role} • {item.email}
        </Text>
        {item.status === 'suspended' && (
          <View style={styles.suspendedBadge}>
            <Ionicons name="alert-circle" size={12} color="#B91C1C" style={{ marginRight: 4 }} />
            <Text style={styles.suspendedText}>Suspended</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={item.status === 'active' ? styles.suspendBtn : styles.reactivateBtn}
        onPress={() => toggleMemberStatus(item)}
      >
        <Text style={item.status === 'active' ? styles.suspendText : styles.reactivateText}>
          {item.status === 'active' ? 'Suspend' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Agency Dashboard</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            ListHeaderComponent={
              <View>
                {/* Overview cards (3 in a row) */}
                <View style={styles.overviewRow}>
                  <View style={styles.overviewCard}>
                    <Text style={styles.overviewLabel}>Plan</Text>
                    <Text style={styles.overviewValue}>
                      {subscription?.plan || 'None'}
                    </Text>
                  </View>
                  <View style={styles.overviewCard}>
                    <Text style={styles.overviewLabel}>Status</Text>
                    <Text style={styles.overviewValue}>
                      {subscription?.status || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.overviewCard}>
                    <Text style={styles.overviewLabel}>Rewards</Text>
                    <Text style={styles.overviewValue}>
                      ₦{referral?.referral_balance?.toLocaleString() || 0}
                    </Text>
                  </View>
                </View>

                {/* Search */}
                <Text style={styles.sectionTitle}>Members</Text>
                <TextInput
                  style={styles.search}
                  placeholder="Search surrogates or donors..."
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor={GRAY}
                />

                {/* Add Member */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Ionicons name="add-circle" size={16} color={ACCENT_WHITE} />
                    <Text style={styles.addBtnText}>Add Member</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            data={filteredRoster}
            keyExtractor={(item) => item.id}
            renderItem={renderRosterItem}
            ListEmptyComponent={
              <Text style={styles.empty}>No surrogates or donors yet.</Text>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}

        {/* Add Member Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <View className="modalOverlay" style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add New Member</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter member email"
                value={newEmail}
                onChangeText={setNewEmail}
              />

              {/* Role selector */}
              <View style={styles.roleSwitch}>
                <TouchableOpacity onPress={() => setNewRole('SURROGATE')}>
                  <Text
                    style={[styles.roleOption, newRole === 'SURROGATE' && styles.roleActive]}
                  >
                    Surrogate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNewRole('DONOR')}>
                  <Text
                    style={[styles.roleOption, newRole === 'DONOR' && styles.roleActive]}
                  >
                    Donor
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={addMember}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SweetAlert-style popup */}
        <AwesomeAlert
          show={alertVisible}
          title={alertTitle}
          message={alertMessage}
          showConfirmButton={true}
          confirmText="OK"
          confirmButtonColor={BRAND_GREEN}
          onConfirmPressed={hideAlert}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG },
  container: { flexGrow: 1, padding: 16 },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: { fontSize: 20, fontWeight: '800', color: BRAND_GREEN },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backText: { color: '#fff', fontWeight: '700', marginLeft: 6 },

  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  overviewLabel: { fontSize: 12, color: GRAY, fontWeight: '600' },
  overviewValue: { fontSize: 14, fontWeight: '800', color: BRAND_GREEN },

  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: BRAND_GREEN,
    marginTop: 8,
    marginBottom: 8,
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: ACCENT_WHITE, fontWeight: '700', marginLeft: 6 },

  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  rosterName: { fontWeight: '700', color: '#111827', fontSize: 14 },
  rosterMeta: { fontSize: 12, color: GRAY },
  suspendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  suspendedText: { color: '#B91C1C', fontWeight: '700', fontSize: 11 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontWeight: '800', fontSize: 18, marginBottom: 12, color: BRAND_GREEN },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  roleSwitch: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  roleOption: { fontWeight: '600', color: GRAY, padding: 6 },
  roleActive: { color: BRAND_GREEN, textDecorationLine: 'underline' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
