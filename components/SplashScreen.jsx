import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Image } from 'react-native';

const BRAND_GREEN = '#16A34A';
const LIGHT_GREEN = '#E8F5E9';
const ACCENT_WHITE = '#FFFFFF';

export default function SplashScreen({ onDone }) {
  // Track if onDone has been called to prevent multiple calls
  const hasCalledOnDone = useRef(false);
  
  // Native-driver values
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // JS-driver values
  const progressJS = useRef(new Animated.Value(0)).current;
  const glowJS = useRef(new Animated.Value(0)).current;
  const pulseJS = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar → JS driver only
    Animated.timing(progressJS, {
      toValue: 1,
      duration: 3500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (!hasCalledOnDone.current) {
          hasCalledOnDone.current = true;
          onDone?.();
        }
      });
    });

    // Loop pulse (JS) + glow (JS)
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseJS, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseJS, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowJS, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowJS, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();

    // Backup timer in case animations fail to complete
    const timer = setTimeout(() => {
      if (!hasCalledOnDone.current) {
        hasCalledOnDone.current = true;
        onDone?.();
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Background */}
      <View style={styles.backgroundPattern}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Logo with glow */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: logoScale }] },
          ]}
        >
          <Animated.View style={[styles.glow, { opacity: glowJS, transform: [{ scale: pulseJS }] }]} />
          <View style={styles.logo}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
          </View>
        </Animated.View>

        {/* Brand */}
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }], alignItems: 'center' }}>
          <Text style={styles.brand}>Surrogacy & Donor</Text>
          <Text style={styles.brandAccent}>Connect</Text>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.tagline}>Building Families Together</Text>
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.watermark}>S&DC</Text>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingProgress, { transform: [{ scaleX: progressJS }] }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_GREEN, alignItems: 'center', justifyContent: 'center' },
  backgroundPattern: { ...StyleSheet.absoluteFillObject },
  circle1: { position: 'absolute', top: '20%', right: '10%', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2: { position: 'absolute', bottom: '30%', left: '15%', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  circle3: { position: 'absolute', top: '60%', right: '25%', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)' },
  content: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  logoContainer: { marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.4)' },
  logo: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: ACCENT_WHITE, overflow: 'hidden', backgroundColor: ACCENT_WHITE },
  logoImage: { width: '100%', height: '100%', borderRadius: 60 },
  brand: { fontSize: 28, fontWeight: '700', color: ACCENT_WHITE },
  brandAccent: { fontSize: 32, fontWeight: '800', color: ACCENT_WHITE, marginTop: -4 },
  tagline: { marginTop: 12, fontSize: 14, color: LIGHT_GREEN, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 80, alignItems: 'center', width: '100%' },
  watermark: { color: ACCENT_WHITE, fontWeight: '700', fontSize: 16, marginBottom: 16 },
  loadingBar: { width: 140, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  loadingProgress: { width: '100%', height: '100%', backgroundColor: ACCENT_WHITE, borderRadius: 2, transformOrigin: 'left center' },
});
