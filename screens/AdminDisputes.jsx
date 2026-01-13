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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

export default function AdminDisputes({ onBack = () => {} }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes')
        .select('id, user_id, profile_id, reason, status, response, created_at, resolved_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDisputes(data || []);
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
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
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          response: responseText.trim(),
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      setRespondingId(null);
      setResponseText('');
      Alert.alert('Resolved', 'Dispute marked as resolved.');
      loadDisputes();
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const renderItem = ({ item }) => {
    const isOpen = item.status !== 'resolved';
    const isResponding = respondingId === item.id;

    return (
      <View style={[styles.card, item.status === 'resolved' && styles.resolvedCard]}>
        <Text style={styles.reason}>Reason: {item.reason}</Text>
        <Text style={styles.meta}>Opened by: {item.user_id}</Text>
        {item.profile_id && <Text style={styles.meta}>Profile disputed: {item.profile_id}</Text>}
        <Text style={styles.meta}>Status: {item.status}</Text>
        <Text style={styles.meta}>
          Created: {new Date(item.created_at).toLocaleString()}
        </Text>

        {item.response && (
          <Text style={styles.responseText}>Admin response: {item.response}</Text>
        )}

        {isOpen && !isResponding && (
          <TouchableOpacity
            style={styles.respondBtn}
            onPress={() => setRespondingId(item.id)}
          >
            <Ionicons name="chatbox-ellipses" size={16} color={ACCENT_WHITE} />
            <Text style={styles.respondText}>Respond & Resolve</Text>
          </TouchableOpacity>
        )}

        {isResponding && (
          <View style={styles.responseBox}>
            <TextInput
              value={responseText}
              onChangeText={setResponseText}
              placeholder="Enter admin response..."
              style={styles.input}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => markResolved(item.id)}
              >
                <Text style={styles.saveText}>Save & Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setRespondingId(null);
                  setResponseText('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <Text style={styles.header}>Disputes Console</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={BRAND_GREEN}
            style={{ marginTop: 20 }}
          />
        ) : disputes.length === 0 ? (
          <Text style={styles.empty}>No disputes filed yet.</Text>
        ) : (
          <FlatList
            data={disputes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, padding: 16 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: { fontSize: 22, fontWeight: '900', color: BRAND_GREEN },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: { color: '#fff', fontWeight: '800', marginLeft: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  resolvedCard: { opacity: 0.7 },
  reason: { fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { color: '#4B5563', fontSize: 13, marginTop: 2 },
  responseText: {
    marginTop: 8,
    color: '#065F46',
    fontWeight: '700',
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 6,
  },
  respondBtn: {
    marginTop: 10,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  respondText: { color: ACCENT_WHITE, fontWeight: '800' },
  responseBox: { marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    minHeight: 60,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: BRAND_GREEN,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: { color: '#fff', fontWeight: '800' },
  cancelBtn: {
    backgroundColor: '#e5e7eb',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: { fontWeight: '700', color: '#111827' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 20, fontSize: 16 },
});
