// screens/DonorDashboard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';

export default function DonorDashboard({ route, navigation }) {
  const { userId } = route.params || {};

  // Set header options for logout button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => {
          // Trigger logout by going to a custom action
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

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroWelcome}>Welcome back,</Text>
            <Text style={styles.heroRole}>Donor</Text>
          </View>
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>ID: {userId}</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("DonorKycWizard", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text-outline" size={24} color={BRAND_GREEN} />
            </View>
            <Text style={styles.gridLabel}>My KYC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Chat")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="wallet-outline" size={24} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Profile", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="person-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.gridLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <Text style={styles.sectionHeader}>Overview</Text>

        <TouchableOpacity style={styles.rowCard}>
          <View style={[styles.miniIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="heart-outline" size={20} color={BRAND_GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Donation History</Text>
            <Text style={styles.rowSub}>View past donations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowCard}>
          <View style={[styles.miniIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Availability</Text>
            <Text style={styles.rowSub}>Update your schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20 },

  // Hero
  heroCard: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroWelcome: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  heroRole: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  idChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  idChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gridItem: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  // Rows
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  miniIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 12, color: '#6B7280' },
});
