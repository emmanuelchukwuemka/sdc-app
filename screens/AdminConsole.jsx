// screens/AdminConsole.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Supabase import - using Flask API service instead
import { adminAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const { width } = Dimensions.get('window');

const FILTERS = [
  { id: 'pending', label: 'Pending', icon: 'time' },
  { id: 'approved', label: 'Approved', icon: 'checkmark-circle' },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle' },
  { id: 'all', label: 'All Files', icon: 'documents' },
];

export default function AdminConsole({ onBack = () => { } }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch KYC documents from Flask API
      const kycDocs = await adminAPI.getKycDocuments();
      
      // Calculate stats
      const newStats = { pending: 0, approved: 0, rejected: 0, all: kycDocs.length };
      kycDocs.forEach(doc => {
        if (newStats[doc.status] !== undefined) newStats[doc.status]++;
      });
      setStats(newStats);

      // Filter documents based on selected filter
      let filteredRows = kycDocs;
      if (filter !== 'all') {
        filteredRows = kycDocs.filter(doc => doc.status === filter);
      }

      setRows(filteredRows);
    } catch (e) {
      Alert.alert('Load error', e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load, filter]);

  const decide = async (id, action) => {
    try {
      const response = await adminAPI.updateKycDocument(id, action);
      
      await load(); // Reload to update stats and list
      Alert.alert('Success', response.msg);
    } catch (e) {
      Alert.alert('Update failed', e?.message || String(e));
    }
  };

  const StatusBadge = ({ status }) => {
    let bg = '#E2E8F0', color = '#475569', icon = 'help-circle';
    if (status === 'approved') { bg = '#DCFCE7'; color = '#16A34A'; icon = 'checkmark-circle'; }
    else if (status === 'pending') { bg = '#FEF9C3'; color = '#D97706'; icon = 'time'; }
    else if (status === 'rejected') { bg = '#FEE2E2'; color = '#DC2626'; icon = 'close-circle'; }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={14} color={color} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const when = new Date(item.created_at).toLocaleDateString();
    const reviewed = item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color={ACCENT_WHITE} />
            </View>
            <View>
              <Text style={styles.userIdText}>User ID: ...{item.user_id?.slice(-4)}</Text>
              <Text style={styles.dateText}>Uploaded: {when}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {item.file_url ? (
          <Image source={{ uri: item.file_url }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]}>
            <Ionicons name="image-outline" size={40} color={TEXT_SECONDARY} />
            <Text style={{ color: TEXT_SECONDARY, marginTop: 8 }}>No image available</Text>
          </View>
        )}

        {reviewed && (
          <Text style={styles.reviewMeta}>
            <Ionicons name="shield-checkmark-outline" size={14} /> Reviewed on {reviewed}
          </Text>
        )}

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => decide(item.id, 'reject')}
            >
              <Ionicons name="close" size={20} color="#DC2626" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => decide(item.id, 'approve')}
            >
              <Ionicons name="checkmark" size={20} color={ACCENT_WHITE} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
                <Text style={styles.headerTitle}>KYC Verification</Text>
                <Text style={styles.headerSubtitle}>{stats.pending} documents pending review</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Tabs / Filters */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive = filter === item.id;
            return (
              <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setFilter(item.id)}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isActive ? ACCENT_WHITE : TEXT_SECONDARY}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.label} ({stats[item.id] || 0})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={BRAND_GREEN}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No {filter} documents found</Text>
            </View>
          )
        }
        ListFooterComponent={loading && <ActivityIndicator color={BRAND_GREEN} style={{ marginTop: 20 }} />}
      />
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
    marginBottom: 16,
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

  // Tabs
  tabsContainer: {
    height: 50,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: ACCENT_WHITE,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  tabTextActive: {
    color: ACCENT_WHITE,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewMeta: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 12,
    fontStyle: 'italic',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  approveBtn: {
    backgroundColor: BRAND_GREEN,
  },
  rejectText: {
    color: '#DC2626',
    fontWeight: '700',
    marginLeft: 6,
  },
  approveText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    marginLeft: 6,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: TEXT_SECONDARY,
    marginTop: 16,
    fontSize: 16,
  },
});
