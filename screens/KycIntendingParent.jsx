// screens/KycIntendingParent.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
// import { supabase } from "../lib/supabase"; // Removed - using Flask API
import { kycAPI } from "../services/api";

const BRAND_GREEN = "#16A34A";
const GRAY = "#6B7280";
const LIGHT_BG = "#F8FAF9";
const ACCENT_WHITE = "#FFFFFF";

const STEPS = [
  "Personal Details",
  "Marital & Family Info",
  "Medical & Fertility Info",
  "Financial & Support",
  "Identification",
  "Referral Info",
  "Emergency Contacts",
];

export default function KycIntendingParent({ userId, onSkip, onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [idImage, setIdImage] = useState(null); // Local image definition

  const [form, setForm] = useState({
    role: "IP",
    personal: {
      title: "",
      surname: "",
      first_name: "",
      middle_name: "",
      dob: "",
      gender: "",
      phone1: "",
      phone2: "",
      email: "",
      nationality: "",
      state_of_birth: "",
      place_of_birth: "",
      home_address: "",
      office_address: "",
      occupation: "",
    },
    marital: {
      status: "",
      spouse_name: "",
      spouse_age: "",
      spouse_occupation: "",
      children_count: "",
      fertility_treatment: "",
      surrogate_before: "",
    },
    medical: {
      history: "",
      fertility_challenges: "",
      under_doctor: "",
      doctor_details: "",
      blood_group: "",
      genotype: "",
    },
    financial: {
      prepared: "",
      insurance: "",
      payment_mode: "",
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
      source_ngo: "",
      source_others: "",
      doctor_referral: "",
      doctor_contact: "",
      doctor_phone: "",
    },
    emergency: {
      name1: "",
      mobile1: "",
      name2: "",
      mobile2: "",
    },
  });

  const stepsCount = STEPS.length;

  const stepCompleted = useMemo(() => {
    return [
      Object.values(form.personal).some((v) => String(v || "").trim().length > 0),
      Object.values(form.marital).some((v) => String(v || "").trim().length > 0),
      Object.values(form.medical).some((v) => String(v || "").trim().length > 0),
      Object.values(form.financial).some((v) => String(v || "").trim().length > 0),
      Object.values(form.identification).some((v) => v),
      Object.entries(form.referral).some(([_, v]) =>
        typeof v === "boolean" ? v : String(v || "").trim().length > 0
      ),
      Object.values(form.emergency).some((v) => String(v || "").trim().length > 0),
    ];
  }, [form]);

  const completedCount = stepCompleted.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / stepsCount) * 100);

  const mergeForm = (path, value) => {
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
  };

  const saveStep = useCallback(
    async (final = false) => {
      try {
        setSaving(true);

        let fileUrl = form.identification.id_card_url || null;
        if (idImage && idImage.uri) {
          try {
            const resp = await fetch(idImage.uri);
            const arrayBuffer = await resp.arrayBuffer();
            const ext = idImage.uri.split('.').pop() || 'jpg';
            const path = `kyc/${userId}/ip_id_${Date.now()}.${ext}`;

            // TODO: Replace with file upload API when implemented
            // const { error: uploadErr } = await supabase.storage
            //   .from('kyc')
            //   .upload(path, arrayBuffer, {
            //     contentType: idImage.type || 'image/jpeg',
            //     upsert: true,
            //   });
            // if (!uploadErr) {
            //   const { data: pub } = supabase.storage.from('kyc').getPublicUrl(path);
            //   fileUrl = pub.publicUrl;
            // }
            
            // Mock successful upload
            fileUrl = `https://mock-storage.com/kyc/${userId}/ip_id_${Date.now()}.${ext}`;
          } catch (uErr) {
            console.log('Upload fail:', uErr);
          }
        }

        const updatedForm = {
          ...form,
          identification: { ...form.identification, id_card_url: fileUrl }
        };

        if (fileUrl) {
          setForm(updatedForm); // sync local
        }

        // Submit KYC document using kycAPI
        await kycAPI.submitKycDocument({
          user_id: userId,
          role: "IP",
          status: final ? "submitted" : "in_progress",
          form_data: updatedForm,
          form_progress: progressPercent,
          file_url: fileUrl
        });

        if (final || progressPercent === 100) {
          onDone();
        } else {
          setStep((s) => Math.min(stepsCount - 1, s + 1));
        }
      } catch (e) {
        console.log("Save error:", e.message || e);
        alert("Something went wrong while saving. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [form, progressPercent, userId, onDone, idImage]
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert("Permission required");
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
        setForm((prev) => ({ ...prev, ...(data.form_data || {}) }));
      }
      if ((data?.form_progress ?? 0) >= 100 || data?.status === "approved") {
        onDone();
      }
    } catch (e) {
      console.log("Load error:", e.message || e);
    } finally {
      setLoading(false);
    }
  }, [userId, onDone]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.sectionTitle}>1. Personal Details</Text>
            <TextInput style={styles.input} placeholder="Title" value={form.personal.title} onChangeText={(v) => mergeForm(["personal", "title"], v)} />
            <TextInput style={styles.input} placeholder="Surname" value={form.personal.surname} onChangeText={(v) => mergeForm(["personal", "surname"], v)} />
            <TextInput style={styles.input} placeholder="First Name" value={form.personal.first_name} onChangeText={(v) => mergeForm(["personal", "first_name"], v)} />
            <TextInput style={styles.input} placeholder="Middle Name" value={form.personal.middle_name} onChangeText={(v) => mergeForm(["personal", "middle_name"], v)} />
            <TextInput style={styles.input} placeholder="Date of Birth" value={form.personal.dob} onChangeText={(v) => mergeForm(["personal", "dob"], v)} />
            <TextInput style={styles.input} placeholder="Gender" value={form.personal.gender} onChangeText={(v) => mergeForm(["personal", "gender"], v)} />
            <TextInput style={styles.input} placeholder="Phone 1" value={form.personal.phone1} onChangeText={(v) => mergeForm(["personal", "phone1"], v)} />
            <TextInput style={styles.input} placeholder="Phone 2" value={form.personal.phone2} onChangeText={(v) => mergeForm(["personal", "phone2"], v)} />
            <TextInput style={styles.input} placeholder="Email" value={form.personal.email} onChangeText={(v) => mergeForm(["personal", "email"], v)} />
            <TextInput style={styles.input} placeholder="Nationality" value={form.personal.nationality} onChangeText={(v) => mergeForm(["personal", "nationality"], v)} />
            <TextInput style={styles.input} placeholder="State of Birth" value={form.personal.state_of_birth} onChangeText={(v) => mergeForm(["personal", "state_of_birth"], v)} />
            <TextInput style={styles.input} placeholder="Place of Birth" value={form.personal.place_of_birth} onChangeText={(v) => mergeForm(["personal", "place_of_birth"], v)} />
            <TextInput style={styles.input} placeholder="Home Address" value={form.personal.home_address} onChangeText={(v) => mergeForm(["personal", "home_address"], v)} />
            <TextInput style={styles.input} placeholder="Office Address" value={form.personal.office_address} onChangeText={(v) => mergeForm(["personal", "office_address"], v)} />
            <TextInput style={styles.input} placeholder="Occupation" value={form.personal.occupation} onChangeText={(v) => mergeForm(["personal", "occupation"], v)} />
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={styles.sectionTitle}>2. Marital & Family Info</Text>
            <TextInput style={styles.input} placeholder="Marital Status" value={form.marital.status} onChangeText={(v) => mergeForm(["marital", "status"], v)} />
            <TextInput style={styles.input} placeholder="Spouse Name" value={form.marital.spouse_name} onChangeText={(v) => mergeForm(["marital", "spouse_name"], v)} />
            <TextInput style={styles.input} placeholder="Spouse Age" value={form.marital.spouse_age} onChangeText={(v) => mergeForm(["marital", "spouse_age"], v)} />
            <TextInput style={styles.input} placeholder="Spouse Occupation" value={form.marital.spouse_occupation} onChangeText={(v) => mergeForm(["marital", "spouse_occupation"], v)} />
            <TextInput style={styles.input} placeholder="Number of children" value={form.marital.children_count} onChangeText={(v) => mergeForm(["marital", "children_count"], v)} />
            <TextInput style={styles.input} placeholder="Fertility treatment history" value={form.marital.fertility_treatment} onChangeText={(v) => mergeForm(["marital", "fertility_treatment"], v)} />
            <TextInput style={styles.input} placeholder="Used surrogate/donor before?" value={form.marital.surrogate_before} onChangeText={(v) => mergeForm(["marital", "surrogate_before"], v)} />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.sectionTitle}>3. Medical & Fertility Info</Text>
            <TextInput style={styles.input} placeholder="Medical history" value={form.medical.history} onChangeText={(v) => mergeForm(["medical", "history"], v)} />
            <TextInput style={styles.input} placeholder="Fertility challenges" value={form.medical.fertility_challenges} onChangeText={(v) => mergeForm(["medical", "fertility_challenges"], v)} />
            <TextInput style={styles.input} placeholder="Under fertility doctor care?" value={form.medical.under_doctor} onChangeText={(v) => mergeForm(["medical", "under_doctor"], v)} />
            <TextInput style={styles.input} placeholder="Doctor details" value={form.medical.doctor_details} onChangeText={(v) => mergeForm(["medical", "doctor_details"], v)} />
            <TextInput style={styles.input} placeholder="Blood Group" value={form.medical.blood_group} onChangeText={(v) => mergeForm(["medical", "blood_group"], v)} />
            <TextInput style={styles.input} placeholder="Genotype" value={form.medical.genotype} onChangeText={(v) => mergeForm(["medical", "genotype"], v)} />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.sectionTitle}>4. Financial & Support</Text>
            <TextInput style={styles.input} placeholder="Financially prepared?" value={form.financial.prepared} onChangeText={(v) => mergeForm(["financial", "prepared"], v)} />
            <TextInput style={styles.input} placeholder="Health insurance?" value={form.financial.insurance} onChangeText={(v) => mergeForm(["financial", "insurance"], v)} />
            <TextInput style={styles.input} placeholder="Preferred payment mode" value={form.financial.payment_mode} onChangeText={(v) => mergeForm(["financial", "payment_mode"], v)} />
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.sectionTitle}>5. Identification</Text>
            <Text style={{ color: GRAY, fontSize: 12, marginBottom: 10 }}>Upload a valid Government ID.</Text>

            <TouchableOpacity onPress={pickImage} style={[styles.input, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2F7', borderStyle: 'dashed' }]}>
              <Ionicons name="cloud-upload" size={24} color={BRAND_GREEN} />
              <Text style={{ color: BRAND_GREEN, marginTop: 4 }}>{idImage ? 'Change Image' : 'Click to Upload ID'}</Text>
            </TouchableOpacity>

            {idImage && (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: BRAND_GREEN }}>Image Selected</Text>
              </View>
            )}
            {form.identification.id_card_url && !idImage && (
              <Text style={{ color: BRAND_GREEN, marginTop: 10 }}>✓ ID Document on file</Text>
            )}
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.sectionTitle}>6. Referral Information</Text>
            <TextInput style={styles.input} placeholder="Doctor referral (Yes/No)" value={form.referral.doctor_referral} onChangeText={(v) => mergeForm(["referral", "doctor_referral"], v)} />
            <TextInput style={styles.input} placeholder="Doctor contact" value={form.referral.doctor_contact} onChangeText={(v) => mergeForm(["referral", "doctor_contact"], v)} />
            <TextInput style={styles.input} placeholder="Doctor phone" value={form.referral.doctor_phone} onChangeText={(v) => mergeForm(["referral", "doctor_phone"], v)} />
            <TextInput style={styles.input} placeholder="Other referral source" value={form.referral.source_others} onChangeText={(v) => mergeForm(["referral", "source_others"], v)} />
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={styles.sectionTitle}>7. Emergency Contacts</Text>
            <TextInput style={styles.input} placeholder="Name (1)" value={form.emergency.name1} onChangeText={(v) => mergeForm(["emergency", "name1"], v)} />
            <TextInput style={styles.input} placeholder="Mobile (1)" value={form.emergency.mobile1} onChangeText={(v) => mergeForm(["emergency", "mobile1"], v)} />
            <TextInput style={styles.input} placeholder="Name (2)" value={form.emergency.name2} onChangeText={(v) => mergeForm(["emergency", "name2"], v)} />
            <TextInput style={styles.input} placeholder="Mobile (2)" value={form.emergency.mobile2} onChangeText={(v) => mergeForm(["emergency", "mobile2"], v)} />
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={{ color: GRAY, marginTop: 8 }}>Loading KYC…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>KYC — Intending Parent</Text>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Ionicons name="exit-outline" size={16} color="#fff" />
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressWrap}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{progressPercent}%</Text>
      </View>
      <Text style={styles.stepLabel}>Step {step + 1} of {stepsCount}: {STEPS[step]}</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {renderStep()}
      </ScrollView>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => setStep((s) => Math.max(0, s - 1))}
          style={[styles.navBtn, step === 0 && { opacity: 0.5 }]}
          disabled={step === 0 || saving}
        >
          <Text style={styles.navText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => saveStep(step === stepsCount - 1)}
          style={[styles.primaryBtn, saving && { opacity: 0.5 }]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {step === stepsCount - 1 ? "Submit" : "Save & Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT_BG, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: BRAND_GREEN },
  skipBtn: { flexDirection: "row", alignItems: "center", backgroundColor: BRAND_GREEN, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  skipText: { color: "#fff", fontWeight: "800", marginLeft: 6 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  progressWrap: { flex: 1, height: 6, backgroundColor: "#E5F5EA", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: BRAND_GREEN },
  progressLabel: { color: GRAY, fontSize: 12, fontWeight: "700", marginLeft: 8 },
  stepLabel: { color: "#374151", marginBottom: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: BRAND_GREEN, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 10, marginBottom: 10 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  navBtn: { backgroundColor: "#EEF2F7", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  navText: { color: BRAND_GREEN, fontWeight: "800" },
  primaryBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  primaryText: { color: ACCENT_WHITE, fontWeight: "800" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
