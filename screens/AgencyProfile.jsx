// screens/AgencyProfile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceAPI, uploadAPI, userAPI } from '../services/api';
import { getApiBaseUrl } from '../services/api-config';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRAND_GREEN = '#14532D';
const LIGHT_BG = '#F9FAFB';
const BORDER = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function AgencyProfile({ navigation: propNavigation, route }) {
  const navigation = propNavigation || useNavigation();
  const userId = route?.params?.userId;
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    console.log('AgencyProfile userId:', userId);
    if (!userId) {
      console.log('No userId provided to AgencyProfile');
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const data = await marketplaceAPI.getProfile(userId);
        if (mounted) {
          setKyc(data.kyc || null);
          setUser(data.user || null);
        }
      } catch (err) {
        console.log('Profile fetch error:', err.response?.data || err.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    const unsubscribe = navigation.addListener('focus', fetchAll);
    return () => { mounted = false; unsubscribe(); };
  }, [userId, navigation]);

  const onPickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow photo access to update your picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setAvatarUploading(true);

      const uriParts = asset.uri.split('.');
      const ext = uriParts[uriParts.length - 1].toLowerCase() || 'jpg';
      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      const finalExt = validExts.includes(ext) ? ext : 'jpg';
      const contentType = `image/${finalExt === 'jpg' ? 'jpeg' : finalExt}`;

      const uploadResp = await uploadAPI.uploadFile({
        uri: asset.uri,
        type: contentType,
        name: `avatar_${userId}.${finalExt}`
      }, 'avatars');

      const publicUrl = uploadResp.url;

      // Update user profile in backend
      await userAPI.updateProfile(userId, { profile_image: publicUrl });

      // Update local state
      setUser(prev => ({ ...(prev || {}), profile_image: publicUrl }));

      // Update AsyncStorage
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const newUserData = {
          ...userData,
          profile_image: publicUrl
        };
        await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      }

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (e) {
      console.log('Upload error detail:', e.response?.data || e.message || e);
      Alert.alert('Upload Failed', e.response?.data?.error || e.message || 'Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const Section = ({ title, children, rightAction }) => (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>
          {title}
        </Text>
        {rightAction}
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );

  const Row = ({ label, value }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <Text style={{ color: TEXT_MUTED, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Text style={{ color: '#111827', fontWeight: '700', flex: 1, textAlign: 'right' }}>
        {value || '-'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const form = kyc?.form_data || {};
  const details = form.details || {};
  const ops = form.ops || {};
  const compliance = form.compliance || {};
  const repId = form.representative_id || {};
  const referral = form.referral || {};
  const emergency = form.emergency || {};
  const kycStatus = kyc?.status || 'Not Started';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#14532D', '#166534']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>
          Agency Profile
        </Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Hero Section */}
      <View style={styles.heroCard}>
          <TouchableOpacity onPress={onPickAvatar} style={styles.avatarPlaceholder}>
            {user?.profile_image ? (
              <Image 
                source={{ uri: user.profile_image.startsWith('http') ? user.profile_image : `${getApiBaseUrl().replace('/api', '')}${user.profile_image}` }} 
                style={{ width: '100%', height: '100%', borderRadius: 12 }} 
              />
            ) : (
              <Ionicons name="business" size={40} color={BRAND_GREEN} />
            )}
            {avatarUploading && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }]}>
                <ActivityIndicator color={BRAND_GREEN} />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>
              {details.agency_name || 'Agency Name'}
            </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{kycStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
          {/* Agency Details */}
          <Section
            title="Agency Information"
            rightAction={
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditAgencyProfile', {
                    userId,
                    formData: form,
                  })
                }
              >
                <Text style={{ color: BRAND_GREEN, fontWeight: '800' }}>Edit</Text>
              </TouchableOpacity>
            }
          >
            <Row label="Registration No" value={details.registration_number} />
            <Row label="Incorporation Date" value={details.incorporation_date} />
            <Row label="Org. Type" value={details.org_type} />
            <Row label="Main Contact" value={details.primary_contact_name} />
            <Row label="Contact Title" value={details.primary_contact_title} />
            <Row label="Phone 1" value={details.phone1} />
            <Row label="Phone 2" value={details.phone2} />
            <Row label="Official Email" value={details.official_email} />
            <Row label="Website" value={details.website} />
            <Row label="HQ Address" value={details.hq_address} />
            <Row label="Branch Offices" value={details.branch_offices} />
          </Section>

          {/* Operational Info */}
          <Section title="Operational Scope">
            <Text style={styles.subTitle}>Services Provided:</Text>
            <View style={styles.tagWrap}>
              {ops.service_surrogacy && <View style={styles.tag}><Text style={styles.tagText}>Surrogacy</Text></View>}
              {ops.service_egg_donation && <View style={styles.tag}><Text style={styles.tagText}>Egg Donation</Text></View>}
              {ops.service_sperm_donation && <View style={styles.tag}><Text style={styles.tagText}>Sperm Donation</Text></View>}
              {ops.service_ivf_support && <View style={styles.tag}><Text style={styles.tagText}>IVF Support</Text></View>}
              {ops.service_legal && <View style={styles.tag}><Text style={styles.tagText}>Legal Support</Text></View>}
              {ops.service_counseling && <View style={styles.tag}><Text style={styles.tagText}>Counseling</Text></View>}
            </View>
            <Row label="Staff Count" value={ops.staff_count} />
            <Row label="Years Experience" value={ops.years_experience} />
            <Row label="Active Surrogates" value={ops.active_surrogates_count} />
            <Row label="Active Donors" value={ops.active_donors_count} />
            <Row label="Partner Clinics" value={ops.partner_clinics} />
          </Section>

          {/* Compliance */}
          <Section title="Compliance & Legal">
            <Row label="TIN" value={compliance.tin} />
            <Row label="Insurance" value={compliance.insurance_has === true ? 'Yes' : 'No'} />
            <Row label="Insurance Details" value={compliance.insurance_details} />
          </Section>

          {/* Emergency Contacts */}
          <Section title="Emergency Contacts">
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.contactLabel}>Primary Contact</Text>
              <Row label="Name" value={emergency.name1} />
              <Row label="Designation" value={emergency.designation1} />
              <Row label="Phone" value={emergency.phone1} />
              <Row label="Email" value={emergency.email1} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Secondary Contact</Text>
              <Row label="Name" value={emergency.name2} />
              <Row label="Designation" value={emergency.designation2} />
              <Row label="Phone" value={emergency.phone2} />
              <Row label="Email" value={emergency.email2} />
            </View>
          </Section>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  heroCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
    overflow: 'hidden',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  contactLabel: {
    color: BRAND_GREEN,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
});
