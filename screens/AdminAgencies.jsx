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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Removed Supabase import - using Flask API service instead
import { adminAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F1F5F9';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

export default function AdminAgencies({ onBack = () => { }, onOpenAgency }) {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');

  const loadAgencies = async () => {
    try {
      setLoading(true);
      
      // Fetch agencies from Flask API
      const agencies = await adminAPI.getAgencies();
      
      // Transform agency data to match expected format
      const transformedAgencies = agencies.map(agency => ({
        id: agency.id,
        email: agency.email,
        username: agency.name,
        created_at: agency.created_at
      }));
      
      setAgencies(transformedAgencies);
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
      onPress={() => {
        // Navigate to agency details
        Alert.alert('Agency Details', `Viewing details for ${item.username}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="business" size={24} color={BRAND_GREEN} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{item.username || 'Unnamed Agency'}</Text>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.date}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
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
                <Text style={styles.headerTitle}>Agencies Directory</Text>
                <Text style={styles.headerSubtitle}>{agencies.length} registered partners</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={TEXT_SECONDARY} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={TEXT_SECONDARY}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 8 }}>
                <Ionicons name="close-circle" size={18} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No agencies found.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    paddingTop: 20,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
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
