// screens/SurrogateConnect.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';

export default function SurrogateConnect({ route, userId: userIdProp }) {
  const routeUid = route?.params?.userId;
  const userId = userIdProp ?? routeUid;
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        // Fetch intending parents who paid for this surrogate
        const { data, error } = await supabase
          .from('surrogate_connections') // ✅ new table or view
          .select('id, parent_name, amount_paid, created_at, status')
          .eq('surrogate_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setConnections(data || []);
      } catch (e) {
        console.log('Error loading connections:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="person-circle-outline" size={22} color={BRAND_GREEN} />
        <Text style={styles.parentName}>{item.parent_name}</Text>
      </View>
      <Text style={styles.detail}>Amount Paid: ₦{item.amount_paid?.toLocaleString()}</Text>
      <Text style={styles.detail}>Status: {item.status}</Text>
      <Text style={styles.date}>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Ionicons name="people-circle" size={32} color={BRAND_GREEN} />
          <View>
            <Text style={styles.headerTitle}>My Connections</Text>
            <Text style={styles.headerSub}>Intended Parents matched with you</Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={BRAND_GREEN} />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : connections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Connections Yet</Text>
            <Text style={styles.emptyText}>
              When an Intended Parent pays to unlock your profile, they will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={connections}
            keyExtractor={(x) => x.id.toString()}
            contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.parent_name ? item.parent_name.charAt(0).toUpperCase() : 'IP'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.parentName}>{item.parent_name || 'Intended Parent'}</Text>
                    <Text style={styles.dateLabel}>Connected on {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#DEF7EC' : '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'active' ? '#03543F' : '#374151' }]}>
                      {item.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Fee Paid</Text>
                    <Text style={styles.infoValue}>₦{item.amount_paid?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.actions}>
                    <View style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="chatbubble" size={16} color={BRAND_GREEN} />
                      <Text style={styles.actionText}>Chat</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  headerContainer: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280' },

  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#6B7280', maxWidth: '70%', lineHeight: 22 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },

  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND_GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  parentName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: BRAND_GREEN },
});
