// screens/Favorites.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function Favorites({ userId, onBack = () => {}, onOpenChat = () => {} }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // 1) Get all favorites for this IP
      const { data, error } = await supabase
        .from('favorites')
        .select('id, target_user_id, created_at')
        .eq('ip_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const targetIds = data.map(f => f.target_user_id);
      if (targetIds.length === 0) {
        setFavorites([]);
        return;
      }

      // 2) Fetch basic user profiles for those targets
      const { data: users, error: uErr } = await supabase
        .from('kyc_documents')
        .select('user_id as id, role, form_data')
        .in('user_id', targetIds);
      if (uErr) throw uErr;

      // 3) Combine
      const composed = data.map(f => {
        const u = users.find(x => x.id === f.target_user_id);
        return {
          id: f.id,
          userId: f.target_user_id,
          createdAt: f.created_at,
          name: `${u?.form_data?.first_name || ''} ${u?.form_data?.last_name || ''}`.trim() || 'Unnamed',
          role: u?.role || '',
          country: u?.form_data?.country || '',
          avatar: u?.form_data?.profile_image || null,
        };
      });

      setFavorites(composed);
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFavorites(); }, []);

  const removeFavorite = async (favId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favId);
      if (error) throw error;
      setFavorites(prev => prev.filter(f => f.id !== favId));
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={
          item.avatar
            ? { uri: item.avatar }
            : { uri: 'https://via.placeholder.com/80x80.png?text=Avatar' }
        }
        style={styles.photo}
      />
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeFavorite(item.id)}>
            <Ionicons name="heart" size={20} color={BRAND_GREEN} />
          </TouchableOpacity>
        </View>
        <Text style={styles.meta}>{item.role}</Text>
        {item.country ? <Text style={styles.meta}>{item.country}</Text> : null}
        <TouchableOpacity style={styles.chatBtn} onPress={() => onOpenChat(item.userId)}>
          <Ionicons name="chatbubbles" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <Text style={styles.header}>My Favorites</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />
      ) : favorites.length === 0 ? (
        <Text style={styles.empty}>No favorites yet. Tap hearts in Marketplace to add.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: BRAND_GREEN },
  header: { fontSize: 20, fontWeight: '800', color: ACCENT_WHITE },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#15803D', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  backText: { color: '#fff', marginLeft: 6 },

  card: { flexDirection: 'row', backgroundColor: ACCENT_WHITE, borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  photo: { width: 80, height: 80, backgroundColor: '#E5E7EB' },
  info: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { color: GRAY, marginTop: 2 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chatText: { color: '#fff', fontWeight: '700' },

  empty: { textAlign: 'center', marginTop: 24, color: GRAY, fontSize: 16 },
});
