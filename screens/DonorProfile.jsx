// screens/DonorProfile.jsx
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F9FAFB';
const BORDER = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function DonorProfile({ navigation: propNavigation, route }) {
  const navigation = propNavigation || useNavigation();
  const userId = route?.params?.userId;
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    console.log('DonorProfile userId:', userId);
    if (!userId) {
      console.log('No userId provided to DonorProfile');
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
  const personal = form.personal || {};
  const medical = form.medical || {};
  const reproductive = form.reproductive || {};
  const identification = form.identification || {};
  const referral = form.referral || {};
  const emergency = form.emergency || {};
  const kycStatus = kyc?.status || 'Not Started';

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

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        {
          compress: 0.8,
          format: finalExt === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      const uploadResp = await uploadAPI.uploadFile({
        uri: asset.uri,
        type: `image/${finalExt === 'jpg' ? 'jpeg' : finalExt}`,
        name: `avatar_${userId}.${finalExt}`
      }, 'avatars');

      const publicUrl = uploadResp.url;
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

      Alert.alert('Profile updated', 'Your profile picture has been updated.');
    } catch (e) {
      console.log('Upload error detail:', e.response?.data || e.message || e);
      Alert.alert('Upload failed', e.response?.data?.error || e.message || 'Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#16A34A', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>
          My Profile
        </Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Avatar Card */}
      <View style={styles.avatarCard}>
        <View style={{ position: 'relative', marginRight: 14 }}>
          {user?.profile_image ? (
            <Image
              source={{ uri: user.profile_image.startsWith('http') ? user.profile_image : `${getApiBaseUrl().replace('/api', '')}${user.profile_image}` }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={38} color={TEXT_MUTED} />
            </View>
          )}

          <TouchableOpacity
            onPress={onPickAvatar}
            style={styles.cameraBtn}
            disabled={avatarUploading}
          >
            {avatarUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
            {`${personal.first_name || user?.first_name || ''} ${personal.surname || user?.last_name || ''}`}
          </Text>
          <Text style={{ color: TEXT_MUTED, fontWeight: '600' }}>
            Donor • ID {userId || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
          {/* Personal Info */}
          <Section
            title="Personal information"
            rightAction={
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditDonorProfile', {
                    userId,
                    formData: form,
                  })
                }
              >
                <Text style={{ color: BRAND_GREEN, fontWeight: '800' }}>Edit</Text>
              </TouchableOpacity>
            }
          >
            <Row label="Title" value={personal.title} />
            <Row label="Full name" value={`${personal.first_name || ''} ${personal.middle_name || ''} ${personal.surname || ''}`} />
            <Row label="Email" value={personal.email} />
            <Row label="Phone 1" value={personal.phone1} />
            <Row label="Phone 2" value={personal.phone2} />
            <Row label="Date of birth" value={personal.dob} />
            <Row label="Nationality" value={personal.nationality} />
            <Row label="State of Birth" value={personal.state_of_birth} />
            <Row label="Place of Birth" value={personal.place_of_birth} />
            <Row label="Home Address" value={personal.home_address} />
            <Row label="Office Address" value={personal.office_address} />
          </Section>

          {/* Verification & KYC */}
          <Section
            title="Verification & KYC"
            rightAction={
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{kycStatus}</Text>
              </View>
            }
          >
            <Row label="KYC status" value={kycStatus} />
            <Row label="Last update" value={kyc?.created_at ? new Date(kyc.created_at).toLocaleDateString() : '-'} />
          </Section>

          {/* Medical & Genetic Info */}
          <Section title="Medical & Genetic Summary">
            <Row label="Blood type" value={medical.blood_group} />
            <Row label="Genotype" value={medical.genotype} />
            <Row label="Height" value={medical.height} />
            <Row label="Weight" value={medical.weight} />
            <Row label="Eye Color" value={medical.eye_color} />
            <Row label="Hair Color" value={medical.hair_color} />
            <Row label="Skin Tone" value={medical.skin_tone} />
            <Row label="Occupation" value={medical.occupation} />
            <Row label="Hereditary Illness" value={medical.hereditary_illness} />
            <Row label="Medical Conditions" value={medical.medical_conditions} />
            <Row label="Lifestyle Habits" value={medical.lifestyle_habits} />
            <Row label="Donated before" value={medical.donated_before} />
            <Row label="Donation count" value={medical.donation_count} />
          </Section>

          {/* Reproductive Info */}
          <Section title="Reproductive Information">
            <Row label="Menstrual Cycle" value={reproductive.menstrual_cycle} />
            <Row label="Fertility Treatments" value={reproductive.fertility_treatments} />
            <Row label="Number of Children" value={reproductive.children_count} />
            <Row label="Last Semen Analysis" value={reproductive.semen_analysis_date} />
            <Row label="STI History" value={reproductive.stis_history} />
          </Section>

          {/* Identification */}
          <Section title="Identification">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {identification.passport && <View style={styles.badge}><Text style={styles.badgeText}>Passport</Text></View>}
              {identification.drivers_license && <View style={styles.badge}><Text style={styles.badgeText}>Driver's License</Text></View>}
              {identification.national_id && <View style={styles.badge}><Text style={styles.badgeText}>National ID</Text></View>}
              {identification.voters_card && <View style={styles.badge}><Text style={styles.badgeText}>Voter's Card</Text></View>}
              {identification.company_id && <View style={styles.badge}><Text style={styles.badgeText}>Company ID</Text></View>}
            </View>
            <Row label="ID on file" value={identification.id_card_url ? 'Yes' : 'No'} />
          </Section>

          {/* Referral Info */}
          <Section title="Referral information">
            <Row label="Source" value={[
              referral.source_staff && 'Staff',
              referral.source_friend && 'Friend',
              referral.source_family && 'Family',
              referral.source_old_client && 'Old Client',
              referral.source_welcome_forum && 'Welcome Forum',
              referral.source_radio && 'Radio',
              referral.source_facebook && 'Facebook',
              referral.source_messenger && 'Messenger',
              referral.source_instagram && 'Instagram',
              referral.source_whatsapp && 'WhatsApp',
              referral.source_twitter && 'Twitter',
              referral.source_website && 'Website',
              referral.source_website_chat && 'Website Chat',
              referral.source_linkedin && 'LinkedIn',
              referral.source_print_media && 'Print Media',
              referral.source_ngo,
              referral.source_others
            ].filter(Boolean).join(', ') || 'Not Provided'} />
            <Row label="Doctor Referral" value={referral.doctor_referral} />
            <Row label="Doctor Name" value={referral.doctor_contact} />
            <Row label="Doctor Phone" value={referral.doctor_phone} />
          </Section>

          {/* Emergency Contacts */}
          <Section title="Emergency Contacts">
            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 4 }}>Contact 1</Text>
              <Row label="Name" value={emergency.name1} />
              <Row label="Mobile" value={emergency.mobile1} />
            </View>
            <View>
              <Text style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 4 }}>Contact 2</Text>
              <Row label="Name" value={emergency.name2} />
              <Row label="Mobile" value={emergency.mobile2} />
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
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#16A34A',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
