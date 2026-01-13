// screens/AdminContracts.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

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

export default function AdminContracts({ onBack = () => {} }) {
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
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!on) return;
        setTemplates(data || []);
      } catch (e) {
        console.log('load templates error', e?.message || e);
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
        // default a friendly name from filename
        const n = (file.name || 'Contract Template').replace(/\.(md|txt)$/i, '');
        setName(n);
      }
      Alert.alert('Template loaded', `Found ${found.length} variable(s).`);
    } catch (e) {
      Alert.alert('Pick failed', e?.message || String(e));
    }
  };

  const saveTemplate = async () => {
    try {
      if (!name.trim()) return Alert.alert('Missing name', 'Enter a template name.');
      if (!body.trim()) return Alert.alert('Missing body', 'Please pick a template file first.');

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({ name: name.trim(), body, variables: vars })
        .select('*')
        .single();
      if (error) throw error;

      setTemplates((prev) => [data, ...prev]);
      setSelected(data);
      setFills(Object.fromEntries((data.variables || []).map((k) => [k, ''])));
      Alert.alert('Saved', 'Template saved successfully.');
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

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <Text style={styles.header}>Admin · Contracts</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Templates */}
        <Text style={styles.sectionTitle}>Templates</Text>
        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : templates.length === 0 ? (
          <Text style={styles.muted}>No templates yet.</Text>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => chooseTemplate(item)}
                style={[
                  styles.tplPill,
                  selected?.id === item.id && styles.tplPillActive
                ]}
              >
                <Text style={[styles.tplText, selected?.id === item.id && styles.tplTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Upload New Template */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload Template (.txt / .md)</Text>
          <TextInput
            placeholder="Template name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.ghostBtn} onPress={pickTemplate}>
              <Text style={styles.ghostText}>Pick File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={saveTemplate}>
              <Text style={styles.primaryText}>Save Template</Text>
            </TouchableOpacity>
          </View>
          {!!vars.length && (
            <View style={styles.varsWrap}>
              <Text style={styles.varsTitle}>Detected variables ({vars.length}):</Text>
              <Text style={styles.varsList}>{vars.map(v => `{{${v}}}`).join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Fill Variables + Live Preview */}
        {selected && (
          <View style={styles.fillWrap}>
            <Text style={styles.sectionTitle}>Fill Variables</Text>
            <ScrollView style={styles.fillForm} contentContainerStyle={{ paddingBottom: 16 }}>
              {(selected.variables || []).map((key) => (
                <View key={key} style={{ marginBottom: 10 }}>
                  <Text style={styles.label}>{key}</Text>
                  <TextInput
                    value={fills[key]}
                    onChangeText={(t) => setFills((prev) => ({ ...prev, [key]: t }))}
                    placeholder={`Enter ${key}`}
                    style={styles.input}
                  />
                </View>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Filled Preview</Text>
            <ScrollView style={styles.previewBox}>
              <Text style={styles.previewText}>{preview}</Text>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9', paddingTop: 8, paddingHorizontal: 16 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  header: { fontSize: 22, fontWeight: '800', color: BRAND_GREEN },
  backBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  backText: { color: ACCENT_WHITE, fontWeight: '700' },

  sectionTitle: { marginTop: 10, marginBottom: 6, color: '#111827', fontWeight: '800' },
  muted: { color: '#6B7280' },

  tplPill: { backgroundColor: '#E5F5EA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  tplPillActive: { backgroundColor: BRAND_GREEN },
  tplText: { color: BRAND_GREEN, fontWeight: '700' },
  tplTextActive: { color: '#fff' },

  card: {
    backgroundColor: ACCENT_WHITE, borderRadius: 16, padding: 14, marginTop: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6
  },
  cardTitle: { color: BRAND_GREEN, fontWeight: '900', marginBottom: 8 },

  row: { flexDirection: 'row', gap: 10, marginTop: 6 },

  ghostBtn: { backgroundColor: '#EEF2F7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  ghostText: { color: BRAND_GREEN, fontWeight: '800' },

  primaryBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '800' },

  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#111827'
  },

  varsWrap: { marginTop: 10, backgroundColor: '#F1F8F4', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#D7EFE0' },
  varsTitle: { color: BRAND_GREEN, fontWeight: '800' },
  varsList: { color: '#374151', marginTop: 4 },

  fillWrap: { marginTop: 12 },
  label: { color: '#374151', marginBottom: 4, fontWeight: '600' },
  fillForm: {
    maxHeight: 160,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 10
  },

  previewBox: {
    maxHeight: 220,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 12, marginTop: 8
  },
  previewText: { color: '#111827' },
});
