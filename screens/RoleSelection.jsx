// screens/RoleSelection.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Image, Animated, LayoutAnimation, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import AlertModal from '../components/AlertModal';

// Modern Design System - Green Theme
const COLORS = {
  primary: {
    light: '#20c95b',
    main: '#16A34A',
    dark: '#148a3f',
    gradient: ['#148a3f', '#16A34A', '#20c95b'],
  },
  secondary: {
    light: '#FBBF24',
    main: '#F59E0B',
    dark: '#D97706',
    gradient: ['#D97706', '#F59E0B', '#FBBF24'],
  },
  neutral: {
    white: '#FFFFFF',
    light: '#F8FAFC',
    medium: '#E2E8F0',
    dark: '#1E293B',
    text: '#334155',
    subtle: '#94A3B8',
  },
  success: {
    main: '#16A34A',
    light: '#D1FAE5',
  },
  surface: {
    card: '#FFFFFF',
    elevated: '#F1F5F9',
    modal: '#FFFFFF',
  },
};

const GRADIENTS = {
  primary: COLORS.primary.gradient,
  secondary: COLORS.secondary.gradient,
  success: [COLORS.success.main, COLORS.success.light],
  premium: COLORS.primary.gradient,
  dark: [COLORS.neutral.dark, COLORS.neutral.dark],
};

const ROLES = [
  { key: 'IP', label: 'Intended Parent', icon: 'people' },
  { key: 'SURROGATE', label: 'Surrogate', icon: 'woman' },
  { key: 'DONOR', label: 'Donor', icon: 'gift' },
  { key: 'AGENCY', label: 'Agency', icon: 'business' },
];

// Safely access Constants configuration
let extra = {};
try {
  extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
} catch (err) {
  console.warn('Could not access Constants config:', err);
}
// ADMIN_PIN is deprecated - admin access now uses a separate flow
// const ADMIN_PIN = extra.adminPin || '6284';

export default function RoleSelection({ onSelect }) {

  const [selectedRole, setSelectedRole] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Auto-select removed to allow manual role selection


  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const showAlert = (title, message, type = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };


  const selectRole = (roleKey) => {
    if (isAnimating) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAnimating(true);
    setSelectedRole(roleKey);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      onSelect(roleKey);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary.main }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Modern Header with Premium Gradient */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Surrogacy & Donor Connect</Text>
            <Text style={styles.appSubtitle}>Your Journey to Parenthood Begins Here</Text>

            <View style={styles.welcomeInHeader}>
              <Text style={styles.welcomeTitleInHeader}>Choose Your Role</Text>
              <Text style={styles.welcomeSubtitleInHeader}>
                Select below to get started
              </Text>
            </View>

            {/* Modern Roles Grid - Redesigned buttons */}
            <View style={styles.rolesGridInHeader}>
              {/* First Row: Surrogate and Donor */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                {ROLES.filter(role => role.key === 'SURROGATE' || role.key === 'DONOR').map((role) => {
                  const active = selectedRole === role.key;
                  return (
                    <Animated.View
                      key={role.key}
                      style={[
                        styles.roleCard,
                        active && styles.roleCardActive,
                        { transform: [{ scale: selectedRole === role.key ? scaleAnim : 1 }] },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => selectRole(role.key)}
                        activeOpacity={0.9}
                        style={styles.roleButton}
                      >
                        <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                          <Ionicons
                            name={role.icon}
                            size={28}
                            color={active ? COLORS.neutral.white : COLORS.primary.main}
                          />
                        </View>
                        <Text style={[styles.roleText, active && styles.roleTextActive]}>
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Second Row: Intended Parent and Agency */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
                {ROLES.filter(role => role.key === 'IP' || role.key === 'AGENCY').map((role) => {
                  const active = selectedRole === role.key;
                  return (
                    <Animated.View
                      key={role.key}
                      style={[
                        styles.roleCard,
                        active && styles.roleCardActive,
                        { transform: [{ scale: selectedRole === role.key ? scaleAnim : 1 }] },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => selectRole(role.key)}
                        activeOpacity={0.9}
                        style={styles.roleButton}
                      >
                        <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                          <Ionicons
                            name={role.icon}
                            size={28}
                            color={active ? COLORS.neutral.white : COLORS.primary.main}
                          />
                        </View>
                        <Text style={[styles.roleText, active && styles.roleTextActive]}>
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            {/* Admin Access Link */}
            <View style={styles.adminSectionInHeader}>
              <TouchableOpacity
                style={styles.adminButtonInHeader}
                onPress={() => onSelect('ADMIN_LOGIN')}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={18} color={COLORS.neutral.white} style={styles.adminButtonIcon} />
                <Text style={styles.adminButtonTextInHeader}>Admin Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* SafeAreaView at the bottom to ensure all buttons are visible */}
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
        <View style={styles.bottomSpacer} />
      </SafeAreaView>



      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onConfirm={handleAlertConfirm}
        onClose={handleAlertClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.primary.main,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSpacer: {
    height: 20,
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: Constants.statusBarHeight + 12,
    marginBottom: 30,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.neutral.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  welcomeInHeader: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeTitleInHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral.white,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitleInHeader: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  rolesGridInHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 8,
    marginBottom: 30,
  },
  // Redesigned role cards
  roleCard: {
    flex: 1,
    minWidth: '48%',
    margin: 6,
    borderRadius: 20,
    backgroundColor: COLORS.neutral.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  roleCardActive: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.dark,
    elevation: 8,
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  roleButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary.main,
    textAlign: 'center',
  },
  roleTextActive: {
    color: COLORS.neutral.white,
  },
  adminSectionInHeader: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  adminButtonInHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  adminButtonTextInHeader: {
    color: COLORS.neutral.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: COLORS.surface.modal,
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    elevation: 12,
    shadowColor: COLORS.neutral.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitleIcon: {
    marginRight: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.neutral.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.neutral.medium,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: COLORS.neutral.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    backgroundColor: COLORS.neutral.light,
    borderWidth: 1,
    borderColor: COLORS.neutral.medium,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.neutral.dark,
    marginBottom: 24,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 0, // allow shrinking
    maxWidth: '48%', // keep both buttons on one row
    flex: 1,
    elevation: 3,
    shadowColor: COLORS.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cancelButton: {
    backgroundColor: COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: COLORS.neutral.medium,
  },
  submitButton: {
    backgroundColor: COLORS.primary.main,
    borderWidth: 1,
    borderColor: COLORS.primary.dark,
  },
  modalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  cancelButtonText: {
    color: COLORS.neutral.dark,
  },
  submitButtonText: {
    color: COLORS.neutral.white,
  },
});