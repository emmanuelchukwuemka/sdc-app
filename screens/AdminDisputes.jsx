// screens/AdminDisputes.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

export default function AdminDisputes({ onBack = () => { } }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const loadDisputes = async () => {
    try {
      setLoading(true);
      // Get disputes from admin API
      const disputesData = await adminAPI.getDisputes();
      setDisputes(disputesData || []);
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
      // Set fallback data
      setDisputes([
        {
          id: '1',
          title: 'Payment Dispute - Escrow Release',
          status: 'open',
          priority: 'high',
          created_at: new Date().toISOString(),
          involved_parties: ['user-001', 'user-002']
        },
        {
          id: '2',
          title: 'KYC Document Rejection Appeal',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          involved_parties: ['user-003']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const markResolved = async (id) => {
    try {
      if (!responseText.trim()) {
        Alert.alert('Missing', 'Please enter a response before resolving.');
        return;
      }

      await adminAPI.resolveDispute(id, responseText.trim());

      setRespondingId(null);
      setResponseText('');
      Alert.alert('Success', 'Dispute marked as resolved.');
      loadDisputes();
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const StatusBadge = ({ status }) => {
    const isResolved = status === 'resolved';
    return (
      <View style={[styles.badge, isResolved ? styles.badgeResolved : styles.badgeOpen]}>
        <Ionicons
          name={isResolved ? 'checkmark-circle' : 'alert-circle'}
          size={14}
          color={isResolved ? '#065F46' : '#9A3412'}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.badgeText, isResolved ? styles.textResolved : styles.textOpen]}>
          {status}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isOpen = item.status !== 'resolved';
    const isResponding = respondingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarBox}>
              <Ionicons name="person" size={16} color={ACCENT_WHITE} />
            </View>
            <View>
              <Text style={styles.userId}>User: {item.user_id?.slice(0, 8)}...</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.contentBox}>
          <Text style={styles.label}>Reason for Dispute:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
          {item.profile_id && (
            <Text style={styles.metaText}>Target Profile ID: {item.profile_id}</Text>
          )}
        </View>

        {item.response && (
          <View style={styles.adminResponseBox}>
            <View style={styles.responseHeader}>
              <Ionicons name="shield-checkmark" size={16} color={BRAND_GREEN} />
              <Text style={styles.responseTitle}>Admin Resolution</Text>
            </View>
            <Text style={styles.responseText}>{item.response}</Text>
            {item.resolved_at && (
              <Text style={styles.resolvedDate}>Resolved on {new Date(item.resolved_at).toLocaleString()}</Text>
            )}
          </View>
        )}

        {isOpen && !isResponding && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setRespondingId(item.id)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={BRAND_GREEN} />
            <Text style={styles.actionBtnText}>Respond & Resolve</Text>
          </TouchableOpacity>
        )}

        {isResponding && (
          <View style={styles.respondContainer}>
            <Text style={styles.respondLabel}>Enter Resolution:</Text>
            <TextInput
              value={responseText}
              onChangeText={setResponseText}
              placeholder="Explain the resolution..."
              placeholderTextColor={TEXT_SECONDARY}
              style={styles.input}
              multiline
            />
            <View style={styles.respondActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setRespondingId(null);
                  setResponseText('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => markResolved(item.id)}
              >
                <Text style={styles.resolveBtnText}>Resolve Dispute</Text>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.headerTitle}>Disputes Console</Text>
                <Text style={styles.headerSubtitle}>Manage & resolve user issues</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={disputes}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No disputes found.</Text>
                </View>
              }
            />
          )}
        </View>
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
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Card
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userId: {
    fontWeight: '700',
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeOpen: { backgroundColor: '#FFF7ED' },
  badgeResolved: { backgroundColor: '#ECFDF5' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  textOpen: { color: '#9A3412' },
  textResolved: { color: '#065F46' },

  contentBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  metaText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 8,
    fontStyle: 'italic',
  },

  adminResponseBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  responseText: {
    fontSize: 14,
    color: '#14532D',
  },
  resolvedDate: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 6,
    textAlign: 'right',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    marginTop: 4,
  },
  actionBtnText: {
    color: BRAND_GREEN,
    fontWeight: '700',
    marginLeft: 8,
  },

  respondContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  respondLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  respondActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  resolveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '700',
  },
  resolveBtnText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
  },

  emptyState: {
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
