// screens/Referral.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BRAND_GREEN = '#16A34A';
const SECONDARY_GREEN = '#22C55E';
const ACCENT_WHITE = '#FFFFFF';

const extra = Constants?.expoConfig?.extra ?? {};
const REF_BASE = extra.referralBaseUrl || 'https://sdc.example/ref';

export default function Referral({ userId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [saveError, setSaveError] = useState('');

  // Statistics Placeholders (Demo)
  const [stats, setStats] = useState({
    totalReferrals: 0,
    earned: 0,
    pending: 0,
  });

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);

        if (!userId) {
          setSaveError('Missing user id. Please re-login.');
          return;
        }

        // Fetch user basic stats if needed, or use placeholders
        // For now, let's keep it demo-friendly as requested for aesthetics

        // 1) Try to fetch an existing code
        const { data: rows, error: selErr } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', userId)
          .limit(1);

        if (rows && rows.length > 0) {
          const c = rows[0].code;
          if (!on) return;
          setCode(c);
          setLink(`${REF_BASE}/${encodeURIComponent(c)}`);
          return;
        }

        // 2) Generate a code
        const base = (userId || '').replace(/-/g, '').toUpperCase();
        let gen = `SDC-${base.slice(-6)}`;

        const upsertOnce = async (candidate) => {
          return await supabase
            .from('referral_codes')
            .upsert({ user_id: userId, code: candidate }, { onConflict: 'user_id' });
        };

        let { error: upErr } = await upsertOnce(gen);
        if (upErr) {
          const isDuplicate = String(upErr.code) === '23505' || /duplicate|unique/i.test(upErr.message || '');
          if (isDuplicate) {
            const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
            gen = `SDC-${rand}`;
            await upsertOnce(gen);
          }
        }

        if (!on) return;
        setCode(gen);
        setLink(`${REF_BASE}/${encodeURIComponent(gen)}`);
      } catch (e) {
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
      Alert.alert('Link Copied', 'Your referral link is ready to share!');
    } catch (e) {
      Alert.alert('Copy failed', e?.message || String(e));
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({
        title: 'Join SDC',
        message: `Join me on Surrogacy & Donor Connect! Use my link to sign up: ${link}`,
        url: link,
      });
    } catch (e) { }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
        <Text style={styles.loaderText}>Generating your code...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Premium Header */}
        <LinearGradient
          colors={[BRAND_GREEN, SECONDARY_GREEN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Earn & Grow</Text>
              <Text style={styles.headerSubtitle}>
                Invite others and earn <Text style={styles.bold}>5%</Text> commission on every profile unlock.
              </Text>
            </View>
            <View style={styles.headerIconCircle}>
              <Ionicons name="gift" size={32} color={BRAND_GREEN} />
            </View>
          </View>

          {/* Mini Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalReferrals}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{stats.earned.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{stats.pending.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Code & Share Section */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardTitle}>Your Referral Details</Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>REFERRAL CODE</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{code}</Text>
              <TouchableOpacity onPress={() => Clipboard.setStringAsync(code).then(() => Alert.alert("Code Copied!"))}>
                <Ionicons name="copy-outline" size={20} color={BRAND_GREEN} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.codeLabel}>PERSONAL LINK</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={copyLink}>
              <Ionicons name="link-outline" size={18} color={BRAND_GREEN} />
              <Text style={styles.secondaryBtnText}>Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={shareLink}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Share Code</Text>
            </TouchableOpacity>
          </View>

          {saveError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B45309" />
              <Text style={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </View>

        {/* How it works */}
        <View style={styles.hintSection}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="share-outline" size={20} color={BRAND_GREEN} />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>Share your link</Text>
              <Text style={styles.stepDesc}>Send your unique code to friends, family or agencies.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="person-add-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>They register</Text>
              <Text style={styles.stepDesc}>When they sign up using your link, we link them to you.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="trending-up-outline" size={20} color="#2196F3" />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepDesc}>Get 5% of all profile unlock fees paid by your referrals.</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAF9' },
  loaderText: { marginTop: 12, color: '#6B7280', fontWeight: '500' },

  // Header
  headerCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTextWrap: { flex: 1, marginRight: 15 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  bold: { fontWeight: '800' },
  headerIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 15,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Main Card
  mainCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mainCardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20 },

  codeContainer: { marginBottom: 16 },
  linkContainer: { marginBottom: 20 },
  codeLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  codeText: { fontSize: 22, fontWeight: '900', color: BRAND_GREEN, letterSpacing: 2 },
  linkBox: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  linkText: { fontSize: 14, color: '#374151', fontWeight: '500' },

  actionRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1, backgroundColor: BRAND_GREEN, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    flex: 1, backgroundColor: '#F0FDF4', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  secondaryBtnText: { color: BRAND_GREEN, fontWeight: '800', fontSize: 15 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#FFFBEB', padding: 8, borderRadius: 8 },
  errorText: { fontSize: 12, color: '#B45309', fontWeight: '500' },

  // Hint Section
  hintSection: { paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  stepRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  stepIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  stepTextContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
