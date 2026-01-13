// screens/SurrogateAppointments.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';

export default function SurrogateAppointments({ route, navigation }) {
  const { userId } = route?.params || {};

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* ✅ TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* ✅ Content */}
      <View style={styles.contentWrap}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Original Header Row with Calendar */}
          <View style={styles.headerRow}>
            <Ionicons name="calendar-outline" size={28} color={BRAND_GREEN} />
            <Text style={styles.title}>Appointments</Text>
          </View>

          <Text style={styles.subtitle}>
            Manage and view your clinic and coordination appointments
          </Text>

          {/* Upcoming Appointments */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming</Text>
            <Text style={styles.cardText}>No upcoming appointments yet.</Text>
          </View>

          {/* Past Appointments */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Past</Text>
            <Text style={styles.cardText}>Your past appointments will appear here.</Text>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              // TODO: hook up booking flow
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Book Appointment</Text>
          </TouchableOpacity>

          {/* Meta Info */}
          {userId ? <Text style={styles.metaText}>User ID: {userId}</Text> : null}
        </ScrollView>
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
    backgroundColor: BRAND_GREEN, // ✅ Green covers safe areas
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

  // ✅ Content Wrapper
  contentWrap: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: { padding: 16, paddingBottom: 100 },

  // Original Header Row with Calendar
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { marginLeft: 8, fontSize: 18, fontWeight: '800', color: BRAND_GREEN },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  // ✅ Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: BRAND_GREEN, marginBottom: 6 },
  cardText: { fontSize: 13, color: '#374151' },

  // ✅ Primary Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', marginLeft: 8 },

  metaText: { color: '#6B7280', fontSize: 11, marginTop: 12 },

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
