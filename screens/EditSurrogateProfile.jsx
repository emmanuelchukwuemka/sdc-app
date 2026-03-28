// screens/EditSurrogateProfile.jsx
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

const BRAND_GREEN = '#16A34A';
const BORDER = '#E5E7EB';

export default function EditSurrogateProfile({ navigation: propNavigation, route }) {
  const navigation = propNavigation || useNavigation();
  const { userId, formData } = route.params || {};
  const [personal, setPersonal] = useState(formData?.personal || {});

  const handleChange = (field, value) => {
    setPersonal({ ...personal, [field]: value });
  };

  const handleSave = async () => {
    try {
      // Fetch existing document first to avoid overwriting other fields
      const documents = await kycAPI.getKycDocuments();
      const existing = documents.find(doc => doc.user_id === userId) || {};

      const updatedForm = {
        ...(existing.form_data || {}),
        personal: personal,
        // Ensure first_name and last_name are at the root of form_data too for the profile header
        first_name: personal.first_name || (existing.form_data || {}).first_name,
        last_name: personal.surname || personal.last_name || (existing.form_data || {}).last_name,
      };

      // If the document was already submitted or approved, keep it that way.
      // Otherwise, if we are editing, we are likely still in 'submitted' or 'approved' state if they could see the edit button.
      const newStatus = existing.status === 'approved' ? 'approved' : 'submitted';

      await kycAPI.submitKycDocument({
        user_id: userId,
        role: existing.role || 'SURROGATE',
        form_data: updatedForm,
        form_progress: 100,
        status: newStatus
      });

      // Also update the core User model first_name and last_name
      await userAPI.updateProfile(userId, {
        first_name: updatedForm.first_name,
        last_name: updatedForm.last_name
      });

      // Update AsyncStorage so Dashboard reflects changes immediately
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const newUserData = {
          ...userData,
          first_name: updatedForm.first_name,
          last_name: updatedForm.last_name
        };
        await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      }

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {['first_name', 'middle_name', 'surname', 'email', 'phone1', 'dob', 'home_address'].map(
          (field) => (
            <View key={field} style={styles.inputWrap}>
              <Text style={styles.label}>{field.replace('_', ' ')}</Text>
              <TextInput
                style={styles.input}
                value={personal[field] || ''}
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
