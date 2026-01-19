// screens/AgencySubscription.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import AlertModal from '../components/AlertModal';
import PaystackCheckout from '../components/PaystackCheckout';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const LIGHT_BG = '#F8FAF9';
const DARK = '#111827';
const GRAY = '#6B7280';

const PLAN_PRICES_NGN = {
  monthly: 20000,
  yearly: 200000,
};

const FEATURES = [
  'Unlimited Profile Access',
  'Priority Matching',
  'Agency Badge & Verification',
  'Analytics Dashboard',
  'Priority Support',
];

export default function AgencySubscription({ userId, onSelect = () => { } }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  // Paystack modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingEmail, setBillingEmail] = useState('demo@example.com');
  const [reference, setReference] = useState(null);
  const [amountNaira, setAmountNaira] = useState(0);

  const showAlert = (title, message, type = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => setAlertVisible(false);
  const handleAlertClose = () => setAlertVisible(false);

  useEffect(() => {
    // In real app, fetch user email
    setBillingEmail('agency@sdc-platform.com');
  }, []);

  const openCheckout = (period) => {
    try {
      setMessage('');
      setSelectedPlan(period);
      const naira = PLAN_PRICES_NGN[period] || 0;
      setAmountNaira(naira);
      setReference(`SUB-${period.toUpperCase()}-${Date.now()}`);
      setCheckoutOpen(true);
    } catch (e) {
      showAlert('Subscription Error', e?.message || String(e), 'error');
    }
  };

  const handlePaySuccess = ({ reference: ref }) => {
    setCheckoutOpen(false);
    setMessage(`Payment successful. Ref: ${ref}`);
    onSelect(selectedPlan);
  };

  const PlanCard = ({ period, price, isYearly }) => (
    <View style={styles.planCard}>
      {isYearly && (
        <View style={styles.bestValue}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{period.toUpperCase()}</Text>
        <Text style={styles.planPrice}>₦{price.toLocaleString()}</Text>
        <Text style={styles.planDuration}>per {period === 'yearly' ? 'year' : 'month'}</Text>
      </View>

      <View style={styles.featureList}>
        {FEATURES.map((item, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color={BRAND_GREEN} />
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.planBtn, isYearly ? styles.planBtnPrimary : styles.planBtnSecondary]}
        onPress={() => openCheckout(period)}
        disabled={busy}
      >
        <Text style={[styles.planBtnText, isYearly ? styles.planBtnTextPrimary : styles.planBtnTextSecondary]}>
          Choose {period === 'yearly' ? 'Yearly' : 'Monthly'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <LinearGradient
        colors={[BRAND_GREEN, SECONDARY_GREEN]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Premium Agency Plan</Text>
          <Text style={styles.headerSubtitle}>
            Unlock full access to the SDC network and start connecting today.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.plansContainer}>
          <PlanCard period="monthly" price={PLAN_PRICES_NGN.monthly} />
          <PlanCard period="yearly" price={PLAN_PRICES_NGN.yearly} isYearly />
        </View>

        {busy && <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />}

        {!!message && (
          <View style={styles.msgBox}>
            <Ionicons name="checkmark-done-circle" size={24} color={BRAND_GREEN} />
            <Text style={styles.msgText}>{message}</Text>
          </View>
        )}

        <View style={styles.footerInfo}>
          <Ionicons name="shield-checkmark" size={16} color={GRAY} />
          <Text style={styles.footerText}>Secure payment powered by Paystack</Text>
        </View>
      </ScrollView>

      <PaystackCheckout
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handlePaySuccess}
        email={billingEmail}
        amountNaira={amountNaira}
        reference={reference}
        metadata={{
          user_id: userId,
          plan: selectedPlan,
          purpose: 'agency_subscription',
        }}
      />

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onConfirm={handleAlertConfirm}
        onClose={handleAlertClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    paddingTop: 40,
    paddingHorizontal: 25,
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 },

  scroll: { padding: 20, paddingBottom: 40 },
  plansContainer: { gap: 20 },

  planCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bestValue: {
    position: 'absolute',
    top: 15,
    right: -30,
    backgroundColor: '#FACC15',
    paddingVertical: 5,
    paddingHorizontal: 40,
    transform: [{ rotate: '45deg' }],
  },
  bestValueText: { color: DARK, fontSize: 10, fontWeight: '900' },

  planHeader: { alignItems: 'center', marginBottom: 20 },
  planName: { fontSize: 12, fontWeight: '900', color: GRAY, letterSpacing: 1.5, marginBottom: 5 },
  planPrice: { fontSize: 32, fontWeight: '900', color: DARK },
  planDuration: { fontSize: 13, color: GRAY, marginTop: 2 },

  featureList: { marginBottom: 25, gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  planBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  planBtnPrimary: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN },
  planBtnSecondary: { backgroundColor: 'transparent', borderColor: BRAND_GREEN },
  planBtnText: { fontSize: 16, fontWeight: '800' },
  planBtnTextPrimary: { color: '#fff' },
  planBtnTextSecondary: { color: BRAND_GREEN },

  msgBox: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 15,
    borderRadius: 15,
    gap: 12
  },
  msgText: { color: '#166534', fontWeight: '600', flex: 1 },

  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 6 },
  footerText: { color: GRAY, fontSize: 12, fontWeight: '600' },
});
