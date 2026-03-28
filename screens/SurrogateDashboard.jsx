// screens/SurrogateDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed Supabase import - using Flask API service instead
import { kycAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';

// Simple horizontal progress bar
const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.progressBarBg}>
      <Animated.View
        style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%` }]}
      />
    </View>
  );
};

export default function SurrogateDashboard({ route, navigation }) {
  const { userId } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [formProgress, setFormProgress] = useState(0);
  const [showTipBanner, setShowTipBanner] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchKyc = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const kycData = await kycAPI.getStatus();
        if (mounted) {
          setKycStatus(kycData?.status ?? null);
          setFormProgress(Math.max(0, Math.min(100, kycData?.form_progress ?? 0)));

          // Show tip banner if not dismissed
          const dismissed = await AsyncStorage.getItem('kycTipDismissed');
          if (dismissed !== 'true' && (kycData?.form_progress ?? 0) < 100) {
            setShowTipBanner(true);
          }
        }
      } catch (err) {
        if (mounted) {
          setKycStatus(null);
          setFormProgress(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchKyc();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const dismissTipBanner = async () => {
    setShowTipBanner(false);
    await AsyncStorage.setItem('kycTipDismissed', 'true');
  };

  // checklist
  const tasks = useMemo(() => {
    const list = [];
    if (!kycStatus || (kycStatus !== 'approved' && formProgress < 100)) {
      list.push('Complete KYC submission');
    }
    return list.slice(0, 3);
  }, [kycStatus, formProgress]);

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card - Nurturing/Growth Focus */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroWelcome}>Empowering Life</Text>
            <Text style={styles.heroRole}>Welcome, Surrogate</Text>
            <View style={styles.kycRow}>
              <View style={[styles.statusTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={kycStatus === 'approved' ? 'checkmark-circle' : 'time'} size={14} color="#fff" />
                <Text style={styles.statusTagText}>{progressLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroIllustration}>
            <Ionicons name="leaf" size={50} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        {/* Profile Completion - Only show if not 100% */}
        {formProgress < 100 && (
          <TouchableOpacity
            style={styles.progressCard}
            onPress={() => navigation.navigate("My KYC", { userId })}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Complete your KYC</Text>
              <Text style={styles.progressPercent}>{formProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${formProgress}%` }]} />
            </View>
            <Text style={styles.progressHint}>Finish your profile to start matching</Text>
          </TouchableOpacity>
        )}

        {/* Journey Status - NEW SECTION */}
        <Text style={styles.sectionHeader}>Journey Status</Text>
        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <Ionicons name="navigate-circle-outline" size={24} color={BRAND_GREEN} />
            <Text style={styles.journeyTitle}>Pre-Matching Stage</Text>
          </View>
          <Text style={styles.journeyDesc}>You are currently in the initial screening phase. Complete your KYC to be visible to Intended Parents.</Text>
          <View style={styles.journeyStepRow}>
            <View style={[styles.journeyStep, styles.stepActive]} />
            <View style={styles.journeyStepLine} />
            <View style={styles.journeyStep} />
            <View style={styles.journeyStepLine} />
            <View style={styles.journeyStep} />
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("My KYC", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text-outline" size={24} color={BRAND_GREEN} />
            </View>
            <Text style={styles.gridLabel}>My KYC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Appointments")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="medkit-outline" size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.gridLabel}>Medical Appt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>My Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Chat")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Support Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Section */}
        {tasks.length > 0 && (
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Ionicons name="list" size={20} color="#4B5563" />
              <Text style={styles.taskTitle}>Next Steps</Text>
            </View>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <Ionicons name="ellipse-outline" size={16} color={BRAND_GREEN} />
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')} style={styles.taskLink}>
              <Text style={styles.taskLinkText}>View All Tasks</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Support Section */}
        <Text style={styles.sectionHeader}>Agency Support</Text>
        <TouchableOpacity 
          style={styles.rowCard} 
          onPress={() => Linking.openURL('tel:09016246947')}
        >
          <View style={[styles.miniIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="call-outline" size={20} color="#4B5563" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Call SDC Support</Text>
            <Text style={styles.rowSub}>Emergency? Speak with a coordinator.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },

  // Hero
  heroCard: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroWelcome: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroRole: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
  heroIllustration: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },

  kycRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },

  // Progress Card
  progressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  progressVal: { fontSize: 14, fontWeight: '800', color: BRAND_GREEN },
  track: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: BRAND_GREEN, borderRadius: 4 },
  progressHint: { fontSize: 12, color: '#6B7280', marginTop: 8 },

  // Journey Status
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16, letterSpacing: 0.5 },
  journeyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  journeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  journeyTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  journeyDesc: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
  journeyStepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  journeyStep: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' },
  stepActive: { backgroundColor: BRAND_GREEN, width: 24, borderRadius: 12 },
  journeyStepLine: { width: 40, height: 2, backgroundColor: '#F3F4F6' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  gridItem: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Tasks
  taskCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  taskTitle: { fontSize: 15, fontWeight: '800', color: '#374151' },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  taskText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  taskLink: { marginTop: 8, alignSelf: 'flex-start' },
  taskLinkText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 13 },

  // Rows
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  miniIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
