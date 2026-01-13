// screens/Marketplace.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LISTINGS_RAW } from '../data/listings';
import { toPublicListing } from '../constants/privacy';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

const FILTERS = ['ALL', 'SURROGATE', 'DONOR'];

// Map demo listing IDs → real user UUIDs
const LISTING_TO_USER = {
  s1: '77777777-7777-7777-7777-777777777777',
  s2: '77777777-7777-7777-7777-777777777777',
  s3: '77777777-7777-7777-7777-777777777777',
  d1: '88888888-8888-8888-8888-888888888888',
  d2: '88888888-8888-8888-8888-888888888888',
  d3: '88888888-8888-8888-8888-888888888888',
};

const FALLBACK_USER_ID = '22222222-2222-2222-2222-222222222222';
const UNLOCK_PRICE = 5000;
const DEFAULT_UNLOCK_COMMISSION_PCT = 10;

export default function Marketplace({
  userId = FALLBACK_USER_ID,
  onOpenWallet = () => {},
  onOpenChat = () => {},
}) {
  const [filter, setFilter] = useState('ALL');
  const [unlockedIds, setUnlockedIds] = useState(new Set());       // listing IDs (s1/d1)
  const [favoriteIds, setFavoriteIds] = useState(new Set());       // target_user_id UUIDs
  const [loading, setLoading] = useState(false);
  const [unlockCommissionPct, setUnlockCommissionPct] = useState(DEFAULT_UNLOCK_COMMISSION_PCT);
  const [badgesMap, setBadgesMap] = useState({});                  // user UUID → [badge]
  const [openDisputeFor, setOpenDisputeFor] = useState(null);      // listingId currently showing dispute form
  const [disputeReason, setDisputeReason] = useState('');          // input model

  const data = useMemo(() => {
    return filter === 'ALL' ? LISTINGS_RAW : LISTINGS_RAW.filter((x) => x.role === filter);
  }, [filter]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_unlocks')
          .select('listing_id')
          .eq('user_id', userId);
        if (error) throw error;
        if (!on) return;
        setUnlockedIds(new Set((data || []).map(r => r.listing_id)));
      } catch (e) {
        console.log('Unlocks load error', e?.message || e);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('target_user_id')
          .eq('ip_id', userId);
        if (error) throw error;
        if (!on) return;
        setFavoriteIds(new Set((data || []).map(r => r.target_user_id)));
      } catch (e) {
        console.log('Favorites load error', e?.message || e);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('commission_settings')
          .select('percent')
          .eq('category', 'unlock')
          .limit(1);
        if (error) throw error;
        const pct = data?.length ? Number(data[0].percent) : DEFAULT_UNLOCK_COMMISSION_PCT;
        if (on) setUnlockCommissionPct(Number.isFinite(pct) ? pct : DEFAULT_UNLOCK_COMMISSION_PCT);
      } catch (e) {
        console.log('Commission load error', e?.message || e);
        if (on) setUnlockCommissionPct(DEFAULT_UNLOCK_COMMISSION_PCT);
      }
    })();
    return () => { on = false; };
  }, []);

  // Load badges for unlocked mapped user UUIDs
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        if (unlockedIds.size === 0) return;
        const uuids = Array.from(unlockedIds)
          .map(lid => LISTING_TO_USER[lid] || lid)
          .filter(Boolean);
        if (uuids.length === 0) return;

        const { data, error } = await supabase
          .from('verification_badges')
          .select('user_id, type, status')
          .in('user_id', uuids);
        if (error) throw error;

        const map = {};
        (data || []).forEach((row) => {
          if (row.status === 'verified') {
            if (!map[row.user_id]) map[row.user_id] = [];
            map[row.user_id].push(row.type);
          }
        });
        if (on) setBadgesMap(map);
      } catch (e) {
        console.log('Badges load error', e?.message || e);
      }
    })();
    return () => { on = false; };
  }, [unlockedIds]);

  const toggleFavorite = async (listingId) => {
    try {
      const targetUserId = LISTING_TO_USER[listingId] || listingId;
      const isFav = favoriteIds.has(targetUserId);

      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('ip_id', userId)
          .eq('target_user_id', targetUserId);
        if (error) throw error;
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ ip_id: userId, target_user_id: targetUserId }]);
        if (error) throw error;
        setFavoriteIds(prev => new Set(prev).add(targetUserId));
      }
    } catch (e) {
      Alert.alert('Favorite failed', e?.message || String(e));
    }
  };

  const handleUnlock = async (listingId) => {
    try {
      setLoading(true);

      const { error: unlockErr } = await supabase.from('marketplace_unlocks').insert({
        user_id: userId,
        listing_id: listingId,
      });
      if (unlockErr) throw unlockErr;

      const commissionPercent = Number(unlockCommissionPct);
      const commissionAmount = Number(((UNLOCK_PRICE * commissionPercent) / 100).toFixed(2));
      const netAmount = Number((UNLOCK_PRICE - commissionAmount).toFixed(2));
      const reference = `UNLOCK-${listingId}-${Date.now()}`;

      const { error: escrowErr } = await supabase.from('escrow_transactions').insert({
        user_id: userId,
        listing_id: listingId,
        type: 'unlock',
        amount: UNLOCK_PRICE,
        currency: 'NGN',
        status: 'held',
        reference,
        meta: { source: 'test', note: 'Simulated unlock payment' },
        commission_percent: commissionPercent,
        commission_amount: commissionAmount,
        net_amount: netAmount,
      });
      if (escrowErr) throw escrowErr;

      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.add(listingId);
        return next;
      });
    } catch (err) {
      Alert.alert('Unlock Error', String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Create dispute (profile-based)
  const submitDispute = async (listingId) => {
    try {
      const profileUuid = LISTING_TO_USER[listingId] || listingId;
      if (!disputeReason.trim()) {
        Alert.alert('Missing', 'Please enter a brief reason for your dispute.');
        return;
      }
      const { error } = await supabase
        .from('disputes')
        .insert([{
          user_id: userId,
          profile_id: profileUuid,
          reason: disputeReason.trim(),
          status: 'open'
        }]);
      if (error) throw error;

      setDisputeReason('');
      setOpenDisputeFor(null);
      Alert.alert('Submitted', 'Your dispute has been submitted. Our team will review.');
    } catch (e) {
      Alert.alert('Dispute failed', e?.message || String(e));
    }
  };

  const renderBadges = (userUuid) => {
    const userBadges = badgesMap[userUuid] || [];
    if (userBadges.length === 0) return null;
    return (
      <View style={styles.badgeRow}>
        {userBadges.map((b) => (
          <View key={b} style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color="#065F46" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{b} Verified</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCard = ({ item }) => {
    const isUnlocked = unlockedIds.has(item.id);
    const targetUserId = LISTING_TO_USER[item.id] || item.id;
    const isFav = favoriteIds.has(targetUserId);
    const publicView = toPublicListing(item);
    const showDispute = openDisputeFor === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.photoWrap}>
          <Image source={{ uri: publicView.image }} style={styles.photo} blurRadius={isUnlocked ? 0 : 16} />

          <TouchableOpacity
            style={[styles.iconBtn, styles.favBtn]}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={ACCENT_WHITE} />
          </TouchableOpacity>

          <View style={[styles.lockOverlay, isUnlocked && styles.unlockedOverlay]}>
            <Text style={styles.lockText}>{isUnlocked ? 'Unlocked' : 'Locked'}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{publicView.role}</Text>
          </View>
          <Text style={styles.title}>Age: {publicView.age}</Text>
          <Text style={styles.meta}>Location: {publicView.location}</Text>
          <Text style={styles.meta}>Availability: {publicView.availability}</Text>

          {!isUnlocked && <Text style={styles.note}>Full details visible after unlock.</Text>}

          {/* Badges + Details only when unlocked */}
          {isUnlocked && renderBadges(targetUserId)}

          {isUnlocked && item.details && (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Details</Text>
              <Text style={styles.detailsLine}>Alias: {item.details.alias}</Text>
              <Text style={styles.detailsLine}>Bio: {item.details.bio}</Text>
              <Text style={styles.detailsLine}>Experience: {item.details.experience}</Text>
              <Text style={styles.detailsLine}>Height: {item.details.height}</Text>
              <Text style={styles.detailsLine}>Blood Group: {item.details.bloodGroup}</Text>
            </View>
          )}

          {/* Report / Dispute (only when unlocked) */}
          {isUnlocked && (
            <>
              {!showDispute ? (
                <TouchableOpacity
                  style={styles.reportBtn}
                  onPress={() => setOpenDisputeFor(item.id)}
                >
                  <Ionicons name="alert-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.reportText}>Report / Dispute</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.disputeBox}>
                  <Text style={styles.disputeTitle}>Describe the issue</Text>
                  <TextInput
                    value={disputeReason}
                    onChangeText={setDisputeReason}
                    placeholder="E.g. misinformation, inappropriate content, payment concern..."
                    style={styles.textInput}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.submitBtn} onPress={() => submitDispute(item.id)}>
                      <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setDisputeReason('');
                        setOpenDisputeFor(null);
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {!isUnlocked && (
            <TouchableOpacity style={[styles.unlockBtn, loading && { opacity: 0.7 }]} onPress={() => handleUnlock(item.id)} disabled={loading}>
              <Text style={styles.unlockText}>Unlock (test) — ₦{UNLOCK_PRICE.toLocaleString()}</Text>
              <Text style={styles.unlockHint}>Includes commission {unlockCommissionPct}%</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        
        <Text style={styles.subheader}>
          {unlockedIds.size > 0 ? `${unlockedIds.size} unlocked` : 'Public listings (images blurred)'}
        </Text>

        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All' : f === 'SURROGATE' ? 'Surrogates' : 'Donors'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9', paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16 },

  // topbar removed; header/actions no longer used
  header: { fontSize: 22, fontWeight: '800', color: BRAND_GREEN },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  walletBtn: { flexDirection: 'row', backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  walletText: { color: ACCENT_WHITE, fontWeight: '800', marginLeft: 6 },
  ghostBtn: { flexDirection: 'row', backgroundColor: '#EEF2F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  ghostText: { color: BRAND_GREEN, fontWeight: '800' },

  subheader: { textAlign: 'center', color: '#4B5563', marginTop: 4, marginBottom: 8 },
  filters: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  filterPill: { backgroundColor: '#E5F5EA', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  filterPillActive: { backgroundColor: BRAND_GREEN },
  filterText: { color: BRAND_GREEN, fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10
  },
  photoWrap: { width: '100%', height: 180, backgroundColor: '#eaeaea' },
  photo: { width: '100%', height: '100%' },

  iconBtn: {
    position: 'absolute',
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  favBtn: { left: 10, backgroundColor: 'rgba(22,163,74,0.9)' },

  lockOverlay: { position: 'absolute', right: 10, top: 10, backgroundColor: 'rgba(22,163,74,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  unlockedOverlay: { backgroundColor: 'rgba(34,197,94,0.95)' },
  lockText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  info: { padding: 14 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#E5F5EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  roleText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { marginTop: 4, color: '#4B5563' },
  note: { marginTop: 8, color: '#6B7280', fontStyle: 'italic' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginRight: 6,
    marginBottom: 6,
  },
  badgeText: { color: '#065F46', fontWeight: '700', fontSize: 12 },

  detailsBox: { marginTop: 10, backgroundColor: '#F1F8F4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D7EFE0' },
  detailsTitle: { fontWeight: '800', color: BRAND_GREEN, marginBottom: 6 },
  detailsLine: { color: '#374151', marginTop: 2 },

  reportBtn: { marginTop: 12, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  reportText: { color: '#fff', fontWeight: '800' },

  disputeBox: { marginTop: 10, backgroundColor: '#fff7ed', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fed7aa' },
  disputeTitle: { fontWeight: '800', color: '#9a3412', marginBottom: 6 },
  textInput: { minHeight: 80, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  submitBtn: { marginTop: 10, backgroundColor: BRAND_GREEN, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flex: 1 },
  submitText: { color: '#fff', fontWeight: '800' },
  cancelBtn: { marginTop: 10, backgroundColor: '#e5e7eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center', flex: 1 },
  cancelText: { color: '#111827', fontWeight: '700' },

  unlockBtn: { marginTop: 12, backgroundColor: BRAND_GREEN, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  unlockText: { color: ACCENT_WHITE, fontWeight: '700' },
  unlockHint: { color: '#E8FFEC', fontSize: 12, marginTop: 4 },
});
