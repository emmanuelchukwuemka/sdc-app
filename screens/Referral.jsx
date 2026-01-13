// screens/Referral.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

const extra = Constants?.expoConfig?.extra ?? {};
const REF_BASE = extra.referralBaseUrl || 'https://sdc.example/ref';

export default function Referral({ userId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);

        if (!userId) {
          setSaveError('Missing user id. Please re-login.');
          return;
        }

        // 1) Try to fetch an existing code
        const { data: rows, error: selErr } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', userId)
          .limit(1);
        if (selErr) {
          // Table may not exist or RLS may block reads; continue to generate client-side
          setSaveError(selErr?.message || 'Unable to read referral code.');
        }

        if (rows && rows.length > 0) {
          const c = rows[0].code;
          if (!on) return;
          setCode(c);
          setLink(`${REF_BASE}/${encodeURIComponent(c)}`);
          return;
        }

        // 2) Generate a code from userId; fall back to random suffix if collision
        const base = (userId || '').replace(/-/g, '').toUpperCase();
        let gen = `SDC-${base.slice(-6)}`; // eg SDC-3A91F2

        // Prefer upsert on user_id to avoid unique violation flow
        const upsertOnce = async (candidate) => {
          return await supabase
            .from('referral_codes')
            .upsert({ user_id: userId, code: candidate }, { onConflict: 'user_id' });
        };

        let { error: upErr } = await upsertOnce(gen);
        if (upErr) {
          const isDuplicate =
            String(upErr.code) === '23505' ||
            /duplicate|unique/i.test(upErr.message || '');

          if (isDuplicate) {
            const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
            gen = `SDC-${rand}`;
            const retry = await upsertOnce(gen);
            if (retry.error) {
              // Couldn't save, but still present the code for sharing
              setSaveError(retry.error?.message || 'Unable to save referral code.');
            }
          } else {
            // RLS or table missing etc.
            setSaveError(upErr?.message || 'Unable to save referral code.');
          }
        }

        if (!on) return;
        setCode(gen);
        setLink(`${REF_BASE}/${encodeURIComponent(gen)}`);
      } catch (e) {
        // Fully unexpected error; present a generic message but still finish
        setSaveError(e?.message || String(e));
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied', 'Referral link copied to clipboard.');
    } catch (e) {
      Alert.alert('Copy failed', e?.message || String(e));
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({
        title: 'Join SDC',
        message: `Use my referral link to sign up: ${link}`,
        url: link,
      });
    } catch (e) {
      // user may cancel; no alert needed
    }
  };

  return (
    // Align with Wallet: rely on global header and keep small top padding
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Removed local topbar to avoid double header and reduce top spacing */}

      <Text style={styles.subheader}>
        Earn <Text style={{fontWeight:'800'}}>5%</Text> from each unlock made by your referrals.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Referral Code</Text>
            <Text style={styles.bigCode}>{code}</Text>
            <Text style={styles.linkLabel}>Share Link</Text>
            <Text style={styles.linkValue} numberOfLines={1} ellipsizeMode="middle">
              {link}
            </Text>
            {saveError ? (
              <Text style={{ color: '#B45309', marginTop: 6 }}>
                {saveError}
              </Text>
            ) : null}

            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={copyLink}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={shareLink}>
                <Text style={styles.btnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>How it works</Text>
            <Text style={styles.hintLine}>1. Share your link with friends or agencies.</Text>
            <Text style={styles.hintLine}>2. They sign up — we record the referral.</Text>
            <Text style={styles.hintLine}>3. You earn when they unlock profiles.</Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9', paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  header: { fontSize: 22, fontWeight: '800', color: BRAND_GREEN },
  backBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  backText: { color: ACCENT_WHITE, fontWeight: '700' },

  subheader: { textAlign: 'center', color: '#4B5563', marginBottom: 10 },

  card: {
    backgroundColor: ACCENT_WHITE, borderRadius: 16, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6
  },
  cardLabel: { color: '#4B5563', marginBottom: 6 },
  bigCode: { fontSize: 28, fontWeight: '900', color: BRAND_GREEN, letterSpacing: 2, textAlign: 'center', marginBottom: 12 },
  linkLabel: { color: '#4B5563' },
  linkValue: { color: '#111827', fontWeight: '700', marginTop: 4 },

  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  btnPrimary: { backgroundColor: BRAND_GREEN },
  btnGhost: { backgroundColor: '#EEF2F7' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhostText: { color: '#111827' },

  hintBox: { marginTop: 14, backgroundColor: '#F1F8F4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#D7EFE0' },
  hintTitle: { color: BRAND_GREEN, fontWeight: '800', marginBottom: 6 },
  hintLine: { color: '#374151', marginTop: 2 },
});
