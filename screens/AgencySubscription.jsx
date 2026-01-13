// screens/AgencySubscription.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import AlertModal from '../components/AlertModal';
import PaystackCheckout from '../components/PaystackCheckout';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

// Test prices in NGN (adjust later as needed)
const PLAN_PRICES_NGN = {
  monthly: 20000,
  yearly: 200000,
};

// (Kept for later in 2b – not used in 2a)
const DEFAULT_SUB_COMMISSION_PCT = 10.0;
const REFERRAL_PERCENT = 5.0;

export default function AgencySubscription({ userId, onSelect = () => {} }) {
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
  const [billingEmail, setBillingEmail] = useState('agency+test@example.com');
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

  // Load auth email (if available) for Paystack receipt
  // Skipped for demo mode - using default email
  useEffect(() => {
    // Using default test email for demo
    setBillingEmail('demo@example.com');
  }, []);

  const openCheckout = (period /* 'monthly' | 'yearly' */) => {
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
    setMessage(`Payment successful. Ref: ${ref}\n(We’ll activate your subscription in step 2b.)`);
    onSelect(selectedPlan); // keep your existing callback behavior
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <View style={styles.container}>
        <Text style={styles.header}>Agency Subscription</Text>
        <Text style={styles.subheader}>Choose a plan to continue</Text>

        <View style={styles.plansRow}>
          <TouchableOpacity
            style={styles.planCard}
            disabled={busy}
            onPress={() => openCheckout('monthly')}
          >
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>₦{PLAN_PRICES_NGN.monthly.toLocaleString()}</Text>
            <Text style={styles.planHint}>Billed every month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.planCard}
            disabled={busy}
            onPress={() => openCheckout('yearly')}
          >
            <Text style={styles.planName}>Yearly</Text>
            <Text style={styles.planPrice}>₦{PLAN_PRICES_NGN.yearly.toLocaleString()}</Text>
            <Text style={styles.planHint}>Save with annual billing</Text>
          </TouchableOpacity>
        </View>

        {busy && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}

        {!!message && (
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>{message}</Text>
          </View>
        )}
      </View>

      {/* Paystack Modal */}
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
          purpose: 'agency_subscription_2a',
        }}
      />

      {/* Alert Modal */}
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
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9', paddingTop: 16, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: '800', color: BRAND_GREEN, textAlign: 'center' },
  subheader: { textAlign: 'center', color: '#4B5563', marginTop: 4 },
  plansRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  planCard: {
    flex: 1, backgroundColor: ACCENT_WHITE, borderRadius: 16, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6
  },
  planName: { color: BRAND_GREEN, fontWeight: '900', fontSize: 16 },
  planPrice: { color: '#111827', fontWeight: '800', fontSize: 18, marginTop: 6 },
  planHint: { color: '#6B7280', marginTop: 4 },
  msgBox: { marginTop: 14, backgroundColor: '#F1F8F4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#D7EFE0' },
  msgText: { color: '#374151' },
});
