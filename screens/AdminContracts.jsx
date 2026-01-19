// screens/AdminContracts.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';

// Colors & Theme
const BRAND_GREEN = '#16A34A';
const BRAND_DARK = '#14532D';
const ACCENT_WHITE = '#FFFFFF';
const BG_COLOR = '#F8FAFC'; // Cool Gray 50
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E2E8F0'; // Slate 200
const TEXT_PRIMARY = '#1E293B'; // Slate 800
const TEXT_SECONDARY = '#64748B'; // Slate 500

const { width } = Dimensions.get('window');
const isTablet = width > 768;

function detectVariables(body = '') {
  const reg = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const set = new Set();
  let m;
  while ((m = reg.exec(body)) !== null) {
    set.add(m[1]);
  }
  return Array.from(set);
}

function fillBody(body = '', values = {}) {
  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    const v = values[key];
    return v != null && v !== '' ? String(v) : `{{${key}}}`;
  });
}

const Header = ({ onBack }) => (
  <View style={styles.headerContainer}>
    <LinearGradient
      colors={[BRAND_GREEN, BRAND_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={ACCENT_WHITE} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Contract Management</Text>
            <Text style={styles.headerSubtitle}>Manage templates & generate agreements</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  </View>
);

export default function AdminContracts({ onBack = () => { } }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // upload state
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [vars, setVars] = useState([]);

  // fill state
  const [selected, setSelected] = useState(null);
  const [fills, setFills] = useState({});

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        // Get contract templates from admin API
        const contracts = await adminAPI.getContracts();
        if (!on) return;
        setTemplates(contracts || []);
      } catch (e) {
        console.log('load templates error', e?.message || e);
        // Set fallback data
        setTemplates([
          {
            id: '1',
            title: 'Standard Surrogacy Agreement',
            type: 'surrogacy',
            version: '2.1',
            status: 'active',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Egg Donation Agreement',
            type: 'donation',
            version: '1.5',
            status: 'active',
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const pickTemplate = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ['text/plain', 'text/markdown', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file) return;

      const textRes = await fetch(file.uri);
      const content = await textRes.text();

      setBody(content);
      const found = detectVariables(content);
      setVars(found);
      if (!name) {
        const n = (file.name || 'Contract Template').replace(/\.(md|txt)$/i, '');
        setName(n);
      }
      Alert.alert('Template Loaded', `Found ${found.length} variable(s). Ready to save.`);
    } catch (e) {
      Alert.alert('Pick failed', e?.message || String(e));
    }
  };

  const saveTemplate = async () => {
    try {
      if (!name.trim()) return Alert.alert('Missing Name', 'Please enter a name for this template.');
      if (!body.trim()) return Alert.alert('Missing Content', 'Please pick a template file first.');

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({ name: name.trim(), body, variables: vars })
        .select('*')
        .single();
      if (error) throw error;

      setTemplates((prev) => [data, ...prev]);
      setSelected(data);
      setFills(Object.fromEntries((data.variables || []).map((k) => [k, ''])));
      setName('');
      setBody('');
      setVars([]);
      Alert.alert('Success', 'Template saved successfully.');
    } catch (e) {
      Alert.alert('Save failed', e?.message || String(e));
    }
  };

  const chooseTemplate = (tpl) => {
    setSelected(tpl);
    const initial = Object.fromEntries((tpl.variables || []).map((k) => [k, '']));
    setFills(initial);
  };

  const preview = useMemo(() => {
    const src = selected ? selected.body : body;
    const values = selected ? fills : Object.fromEntries(vars.map((k) => [k, '']));
    return fillBody(src || '', values);
  }, [selected, body, vars, fills]);

  const renderTemplateCard = ({ item }) => {
    const isActive = selected?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => chooseTemplate(item)}
        style={[styles.templateCard, isActive && styles.templateCardActive]}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isActive ? [BRAND_GREEN, '#15803d'] : ['#F8FAFC', '#F1F5F9']}
          style={styles.cardGradient}
        >
          <View style={styles.cardIcon}>
            <Ionicons
              name={isActive ? "document-text" : "document-text-outline"}
              size={28}
              color={isActive ? ACCENT_WHITE : BRAND_GREEN}
            />
          </View>
          <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.cardMeta, isActive && styles.cardMetaActive]}>
            {item.variables?.length || 0} Variables
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <Header onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Templates Carousel */}
          <View style={styles.sectionHeader}>
            <Ionicons name="library-outline" size={20} color={BRAND_GREEN} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Available Templates</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading templates...</Text>
            </View>
          ) : templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No templates found. Upload one below.</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={renderTemplateCard}
            />
          )}

          {/* Editor & Upload Area */}
          <View style={styles.splitLayout}>
            {/* Upload / Details Section */}
            <View style={styles.editorSection}>
              {!selected ? (
                // UPLOAD MODE
                <View style={[styles.card, styles.uploadCard]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="cloud-upload-outline" size={22} color={TEXT_PRIMARY} />
                    <Text style={styles.cardHeaderTitle}>Upload New Template</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Template Name</Text>
                    <TextInput
                      placeholder="e.g. Standard Surrogacy Agreement"
                      value={name}
                      onChangeText={setName}
                      style={styles.input}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <TouchableOpacity style={styles.dropZone} onPress={pickTemplate}>
                    <Ionicons
                      name={body ? "checkmark-circle" : "document-attach-outline"}
                      size={40}
                      color={body ? BRAND_GREEN : "#94A3B8"}
                    />
                    <Text style={[styles.dropText, body && { color: BRAND_GREEN, fontWeight: '600' }]}>
                      {body ? "Template Loaded Successfully" : "Tap to pick a .txt or .md file"}
                    </Text>
                    {!!vars.length && (
                      <Text style={styles.varCountBadge}>{vars.length} variables detected</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, (!name.trim() || !body.trim()) && styles.disabledBtn]}
                    onPress={saveTemplate}
                    disabled={!name.trim() || !body.trim()}
                  >
                    <Text style={styles.primaryBtnText}>Save Template</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // FILL VARIABLES MODE
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="create-outline" size={22} color={TEXT_PRIMARY} />
                    <Text style={styles.cardHeaderTitle}>Fill Details: {selected.name}</Text>
                    <TouchableOpacity onPress={() => setSelected(null)} style={{ marginLeft: 'auto' }}>
                      <Text style={{ color: BRAND_GREEN, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
                    {(selected.variables || []).length === 0 ? (
                      <Text style={styles.mutedText}>No variables to fill in this template.</Text>
                    ) : (
                      (selected.variables || []).map((key) => (
                        <View key={key} style={styles.inputGroup}>
                          <Text style={styles.label}>{key.replace(/_/g, ' ')}</Text>
                          <TextInput
                            value={fills[key]}
                            onChangeText={(t) => setFills((prev) => ({ ...prev, [key]: t }))}
                            placeholder={`Enter value`}
                            style={styles.input}
                            placeholderTextColor="#94A3B8"
                          />
                        </View>
                      ))
                    )}
                  </ScrollView>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { flex: 1 }]}
                      onPress={() => Alert.alert('Coming Soon', 'PDF Generation will be implemented here.')}
                    >
                      <Ionicons name="print-outline" size={18} color={BRAND_GREEN} style={{ marginRight: 6 }} />
                      <Text style={styles.secondaryBtnText}>Generate PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Preview Section */}
            {(selected || body) && (
              <View style={styles.previewSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="eye-outline" size={20} color={BRAND_GREEN} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Live Preview</Text>
                </View>

                <View style={styles.paperSheet}>
                  <ScrollView nestedScrollEnabled style={{ height: 400 }}>
                    <Text style={styles.documentText}>{preview}</Text>
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: BRAND_GREEN,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ACCENT_WHITE,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    marginTop: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },

  // Template Cards
  templateCard: {
    width: 160,
    height: 140,
    borderRadius: 16,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: CARD_BG,
  },
  templateCardActive: {
    elevation: 6,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.3,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 8,
  },
  cardTitleActive: {
    color: ACCENT_WHITE,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  cardMetaActive: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Editor Layout
  splitLayout: {
    paddingHorizontal: 20,
    gap: 24,
  },
  editorSection: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  input: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },

  // Drop Zone
  dropZone: {
    height: 140,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
    padding: 16,
  },
  dropText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  varCountBadge: {
    marginTop: 8,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    color: '#15803d',
    borderRadius: 99,
    fontWeight: '600',
    overflow: 'hidden',
  },

  // Buttons
  primaryBtn: {
    backgroundColor: BRAND_GREEN,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  disabledBtn: {
    backgroundColor: BRAND_GREEN,
    opacity: 0.5,
    elevation: 0,
  },
  primaryBtnText: {
    color: ACCENT_WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  secondaryBtnText: {
    color: BRAND_GREEN,
    fontWeight: '600',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
  },

  // Preview Paper
  paperSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2, // Slight rounded corners for paper look
    minHeight: 400,
    padding: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 40,
  },
  documentText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    lineHeight: 24,
    color: '#334155',
  },
  mutedText: {
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
});
