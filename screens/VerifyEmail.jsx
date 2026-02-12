import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import AlertModal from '../components/AlertModal';

const BRAND_GREEN = '#16A34A';

export default function VerifyEmail({ email, onSuccess, onBack }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('info');

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const showAlert = (title, message, type = 'info') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

    const handleVerify = async () => {
        if (!code || code.length < 6) {
            showAlert('Invalid Code', 'Please enter a valid 6-digit verification code.', 'error');
            return;
        }

        setLoading(true);
        try {
            const data = await authAPI.verifyOtp(email, code, 'signup');
            showAlert('Success', 'Email verified successfully!', 'success');
            setTimeout(() => {
                onSuccess(data.user);
            }, 1500);
        } catch (err) {
            console.error("Verification Error:", err);
            showAlert('Verification Failed', err.message || 'Invalid code. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            await authAPI.resendOtp(email, 'signup');
            setResendCooldown(60);
            showAlert('Code Sent', 'A new verification code has been sent to your email.', 'success');
        } catch (err) {
            showAlert('Error', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-unread-outline" size={40} color={BRAND_GREEN} />
                    </View>

                    <Text style={styles.title}>Verify your Email</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to <Text style={styles.emailHighlighted}>{email}</Text>
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="000000"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={code}
                            onChangeText={setCode}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.verifyBtnText}>Verify Code</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleResend}
                        disabled={resendCooldown > 0}
                        style={styles.resendBtn}
                    >
                        <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <AlertModal
                    visible={alertVisible}
                    type={alertType}
                    title={alertTitle}
                    message={alertMessage}
                    onConfirm={() => setAlertVisible(false)}
                    onRequestClose={() => setAlertVisible(false)}
                    brandColor={BRAND_GREEN}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, padding: 24 },
    backButton: { marginBottom: 20 },
    content: { flex: 1, alignItems: 'center', paddingTop: 40 },

    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },

    title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    emailHighlighted: { fontWeight: '700', color: '#1F2937' },

    inputContainer: {
        width: '100%',
        marginBottom: 24
    },
    input: {
        width: '100%',
        height: 60,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
        letterSpacing: 8,
    },

    verifyBtn: {
        width: '100%',
        backgroundColor: BRAND_GREEN,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: BRAND_GREEN,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    verifyBtnDisabled: { opacity: 0.7 },
    verifyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

    resendBtn: { padding: 12 },
    resendText: { color: BRAND_GREEN, fontWeight: '600', fontSize: 14 },
    resendTextDisabled: { color: '#9CA3AF' },
});
