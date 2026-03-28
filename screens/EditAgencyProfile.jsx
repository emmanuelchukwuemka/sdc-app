// screens/EditAgencyProfile.jsx
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { kycAPI, userAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRAND_GREEN = '#14532D';
const BORDER = '#E5E7EB';

export default function EditAgencyProfile({ navigation: propNavigation, route }) {
  const navigation = propNavigation || useNavigation();
  const { userId, formData } = route.params || {};
  const [details, setDetails] = useState(formData?.details || {});

  const handleChange = (field, value) => {
    setDetails({ ...details, [field]: value });
  };

  const handleSave = async () => {
    try {
      const documents = await kycAPI.getKycDocuments();
      const existing = documents.find(doc => doc.user_id === userId) || {};

      const updatedForm = {
        ...(existing.form_data || {}),
        details: details,
      };

      const newStatus = existing.status === 'approved' ? 'approved' : 'submitted';

      await kycAPI.submitKycDocument({
        user_id: userId,
        role: existing.role || 'AGENCY',
        form_data: updatedForm,
        form_progress: 100,
        status: newStatus
      });

      // Update core user model if agency name should be reflected as first_name/last_name
      // For agencies, we can set first_name to agency_name and last_name to empty or vice versa
      await userAPI.updateProfile(userId, {
        first_name: updatedForm.details.agency_name,
        last_name: ''
      });

      // Update AsyncStorage
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const newUserData = {
          ...userData,
          first_name: updatedForm.details.agency_name,
          last_name: ''
        };
        await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      }

      Alert.alert('Success', 'Agency profile updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Agency</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {['agency_name', 'registration_number', 'official_email', 'phone1', 'hq_address'].map(
          (field) => (
            <View key={field} style={styles.inputWrap}>
              <Text style={styles.label}>{field.replace('_', ' ')}</Text>
              <TextInput
                style={styles.input}
                value={details[field] || ''}
                onChangeText={(val) => handleChange(field, val)}
                placeholder={`Enter ${field}`}
              />
            </View>
          )
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  inputWrap: { marginBottom: 14 },
  label: { fontWeight: '700', marginBottom: 4, color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    backgroundColor: BRAND_GREEN,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#fff', fontWeight: '800' },
});
