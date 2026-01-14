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
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const BADGE_TYPES = [
  { id: 'ID', label: 'Identity Verified', icon: 'id-card' },
  { id: 'Medical', label: 'Medical Cleared', icon: 'medkit' },
  { id: 'Legal', label: 'Legal Verified', icon: 'briefcase' },
];

export default function AdminBadges({ onBack = () => { } }) {
  const [userId, setUserId] = useState('');
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeBadges, setActiveBadges] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Load recent users from KYC docs
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

  const BadgeCard = ({ item }) => {
    const active = isActive(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleBadge(item.id)}
        style={[styles.badgeCard, active && styles.badgeCardActive]}
        disabled={toggling || loadingBadges}
        activeOpacity={0.8}
      >
        <View style={[styles.badgeIcon, active && styles.badgeIconActive]}>
          <Ionicons
            name={item.icon}
            size={24}
            color={active ? BRAND_GREEN : TEXT_SECONDARY}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.badgeLabel, active && styles.badgeLabelActive]}>{item.label}</Text>
          <Text style={styles.badgeStatus}>
            {active ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
        {active && (
          <Ionicons name="checkmark-circle" size={24} color={BRAND_GREEN} />
        )}
      </TouchableOpacity>
    );
  };

  const renderRecent = ({ item }) => (
    <TouchableOpacity
      style={styles.recentRow}
      onPress={() => loadUserBadges(item.user_id)}
    >
      <View style={styles.recentAvatar}>
        <Ionicons name="person" size={16} color={ACCENT_WHITE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.recentUserId} numberOfLines={1}>
          {item.user_id}
        </Text>
        <Text style={styles.recentWhen}>
          Latest activity: {new Date(item.when).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );

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
                <Text style={styles.headerTitle}>Verification Badges</Text>
                <Text style={styles.headerSubtitle}>Manage user verification status</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* User Search Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Find User</Text>
            <View style={styles.searchRow}>
              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color={TEXT_SECONDARY} style={{ marginLeft: 10 }} />
                <TextInput
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Paste User ID (UUID)"
                  placeholderTextColor={TEXT_SECONDARY}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => loadUserBadges()}
                style={styles.loadBtn}
              >
                {loadingBadges ? (
                  <ActivityIndicator size="small" color={ACCENT_WHITE} />
                ) : (
                  <Text style={styles.loadBtnText}>Load</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification Status</Text>
            {userId ? (
              <Text style={styles.userBadge}>User ID: {userId.slice(0, 8)}...</Text>
            ) : (
              <Text style={styles.hintText}>Load a user first</Text>
            )}
          </View>

          <View style={styles.badgesGrid}>
            {BADGE_TYPES.map(badge => (
              <BadgeCard key={badge.id} item={badge} />
            ))}
          </View>

          {/* Recent Users */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={loadRecentUsers}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentCard}>
            {loadingRecent ? (
              <ActivityIndicator color={BRAND_GREEN} style={{ padding: 20 }} />
            ) : recentUsers.length === 0 ? (
              <Text style={styles.emptyText}>No recent users found.</Text>
            ) : (
              recentUsers.map(user => (
                <View key={user.user_id}>
                  {renderRecent({ item: user })}
                  <View style={styles.divider} />
                </View>
              ))
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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

  scrollContent: {
    padding: 20,
  },

  // Search Card
  card: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  loadBtn: {
    width: 70,
    backgroundColor: BRAND_GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadBtnText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
  },

  // Badges
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  userBadge: {
    fontSize: 12,
    color: BRAND_GREEN,
    fontWeight: '600',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  badgesGrid: {
    gap: 12,
    marginBottom: 32,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeCardActive: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#F0FDF4',
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  badgeIconActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  badgeLabelActive: {
    color: BRAND_GREEN,
  },
  badgeStatus: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },

  // Recent Users
  recentCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 10, // tighter padding
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentUserId: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  recentWhen: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  refreshText: {
    color: BRAND_GREEN,
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 58,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: TEXT_SECONDARY,
  },
});
