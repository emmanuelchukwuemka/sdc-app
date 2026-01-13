// components/IpTopBar.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND_GREEN = '#16A34A';

export default function IpTopBar({
  navigation,
  route,
  options,
  onOpenProfile,
  onLogout,
}) {
  const title = options?.title || route?.name || '';

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: BRAND_GREEN }}>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}
      >
        {/* Left: Drawer menu */}
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={{ padding: 6, marginRight: 6 }}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Center: Title */}
        <View style={{ flex: 1, alignItems: 'flex-start', marginLeft: 10 }}>
          <Text
            numberOfLines={1}
            style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}
          >
            {title}
          </Text>
        </View>

        {/* Right: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{ marginRight: 14 }}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Dispute')}
            style={{ marginRight: 14 }}
          >
            <Ionicons name="headset-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              onOpenProfile
                ? onOpenProfile()
                : navigation.navigate('Profile', { role: 'IP' })
            }
            style={{ marginRight: 14 }}
          >
            <Ionicons name="person-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
