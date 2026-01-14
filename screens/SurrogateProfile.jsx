// screens/SurrogateProfile.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F9FAFB';
const BORDER = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function SurrogateProfile({ navigation, route }) {
  const userId = route?.params?.userId;
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!userId) return;
  
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data: kycRow, error: kycErr } = await supabase.from('kyc_documents')
            .select('status, created_at, form_data')
            .eq('user_id', userId)
            .maybeSingle();
  
        if (kycErr) throw kycErr;
  
        if (mounted) {
          // Extract user data from form_data
          const userData = kycRow?.form_data ? {
            first_name: kycRow.form_data.first_name,
            last_name: kycRow.form_data.last_name,
            profile_image: kycRow.form_data.profile_image
          } : null;
          setUser(userData || null);
          setKyc(kycRow || null);
        }
      } catch (err) {
        console.log('Profile fetch error:', err.message);
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
      <Text style={{ color: TEXT_MUTED, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: '#111827', fontWeight: '700' }}>
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
   const kycStatus = kyc?.status || 'Not Started';

  const onPickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow photo access to update your picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaType?.Images ??
          ImagePicker.MediaTypeOptions?.Images ??
          'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];

      // Ensure authenticated before upload
      // Skip auth check for demo mode
      const user = { id: userId }; // Use passed userId for demo mode

      setAvatarUploading(true);

      // --- 1. keep original extension ---
      const uriParts = asset.uri.split('.');
      const ext = uriParts[uriParts.length - 1].toLowerCase() || 'jpg';
      const validExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      const finalExt = validExts.includes(ext) ? ext : 'jpg';

      const path = `avatars/${user.id}/${Date.now()}.${finalExt}`;

      // --- 2. resize & convert ---
      let base64String;
      try {
        if (Platform.OS === 'web') {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 512 } }],
            {
              compress: 0.8,
              format:
                finalExt === 'png'
                  ? ImageManipulator.SaveFormat.PNG
                  : ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          base64String = manipulated.base64;
        }
      } catch (e) {
        console.log('Resize error:', e);
        throw new Error('Could not prepare image');
      }

      // --- 3. base64 -> ArrayBuffer ---
      function decode(base64) {
        const bin = atob(base64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr.buffer;
      }

      // --- 4. upload to Supabase ---
      const contentType = finalExt === 'png' ? 'image/png' : `image/jpeg`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64String), {
          contentType,
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      // --- 5. save public URL into users table ---
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
          .from('users')
          .update({ profile_image: publicUrl })
          .eq('id', user.id);
        if (updateErr) throw updateErr;

      // --- 6. update local state & done ---
      setUser(prev => ({ ...(prev || {}), profile_image: publicUrl }));
      Alert.alert('Profile updated', 'Your profile picture has been updated.');
    } catch (e) {
      Alert.alert('Upload failed', e.message || 'Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_GREEN }} edges={['top', 'bottom']}>
      {/* ✅ Green Header */}
      <LinearGradient
        colors={['#16A34A', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 18,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>
          Profile
        </Text>
        <View style={{ width: 28 }} />
      </LinearGradient>
      
      {/* Avatar Card */}
      <View
        style={{
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
        }}
      >
        <View style={{ position: 'relative', marginRight: 14 }}>
          {user?.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={{ width: 72, height: 72, borderRadius: 9999, backgroundColor: LIGHT_BG, borderWidth: 1, borderColor: BORDER }}
            />
          ) : (
            <View
              style={{
                width: 72, height: 72, borderRadius: 9999,
                backgroundColor: LIGHT_BG, borderWidth: 1, borderColor: BORDER,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={38} color={TEXT_MUTED} />
            </View>
          )}
      
          <TouchableOpacity
            onPress={onPickAvatar}
            style={{
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
            }}
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
            {`${user?.first_name || personal.first_name || ''} ${user?.last_name || personal.surname || ''}`}
          </Text>
          <Text style={{ color: TEXT_MUTED, fontWeight: '600' }}>
            Surrogate • ID {userId || '—'}
          </Text>
        </View>
      </View>

      {/* ✅ White content wrapper */}
      <View
        style={{
          flex: 1,
          backgroundColor: LIGHT_BG,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
        }}
      >
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
          {/* Personal Info */}
          <Section
            title="Personal information"
            rightAction={
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('EditSurrogateProfile', {
                    userId,
                    formData: form,
                  })
                }
              >
                <Text style={{ color: BRAND_GREEN, fontWeight: '800' }}>Edit</Text>
              </TouchableOpacity>
            }
          >
            <Row label="Full name" value={`${personal.first_name || ''} ${personal.middle_name || ''} ${personal.surname || ''}`} />
            <Row label="Email" value={personal.email} />
            <Row label="Phone" value={personal.phone1} />
            <Row label="Date of birth" value={personal.dob} />
            <Row label="Location" value={personal.home_address} />
          </Section>

          {/* Verification & KYC */}
          <Section
            title="Verification & KYC"
            rightAction={
              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9999 }}>
                <Text style={{ color: '#166534', fontWeight: '800' }}>{kycStatus}</Text>
              </View>
            }
          >
            <Row label="KYC status" value={kycStatus} />
            <Row label="Last update" value={kyc?.created_at ? new Date(kyc.created_at).toLocaleDateString() : '-'} />
          </Section>

          {/* Health Summary */}
          <Section title="Health summary">
            <Row label="Blood type" value={medical.blood_group} />
            <Row label="Genotype" value={medical.genotype} />
            <Row label="Children" value={medical.number_of_children} />
            <Row label="Occupation" value={medical.occupation} />
          </Section>

          {/* Availability */}
          <Section title="Availability">
            <Text style={{ color: TEXT_MUTED, marginBottom: 6 }}>Current status</Text>
            <Text style={{ fontWeight: '800', color: '#111827' }}>
              Open to new matches
            </Text>
          </Section>

          {/* Documents */}
          <Section title="Documents">
            <Text style={{ color: TEXT_MUTED }}>
              • Government ID • Medical report • Consent forms
            </Text>
          </Section>
        </ScrollView>
      </View>

      {/* ✅ Green Bottom Nav */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: BRAND_GREEN,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => navigation.navigate('SurrogateHome', { userId })}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>
            Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
