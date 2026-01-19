import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '../lib/supabase'; // Removed - using Flask API
import { kycAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAF9';

const STEPS = [
  'Personal Details',
  'Medical Information',
  'Identification',
  'Referral Information',
  'Emergency Contacts',
];

// Simple time formatter like "08:45 PM"
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function ThinProgress({ percent = 0 }) {
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(100, percent))}%` }]} />
    </View>
  );
}

export default function KycSurrogate({
  userId: userIdProp,
  route,
  navigation,
  onDone = () => { },
  onSkip = () => { },
}) {
  const userId = userIdProp ?? route?.params?.userId;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState(null); // NEW: last saved timestamp
  const [idImage, setIdImage] = useState(null); // Local image pick
  const insets = useSafeAreaInsets();

  // Debounce timer ref for auto-save
  const autosaveTimer = useRef(null);

  // Form state (single object, organized by sections)
  const [form, setForm] = useState({
    role: 'SURROGATE',
    personal: {
      title: '',
      surname: '',
      first_name: '',
      middle_name: '',
      dob: '',
      phone1: '',
      phone2: '',
      nationality: '',
      state_of_birth: '',
      place_of_birth: '',
      email: '',
      home_address: '',
      office_address: '',
    },
    medical: {
      blood_group: '',
      genotype: '',
      number_of_children: '',
      had_cs_before: null, // true/false
      been_surrogate_before: null, // true/false
      height: '',
      weight: '',
      occupation: '',
    },
    identification: {
      passport: false,
      drivers_license: false,
      national_id: false,
      voters_card: false,
      company_id: false,
      id_card_url: null, // NEW
    },
    referral: {
      source_staff: false,
      source_friend: false,
      source_family: false,
      source_old_client: false,
      source_welcome_forum: false,
      source_radio: false,
      source_facebook: false,
      source_messenger: false,
      source_instagram: false,
      source_whatsapp: false,
      source_twitter: false,
      source_website: false,
      source_website_chat: false,
      source_linkedin: false,
      source_print_media: false,
      source_ngo: '',
      source_others: '',
      doctor_refer: null, // true/false
      doctor_name_contact: '',
      doctor_phone: '',
    },
    emergency: {
      name1: '',
      mobile1: '',
      name2: '',
      mobile2: '',
    },
  });

  const [savedSnapshot, setSavedSnapshot] = useState(null);

  // Helpers to compute input border color based on entered vs saved values
  const getSavedValue = useCallback((path) => {
    if (!savedSnapshot) return undefined;
    let ref = savedSnapshot;
    for (let i = 0; i < path.length; i++) {
      if (ref == null) return undefined;
      ref = ref[path[i]];
    }
    return ref;
  }, [savedSnapshot]);

  const isFilled = (v) => {
    if (typeof v === 'boolean') return v === true;
    return String(v ?? '').trim().length > 0;
  };

  const fieldBorderStyle = (path, currentValue) => {
    const savedVal = getSavedValue(path);
    if (isFilled(savedVal)) return styles.inputGreen; // stay green if saved & filled
    if (isFilled(currentValue)) return styles.inputGreen; // turn green when user types
    return styles.inputRed; // red when empty/unfilled
  };

  const stepsCount = STEPS.length;

  // Compute simple progress based on completed steps we’ve saved.
  const stepCompleted = useMemo(() => {
    const checks = [
      // personal
      Object.values(form.personal).some((v) => String(v || '').trim().length > 0),
      // medical
      (form.medical.had_cs_before !== null) ||
      (form.medical.been_surrogate_before !== null) ||
      Object.entries(form.medical).some(([k, v]) => k !== 'had_cs_before' && k !== 'been_surrogate_before' && String(v || '').trim().length > 0),
      // identification
      Object.values(form.identification).some(Boolean),
      // referral
      (form.referral.doctor_refer !== null) ||
      Object.entries(form.referral).some(([k, v]) => k !== 'doctor_refer' && (typeof v === 'boolean' ? v : String(v || '').trim().length > 0)),
      // emergency
      Object.values(form.emergency).some((v) => String(v || '').trim().length > 0),
    ];
    return checks;
  }, [form]);

  const completedCount = stepCompleted.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / stepsCount) * 100);

  // Debounced auto-save scheduler (no external deps)
  const scheduleAutoSave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      // Auto-save as "in_progress"
      saveStep(false);
    }, 1000); // 1s after user stops typing/toggling
  }, [saveStep]);

  const mergeForm = (path, value) => {
    // path example: ['personal','surname']
    setForm((prev) => {
      const next = { ...prev };
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        ref[path[i]] = { ...ref[path[i]] };
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });

    // schedule auto-save on every change
    scheduleAutoSave();
  };

  const saveStep = useCallback(async (finalize = false) => {
    try {
      setSaving(true);

      // Check if user already has existing KYC document
      const documents = await kycAPI.getKycDocuments();
      const existing = documents.find(doc => doc.user_id === userId);

      const status = finalize ? 'submitted' : 'in_progress';

      // 1. Upload File if new image selected
      let fileUrl = form.identification.id_card_url || null;
      if (idImage && idImage.uri) {
        try {
          const resp = await fetch(idImage.uri);
          const arrayBuffer = await resp.arrayBuffer();
          const ext = idImage.uri.split('.').pop() || 'jpg';
          const path = `kyc/${userId}/id_document_${Date.now()}.${ext}`;

          // TODO: Replace with file upload API when implemented
          // const { error: uploadErr } = await supabase.storage
          //   .from('kyc')
          //   .upload(path, arrayBuffer, {
          //     contentType: idImage.type || 'image/jpeg',
          //     upsert: true,
          //   });

          // if (uploadErr) throw uploadErr;

          // const { data: pub } = supabase.storage.from('kyc').getPublicUrl(path);
          // fileUrl = pub.publicUrl;
          
          // Mock successful upload
          fileUrl = `https://mock-storage.com/kyc/${userId}/id_document_${Date.now()}.${ext}`;
        } catch (uplErr) {
          console.log('Upload error:', uplErr);
          // Proceed saving form but alert?
        }
      }

      // 2. Update Form Data with URL
      const updatedForm = {
        ...form,
        identification: {
          ...form.identification,
          id_card_url: fileUrl
        }
      };

      // Submit KYC document using kycAPI
      await kycAPI.submitKycDocument({
        user_id: userId,
        role: 'SURROGATE',
        status: status,
        form_data: updatedForm,
        form_progress: progressPercent,
        file_url: fileUrl
      });

      // Update local state
      setForm(updatedForm); // Ensure local state has URL
      setSavedSnapshot(updatedForm);
      if (finalize) onDone();
    } catch (e) {
      console.log('KYC save error (outer catch):', e);
      Alert.alert('Save Failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [form, progressPercent, userId, onDone, idImage]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Permission to access gallery is required.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setIdImage(res.assets[0]);
    }
  };

  const loadExisting = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch existing KYC data
      const documents = await kycAPI.getKycDocuments();
      const data = documents.find(doc => doc.user_id === userId) || null;
      if (data?.form_data) {
        // ✅ Deep merge instead of shallow merge
        setForm((prev) => ({
          ...prev,
          personal: { ...prev.personal, ...(data.form_data.personal || {}) },
          medical: { ...prev.medical, ...(data.form_data.medical || {}) },
          identification: { ...prev.identification, ...(data.form_data.identification || {}) },
          referral: { ...prev.referral, ...(data.form_data.referral || {}) },
          emergency: { ...prev.emergency, ...(data.form_data.emergency || {}) },
        }));
        setSavedSnapshot(data.form_data || null);
      }
      // If previously submitted/approved, we can immediately finish
      if (data?.status === 'submitted' || data?.status === 'approved') {
        onDone();
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, onDone]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const goNext = async () => {
    // force an immediate save on navigation
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await saveStep(false);
    setStep((s) => Math.min(stepsCount - 1, s + 1));
  };

  const goBack = async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await saveStep(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const finishAll = async () => {
    // Check if form is complete before submission
    if (progressPercent < 100) {
      Alert.alert(
        'Form Incomplete',
        "You can't submit the form until all the information is completed. You can click Skip at the top to continue later."
      );
      return;
    }

    try {
      setSaving(true);
      // Force final submission state
      const finalize = true;
      // Save with finalize to set status: 'submitted' and current form_data
      await saveStep(finalize);
      // Form is already submitted via saveStep() which uses kycAPI
      onDone();
    } catch (e) {
      console.log('Finalize error (Surrogate):', e?.message || e);
    } finally {
      setSaving(false);
    }
  };

  // Reusable pill checkbox
  const Pill = ({ label, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : null]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPersonal = () => (
    <View>
      <Text style={styles.sectionTitle}>1. Personal Details</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'title'], form.personal.title)]} placeholder="Title" value={form.personal.title} onChangeText={(t) => mergeForm(['personal', 'title'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'surname'], form.personal.surname)]} placeholder="Surname" value={form.personal.surname} onChangeText={(t) => mergeForm(['personal', 'surname'], t)} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'first_name'], form.personal.first_name)]} placeholder="First Name" value={form.personal.first_name} onChangeText={(t) => mergeForm(['personal', 'first_name'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'middle_name'], form.personal.middle_name)]} placeholder="Middle Name" value={form.personal.middle_name} onChangeText={(t) => mergeForm(['personal', 'middle_name'], t)} />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['personal', 'dob'], form.personal.dob)]} placeholder="Date of Birth (DD/MM/YYYY)" value={form.personal.dob} onChangeText={(t) => mergeForm(['personal', 'dob'], t)} />
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'phone1'], form.personal.phone1)]} placeholder="Telephone (1)" value={form.personal.phone1} onChangeText={(t) => mergeForm(['personal', 'phone1'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'phone2'], form.personal.phone2)]} placeholder="Telephone (2)" value={form.personal.phone2} onChangeText={(t) => mergeForm(['personal', 'phone2'], t)} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'nationality'], form.personal.nationality)]} placeholder="Nationality" value={form.personal.nationality} onChangeText={(t) => mergeForm(['personal', 'nationality'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['personal', 'state_of_birth'], form.personal.state_of_birth)]} placeholder="State of Birth" value={form.personal.state_of_birth} onChangeText={(t) => mergeForm(['personal', 'state_of_birth'], t)} />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['personal', 'place_of_birth'], form.personal.place_of_birth)]} placeholder="Place of Birth" value={form.personal.place_of_birth} onChangeText={(t) => mergeForm(['personal', 'place_of_birth'], t)} />
      <TextInput style={[styles.inputFull, fieldBorderStyle(['personal', 'email'], form.personal.email)]} placeholder="Email Address" value={form.personal.email} onChangeText={(t) => mergeForm(['personal', 'email'], t)} />
      <TextInput style={[styles.inputFull, fieldBorderStyle(['personal', 'home_address'], form.personal.home_address)]} placeholder="Home Address" value={form.personal.home_address} onChangeText={(t) => mergeForm(['personal', 'home_address'], t)} />
      <TextInput style={[styles.inputFull, fieldBorderStyle(['personal', 'office_address'], form.personal.office_address)]} placeholder="Office Address" value={form.personal.office_address} onChangeText={(t) => mergeForm(['personal', 'office_address'], t)} />
    </View>
  );

  const renderMedical = () => (
    <View>
      <Text style={styles.sectionTitle}>2. Medical Information</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['medical', 'blood_group'], form.medical.blood_group)]} placeholder="Blood Group" value={form.medical.blood_group} onChangeText={(t) => mergeForm(['medical', 'blood_group'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['medical', 'genotype'], form.medical.genotype)]} placeholder="Genotype" value={form.medical.genotype} onChangeText={(t) => mergeForm(['medical', 'genotype'], t)} />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['medical', 'number_of_children'], form.medical.number_of_children)]} placeholder="Number of Children" value={String(form.medical.number_of_children || '')} onChangeText={(t) => mergeForm(['medical', 'number_of_children'], t)} />
      <View style={styles.pillRow}>
        <Pill
          label={`Had CS before: ${form.medical.had_cs_before === true ? 'Yes' : form.medical.had_cs_before === false ? 'No' : 'N/A'}`}
          active={form.medical.had_cs_before === true}
          onPress={() => mergeForm(['medical', 'had_cs_before'], form.medical.had_cs_before === true ? null : true)}
        />
        <Pill
          label="Set No"
          active={form.medical.had_cs_before === false}
          onPress={() => mergeForm(['medical', 'had_cs_before'], form.medical.had_cs_before === false ? null : false)}
        />
      </View>
      <View style={styles.pillRow}>
        <Pill
          label={`Been surrogate before: ${form.medical.been_surrogate_before === true ? 'Yes' : form.medical.been_surrogate_before === false ? 'No' : 'N/A'}`}
          active={form.medical.been_surrogate_before === true}
          onPress={() => mergeForm(['medical', 'been_surrogate_before'], form.medical.been_surrogate_before === true ? null : true)}
        />
        <Pill
          label="Set No"
          active={form.medical.been_surrogate_before === false}
          onPress={() => mergeForm(['medical', 'been_surrogate_before'], form.medical.been_surrogate_before === false ? null : false)}
        />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['medical', 'height'], form.medical.height)]} placeholder="Height" value={form.medical.height} onChangeText={(t) => mergeForm(['medical', 'height'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['medical', 'weight'], form.medical.weight)]} placeholder="Weight" value={form.medical.weight} onChangeText={(t) => mergeForm(['medical', 'weight'], t)} />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['medical', 'occupation'], form.medical.occupation)]} placeholder="Occupation" value={form.medical.occupation} onChangeText={(t) => mergeForm(['medical', 'occupation'], t)} />
    </View>
  );

  const renderIdentification = () => (
    <View>
      <Text style={styles.sectionTitle}>3. Identification</Text>
      <Text style={styles.smallNote}>Please select available ID types and upload a document.</Text>
      <View style={styles.pillWrap}>
        <Pill label="International Passport" active={form.identification.passport} onPress={() => mergeForm(['identification', 'passport'], !form.identification.passport)} />
        <Pill label="Driver’s License" active={form.identification.drivers_license} onPress={() => mergeForm(['identification', 'drivers_license'], !form.identification.drivers_license)} />
        <Pill label="National ID" active={form.identification.national_id} onPress={() => mergeForm(['identification', 'national_id'], !form.identification.national_id)} />
        <Pill label="Voter’s Card" active={form.identification.voters_card} onPress={() => mergeForm(['identification', 'voters_card'], !form.identification.voters_card)} />
        <Pill label="Company ID" active={form.identification.company_id} onPress={() => mergeForm(['identification', 'company_id'], !form.identification.company_id)} />
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
        <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.uploadText}>{idImage ? 'Change ID Document' : 'Upload ID Document'}</Text>
      </TouchableOpacity>

      {idImage && (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ color: BRAND_GREEN, marginBottom: 4 }}>Selected:</Text>
          {/* Simple preview if it's an image */}
          <View style={{ width: 100, height: 100, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10 }}>{idImage.uri ? 'Image Selected' : ''}</Text>
          </View>
        </View>
      )}

      {form.identification.id_card_url && !idImage && (
        <Text style={{ color: BRAND_GREEN, marginTop: 10 }}>✓ ID Document on file</Text>
      )}

      <Text style={styles.smallNote}>Supported: Images (JPEG, PNG).</Text>
    </View>
  );

  const renderReferral = () => (
    <View>
      <Text style={styles.sectionTitle}>4. Referral Information</Text>
      <View style={styles.pillWrap}>
        <Pill label="Staff" active={form.referral.source_staff} onPress={() => mergeForm(['referral', 'source_staff'], !form.referral.source_staff)} />
        <Pill label="Friend" active={form.referral.source_friend} onPress={() => mergeForm(['referral', 'source_friend'], !form.referral.source_friend)} />
        <Pill label="Family" active={form.referral.source_family} onPress={() => mergeForm(['referral', 'source_family'], !form.referral.source_family)} />
        <Pill label="Old Client" active={form.referral.source_old_client} onPress={() => mergeForm(['referral', 'source_old_client'], !form.referral.source_old_client)} />
        <Pill label="Welcome Forum" active={form.referral.source_welcome_forum} onPress={() => mergeForm(['referral', 'source_welcome_forum'], !form.referral.source_welcome_forum)} />
        <Pill label="Radio" active={form.referral.source_radio} onPress={() => mergeForm(['referral', 'source_radio'], !form.referral.source_radio)} />
        <Pill label="Facebook" active={form.referral.source_facebook} onPress={() => mergeForm(['referral', 'source_facebook'], !form.referral.source_facebook)} />
        <Pill label="Messenger" active={form.referral.source_messenger} onPress={() => mergeForm(['referral', 'source_messenger'], !form.referral.source_messenger)} />
        <Pill label="Instagram" active={form.referral.source_instagram} onPress={() => mergeForm(['referral', 'source_instagram'], !form.referral.source_instagram)} />
        <Pill label="WhatsApp" active={form.referral.source_whatsapp} onPress={() => mergeForm(['referral', 'source_whatsapp'], !form.referral.source_whatsapp)} />
        <Pill label="Twitter" active={form.referral.source_twitter} onPress={() => mergeForm(['referral', 'source_twitter'], !form.referral.source_twitter)} />
        <Pill label="Website" active={form.referral.source_website} onPress={() => mergeForm(['referral', 'source_website'], !form.referral.source_website)} />
        <Pill label="Website Chat" active={form.referral.source_website_chat} onPress={() => mergeForm(['referral', 'source_website_chat'], !form.referral.source_website_chat)} />
        <Pill label="LinkedIn" active={form.referral.source_linkedin} onPress={() => mergeForm(['referral', 'source_linkedin'], !form.referral.source_linkedin)} />
        <Pill label="Print Media" active={form.referral.source_print_media} onPress={() => mergeForm(['referral', 'source_print_media'], !form.referral.source_print_media)} />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['referral', 'source_ngo'], form.referral.source_ngo)]} placeholder="NGO (please specify)" value={form.referral.source_ngo} onChangeText={(t) => mergeForm(['referral', 'source_ngo'], t)} />
      <TextInput style={[styles.inputFull, fieldBorderStyle(['referral', 'source_others'], form.referral.source_others)]} placeholder="Others (please specify)" value={form.referral.source_others} onChangeText={(t) => mergeForm(['referral', 'source_others'], t)} />
      <View style={styles.pillRow}>
        <Pill
          label={`Doctor referral: ${form.referral.doctor_refer === true ? 'Yes' : form.referral.doctor_refer === false ? 'No' : 'N/A'}`}
          active={form.referral.doctor_refer === true}
          onPress={() => mergeForm(['referral', 'doctor_refer'], form.referral.doctor_refer === true ? null : true)}
        />
        <Pill
          label="Set No"
          active={form.referral.doctor_refer === false}
          onPress={() => mergeForm(['referral', 'doctor_refer'], form.referral.doctor_refer === false ? null : false)}
        />
      </View>
      <TextInput style={[styles.inputFull, fieldBorderStyle(['referral', 'doctor_name_contact'], form.referral.doctor_name_contact)]} placeholder="Doctor’s name & contact" value={form.referral.doctor_name_contact} onChangeText={(t) => mergeForm(['referral', 'doctor_name_contact'], t)} />
      <TextInput style={[styles.inputFull, fieldBorderStyle(['referral', 'doctor_phone'], form.referral.doctor_phone)]} placeholder="Phone number of referral doctor" value={form.referral.doctor_phone} onChangeText={(t) => mergeForm(['referral', 'doctor_phone'], t)} />
    </View>
  );

  const renderEmergency = () => (
    <View>
      <Text style={styles.sectionTitle}>5. Emergency/Next of Kin</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'name1'], form.emergency.name1)]} placeholder="Name (1)" value={form.emergency.name1} onChangeText={(t) => mergeForm(['emergency', 'name1'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'mobile1'], form.emergency.mobile1)]} placeholder="Mobile (1)" value={form.emergency.mobile1} onChangeText={(t) => mergeForm(['emergency', 'mobile1'], t)} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'name2'], form.emergency.name2)]} placeholder="Name (2)" value={form.emergency.name2} onChangeText={(t) => mergeForm(['emergency', 'name2'], t)} />
        <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'mobile2'], form.emergency.mobile2)]} placeholder="Mobile (2)" value={form.emergency.mobile2} onChangeText={(t) => mergeForm(['emergency', 'mobile2'], t)} />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderPersonal();
      case 1: return renderMedical();
      case 2: return renderIdentification();
      case 3: return renderReferral();
      case 4: return renderEmergency();
      default: return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={{ color: GRAY, marginTop: 8 }}>Loading KYC…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>KYC — Surrogate</Text>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Ionicons name="exit-outline" size={16} color="#fff" />
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Thin progress bar */}
        <View style={styles.progressRow}>
          <ThinProgress percent={progressPercent} />
          <Text style={styles.progressLabel}>{progressPercent}%</Text>
        </View>

        {/* Save status */}
        <Text style={styles.saveStatus}>
          {saving
            ? 'Saving…'
            : lastSavedAt
              ? `Last saved at ${fmtTime(lastSavedAt)}`
              : 'Not saved yet'}
        </Text>

        <Text style={styles.stepLabel}>Step {step + 1} of {stepsCount}: {STEPS[step]}</Text>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={12}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 80 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderStep()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Nav actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={goBack} style={[styles.navBtn, step === 0 && { opacity: 0.4 }]} disabled={step === 0 || saving}>
            <Text style={styles.navText}>Back</Text>
          </TouchableOpacity>

          {step < stepsCount - 1 ? (
            <TouchableOpacity onPress={goNext} style={[styles.primaryBtn, saving && { opacity: 0.6 }]} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save & Continue</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={finishAll} style={[styles.primaryBtn, saving && { opacity: 0.6 }]} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Submit</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG },
  container: { flex: 1, padding: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: BRAND_GREEN },
  skipBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND_GREEN, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  skipText: { color: '#fff', fontWeight: '800', marginLeft: 6 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressWrap: { flex: 1, height: 6, backgroundColor: '#E5F5EA', borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: BRAND_GREEN },

  progressLabel: { color: GRAY, fontSize: 12, fontWeight: '700' },
  saveStatus: { color: GRAY, fontSize: 12, marginBottom: 8 },

  stepLabel: { color: '#374151', marginBottom: 12, fontWeight: '700' },

  sectionTitle: { color: BRAND_GREEN, fontWeight: '900', marginBottom: 8, fontSize: 16 },

  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  inputFull: { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 8 },
  inputGreen: { borderColor: BRAND_GREEN },
  inputRed: { borderColor: '#ef4444' },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  pillActive: { backgroundColor: '#E5F5EA', borderColor: BRAND_GREEN },
  pillText: { color: '#374151', fontWeight: '700' },
  pillTextActive: { color: BRAND_GREEN },

  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navBtn: { backgroundColor: '#EEF2F7', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  navText: { color: BRAND_GREEN, fontWeight: '800' },

  primaryBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  primaryText: { color: ACCENT_WHITE, fontWeight: '800' },

  primaryText: { color: ACCENT_WHITE, fontWeight: '800' },

  smallNote: { color: GRAY, fontSize: 12, marginTop: 4 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  uploadBtn: { backgroundColor: BRAND_GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 12 },
  uploadText: { color: '#fff', fontWeight: '700' },
});
