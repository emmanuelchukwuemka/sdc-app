// screens/AdminBadges.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const LIGHT = '#F3F4F6';

const BADGE_TYPES = ['ID', 'Medical', 'Legal'];

export default function AdminBadges({ onBack = () => {} }) {
  const [userId, setUserId] = useState('');
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeBadges, setActiveBadges] = useState([]); 
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // 🔄 Load a small recent users list from KYC docs
  const loadRecentUsers = async () => {
    try {
      setLoadingRecent(true);
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const unique = [];
      const seen = new Set();
      (data || []).forEach((row) => {
        if (row?.user_id && !seen.has(row.user_id)) {
          seen.add(row.user_id);
          unique.push({ user_id: row.user_id, when: row.created_at });
        }
      });
      setRecentUsers(unique);
    } catch (e) {
      console.warn('loadRecentUsers error', e?.message || e);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadRecentUsers();
  }, []);

  const isActive = (type) => activeBadges.includes(type);

  const loadUserBadges = async (targetUserId) => {
    const uid = (targetUserId || userId || '').trim();
    if (!uid) {
      Alert.alert('Missing user', 'Enter a user_id or pick from Recent Users.');
      return;
    }
    try {
      setLoadingBadges(true);
      const { data, error } = await supabase
        .from('verification_badges')
        .select('type, status')
        .eq('user_id', uid);

      if (error) throw error;

      const verified = (data || [])
        .filter((r) => r.status === 'verified')
        .map((r) => r.type);

      setActiveBadges(verified);
      setUserId(uid); 
    } catch (e) {
      Alert.alert('Load failed', e?.message || String(e));
    } finally {
      setLoadingBadges(false);
    }
  };

  const toggleBadge = async (type) => {
    const uid = (userId || '').trim();
    if (!uid) {
      Alert.alert('Missing user', 'Enter a user_id or pick from Recent Users.');
      return;
    }
    try {
      setToggling(true);

      const { data: existing, error: selErr } = await supabase
        .from('verification_badges')
        .select('id, status')
        .eq('user_id', uid)
        .eq('type', type)
        .maybeSingle();

      if (selErr && selErr.code !== 'PGRST116') throw selErr;

      if (existing?.id && existing.status === 'verified') {
        // revoke
        const { error: delErr } = await supabase
          .from('verification_badges')
          .delete()
          .eq('id', existing.id);
        if (delErr) throw delErr;
      } else {
        // insert verified
        const { error: insErr } = await supabase
          .from('verification_badges')
          .insert([
            { user_id: uid, type, status: 'verified', verified_by: 'admin@test' },
          ]);
        if (insErr) throw insErr;
      }

      await loadUserBadges(uid);
    } catch (e) {
      Alert.alert('Update failed', e?.message || String(e));
    } finally {
      setToggling(false);
    }
  };

  const BadgeToggle = ({ type }) => {
    const active = isActive(type);
    return (
      <TouchableOpacity
        onPress={() => toggleBadge(type)}
        style={[styles.badgeToggle, active ? styles.badgeOn : styles.badgeOff]}
        disabled={toggling || loadingBadges}
      >
        <Ionicons
          name={active ? 'shield-checkmark' : 'shield-outline'}
          size={16}
          color={active ? '#065F46' : BRAND_GREEN}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.badgeText,
            active ? styles.badgeTextOn : styles.badgeTextOff,
          ]}
        >
          {type}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRecent = ({ item }) => (
    <TouchableOpacity
      style={styles.recentRow}
      onPress={() => loadUserBadges(item.user_id)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.recentUserId} numberOfLines={1} selectable>
          {item.user_id}
        </Text>
        <Text style={styles.recentWhen}>
          {new Date(item.when).toLocaleString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GRAY} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={ACCENT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.header}>Admin · Verification Badges</Text>
        </View>
        <TouchableOpacity onPress={loadRecentUsers} style={styles.ghostBtn}>
          <Ionicons name="refresh" size={16} color={BRAND_GREEN} />
          <Text style={styles.ghostText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Card: Select user */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select User</Text>
        <Text style={styles.help}>
          Paste a user_id or pick from the Recent list below.
        </Text>

        <View style={styles.userRow}>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            placeholder="user_id (UUID)"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => loadUserBadges()}
            style={styles.primaryBtn}
          >
            {loadingBadges ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Load</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggles */}
        <View style={styles.badgeRow}>
          {BADGE_TYPES.map((t) => (
            <BadgeToggle key={t} type={t} />
          ))}
        </View>
      </View>

      {/* Card: Recent Users */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Users (from KYC)</Text>
        {loadingRecent ? (
          <ActivityIndicator size="small" />
        ) : (
          <FlatList
            data={recentUsers}
            keyExtractor={(x) => x.user_id}
            renderItem={renderRecent}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No recent KYC uploads.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  topbar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: { marginLeft: 10, fontSize: 18, fontWeight: '900', color: BRAND_GREEN },
  backBtn: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ghostText: { color: BRAND_GREEN, fontWeight: '800', marginLeft: 6 },
  card: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  cardTitle: { color: BRAND_GREEN, fontWeight: '900', fontSize: 16, marginBottom: 6 },
  help: { color: GRAY, marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  primaryBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginLeft: 8 },
  primaryText: { color: ACCENT_WHITE, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badgeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  badgeOn: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  badgeOff: { backgroundColor: '#E5F5EA', borderColor: '#C7EED4' },
  badgeText: { fontWeight: '900' },
  badgeTextOn: { color: '#065F46' },
  badgeTextOff: { color: BRAND_GREEN },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentUserId: { color: '#111827', fontWeight: '700' },
  recentWhen: { color: GRAY, fontSize: 12 },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
  empty: { color: GRAY, textAlign: 'center', marginVertical: 6 },
});
