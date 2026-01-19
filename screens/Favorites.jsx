// screens/Favorites.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Supabase import - using Flask API service instead
import { favoritesAPI, userAPI } from '../services/api';
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
      const favoriteIds = await favoritesAPI.getFavorites();
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      // 2) Fetch basic user profiles for those targets
      // TODO: Implement bulk user profile fetching in userAPI
      const users = [];
      for (const targetId of favoriteIds) {
        try {
          const user = await userAPI.getProfile(targetId);
          users.push({
            id: targetId,
            role: user.role,
            form_data: {
              first_name: user.first_name,
              last_name: user.last_name
            }
          });
        } catch (err) {
          // Skip users that can't be fetched
          console.log(`Could not fetch user ${targetId}:`, err.message);
        }
      }

      // 3) Combine
      const composed = favoriteIds.map((targetId, index) => {
        const u = users.find(x => x.id === targetId);
        return {
          id: `fav_${targetId}`,
          userId: targetId,
          createdAt: new Date().toISOString(),
          name: `${u?.form_data?.first_name || ''} ${u?.form_data?.last_name || ''}`.trim() || 'Unnamed',
          role: u?.role || '',
          country: '', // Not available in current API
          avatar: null, // Not available in current API
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
      // Extract user ID from our generated favorite ID
      const userIdToRemove = favId.replace('fav_', '');
      await favoritesAPI.removeFavorite(userIdToRemove);
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
            <Ionicons name="heart" size={20} color="#EF4444" />
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
