// screens/SignContract.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Signature from 'react-native-signature-canvas';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { adminAPI, uploadAPI, contractsAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

function fillBody(body = '', values = {}) {
  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    const v = values[key];
    return v != null && v !== '' ? String(v) : `{{${key}}}`;
  });
}

// Convert base64 → ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary_string = global.atob ? global.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
}

export default function SignContract({
  userId = '55555555-5555-5555-5555-555555555555',
  role = 'IP',
  onBack = () => { },
}) {
  const [templates, setTemplates] = useState([]);
  const [tpl, setTpl] = useState(null);
  const [fills, setFills] = useState({});
  const [signerName, setSignerName] = useState('');
  const [sigB64, setSigB64] = useState(''); // raw base64 (no data: prefix)
  const [busy, setBusy] = useState(false);

  const sigRef = useRef(null);

  // Load templates
  useEffect(() => {
    let on = true;
    (async () => {
      const fetchAll = async () => {
        try {
          const data = await adminAPI.getContractTemplates();
          if (!on) return;
          setTemplates(data || []);
          if ((data || []).length && !tpl) {
            setTpl(data[0]);
            const init = Object.fromEntries((data[0].variables || []).map((k) => [k, '']));
            setFills(init);
          }
        } catch (e) {
          Alert.alert('Load templates failed', e?.message || String(e));
        }
      };
      fetchAll();
      return () => { on = false; };
    }, []);

    const onSelectTpl = (t) => {
      setTpl(t);
      const init = Object.fromEntries((t.variables || []).map((k) => [k, '']));
      setFills(init);
      setSigB64('');
    };

    const preview = useMemo(() => {
      const src = tpl?.body || '';
      return fillBody(src, fills);
    }, [tpl, fills]);

    const handleOK = (dataUrl) => {
      // dataUrl may be "data:image/png;base64,XXXX"
      const raw = (dataUrl || '').split('base64,')[1] || dataUrl; // fall back to whole if split failed
      setSigB64(raw || '');
    };

    const clearSign = () => {
      sigRef.current?.clearSignature();
      setSigB64('');
    };

    const makeHtml = () => {
      const signedLine = signerName ? `<div style="margin-top:24px;"><strong>Signed by:</strong> ${signerName}</div>` : '';
      const sigImg = sigB64
        ? `<div style="margin-top:8px;"><img src="data:image/png;base64,${sigB64}" style="height:80px;"/></div>`
        : '<div style="margin-top:8px; color:#888;">(No signature attached)</div>';
      const pretty = preview
        .replace(/\n/g, '<br/>')
        .replace(/\s{2,}/g, (m) => '&nbsp;'.repeat(m.length));

      return `
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <style>
            body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
            .title { color: ${BRAND_GREEN}; font-size: 20px; font-weight: 900; margin-bottom: 12px; }
            .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
          </style>
        </head>
        <body>
          <div class="title">Contract</div>
          <div class="box">
            <div>${pretty}</div>
            ${signedLine}
            ${sigImg}
            <div style="margin-top:16px; font-size:12px; color:#666">Generated on ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `;
    };

    const generateAndUpload = async () => {
      try {
        if (!tpl) return Alert.alert('Missing template', 'Pick a template first.');
        if (!signerName.trim()) return Alert.alert('Missing signer', 'Enter the signer name.');

        setBusy(true);

        // 1) Generate PDF
        const { uri } = await Print.printToFileAsync({ html: makeHtml() });
        if (!uri) throw new Error('Failed to create PDF file');

        // 2) Upload PDF to Flask API
        const fileToUpload = {
          uri,
          type: 'application/pdf',
          name: `contract_${userId}_${tpl.id}_${Date.now()}.pdf`,
        };

        const uploadResp = await uploadAPI.uploadFile(fileToUpload, `contracts/${userId}`);
        const publicUrl = uploadResp.url;

        // 3) Log row via Flask API
        await contractsAPI.signContract({
          template_id: tpl.id,
          user_id: userId,
          role,
          signer_name: signerName.trim(),
          filled_values: fills,
          pdf_url: publicUrl,
        });

        Alert.alert('PDF ready', 'Your signed contract was generated.',
          [
            {
              text: 'Open', onPress: async () => {
                if (publicUrl) {
                  const can = await Linking.canOpenURL(publicUrl);
                  if (can) await Linking.openURL(publicUrl);
                } else if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri);
                }
              }
            },
            { text: 'Close', style: 'cancel' }
          ]
        );
      } catch (e) {
        Alert.alert('Failed', e?.message || String(e));
      } finally {
        setBusy(false);
      }
    };


    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          {/* Top bar */}
          <View style={styles.topbar}>
            <Text style={styles.header}>Sign Contract</Text>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Template pills */}
          <Text style={styles.sectionTitle}>Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tplPill, tpl?.id === t.id && styles.tplPillActive]}
                onPress={() => onSelectTpl(t)}
              >
                <Text style={[styles.tplText, tpl?.id === t.id && styles.tplTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
            {templates.length === 0 && <Text style={styles.muted}>No templates found. Add one in Admin → Contracts.</Text>}
          </ScrollView>

          {/* Variable inputs */}
          {tpl && (
            <>
              <Text style={styles.sectionTitle}>Fill Variables</Text>
              <ScrollView style={styles.fillForm} contentContainerStyle={{ paddingBottom: 8 }}>
                {(tpl.variables || []).map((key) => (
                  <View key={key} style={{ marginBottom: 8 }}>
                    <Text style={styles.label}>{key}</Text>
                    <TextInput
                      value={fills[key]}
                      onChangeText={(v) => setFills((prev) => ({ ...prev, [key]: v }))}
                      placeholder={`Enter ${key}`}
                      style={styles.input}
                    />
                  </View>
                ))}
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.label}>signer_name</Text>
                  <TextInput
                    value={signerName}
                    onChangeText={setSignerName}
                    placeholder="Enter signer full name"
                    style={styles.input}
                  />
                </View>
              </ScrollView>

              {/* Live preview */}
              <Text style={styles.sectionTitle}>Preview</Text>
              <ScrollView style={styles.previewBox}>
                <Text style={styles.previewText}>{preview}</Text>
              </ScrollView>

              {/* Signature pad */}
              <Text style={styles.sectionTitle}>Signature</Text>
              <View style={styles.sigBox}>
                <Signature
                  ref={sigRef}
                  onOK={handleOK}
                  onEmpty={() => Alert.alert('Signature required', 'Please draw your signature, then tap ✓')}
                  descriptionText="Sign above"
                  clearText="Clear"
                  confirmText="✓"
                  webStyle={`
                  .m-signature-pad--footer .button {
                    background:${BRAND_GREEN}; color: #fff; border-radius: 8px; padding: 6px 10px; margin: 0 6px;
                  }
                  .m-signature-pad--footer { display:flex; justify-content:flex-end; }
                  .m-signature-pad { box-shadow: none; border: 1px solid #e5e7eb; }
                `}
                  backgroundColor="#fff"
                  penColor={BRAND_GREEN}
                  autoClear={false}
                />
                <View style={styles.sigActions}>
                  <TouchableOpacity style={styles.ghostBtn} onPress={clearSign}>
                    <Text style={styles.ghostText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Generate PDF */}
              <TouchableOpacity
                style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
                onPress={generateAndUpload}
                disabled={busy}
              >
                <Text style={styles.primaryText}>{busy ? 'Generating…' : 'Generate PDF'}</Text>
              </TouchableOpacity>
            </>
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

    label: { color: '#374151', marginBottom: 4, fontWeight: '600' },
    input: {
      backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: '#E5E7EB', color: '#111827'
    },
    fillForm: { maxHeight: 160, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10 },

    previewBox: { maxHeight: 180, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
    previewText: { color: '#111827' },

    sigBox: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
    sigActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, gap: 8 },

    ghostBtn: { backgroundColor: '#EEF2F7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    ghostText: { color: BRAND_GREEN, fontWeight: '800' },

    primaryBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, marginTop: 12, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '800' },
  });
