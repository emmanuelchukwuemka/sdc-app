import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AlertModal = ({
  visible,
  type = 'info',
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  onRequestClose,
  brandColor = '#10B981'
}) => {
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return brandColor;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: brandColor, borderColor: brandColor }]}>
          <View style={styles.modalIconWrap}>
            <Ionicons
              name={getIconName()}
              size={48}
              color={getIconColor()}
            />
          </View>
          
          {title && (
            <Text style={styles.modalTitle}>{title}</Text>
          )}
          
          <Text style={styles.modalMessage}>{message}</Text>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={onConfirm}
          >
            <Text style={[styles.modalButtonText, { color: brandColor }]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80%',
    maxWidth: '90%',
  },
  modalIconWrap: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AlertModal;