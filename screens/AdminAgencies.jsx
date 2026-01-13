// screens/AdminAgencies.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

export default function AdminAgencies({ onBack = () => {}, onOpenAgency }) {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username')
        .eq('role', 'AGENCY');
      if (error) throw error;
      setAgencies(data || []);
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
  }, []);

  const filtered = agencies.filter((a) => {
    const term = search.toLowerCase();
    return (
      (a.username && a.username.toLowerCase().includes(term)) ||
      (a.email && a.email.toLowerCase().includes(term))
    );
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onOpenAgency(item.id)}
    >
      <Ionicons
        name="business"
        size={20}
        color={BRAND_GREEN}
        style={{ marginRight: 8 }}
      />
      <View>
        <Text style={styles.name}>{item.username || item.email || 'Unnamed'}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <Text style={styles.header}>Agencies</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.search}
          placeholder="Search agencies..."
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No agencies found.</Text>
        ) : (
          <FlatList
            data={filtered}
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

  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  name: { fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 20 },
});
