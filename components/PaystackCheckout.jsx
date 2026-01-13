// components/PaystackCheckout.jsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { Paystack } from 'react-native-paystack-webview';

const BRAND_GREEN = '#16A34A';

export default function PaystackCheckout({
  visible,
  onClose,
  onSuccess,
  email = 'agency+test@example.com',
  amountNaira = 0,            // number in Naira (e.g., 20000)
  reference,                   // optional custom reference string
  metadata = {},
}) {
  const paystackKey = Constants?.expoConfig?.extra?.paystackPublicKey;

  if (!paystackKey) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>Missing Paystack Key</Text>
            <Text style={styles.text}>
              Add {"expo.extra.paystackPublicKey"} to your app.json, then reload the app.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // The library expects amount as a string (Naira). It handles conversion internally.
  const amountString = Number(amountNaira || 0).toFixed(2);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Paystack
        paystackKey={paystackKey}
        amount={amountString}
        billingEmail={email}
        billingName="Agency Subscription"
        activityIndicatorColor={BRAND_GREEN}
        currency="NGN"
        channels={['card', 'bank', 'ussd']}
        refNumber={reference}        // optional; Paystack will generate if not provided
        metadata={metadata}
        autoStart={true}
        onCancel={() => onClose?.()}
        onSuccess={(res) => {
          // Typical shape: res?.data?.transactionRef?.reference
          try {
            const ref = res?.data?.transactionRef?.reference || reference || 'N/A';
            onSuccess?.({ ok: true, reference: ref, raw: res });
          } catch (e) {
            onSuccess?.({ ok: true, reference, raw: res });
          }
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '92%' },
  title: { fontSize: 18, fontWeight: '800', color: BRAND_GREEN, marginBottom: 8 },
  text: { color: '#374151', marginBottom: 12 },
  btn: { backgroundColor: BRAND_GREEN, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
});
