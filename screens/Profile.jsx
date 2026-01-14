// screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#064E3B';
const ACCENT_BG = '#F0FDF4';
const GRAY_TEXT = '#6B7280';
const DARK_TEXT = '#1F2937';
const BG_COLOR = '#F9FAFB';

const { width } = Dimensions.get('window');

export default function Profile({ route, navigation, onLogout }) {
  const role = route?.params?.role || 'User';
  const userId = route?.params?.userId || '0000-0000';

  const [badges, setBadges] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Load badges
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('verification_badges')
          .select('type, status')
          .eq('user_id', userId)
          .eq('status', 'verified');
        if (error) throw error;
        if (on) setBadges((data || []).map((r) => r.type));
      } catch (e) {
        console.log('Badges load error', e?.message || e);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  // Load profile (kyc_documents)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('kyc_documents')
          .select('form_data')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        if (on) setProfileData(data?.form_data || {});
      } catch (e) {
        console.log('Profile load error', e?.message || e);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [userId]);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              setSigningOut(true);
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                await supabase.auth.signOut();
              }
            } catch (e) {
              console.log('Logout error', e?.message || e);
            } finally {
              setSigningOut(false);
              if (onLogout) onLogout();
              else {
                try {
                  navigation.getParent()?.goBack();
                } catch (err) { }
              }
            }
          }
        }
      ]
    );
  };

  const getDisplayName = () => {
    if (!profileData) return 'Guest User';
    const personal = profileData.personal || {};
    const firstName = profileData.first_name || personal.first_name || '';
    const lastName = profileData.last_name || personal.surname || personal.last_name || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    if (profileData.firstName || profileData.lastName) return `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
    return 'Suri User';
  };

  const displayName = getDisplayName();
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const email = profileData?.email || profileData?.personal?.email || 'No email linked';

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={20} color={BRAND_GREEN} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const MenuRow = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={20} color={DARK_TEXT} />
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Decorative Header Background */}
      <LinearGradient
        colors={[BRAND_GREEN, BRAND_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Profile Card Floating Over Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBorder}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.nameText}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role}</Text>
          </View>
          <Text style={styles.idText}>ID: {userId}</Text>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{badges.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Profile</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* Verification Section */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VERIFIED BADGES</Text>
            <View style={styles.badgesRow}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badgeChip}>
                  <Ionicons name="shield-checkmark" size={14} color={BRAND_GREEN} />
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          <View style={styles.card}>
            <InfoRow icon="mail-outline" label="Email" value={email} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" label="Phone" value={profileData?.personal?.phone1 || profileData?.phone || ''} />
            <View style={styles.divider} />
            <InfoRow icon="calendar-outline" label="Date of Birth" value={profileData?.personal?.dob || profileData?.dob || ''} />
            <View style={styles.divider} />
            <InfoRow icon="location-outline" label="Address" value={profileData?.personal?.home_address || 'Not set'} />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.card}>
            <MenuRow icon="notifications-outline" label="Notifications" onPress={() => { }} />
            <View style={styles.divider} />
            <MenuRow icon="lock-closed-outline" label="Privacy & Security" onPress={() => { }} />
            <View style={styles.divider} />
            <MenuRow icon="help-circle-outline" label="Help & Support" onPress={() => { }} />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color={BRAND_GREEN} />
            ) : (
              <Text style={styles.logoutBtnText}>Log Out</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.version}>App Version 1.0.2</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerGradient: {
    height: 200,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100, // Push content down to overlap header
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 24,
  },
  avatarBorder: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 50,
    marginTop: -60, // Pull up out of card
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCENT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_GREEN,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: ACCENT_BG,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: BRAND_GREEN,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  idText: {
    fontSize: 12,
    color: GRAY_TEXT,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  statLabel: {
    fontSize: 11,
    color: GRAY_TEXT,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY_TEXT,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6, // tight padding for list items
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: GRAY_TEXT, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: DARK_TEXT },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 60, marginRight: 12 },

  // Menus
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: DARK_TEXT,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_TEXT,
    marginLeft: 6,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    width: '100%',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
  version: {
    fontSize: 12,
    color: '#9CA3AF',
  }
});
