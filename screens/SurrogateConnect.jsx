// screens/SurrogateConnect.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';

export default function SurrogateConnect({ route, userId: userIdProp, navigation }) {
  const routeUid = route?.params?.userId;
  const userId = userIdProp ?? routeUid;
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('surrogate_connections')
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

  const renderStats = () => (
    <View style={styles.statsBar}>
      <View style={styles.statBox}>
        <Text style={styles.statNum}>{connections.length}</Text>
        <Text style={styles.statLab}>Matches</Text>
      </View>
      <View style={styles.statSep} />
      <View style={styles.statBox}>
        <Text style={styles.statNum}>
          {connections.filter(c => c.status === 'active').length}
        </Text>
        <Text style={styles.statLab}>Active</Text>
      </View>
      <View style={styles.statSep} />
      <View style={styles.statBox}>
        <Text style={styles.statNum}>
          {new Set(connections.map(c => new Date(c.created_at).getMonth())).size}
        </Text>
        <Text style={styles.statLab}>Months</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Premium Header */}
      <LinearGradient
        colors={[BRAND_GREEN, SECONDARY_GREEN]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerArea}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Connections</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSub}>Manage your interactions with Intended Parents</Text>

        {renderStats()}
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={BRAND_GREEN} />
            <Text style={styles.loadingText}>Searching matches...</Text>
          </View>
        ) : connections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Ionicons name="people-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Stay Tuned!</Text>
            <Text style={styles.emptyTxt}>
              Matches will appear here once an Intended Parent shows interest.
            </Text>
          </View>
        ) : (
          <FlatList
            data={connections}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.connCard}>
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={[BRAND_GREEN, SECONDARY_GREEN]}
                    style={styles.avatarGradient}
                  >
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarInitial}>
                        {item.parent_name ? item.parent_name.charAt(0).toUpperCase() : 'IP'}
                      </Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.nameSection}>
                    <Text style={styles.pName}>{item.parent_name || 'Intended Parent'}</Text>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-clear-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.pDate}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#DCFCE7' : '#F3F4F6' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'active' ? '#166534' : '#4B5563' }]}>
                      {item.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardLine} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.feeLabel}>Unlock Fee</Text>
                    <Text style={styles.feeValue}>₦{item.amount_paid?.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.chatAction}
                    onPress={() => navigation?.navigate('Chat', { conversationId: 'demo-chat' })}
                  >
                    <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
                    <Text style={styles.chatActionText}>Open Chat</Text>
                  </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  headerArea: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLab: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 2 },
  statSep: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },

  body: { flex: 1, marginTop: -15 },
  listContent: { padding: 20, paddingTop: 10, paddingBottom: 60 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 12, color: '#6B7280', fontWeight: '500' },

  emptyWrap: { flex: 1, alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  emptyTxt: { textAlign: 'center', color: '#6B7280', lineHeight: 22 },

  // Cards
  connCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarGradient: { width: 50, height: 50, borderRadius: 25, padding: 2 },
  avatarInner: { flex: 1, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '900', color: BRAND_GREEN },

  nameSection: { flex: 1, marginLeft: 15 },
  pName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pDate: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  cardLine: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  feeValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },

  chatAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  chatActionText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
