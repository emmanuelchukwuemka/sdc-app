// screens/JourneyTimeline.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';

export default function JourneyTimeline({
  userId = '55555555-5555-5555-5555-555555555555',
  role = 'IP',
  onBack = () => {},
}) {
  const [journey, setJourney] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  // Ensure a journey exists for this user+role, then load milestones
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        // 1) find journey
        let { data: found, error: findErr } = await supabase
          .from('journeys')
          .select('*')
          .eq('user_id', userId)
          .eq('role', role)
          .limit(1);
        if (findErr) throw findErr;

        let j = found?.[0];
        if (!j) {
          // create one
          const { data: created, error: insErr } = await supabase
            .from('journeys')
            .insert({ user_id: userId, role, title: 'Surrogacy Journey' })
            .select('*')
            .single();
          if (insErr) throw insErr;
          j = created;
        }
        if (!on) return;
        setJourney(j);

        // 2) load milestones
        const { data: ms, error: msErr } = await supabase
          .from('journey_milestones')
          .select('*')
          .eq('journey_id', j.id)
          .order('when_at', { ascending: true });
        if (msErr) throw msErr;
        if (!on) return;
        setMilestones(ms || []);
      } catch (e) {
        Alert.alert('Journey error', e?.message || String(e));
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [userId, role]);

  const addMilestone = async () => {
    const t = title.trim();
    if (!t) return Alert.alert('Title required', 'Please enter a milestone title.');
    if (!journey?.id) return;

    try {
      setAdding(true);
      const { data, error } = await supabase
        .from('journey_milestones')
        .insert({
          journey_id: journey.id,
          title: t,
          note: note.trim() || null,
          // when_at defaults to now() in DB
        })
        .select('*')
        .single();
      if (error) throw error;

      setMilestones((prev) => [...prev, data].sort((a, b) => new Date(a.when_at) - new Date(b.when_at)));
      setTitle('');
      setNote('');
    } catch (e) {
      Alert.alert('Add failed', e?.message || String(e));
    } finally {
      setAdding(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const date = new Date(item.when_at);
    const ts = date.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const isLast = index === milestones.length - 1;
    return (
      <View style={styles.row}>
        <View style={styles.lineCol}>
          <View style={styles.dot} />
          {!isLast && <View style={styles.line} />}
        </View>
        <View style={styles.card}>
          <Text style={styles.msTitle}>{item.title}</Text>
          {!!item.note && <Text style={styles.msNote}>{item.note}</Text>}
          <Text style={styles.msTime}>{ts}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <Text style={styles.header}>Journey</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Journey meta */}
        <Text style={styles.subheader}>
          {loading ? 'Loading…' : `${journey?.title || 'Journey'} — Role: ${role}`}
        </Text>

        {/* Timeline */}
        <FlatList
          data={milestones}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No milestones yet — add your first below.</Text> : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Add milestone */}
        <View style={styles.addWrap}>
          <Text style={styles.label}>Milestone title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Initial Consultation Complete"
            style={styles.input}
          />
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a short note"
            style={[styles.input, { minHeight: 44 }]}
            multiline
          />
          <TouchableOpacity style={[styles.primaryBtn, adding && { opacity: 0.7 }]} onPress={addMilestone} disabled={adding || loading}>
            <Text style={styles.primaryText}>{adding ? 'Adding…' : 'Add Milestone'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF9' },
  container: { flex: 1, backgroundColor: '#F8FAF9' },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  header: { fontSize: 22, fontWeight: '800', color: BRAND_GREEN },
  subheader: { textAlign: 'center', color: '#4B5563', marginBottom: 6 },

  backBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  backText: { color: ACCENT_WHITE, fontWeight: '700' },

  row: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  lineCol: { width: 22, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND_GREEN, marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: '#D1FAE5', marginTop: 2 },

  card: {
    flex: 1,
    backgroundColor: ACCENT_WHITE,
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  msTitle: { fontWeight: '900', color: BRAND_GREEN },
  msNote: { color: '#374151', marginTop: 4 },
  msTime: { color: '#6B7280', marginTop: 6, fontSize: 12 },

  addWrap: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, backgroundColor: '#F8FAF9' },
  label: { color: '#374151', marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', marginBottom: 8
  },

  primaryBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800' },

  empty: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
});
