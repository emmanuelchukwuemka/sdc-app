// screens/KycDonor.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const BRAND_GREEN = "#16A34A";
const GRAY = "#6B7280";
const LIGHT_BG = "#F8FAF9";
const ACCENT_WHITE = "#FFFFFF";

const STEPS = [
  "Personal Details",
  "Medical & Genetic Info",
  "Reproductive & Screening",
  "Identification",
  "Referral Info",
  "Emergency Contacts",
];

export default function KycDonor({ userId, onSkip, onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [idImage, setIdImage] = useState(null);

  const [form, setForm] = useState({
    role: "DONOR",
    personal: {
      title: "",
      surname: "",
      first_name: "",
      middle_name: "",
      dob: "",
      phone1: "",
      phone2: "",
      nationality: "",
      state_of_birth: "",
      place_of_birth: "",
      email: "",
      home_address: "",
      office_address: "",
    },
    medical: {
      blood_group: "",
      genotype: "",
      height: "",
      weight: "",
      eye_color: "",
      hair_color: "",
      skin_tone: "",
      hereditary_illness: "",
      donated_before: "",
      donation_count: "",
      medical_conditions: "",
      lifestyle_habits: "",
    },
    reproductive: {
      menstrual_cycle: "",
      fertility_treatments: "",
      children_count: "",
      semen_analysis_date: "",
      stis_history: "",
    },
    identification: {
      passport: false,
      drivers_license: false,
      national_id: false,
      voters_card: false,
      company_id: false,
      id_card_url: null,
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
      Object.values(form.medical).some((v) => String(v || "").trim().length > 0),
      Object.values(form.reproductive).some((v) => String(v || "").trim().length > 0),
      form.identification.id_card_url ||
      Object.entries(form.identification).some(
        ([k, v]) => k !== "id_card_url" && (typeof v === "boolean" ? v : String(v || "").trim().length > 0)
      ),
      Object.entries(form.referral).some(([k, v]) =>
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

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert("Permission required to access gallery");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setIdImage(res.assets[0]);
    }
  };

  // Saved snapshot + helpers to drive red/green borders like KycSurrogate
  const [savedSnapshot, setSavedSnapshot] = useState(null);
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
    if (isFilled(savedVal)) return styles.inputGreen;
    if (isFilled(currentValue)) return styles.inputGreen;
    return styles.inputRed;
  };

  const saveStep = useCallback(
    async (final = false) => {
      try {
        setSaving(true);

        let fileUrl = form.identification.id_card_url || null;
        if (idImage) {
          const resp = await fetch(idImage.uri);
          const arrayBuffer = await resp.arrayBuffer();
          const path = `kyc/${userId}/${Date.now()}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from("kyc")
            .upload(path, arrayBuffer, {
              contentType: "image/jpeg",
              upsert: true,
            });
          if (!uploadErr) {
            const { data: pub } = supabase.storage.from("kyc").getPublicUrl(path);
            fileUrl = pub.publicUrl;
          }
        }

        const payload = {
          ...form,
          identification: { ...form.identification, id_card_url: fileUrl },
        };

        await supabase.from("kyc_documents").upsert(
          {
            user_id: userId,
            role: "DONOR",
            status: final ? "submitted" : "in_progress",
            form_data: payload,
            form_progress: final ? 100 : progressPercent,
            file_url: fileUrl, // Root column for Admin
          },
          { onConflict: "user_id" }
        );

        // Update snapshot so borders stay green after save
        setSavedSnapshot(payload);

        if (final) {
          onDone();
        } else {
          setForm(payload);
          setStep((s) => Math.min(stepsCount - 1, s + 1));
        }
      } catch (e) {
        console.log("Save error:", e.message || e);
        alert("Something went wrong while saving. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [form, progressPercent, userId, idImage, onDone]
  );

  const finishAll = async () => {
    try {
      setSaving(true);
      await saveStep(true);
      await supabase
        .from('kyc_documents')
        .update({ form_progress: 100, status: 'submitted' })
        .eq('user_id', userId);
      onDone();
    } catch (e) {
      console.log('Finalize error (Donor):', e?.message || e);
    } finally {
      setSaving(false);
    }
  };
  const loadExisting = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("form_data, form_progress, status")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data?.form_data) {
        setForm((prev) => ({ ...prev, ...(data.form_data || {}) }));
        setSavedSnapshot(data.form_data || null);
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
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'title'], form.personal.title)]} placeholder="Title" value={form.personal.title} onChangeText={(v) => mergeForm(["personal", "title"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'surname'], form.personal.surname)]} placeholder="Surname" value={form.personal.surname} onChangeText={(v) => mergeForm(["personal", "surname"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'first_name'], form.personal.first_name)]} placeholder="First Name" value={form.personal.first_name} onChangeText={(v) => mergeForm(["personal", "first_name"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'middle_name'], form.personal.middle_name)]} placeholder="Middle Name" value={form.personal.middle_name} onChangeText={(v) => mergeForm(["personal", "middle_name"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'dob'], form.personal.dob)]} placeholder="Date of Birth" value={form.personal.dob} onChangeText={(v) => mergeForm(["personal", "dob"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'phone1'], form.personal.phone1)]} placeholder="Telephone (1)" value={form.personal.phone1} onChangeText={(v) => mergeForm(["personal", "phone1"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'phone2'], form.personal.phone2)]} placeholder="Telephone (2)" value={form.personal.phone2} onChangeText={(v) => mergeForm(["personal", "phone2"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'nationality'], form.personal.nationality)]} placeholder="Nationality" value={form.personal.nationality} onChangeText={(v) => mergeForm(["personal", "nationality"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'state_of_birth'], form.personal.state_of_birth)]} placeholder="State of Birth" value={form.personal.state_of_birth} onChangeText={(v) => mergeForm(["personal", "state_of_birth"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'place_of_birth'], form.personal.place_of_birth)]} placeholder="Place of Birth" value={form.personal.place_of_birth} onChangeText={(v) => mergeForm(["personal", "place_of_birth"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'email'], form.personal.email)]} placeholder="Email" value={form.personal.email} onChangeText={(v) => mergeForm(["personal", "email"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'home_address'], form.personal.home_address)]} placeholder="Home Address" value={form.personal.home_address} onChangeText={(v) => mergeForm(["personal", "home_address"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['personal', 'office_address'], form.personal.office_address)]} placeholder="Office Address" value={form.personal.office_address} onChangeText={(v) => mergeForm(["personal", "office_address"], v)} />
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={styles.sectionTitle}>2. Medical & Genetic Info</Text>
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'blood_group'], form.medical.blood_group)]} placeholder="Blood Group" value={form.medical.blood_group} onChangeText={(v) => mergeForm(["medical", "blood_group"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'genotype'], form.medical.genotype)]} placeholder="Genotype" value={form.medical.genotype} onChangeText={(v) => mergeForm(["medical", "genotype"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'height'], form.medical.height)]} placeholder="Height" value={form.medical.height} onChangeText={(v) => mergeForm(["medical", "height"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'weight'], form.medical.weight)]} placeholder="Weight" value={form.medical.weight} onChangeText={(v) => mergeForm(["medical", "weight"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'eye_color'], form.medical.eye_color)]} placeholder="Eye Color" value={form.medical.eye_color} onChangeText={(v) => mergeForm(["medical", "eye_color"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'hair_color'], form.medical.hair_color)]} placeholder="Hair Color" value={form.medical.hair_color} onChangeText={(v) => mergeForm(["medical", "hair_color"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'skin_tone'], form.medical.skin_tone)]} placeholder="Skin Tone" value={form.medical.skin_tone} onChangeText={(v) => mergeForm(["medical", "skin_tone"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'hereditary_illness'], form.medical.hereditary_illness)]} placeholder="Hereditary illnesses" value={form.medical.hereditary_illness} onChangeText={(v) => mergeForm(["medical", "hereditary_illness"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'donated_before'], form.medical.donated_before)]} placeholder="Donated before?" value={form.medical.donated_before} onChangeText={(v) => mergeForm(["medical", "donated_before"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'donation_count'], form.medical.donation_count)]} placeholder="Number of donations" value={form.medical.donation_count} onChangeText={(v) => mergeForm(["medical", "donation_count"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'medical_conditions'], form.medical.medical_conditions)]} placeholder="Known medical conditions" value={form.medical.medical_conditions} onChangeText={(v) => mergeForm(["medical", "medical_conditions"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['medical', 'lifestyle_habits'], form.medical.lifestyle_habits)]} placeholder="Lifestyle habits" value={form.medical.lifestyle_habits} onChangeText={(v) => mergeForm(["medical", "lifestyle_habits"], v)} />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.sectionTitle}>3. Reproductive & Screening</Text>
            <TextInput style={[styles.input, fieldBorderStyle(['reproductive', 'menstrual_cycle'], form.reproductive.menstrual_cycle)]} placeholder="Menstrual cycle (for females)" value={form.reproductive.menstrual_cycle} onChangeText={(v) => mergeForm(["reproductive", "menstrual_cycle"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['reproductive', 'fertility_treatments'], form.reproductive.fertility_treatments)]} placeholder="Fertility treatments" value={form.reproductive.fertility_treatments} onChangeText={(v) => mergeForm(["reproductive", "fertility_treatments"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['reproductive', 'children_count'], form.reproductive.children_count)]} placeholder="Number of children" value={form.reproductive.children_count} onChangeText={(v) => mergeForm(["reproductive", "children_count"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['reproductive', 'semen_analysis_date'], form.reproductive.semen_analysis_date)]} placeholder="Date of last semen analysis" value={form.reproductive.semen_analysis_date} onChangeText={(v) => mergeForm(["reproductive", "semen_analysis_date"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['reproductive', 'stis_history'], form.reproductive.stis_history)]} placeholder="History of STIs" value={form.reproductive.stis_history} onChangeText={(v) => mergeForm(["reproductive", "stis_history"], v)} />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.sectionTitle}>4. Identification</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={styles.uploadText}>Upload ID</Text>
            </TouchableOpacity>
            {idImage && <Image source={{ uri: idImage.uri }} style={{ width: 120, height: 120, marginTop: 10 }} />}
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.sectionTitle}>5. Referral Information</Text>
            <TextInput style={[styles.input, fieldBorderStyle(['referral', 'doctor_referral'], form.referral.doctor_referral)]} placeholder="Doctor referral (Yes/No)" value={form.referral.doctor_referral} onChangeText={(v) => mergeForm(["referral", "doctor_referral"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['referral', 'doctor_contact'], form.referral.doctor_contact)]} placeholder="Doctor contact" value={form.referral.doctor_contact} onChangeText={(v) => mergeForm(["referral", "doctor_contact"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['referral', 'doctor_phone'], form.referral.doctor_phone)]} placeholder="Doctor phone" value={form.referral.doctor_phone} onChangeText={(v) => mergeForm(["referral", "doctor_phone"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['referral', 'source_others'], form.referral.source_others)]} placeholder="Other referral source" value={form.referral.source_others} onChangeText={(v) => mergeForm(["referral", "source_others"], v)} />
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.sectionTitle}>6. Emergency Contacts</Text>
            <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'name1'], form.emergency.name1)]} placeholder="Name (1)" value={form.emergency.name1} onChangeText={(v) => mergeForm(["emergency", "name1"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'mobile1'], form.emergency.mobile1)]} placeholder="Mobile (1)" value={form.emergency.mobile1} onChangeText={(v) => mergeForm(["emergency", "mobile1"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'name2'], form.emergency.name2)]} placeholder="Name (2)" value={form.emergency.name2} onChangeText={(v) => mergeForm(["emergency", "name2"], v)} />
            <TextInput style={[styles.input, fieldBorderStyle(['emergency', 'mobile2'], form.emergency.mobile2)]} placeholder="Mobile (2)" value={form.emergency.mobile2} onChangeText={(v) => mergeForm(["emergency", "mobile2"], v)} />
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
        <Text style={styles.headerTitle}>KYC — Donor</Text>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Ionicons name="exit-outline" size={16} color="#fff" />
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
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
  inputGreen: { borderColor: BRAND_GREEN },
  inputRed: { borderColor: '#ef4444' },
  uploadBtn: { backgroundColor: BRAND_GREEN, padding: 12, borderRadius: 10, marginTop: 10 },
  uploadText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  navBtn: { backgroundColor: "#EEF2F7", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  navText: { color: BRAND_GREEN, fontWeight: "800" },
  primaryBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  primaryText: { color: ACCENT_WHITE, fontWeight: "800" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
