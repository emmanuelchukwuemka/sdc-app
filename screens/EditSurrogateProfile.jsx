// screens/EditSurrogateProfile.jsx
import React, { useState } from 'react';
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
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const BORDER = '#E5E7EB';

export default function EditSurrogateProfile({ navigation, route }) {
  const { userId, formData } = route.params || {};
  const [personal, setPersonal] = useState(formData?.personal || {});

  const handleChange = (field, value) => {
    setPersonal({ ...personal, [field]: value });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ form_data: { personal } }) // only personal part for now
        .eq('user_id', userId);

      if (error) throw error;
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
