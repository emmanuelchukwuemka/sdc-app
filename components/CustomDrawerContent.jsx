// components/CustomDrawerContent.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

const FALLBACK_AVATAR = require('../assets/avatar.png');

export default function CustomDrawerContent(props) {
  const { userId, role, profile, onLogout, isIpFlow, isSurrogateFlow } = props;
  const [user, setUser] = useState(profile || null);
  const [authRole, setAuthRole] = useState(null);

  useEffect(() => {
    if (profile) {
      setUser(profile);
      return;
    }
    if (!userId) return;

    let mounted = true;
    const fetchUser = async () => {
      try {
        // Use authAPI to get current user info
        const currentUser = await authAPI.getCurrentUser();
        if (mounted) {
          setUser({
            first_name: currentUser.first_name || '',
            last_name: currentUser.last_name || '',
            role: currentUser.role,
            email: currentUser.email
          });
        }
      } catch (error) {
        console.log('Failed to fetch user data:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [userId, profile]);

  // Read role from Supabase auth app_metadata
  // Skipped for demo mode
  /*useEffect(() => {
    let on = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && on) {
        const appRole = data?.user?.app_metadata?.role;
        setAuthRole(appRole || null);
      }
    })();
    return () => { on = false; };
  }, []);*/

  const goTo = (screen) => {
    if (isIpFlow || isSurrogateFlow) {
      props.navigation.closeDrawer();
      props.navigation.navigate('Main', { screen });
    } else {
      props.navigation.navigate(screen);
    }
  };

  const effectiveRole = user?.role ?? role ?? authRole ?? null;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        {/* Close button */}
        <TouchableOpacity
          onPress={() => props.navigation.closeDrawer()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Avatar + info */}
        <Image
          source={user?.profile_image ? { uri: user.profile_image } : FALLBACK_AVATAR}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {user?.first_name
            ? `${user.first_name} ${user.last_name || ''}`
            : 'Guest User'}
        </Text>

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{effectiveRole || 'Unknown'}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Dashboard')}>
          <Ionicons name="speedometer-outline" size={22} color="#16A34A" />
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Wallet')}>
          <Ionicons name="wallet-outline" size={22} color="#16A34A" />
          <Text style={styles.menuText}>Wallet</Text>
        </TouchableOpacity>

        {effectiveRole !== 'SURROGATE' && (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { 
              props.navigation.closeDrawer(); 
              props.navigation.navigate('Favorites', { userId }); 
            }}
          >
            <Ionicons name="heart-outline" size={22} color="#16A34A" />
            <Text style={styles.menuText}>Favorites</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#16A34A" />
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Dispute')}>
          <Ionicons name="alert-circle-outline" size={22} color="#16A34A" />
          <Text style={styles.menuText}>Disputes</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#16A34A',
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#fff' },
  roleBadge: {
    marginTop: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  menu: { flex: 1, paddingVertical: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuText: { marginLeft: 16, fontSize: 16, color: '#111' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 15 },
});
