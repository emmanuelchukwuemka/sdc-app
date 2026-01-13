// screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';

export default function Profile({ route, onLogout }) {
  const role = route?.params?.role || 'IP';
  const userId = route?.params?.userId || '55555555-5555-5555-5555-555555555555';

  const [badges, setBadges] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Load badges
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('verification_badges')
          .select('type, status')
          .eq('user_id', userId)
          .eq('status', 'verified');
        if (error) throw error;
        if (on) setBadges((data || []).map((r) => r.type));
      } catch (e) {
        console.log('Badges load error', e?.message || e);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  // Load profile (kyc_documents)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('kyc_documents')
          .select('form_data')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        if (on) setProfileData(data?.form_data || null);
      } catch (e) {
        console.log('Profile load error', e?.message || e);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      // Skip actual logout since we're in demo mode
      // await supabase.auth.signOut();
    } catch (e) {
      console.log('Logout error', e?.message || e);
    } finally {
      setSigningOut(false);
      onLogout && onLogout();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Role */}
        <View style={styles.card}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{role}</Text>
        </View>

        {/* User ID */}
        <View style={styles.card}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value} selectable>{userId}</Text>
        </View>

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.label}>Verification Badges</Text>
          {loading ? (
            <ActivityIndicator color={BRAND_GREEN} size="small" />
          ) : badges.length > 0 ? (
            <View style={styles.badgesRow}>
              {badges.map((b) => (
                <View key={b} style={[styles.badgeChip, styles.badgeOn]}>
                  <Text style={[styles.badgeText, styles.badgeTextOn]}>{b}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No badges verified yet.</Text>
          )}
        </View>

        {/* Dynamic Profile Info */}
        <View style={styles.card}>
          <Text style={styles.label}>Profile Information</Text>
          {loading ? (
            <ActivityIndicator color={BRAND_GREEN} size="small" />
          ) : profileData ? (
            Object.entries(profileData).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoKey}>{formatKey(key)}</Text>
                <Text style={styles.infoValue}>{String(value)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No profile data found.</Text>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={signingOut}
        >
          <Text style={styles.logoutText}>
            {signingOut ? 'Signing out…' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper to format JSON keys into readable labels
function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { padding: 16 },
  card: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  label: { color: BRAND_GREEN, fontWeight: '800', marginBottom: 6 },
  value: { color: '#111827' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  badgeText: { fontWeight: '700', fontSize: 12 },
  badgeTextOn: { color: '#065F46' },

  empty: { color: GRAY, fontStyle: 'italic' },

  infoRow: { marginBottom: 8 },
  infoKey: { fontWeight: '700', color: BRAND_GREEN },
  infoValue: { color: '#111827' },

  logoutBtn: {
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#fff', fontWeight: '800' },
});
