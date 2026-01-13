// screens/KycAgency.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAF9';

const STEPS = [
  'Agency Details',
  'Operational Information',
  'Legal & Compliance',
  'Representative Identification',
  'Referral Information',
  'Emergency / Compliance Contacts',
];

function ThinProgress({ percent = 0 }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressWrap}>
        <View style={[styles.progressBar, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{pct}%</Text>
    </View>
  );
}

export default function KycAgency({
  userId,
  onSkip = () => {},
  onDone = () => {},
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [form, setForm] = useState({
    role: 'AGENCY',
    details: {
      agency_name: '',
      registration_number: '',
      incorporation_date: '',
      org_type: '',
      primary_contact_name: '',
      primary_contact_title: '',
      phone1: '',
      phone2: '',
      official_email: '',
      website: '',
      hq_address: '',
      branch_offices: '',
    },
    ops: {
      service_surrogacy: false,
      service_egg_donation: false,
      service_sperm_donation: false,
      service_ivf_support: false,
      service_legal: false,
      service_counseling: false,
      service_other_text: '',
      staff_count: '',
      active_surrogates_count: '',
      active_donors_count: '',
      matched_ip_count: '',
      partner_clinics: '',
      years_experience: '',
    },
    compliance: {
      tin: '',
      insurance_has: null, // true/false
      insurance_details: '',
      proof_registration_url: '',
      operating_license_url: '',
    },
    representative_id: {
      passport: false,
      drivers_license: false,
      national_id: false,
      voters_card: false,
      company_id: false,
      representative_id_urls: [], // array of image URLs
    },
    referral: {
      source_staff: false,
      source_partner_clinic: false,
      source_friend: false,
      source_website: false,
      source_facebook: false,
      source_instagram: false,
      source_whatsapp: false,
      source_linkedin: false,
      source_twitter: false,
      source_ngo: false,
      source_other: '',
    },
    emergency: {
      name1: '',
      designation1: '',
      phone1: '',
      email1: '',
      name2: '',
      designation2: '',
      phone2: '',
      email2: '',
    },
  });

  const stepsCount = STEPS.length;

  // Calculate simple progress: step considered complete if any of its fields are filled/set
  const stepCompleted = useMemo(() => {
    const nonEmpty = (v) => String(v || '').trim().length > 0;

    const s1 =
      Object.values(form.details).some((v) => nonEmpty(v));
    const s2 =
      form.ops.service_surrogacy ||
      form.ops.service_egg_donation ||
      form.ops.service_sperm_donation ||
      form.ops.service_ivf_support ||
      form.ops.service_legal ||
      form.ops.service_counseling ||
      nonEmpty(form.ops.service_other_text) ||
      nonEmpty(form.ops.staff_count) ||
      nonEmpty(form.ops.active_surrogates_count) ||
      nonEmpty(form.ops.active_donors_count) ||
      nonEmpty(form.ops.matched_ip_count) ||
      nonEmpty(form.ops.partner_clinics) ||
      nonEmpty(form.ops.years_experience);

    const s3 =
      nonEmpty(form.compliance.tin) ||
      form.compliance.insurance_has !== null ||
      nonEmpty(form.compliance.insurance_details) ||
      nonEmpty(form.compliance.proof_registration_url) ||
      nonEmpty(form.compliance.operating_license_url);

    const s4 =
      form.representative_id.passport ||
      form.representative_id.drivers_license ||
      form.representative_id.national_id ||
      form.representative_id.voters_card ||
      form.representative_id.company_id ||
      (form.representative_id.representative_id_urls || []).length > 0;

    const s5 =
      form.referral.source_staff ||
      form.referral.source_partner_clinic ||
      form.referral.source_friend ||
      form.referral.source_website ||
      form.referral.source_facebook ||
      form.referral.source_instagram ||
      form.referral.source_whatsapp ||
      form.referral.source_linkedin ||
      form.referral.source_twitter ||
      form.referral.source_ngo ||
      nonEmpty(form.referral.source_other);

    const s6 =
      nonEmpty(form.emergency.name1) ||
      nonEmpty(form.emergency.designation1) ||
      nonEmpty(form.emergency.phone1) ||
      nonEmpty(form.emergency.email1) ||
      nonEmpty(form.emergency.name2) ||
      nonEmpty(form.emergency.designation2) ||
      nonEmpty(form.emergency.phone2) ||
      nonEmpty(form.emergency.email2);

    return [s1, s2, s3, s4, s5, s6];
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

  // Upload helper
  const pickAndUpload = async (saveToPathArray) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Please allow photo library access to upload.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (res.canceled || !res.assets?.[0]) return;

    try {
      const asset = res.assets[0];
      const resp = await fetch(asset.uri);
      const arrayBuffer = await resp.arrayBuffer();
      const path = `kyc/${userId}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.jpg`;

      const up = await supabase.storage.from('kyc').upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from('kyc').getPublicUrl(path);
      const publicUrl = pub?.publicUrl || '';

      // Save into form at given path (string for single; array push for list)
      setForm((prev) => {
        const next = { ...prev };
        let ref = next;
        for (let i = 0; i < saveToPathArray.length - 1; i++) {
          ref[saveToPathArray[i]] = { ...ref[saveToPathArray[i]] };
          ref = ref[saveToPathArray[i]];
        }
        const last = saveToPathArray[saveToPathArray.length - 1];
        if (Array.isArray(ref[last])) {
          ref[last] = [...ref[last], publicUrl];
        } else {
          ref[last] = publicUrl;
        }
        return next;
      });
    } catch (e) {
      console.log('Upload failed:', e?.message || e);
      alert('Upload failed. Please try again.');
    }
  };

  // Save current state to DB
  const saveStep = useCallback(
    async (finalize = false) => {
      try {
        setSaving(true);

        const { data: existing, error: selErr } = await supabase
          .from('kyc_documents')
          .select('id, status')
          .eq('user_id', userId)
          .maybeSingle();
        if (selErr) throw selErr;

        const status =
          finalize || progressPercent === 100 ? 'submitted' : 'in_progress';

        if (!existing) {
          const { error: insErr } = await supabase.from('kyc_documents').insert([
            {
              user_id: userId,
              role: 'AGENCY',
              status,
              form_data: form,
              form_progress: progressPercent,
            },
          ]);
          if (insErr) throw insErr;
        } else {
          const { error: updErr } = await supabase
            .from('kyc_documents')
            .update({
              role: 'AGENCY',
              status,
              form_data: form,
              form_progress: progressPercent,
            })
            .eq('user_id', userId);
          if (updErr) throw updErr;
        }

        if (finalize || progressPercent === 100) {
          onDone();
        }
      } catch (e) {
        console.log('KYC save error:', e?.message || e);
        // Soft-fail to keep flow smooth
      } finally {
        setSaving(false);
      }
    },
    [form, progressPercent, userId, onDone]
  );

  const loadExisting = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('form_data, form_progress, status')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (data?.form_data) {
        setForm((prev) => ({ ...prev, ...(data.form_data || {}) }));
      }
      if ((data?.form_progress ?? 0) >= 100 || data?.status === 'approved') {
        onDone();
      }
    } catch (e) {
      // ignore for MVP
    } finally {
      setLoading(false);
    }
  }, [userId, onDone]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const goNext = async () => {
    await saveStep(false);
    setStep((s) => Math.min(stepsCount - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const finishAll = async () => await saveStep(true);

  // Reusable pill
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

  // Step renderers
  const renderDetails = () => (
    <View>
      <Text style={styles.sectionTitle}>1. Agency Details</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Agency Name"
        value={form.details.agency_name}
        onChangeText={(t) => mergeForm(['details', 'agency_name'], t)}
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Registration / License Number"
          value={form.details.registration_number}
          onChangeText={(t) => mergeForm(['details', 'registration_number'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Incorporation (DD/MM/YYYY)"
          value={form.details.incorporation_date}
          onChangeText={(t) => mergeForm(['details', 'incorporation_date'], t)}
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Type of Organization (LLC / NGO / Clinic-affiliated / Other)"
        value={form.details.org_type}
        onChangeText={(t) => mergeForm(['details', 'org_type'], t)}
      />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Primary Contact — Full Name"
          value={form.details.primary_contact_name}
          onChangeText={(t) => mergeForm(['details', 'primary_contact_name'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Designation / Role"
          value={form.details.primary_contact_title}
          onChangeText={(t) => mergeForm(['details', 'primary_contact_title'], t)}
        />
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Telephone (1)"
          value={form.details.phone1}
          onChangeText={(t) => mergeForm(['details', 'phone1'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Telephone (2)"
          value={form.details.phone2}
          onChangeText={(t) => mergeForm(['details', 'phone2'], t)}
        />
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Official Email"
          value={form.details.official_email}
          onChangeText={(t) => mergeForm(['details', 'official_email'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Website"
          value={form.details.website}
          onChangeText={(t) => mergeForm(['details', 'website'], t)}
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Office Address (Headquarters)"
        value={form.details.hq_address}
        onChangeText={(t) => mergeForm(['details', 'hq_address'], t)}
      />

      <TextInput
        style={styles.inputFull}
        placeholder="Branch Offices (if any)"
        value={form.details.branch_offices}
        onChangeText={(t) => mergeForm(['details', 'branch_offices'], t)}
      />
    </View>
  );

  const renderOps = () => (
    <View>
      <Text style={styles.sectionTitle}>2. Operational Information</Text>
      <Text style={styles.smallNote}>Services Provided (tap to toggle):</Text>
      <View style={styles.pillWrap}>
        <Pill
          label="Surrogacy"
          active={form.ops.service_surrogacy}
          onPress={() => mergeForm(['ops', 'service_surrogacy'], !form.ops.service_surrogacy)}
        />
        <Pill
          label="Egg Donation"
          active={form.ops.service_egg_donation}
          onPress={() => mergeForm(['ops', 'service_egg_donation'], !form.ops.service_egg_donation)}
        />
        <Pill
          label="Sperm Donation"
          active={form.ops.service_sperm_donation}
          onPress={() => mergeForm(['ops', 'service_sperm_donation'], !form.ops.service_sperm_donation)}
        />
        <Pill
          label="IVF Support"
          active={form.ops.service_ivf_support}
          onPress={() => mergeForm(['ops', 'service_ivf_support'], !form.ops.service_ivf_support)}
        />
        <Pill
          label="Legal"
          active={form.ops.service_legal}
          onPress={() => mergeForm(['ops', 'service_legal'], !form.ops.service_legal)}
        />
        <Pill
          label="Counseling"
          active={form.ops.service_counseling}
          onPress={() => mergeForm(['ops', 'service_counseling'], !form.ops.service_counseling)}
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Other Services (specify)"
        value={form.ops.service_other_text}
        onChangeText={(t) => mergeForm(['ops', 'service_other_text'], t)}
      />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Number of Staff"
          value={form.ops.staff_count}
          onChangeText={(t) => mergeForm(['ops', 'staff_count'], t)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Active Surrogates"
          value={form.ops.active_surrogates_count}
          onChangeText={(t) => mergeForm(['ops', 'active_surrogates_count'], t)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Active Donors"
          value={form.ops.active_donors_count}
          onChangeText={(t) => mergeForm(['ops', 'active_donors_count'], t)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Intended Parents Matched (to date)"
          value={form.ops.matched_ip_count}
          onChangeText={(t) => mergeForm(['ops', 'matched_ip_count'], t)}
          keyboardType="numeric"
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Partner Clinics / Hospitals"
        value={form.ops.partner_clinics}
        onChangeText={(t) => mergeForm(['ops', 'partner_clinics'], t)}
      />

      <TextInput
        style={styles.inputFull}
        placeholder="Years of Experience in Programs"
        value={form.ops.years_experience}
        onChangeText={(t) => mergeForm(['ops', 'years_experience'], t)}
        keyboardType="numeric"
      />
    </View>
  );

  const renderCompliance = () => (
    <View>
      <Text style={styles.sectionTitle}>3. Legal & Compliance</Text>

      <TextInput
        style={styles.inputFull}
        placeholder="Tax Identification Number (TIN)"
        value={form.compliance.tin}
        onChangeText={(t) => mergeForm(['compliance', 'tin'], t)}
      />

      <View style={styles.pillRow}>
        <Pill
          label={`Insurance Coverage: ${
            form.compliance.insurance_has === true ? 'Yes' :
            form.compliance.insurance_has === false ? 'No' : 'N/A'
          }`}
          active={form.compliance.insurance_has === true}
          onPress={() =>
            mergeForm(
              ['compliance', 'insurance_has'],
              form.compliance.insurance_has === true ? null : true
            )
          }
        />
        <Pill
          label="Set No"
          active={form.compliance.insurance_has === false}
          onPress={() =>
            mergeForm(
              ['compliance', 'insurance_has'],
              form.compliance.insurance_has === false ? null : false
            )
          }
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Insurance Details (if any)"
        value={form.compliance.insurance_details}
        onChangeText={(t) => mergeForm(['compliance', 'insurance_details'], t)}
      />

      {/* Uploads */}
      <View style={styles.uploadRow}>
        <Text style={styles.uploadLabel}>Proof of Registration / Business Certificate</Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => pickAndUpload(['compliance', 'proof_registration_url'])}
        >
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>
      {form.compliance.proof_registration_url ? (
        <Image
          source={{ uri: form.compliance.proof_registration_url }}
          style={styles.previewImage}
        />
      ) : null}

      <View style={styles.uploadRow}>
        <Text style={styles.uploadLabel}>Operating License (if applicable)</Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => pickAndUpload(['compliance', 'operating_license_url'])}
        >
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>
      {form.compliance.operating_license_url ? (
        <Image
          source={{ uri: form.compliance.operating_license_url }}
          style={styles.previewImage}
        />
      ) : null}
    </View>
  );

  const renderRepId = () => (
    <View>
      <Text style={styles.sectionTitle}>4. Identification (Agency Representative)</Text>
      <Text style={styles.smallNote}>Tick the type(s) of ID and upload image(s):</Text>

      <View style={styles.pillWrap}>
        <Pill
          label="International Passport"
          active={form.representative_id.passport}
          onPress={() => mergeForm(['representative_id', 'passport'], !form.representative_id.passport)}
        />
        <Pill
          label="Driver’s License"
          active={form.representative_id.drivers_license}
          onPress={() => mergeForm(['representative_id', 'drivers_license'], !form.representative_id.drivers_license)}
        />
        <Pill
          label="National ID"
          active={form.representative_id.national_id}
          onPress={() => mergeForm(['representative_id', 'national_id'], !form.representative_id.national_id)}
        />
        <Pill
          label="Voter’s Card"
          active={form.representative_id.voters_card}
          onPress={() => mergeForm(['representative_id', 'voters_card'], !form.representative_id.voters_card)}
        />
        <Pill
          label="Company ID"
          active={form.representative_id.company_id}
          onPress={() => mergeForm(['representative_id', 'company_id'], !form.representative_id.company_id)}
        />
      </View>

      <TouchableOpacity
        style={[styles.uploadBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
        onPress={() => pickAndUpload(['representative_id', 'representative_id_urls'])}
      >
        <Ionicons name="cloud-upload" size={16} color="#fff" />
        <Text style={styles.uploadText}>Upload Representative ID</Text>
      </TouchableOpacity>

      <View style={styles.thumbRow}>
        {(form.representative_id.representative_id_urls || []).map((u, idx) => (
          <Image key={idx} source={{ uri: u }} style={styles.thumb} />
        ))}
      </View>
    </View>
  );

  const renderReferral = () => (
    <View>
      <Text style={styles.sectionTitle}>5. Referral Information</Text>
      <View style={styles.pillWrap}>
        <Pill
          label="Staff"
          active={form.referral.source_staff}
          onPress={() => mergeForm(['referral', 'source_staff'], !form.referral.source_staff)}
        />
        <Pill
          label="Partner Clinic"
          active={form.referral.source_partner_clinic}
          onPress={() =>
            mergeForm(['referral', 'source_partner_clinic'], !form.referral.source_partner_clinic)
          }
        />
        <Pill
          label="Friend"
          active={form.referral.source_friend}
          onPress={() => mergeForm(['referral', 'source_friend'], !form.referral.source_friend)}
        />
        <Pill
          label="Website"
          active={form.referral.source_website}
          onPress={() => mergeForm(['referral', 'source_website'], !form.referral.source_website)}
        />
        <Pill
          label="Facebook"
          active={form.referral.source_facebook}
          onPress={() => mergeForm(['referral', 'source_facebook'], !form.referral.source_facebook)}
        />
        <Pill
          label="Instagram"
          active={form.referral.source_instagram}
          onPress={() =>
            mergeForm(['referral', 'source_instagram'], !form.referral.source_instagram)
          }
        />
        <Pill
          label="WhatsApp"
          active={form.referral.source_whatsapp}
          onPress={() =>
            mergeForm(['referral', 'source_whatsapp'], !form.referral.source_whatsapp)
          }
        />
        <Pill
          label="LinkedIn"
          active={form.referral.source_linkedin}
          onPress={() => mergeForm(['referral', 'source_linkedin'], !form.referral.source_linkedin)}
        />
        <Pill
          label="Twitter"
          active={form.referral.source_twitter}
          onPress={() => mergeForm(['referral', 'source_twitter'], !form.referral.source_twitter)}
        />
        <Pill
          label="NGO"
          active={form.referral.source_ngo}
          onPress={() => mergeForm(['referral', 'source_ngo'], !form.referral.source_ngo)}
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Others (please specify)"
        value={form.referral.source_other}
        onChangeText={(t) => mergeForm(['referral', 'source_other'], t)}
      />
    </View>
  );

  const renderEmergency = () => (
    <View>
      <Text style={styles.sectionTitle}>6. Emergency / Compliance Contacts</Text>
      <Text style={styles.smallNote}>Primary Contact</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={form.emergency.name1}
          onChangeText={(t) => mergeForm(['emergency', 'name1'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Designation"
          value={form.emergency.designation1}
          onChangeText={(t) => mergeForm(['emergency', 'designation1'], t)}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Telephone"
          value={form.emergency.phone1}
          onChangeText={(t) => mergeForm(['emergency', 'phone1'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.emergency.email1}
          onChangeText={(t) => mergeForm(['emergency', 'email1'], t)}
        />
      </View>

      <Text style={[styles.smallNote, { marginTop: 10 }]}>Secondary Contact</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={form.emergency.name2}
          onChangeText={(t) => mergeForm(['emergency', 'name2'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Designation"
          value={form.emergency.designation2}
          onChangeText={(t) => mergeForm(['emergency', 'designation2'], t)}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Telephone"
          value={form.emergency.phone2}
          onChangeText={(t) => mergeForm(['emergency', 'phone2'], t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.emergency.email2}
          onChangeText={(t) => mergeForm(['emergency', 'email2'], t)}
        />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderDetails();
      case 1:
        return renderOps();
      case 2:
        return renderCompliance();
      case 3:
        return renderRepId();
      case 4:
        return renderReferral();
      case 5:
        return renderEmergency();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={{ color: GRAY, marginTop: 8 }}>Loading agency KYC…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>KYC — Agency</Text>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Ionicons name="exit-outline" size={16} color="#fff" />
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <ThinProgress percent={progressPercent} />
        <Text style={styles.stepLabel}>
          Step {step + 1} of {stepsCount}: {STEPS[step]}
        </Text>

        {/* Content */}
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
          {renderStep()}
        </ScrollView>

        {/* Nav actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={goBack}
            style={[styles.navBtn, step === 0 && { opacity: 0.4 }]}
            disabled={step === 0 || saving}
          >
            <Text style={styles.navText}>Back</Text>
          </TouchableOpacity>

          {step < stepsCount - 1 ? (
            <TouchableOpacity
              onPress={goNext}
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={finishAll}
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Submit</Text>
              )}
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: BRAND_GREEN },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skipText: { color: '#fff', fontWeight: '800', marginLeft: 6 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressWrap: { flex: 1, height: 6, backgroundColor: '#E5F5EA', borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: BRAND_GREEN },
  progressLabel: { color: GRAY, fontSize: 12, fontWeight: '700' },
  stepLabel: { color: '#374151', marginBottom: 10, fontWeight: '700' },

  sectionTitle: { color: BRAND_GREEN, fontWeight: '900', marginBottom: 10, fontSize: 16 },

  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputFull: {
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillActive: { backgroundColor: '#E5F5EA', borderColor: BRAND_GREEN },
  pillText: { color: '#374151', fontWeight: '700' },
  pillTextActive: { color: BRAND_GREEN },

  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navBtn: { backgroundColor: '#EEF2F7', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  navText: { color: BRAND_GREEN, fontWeight: '800' },

  primaryBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  primaryText: { color: ACCENT_WHITE, fontWeight: '800' },

  smallNote: { color: GRAY, fontSize: 12, marginBottom: 6 },

  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  uploadLabel: { color: '#374151', fontWeight: '700', flex: 1, marginRight: 10 },
  uploadBtn: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  uploadText: { color: '#fff', fontWeight: '800' },
  previewImage: { width: 110, height: 110, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },

  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
