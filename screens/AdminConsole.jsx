// screens/AdminConsole.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminConsole({ onBack = () => {} }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      Alert.alert('Load error', e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: 'admin@test' })
        .eq('id', id);
      if (error) throw error;

      await load();

      Alert.alert('Updated', `KYC was marked ${status}.`, [
        filter !== status
          ? { text: `Go to ${status}`, onPress: () => setFilter(status) }
          : { text: 'OK' },
      ]);
    } catch (e) {
      Alert.alert('Update failed', e?.message || String(e));
    }
  };

  const StatusBadge = ({ status }) => {
    let bg = '#D1D5DB', color = '#111827';
    if (status === 'approved') { bg = '#DCFCE7'; color = '#16A34A'; }
    else if (status === 'pending') { bg = '#FEF9C3'; color = '#CA8A04'; }
    else if (status === 'rejected') { bg = '#FEE2E2'; color = '#DC2626'; }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const when = new Date(item.created_at).toLocaleString();
    const reviewed = item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : null;

    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
          <Text style={styles.cardTitle}>KYC Record</Text>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.meta}>User: <Text selectable>{item.user_id || '—'}</Text></Text>
        <Text style={styles.meta}>Uploaded: {when}</Text>
        {reviewed && <Text style={styles.meta}>Reviewed: {reviewed} · by {item.reviewed_by || '—'}</Text>}

        {item.file_url ? (
          <Image source={{ uri: item.file_url }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]}>
            <Text style={{ color: '#9CA3AF' }}>No image</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => decide(item.id, 'reject')}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => decide(item.id, 'approve')}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const FilterPill = ({ value }) => {
    const active = filter === value;
    return (
      <TouchableOpacity
        onPress={() => setFilter(value)}
        style={[styles.pill, active && styles.pillActive]}
      >
        <Text style={[styles.pillText, active && styles.pillTextActive]}>
          {value[0].toUpperCase() + value.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <View style={styles.container}>
        {/* Header with Back */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Admin · KYC Console</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => <FilterPill key={f} value={f} />)}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(x) => x.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
            ListEmptyComponent={<Text style={styles.empty}>No records in this view.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9', padding: 16 },

  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 22, fontWeight: '900', color: BRAND_GREEN, marginLeft: 12 },

  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backText: { color: '#fff', fontWeight: '800', marginLeft: 6 },

  filtersRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: '#E5F5EA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillActive: { backgroundColor: BRAND_GREEN },
  pillText: { color: BRAND_GREEN, fontWeight: '800' },
  pillTextActive: { color: '#fff' },

  card: {
    backgroundColor: ACCENT_WHITE, borderRadius: 16, padding: 14, marginTop: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6
  },
  cardTitle: { color: BRAND_GREEN, fontWeight: '900', fontSize: 16 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '700', textTransform: 'capitalize', fontSize: 12 },

  meta: { color: '#374151', marginBottom: 4 },
  preview: { width: '100%', height: 180, borderRadius: 12, marginTop: 8, backgroundColor: '#F3F4F6' },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  rejectBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  rejectText: { color: '#B91C1C', fontWeight: '800' },
  approveBtn: { backgroundColor: BRAND_GREEN, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  approveText: { color: '#fff', fontWeight: '800' },

  empty: { color: '#6B7280', textAlign: 'center', marginTop: 16 },
});
