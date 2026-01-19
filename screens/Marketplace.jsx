// screens/Marketplace.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Supabase import - using Flask API service instead
import { marketplaceAPI, favoritesAPI, badgesAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LISTINGS_RAW } from '../data/listings';
import { toPublicListing } from '../constants/privacy';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#064E3B';
const GRAY_TEXT = '#6B7280';
const DARK_TEXT = '#1F2937';
const BG_COLOR = '#F9FAFB';

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

const UNLOCK_PRICE = 5000;
const DEFAULT_UNLOCK_COMMISSION_PCT = 10;
const { width } = Dimensions.get('window');

export default function Marketplace({
  userId = '00000000-0000-0000-0000-000000000000',
  onOpenChat = () => { },
}) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [unlockCommissionPct, setUnlockCommissionPct] = useState(DEFAULT_UNLOCK_COMMISSION_PCT);
  const [badgesMap, setBadgesMap] = useState({});
  const [openDisputeFor, setOpenDisputeFor] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Derived Data
  const filteredData = useMemo(() => {
    let result = LISTINGS_RAW;
    // Filter by Role
    if (filter !== 'ALL') {
      result = result.filter((x) => x.role === filter);
    }
    // Filter by Search Query (simple contains check on location/role)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.location.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filter, searchQuery]);

  // --- Effects (Data Loading) ---
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const unlocks = await marketplaceAPI.getUnlocks();
        if (on && unlocks) setUnlockedIds(new Set(unlocks));
      } catch (e) { }
    })();
    return () => { on = false; };
  }, [userId]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const favorites = await favoritesAPI.getFavorites();
        if (on && favorites) setFavoriteIds(new Set(favorites));
      } catch (e) { }
    })();
    return () => { on = false; };
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const commissions = await marketplaceAPI.getCommissionSettings();
        if (commissions && commissions.unlock) setUnlockCommissionPct(Number(commissions.unlock));
      } catch (e) { }
    })();
  }, [])

  // Load badges
  useEffect(() => {
    if (unlockedIds.size === 0) return;
    const uuids = Array.from(unlockedIds).map(lid => LISTING_TO_USER[lid] || lid).filter(Boolean);
    if (!uuids.length) return;

    (async () => {
      try {
        const badgesData = await badgesAPI.getBadgesByUsers(uuids);
        const map = {};
        (badgesData || []).forEach(badge => {
          if (badge.status === 'verified') {
            if (!map[badge.user_id]) map[badge.user_id] = [];
            map[badge.user_id].push(badge.type);
          }
        });
        setBadgesMap(map);
      } catch (e) { }
    })();
  }, [unlockedIds]);

  // --- Handlers ---
  const toggleFavorite = async (listingId) => {
    try {
      const targetUserId = LISTING_TO_USER[listingId] || listingId;
      const isFav = favoriteIds.has(targetUserId);

      if (isFav) {
        await favoritesAPI.removeFavorite(targetUserId);
        setFavoriteIds(prev => { const n = new Set(prev); n.delete(targetUserId); return n; });
      } else {
        await favoritesAPI.addFavorite(targetUserId);
        setFavoriteIds(prev => new Set(prev).add(targetUserId));
      }
    } catch (e) { Alert.alert('Error', 'Could not update favorites'); }
  };

  const handleUnlock = async (listingId) => {
    try {
      setLoading(true);
      await marketplaceAPI.unlockProfile(listingId);

      // Simulate escrow/payment logic silently for now or add record
      // ... (existing escrow logic kept simple for UI focus)

      setUnlockedIds(prev => new Set(prev).add(listingId));
      Alert.alert('Success', 'Profile unlocked successfully');
    } catch (err) {
      Alert.alert('Unlock Failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitDispute = async (listingId) => {
    // TODO: Implement dispute submission via API
    // This would require a disputes API endpoint
    setOpenDisputeFor(null);
    Alert.alert("Submitted", "Dispute submitted for review.");
  };

  // --- Render Items ---
  const renderItem = ({ item }) => {
    const isUnlocked = unlockedIds.has(item.id);
    const targetUserId = LISTING_TO_USER[item.id] || item.id;
    const isFav = favoriteIds.has(targetUserId);
    const publicView = toPublicListing(item);
    const badges = badgesMap[targetUserId] || [];
    const showDispute = openDisputeFor === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: publicView.image }}
            style={[styles.image, !isUnlocked && styles.blurredImage]}
            resizeMode="cover"
          />
          {/* Overlay Gradient/Tint for locked items could go here */}

          <View style={styles.cardHeaderOverlay}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{publicView.role}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favButton}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#EF4444" : "#fff"} />
            </TouchableOpacity>
          </View>

          {!isUnlocked && (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={24} color="#fff" />
              <Text style={styles.lockedText}>Locked Profile</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>{isUnlocked && item.details ? item.details.alias || 'Available' : 'Verified Candidate'}</Text>
            {badges.length > 0 && <Ionicons name="shield-checkmark" size={18} color={BRAND_GREEN} />}
          </View>

          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={14} color={GRAY_TEXT} /> {publicView.location}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Age</Text>
              <Text style={styles.statValue}>{publicView.age}</Text>
            </View>
            <View style={[styles.statPill, { marginLeft: 8 }]}>
              <Text style={styles.statLabel}>Availability</Text>
              <Text style={styles.statValue}>{publicView.availability}</Text>
            </View>
          </View>

          {isUnlocked && item.details && (
            <View style={styles.unlockedDetails}>
              <Text style={styles.bioText} numberOfLines={2}>{item.details.bio}</Text>
            </View>
          )}

          <View style={styles.actionContainer}>
            {isUnlocked ? (
              <TouchableOpacity style={styles.chatBtn} onPress={onOpenChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={BRAND_GREEN} style={{ marginRight: 6 }} />
                <Text style={styles.chatBtnText}>Message</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.unlockBtn} onPress={() => handleUnlock(item.id)} disabled={loading}>
                <Text style={styles.unlockBtnText}>Unlock Profile • ₦{UNLOCK_PRICE.toLocaleString()}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dispute Link (Only Unlocked) */}
          {isUnlocked && (
            <TouchableOpacity onPress={() => setOpenDisputeFor(showDispute ? null : item.id)} style={{ alignSelf: 'center', marginTop: 12 }}>
              <Text style={{ color: GRAY_TEXT, fontSize: 12 }}>Report Issue</Text>
            </TouchableOpacity>
          )}

          {/* Inline Dispute Form */}
          {showDispute && (
            <View style={styles.disputeForm}>
              <Text style={styles.disputeHeader}>Report Profile</Text>
              <TextInput
                style={styles.disputeInput}
                placeholder="Reason for reporting..."
                value={disputeReason}
                onChangeText={setDisputeReason}
              />
              <TouchableOpacity style={styles.submitDisputeBtn} onPress={() => submitDispute(item.id)}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity style={styles.walletIcon}>
          <Ionicons name="wallet-outline" size={24} color={DARK_TEXT} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={GRAY_TEXT} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={GRAY_TEXT}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f === 'SURROGATE' ? 'Surrogates' : 'Donors'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />} // Space for bottom tab
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: -0.5,
  },
  walletIcon: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },

  // Search
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK_TEXT,
    height: '100%',
  },

  // Filters
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY_TEXT,
  },
  filterTextActive: {
    color: '#fff',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    opacity: 0.9,
  },
  cardHeaderOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_GREEN,
    textTransform: 'uppercase',
  },
  favButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 20,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)', // iOS only effect, okay to leave
  },
  lockedText: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 8,
  },

  cardBody: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  locationText: {
    fontSize: 13,
    color: GRAY_TEXT,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statPill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: GRAY_TEXT,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  unlockedDetails: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
  },
  bioText: {
    fontSize: 13,
    color: '#166534',
    fontStyle: 'italic',
  },

  // Actions
  actionContainer: {
    width: '100%',
  },
  unlockBtn: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  unlockBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    backgroundColor: '#fff',
  },
  chatBtnText: {
    color: BRAND_GREEN,
    fontWeight: '700',
    fontSize: 15,
  },
  disputeForm: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  disputeHeader: { fontSize: 13, fontWeight: '700', color: '#991B1B', marginBottom: 6 },
  disputeInput: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 13 },
  submitDisputeBtn: { backgroundColor: '#EF4444', alignItems: 'center', padding: 8, borderRadius: 8 },

});
