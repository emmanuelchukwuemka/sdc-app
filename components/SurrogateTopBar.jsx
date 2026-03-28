// components/SurrogateTopBar.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';

export default function SurrogateTopBar({
  navigation,
  route,
  options,
  onOpenProfile,
  onLogout,
  role = 'SURROGATE', // default to surrogate
}) {
  const title = options?.title || route?.name || '';
  
  const getRoleColor = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case 'SURROGATE': return '#22C55E'; // Vibrant Green
      case 'IP':
      case 'INTENDING_PARENT': return '#16A34A'; // Mid Green
      case 'DONOR': return '#15803D'; // Dark Green
      case 'AGENCY': return '#14532D'; // Deep Green
      case 'ADMIN': return '#064E3B'; // Very Dark Green
      default: return '#16A34A';
    }
  };

  const bgColor = getRoleColor(role);

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: bgColor }}>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}
      >
        {/* Left: Sidebar (Drawer) Button */}
        <View style={{ width: 80, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={{ padding: 6, marginRight: 6 }}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Center: Title */}
        <View style={{ flex: 1, alignItems: 'flex-start', marginLeft: 10 }}>
          <Text
            numberOfLines={1}
            style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}
          >
            {title}
          </Text>
        </View>

        {/* Right: Actions (Notifications, Profile, Logout) */}
        <View
          style={{
            width: 120,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {/* Notifications */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{ marginRight: 12 }}
            accessibilityLabel="Open notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            onPress={() =>
              onOpenProfile
                ? onOpenProfile()
                : navigation.navigate('My Profile') // ✅ fixed
            }
            style={{ marginRight: 12 }}
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={() => onLogout && onLogout()}
            accessibilityLabel="Logout"
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
