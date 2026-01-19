// screens/IpDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';

const ProgressBar = ({ progress }) => (
  <View style={styles.progressBarBg}>
    <Animated.View
      style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%` }]}
    />
  </View>
);

export default function IpDashboard({ route, navigation }) {
  const { userId } = route.params || {};
  const [kycStatus, setKycStatus] = useState(null);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    const fetchKyc = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('status, form_progress')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) {
        setKycStatus(data.status);
        setFormProgress(data.form_progress || 0);
      }
    };
    fetchKyc();
  }, [userId]);

  const progressLabel = useMemo(() => {
    if (kycStatus === 'approved') return 'Approved';
    if (kycStatus === 'submitted') return 'Submitted';
    if (kycStatus === 'in_progress') return 'In Progress';
    return 'Not Started';
  }, [kycStatus]);

  const getStatusColor = () => {
    if (kycStatus === 'approved') return '#10B981';
    if (kycStatus === 'submitted') return '#F59E0B';
    if (kycStatus === 'in_progress') return '#3B82F6';
    return '#EF4444';
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.pillActionsRow}>
          <TouchableOpacity
            style={styles.pillAction}
            onPress={() => navigation.navigate('Connect')}
          >
            <Ionicons name="people-outline" size={18} color={BRAND_GREEN} />
            <Text style={styles.pillActionText}>Marketplace</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pillAction}
            onPress={() => navigation.navigate('IpFavorites')}
          >
            <Ionicons name="heart-outline" size={18} color={BRAND_GREEN} />
            <Text style={styles.pillActionText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pillAction}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Ionicons name="wallet-outline" size={18} color={BRAND_GREEN} />
            <Text style={styles.pillActionText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* KYC Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={BRAND_GREEN} />
            <Text style={styles.cardTitle}>KYC Status</Text>
          </View>
          <Text style={styles.cardText}>Your KYC is {progressLabel.toLowerCase()}</Text>
          <ProgressBar progress={formProgress} />
          <Text style={styles.progressLabel}>{formProgress}% complete</Text>
        </View>

        {/* Contracts & Journey */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach-outline" size={20} color={BRAND_GREEN} />
              <Text style={styles.cardTitle}>Contracts</Text>
            </View>
            <Text style={styles.cardText}>No active contracts</Text>
            <TouchableOpacity
              style={styles.cardBtnOutline}
              onPress={() => navigation.navigate('Contracts')}
            >
              <Text style={styles.cardBtnOutlineText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trail-sign-outline" size={20} color={BRAND_GREEN} />
              <Text style={styles.cardTitle}>Journey</Text>
            </View>
            <Text style={styles.cardText}>No milestones yet</Text>
            <TouchableOpacity
              style={styles.cardBtnOutline}
              onPress={() => navigation.navigate('Journey')}
            >
              <Text style={styles.cardBtnOutlineText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={BRAND_GREEN} />
            <Text style={styles.cardTitle}>Messages</Text>
          </View>
          <Text style={styles.cardText}>No new messages</Text>
          <TouchableOpacity
            style={styles.cardBtnOutline}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.cardBtnOutlineText}>Open Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: LIGHT_BG },
  content: { padding: 16 },

  pillActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pillAction: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  pillActionText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8, color: TEXT_PRIMARY },
  cardText: { fontSize: 14, color: TEXT_SECONDARY, marginBottom: 12 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: 8, backgroundColor: BRAND_GREEN, borderRadius: 4 },
  progressLabel: { marginTop: 6, fontSize: 12, color: TEXT_SECONDARY },

  cardBtnOutline: {
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnOutlineText: { color: BRAND_GREEN, fontWeight: '600', fontSize: 14 },

  twoColumnRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfCard: { flex: 1, marginHorizontal: 4 },
});
