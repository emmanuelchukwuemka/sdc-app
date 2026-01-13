// screens/IpDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

const BRAND_GREEN = "#16A34A";
const LIGHT_BG = "#F8FAF9";
const CARD_BG = "#FFFFFF";
const TEXT_PRIMARY = "#1F2937";
const TEXT_SECONDARY = "#6B7280";
const TEXT_LIGHT = "#9CA3AF";

const ProgressBar = ({ progress }) => (
  <View style={styles.progressBarBg}>
    <Animated.View
      style={[styles.progressBarFill, { width: `${Math.min(100, progress)}%` }]}
    />
  </View>
);

export default function IpDashboard({ route, navigation }) {
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
        const { data, error } = await supabase
          .from("kyc_documents")
          .select("status, form_progress")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (mounted) {
          setKycStatus(data?.status ?? null);
          setFormProgress(Math.max(0, Math.min(100, data?.form_progress ?? 0)));

          const dismissed = await AsyncStorage.getItem("kycTipDismissed");
          if (dismissed !== "true" && (data?.form_progress ?? 0) < 100) {
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
    await AsyncStorage.setItem("kycTipDismissed", "true");
  };

  const tasks = useMemo(() => {
    const list = [];
    if (!kycStatus || (kycStatus !== "approved" && formProgress < 100)) {
      list.push("Complete KYC submission");
    }
    return list.slice(0, 3);
  }, [kycStatus, formProgress]);

  const progressLabel = useMemo(() => {
    if (kycStatus === "approved") return "Approved";
    if (kycStatus === "submitted") return "Submitted";
    if (kycStatus === "in_progress") return "In Progress";
    return "Not Started";
  }, [kycStatus]);

  const getStatusColor = () => {
    if (kycStatus === "approved") return "#10B981";
    if (kycStatus === "submitted") return "#F59E0B";
    if (kycStatus === "in_progress") return "#3B82F6";
    return "#EF4444";
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Welcome / Status Card */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroWelcome}>Welcome back,</Text>
            <Text style={styles.heroRole}>Intending Parent</Text>
          </View>

          <View style={styles.kycRow}>
            <View style={[styles.statusTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={kycStatus === 'approved' ? 'checkmark-circle' : 'time'} size={14} color="#fff" />
              <Text style={styles.statusTagText}>{progressLabel}</Text>
            </View>
          </View>

          {formProgress < 100 && (
            <View style={styles.progressWrap}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressText}>Profile Completion</Text>
                <Text style={styles.progressText}>{formProgress}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${formProgress}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("KycIntendingParent", { userId })}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="id-card-outline" size={24} color={BRAND_GREEN} />
            </View>
            <Text style={styles.gridLabel}>My KYC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Wallet")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Marketplace")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="search-outline" size={24} color="#F97316" />
            </View>
            <Text style={styles.gridLabel}>Find Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate("Journey")}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="map-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.gridLabel}>Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Information Cards */}
        <Text style={styles.sectionHeader}>Important Updates</Text>

        {showTipBanner && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipTitle}>Complete your Profile</Text>
            </View>
            <Text style={styles.tipBody}>
              Upload your ID and complete medical info to get verified and start connecting with surrogates.
            </Text>
            <TouchableOpacity onPress={dismissTipBanner} style={styles.tipLink}>
              <Text style={styles.tipLinkText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contracts Teaser */}
        <TouchableOpacity style={styles.rowCard} onPress={() => navigation.navigate("Contracts")}>
          <View style={[styles.miniIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="document-text" size={20} color={BRAND_GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>My Contracts</Text>
            <Text style={styles.rowSub}>View signed agreements</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        {/* Support Teaser */}
        <TouchableOpacity style={styles.rowCard} onPress={() => Alert.alert('Support', 'Contact support@sdc.com')}>
          <View style={[styles.miniIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="headset" size={20} color="#4B5563" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Help & Support</Text>
            <Text style={styles.rowSub}>Questions? We’re here.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20, paddingBottom: 40 },

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
  },
  heroWelcome: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  heroRole: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },

  kycRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusTagText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  progressWrap: { marginTop: 20 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

  // Sections
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Grid Actions
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gridItem: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  // Updates / Rows
  tipCard: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#B45309' },
  tipBody: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  tipLink: { alignSelf: 'flex-end', marginTop: 8 },
  tipLinkText: { color: '#B45309', fontWeight: '700', fontSize: 12 },

  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6 },
  miniIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 12, color: '#6B7280' },
});
