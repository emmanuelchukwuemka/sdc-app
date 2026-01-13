// screens/Tasks.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';
const LIGHT_BG = '#F8FAF9';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';

export default function Tasks({ navigation, route }) {
  const { userId, role } = route.params || {};

  // Dummy tasks for now — replace with Supabase or API data later
  const tasks = [
    { id: '1', title: 'Complete KYC submission', completed: false },
    { id: '2', title: 'Upload medical documents', completed: true },
    { id: '3', title: 'Schedule first appointment', completed: false },
  ];

  const renderTask = ({ item }) => (
    <View style={styles.taskRow}>
      <Ionicons
        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={item.completed ? BRAND_GREEN : TEXT_SECONDARY}
      />
      <Text
        style={[
          styles.taskText,
          item.completed && { textDecorationLine: 'line-through', color: TEXT_SECONDARY },
        ]}
      >
        {item.title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* ✅ TopBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ✅ Content */}
      <View style={styles.contentWrap}>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
        />
      </View>

      {/* ✅ Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('SurrogateHome', { userId })}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: BRAND_GREEN, // ✅ green extends into safe areas
  },

  // ✅ TopBar
  header: {
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // ✅ Content wrapper
  contentWrap: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  list: { padding: 16 },

  // ✅ Task rows
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  taskText: { fontSize: 14, color: TEXT_PRIMARY, marginLeft: 12 },

  // ✅ Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_GREEN,
    paddingVertical: 12,
  },
  navItem: { alignItems: 'center' },
  navText: { color: '#fff', fontSize: 12, marginTop: 2 },
});
