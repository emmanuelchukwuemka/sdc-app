// screens/Notifications.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Removed Supabase import - using Flask API service instead
import { notificationsAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const LIGHT_BG = '#F8FAF9';

export default function Notifications({ route, navigation }) {
  const { userId } = route?.params || {};

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch notifications from Flask API
      const notifications = await notificationsAPI.getNotifications();
      setNotifications(notifications);
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      // Update notification status via Flask API
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* ✅ TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ✅ Content */}
      <View style={styles.contentWrap}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND_GREEN} />
            <Text style={styles.loadingText}>Loading notifications…</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.itemRow,
                  item.status !== 'read' && styles.unreadCard,
                ]}
              >
                <Ionicons
                  name={
                    item.severity === 'warning'
                      ? 'warning-outline'
                      : (item.status === 'unread' ? 'mail-unread-outline' : 'mail-open-outline')
                  }
                  size={20}
                  color={BRAND_GREEN}
                />
                <View style={styles.itemBody}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.status !== 'read' && (
                      <TouchableOpacity
                        style={styles.markBtn}
                        onPress={() => markAsRead(item.id)}
                      >
                        <Ionicons name="checkmark-done" size={14} color="#fff" />
                        <Text style={styles.markText}>Mark as read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.itemText}>{item.body}</Text>
                  <Text style={styles.itemTime}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* ✅ Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('SurrogateHome', { userId })}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
  },

  // ✅ TopBar
  header: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // ✅ Content
  contentWrap: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Notification item styles
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    marginBottom: 10,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: BRAND_GREEN,
    backgroundColor: '#E6F9EE',
  },
  itemBody: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: { color: '#111827', fontWeight: '700' },
  itemText: { color: '#374151', marginTop: 2 },
  itemTime: { color: '#6B7280', fontSize: 12, marginTop: 4 },

  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markText: { color: ACCENT_WHITE, fontSize: 12, marginLeft: 4 },

  // Empty / Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 8, color: '#6B7280' },

  // ✅ Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingVertical: 12,
  },
  navItem: { alignItems: 'center' },
  navText: { color: '#fff', fontSize: 12, marginTop: 2 },
});
