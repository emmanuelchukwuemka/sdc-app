// screens/DonorDashboard.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const BRAND_GREEN_DARK = '#15803D';
const LIGHT_BG = '#F8FAF9';

export default function DonorDashboard({ route, navigation }) {
  const { userId } = route.params || {};
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          return;
        }

        const currentUser = await authAPI.getCurrentUser();
        if (currentUser) {
          const userData = {
            first_name: currentUser.first_name || '',
            last_name: currentUser.last_name || '',
            role: currentUser.role,
            email: currentUser.email,
            id: currentUser.id
          };
          setUser(userData);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (error) {
        console.log('Failed to fetch user data:', error);
      }
    };
    fetchUser();
  }, [userId]);

  // Set header options for logout button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => {
          navigation.getParent()?.goBack();
        }} style={{ marginRight: 10 }}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card - Rebranded for Donor */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroWelcome}>
              The Gift of Life
            </Text>
            <Text style={styles.heroRole}>
              Hello, {user?.first_name || 'Donor'}!
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>Eligible to Donate</Text>
            </View>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={40} color="rgba(255,255,255,0.4)" />
          </View>
        </View>

        {/* Donation Stats Quick View */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLab}>Donations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>Active</Text>
            <Text style={styles.statLab}>Status</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("My KYC", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={BRAND_GREEN_DARK} />
            </View>
            <Text style={styles.gridLabel}>KYC Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Chat")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#16A34A" />
            </View>
            <Text style={styles.gridLabel}>Support Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="wallet-outline" size={24} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Donation Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("My Profile", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="person-outline" size={24} color="#15803D" />
            </View>
            <Text style={styles.gridLabel}>My Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <Text style={styles.sectionHeader}>Health & Records</Text>

        <TouchableOpacity style={styles.rowCard}>
          <View style={[styles.miniIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="medkit-outline" size={20} color={BRAND_GREEN_DARK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Medical Screening</Text>
            <Text style={styles.rowSub}>Review your test results</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowCard}>
          <View style={[styles.miniIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="fitness-outline" size={20} color="#4B5563" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Wellness Tips</Text>
            <Text style={styles.rowSub}>Optimize your donation health</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },

  // Hero - Indigo Gradient Style
  heroCard: {
    backgroundColor: BRAND_GREEN_DARK,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: BRAND_GREEN_DARK,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroWelcome: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroRole: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4, marginBottom: 12 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statLab: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F3F4F6' },

  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16, letterSpacing: 0.5 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { 
    width: '48%', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'center' },

  // Rows
  rowCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 18, 
    marginBottom: 12, 
    gap: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F9FAFB'
  },
  miniIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
