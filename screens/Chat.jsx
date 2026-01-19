// screens/Chat.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { messagesAPI, uploadAPI } from '../services/api';

const BRAND_GREEN = '#16A34A';
const ACCENT_WHITE = '#FFFFFF';
const BRAND_GREEN_DARK = '#0F8C3D';
const GRAY_BG = '#F3F4F6';
const AVATAR_INCOMING = require('../assets/avatar-placeholder.png');
const formatDateLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yd = new Date(Date.now() - 86400000);
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yd)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function Chat({
  userId,
  conversationId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  onBack = () => { },
}) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const data = await messagesAPI.getMessages(conversationId);
        if (!on) return;
        setMessages(data || []);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
      } catch (e) {
        console.log('load messages error', e?.message || e);
      } finally {
        on && setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [conversationId]);

  // TODO: Add WebSocket support for realtime messaging
  // For now, polling can be implemented if needed

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    try {
      setSending(true);
      setText('');
      const messageData = {
        conversation_id: conversationId,
        content: trimmed,
      };
      const newMessage = await messagesAPI.send(messageData);
      // Add the new message to the local state
      setMessages(prev => [...prev, newMessage]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      console.log('send error', e?.message || e);
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // File attachment functionality
  const attachAndSend = async () => {
    try {
      if (uploading) return;
      setUploading(true);

      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ['image/*', 'application/pdf', 'application/*', 'text/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        setUploading(false);
        return;
      }

      // Upload file
      const uploadResult = await uploadAPI.uploadFile(
        {
          uri: file.uri,
          name: file.name || 'upload',
          type: file.mimeType || 'application/octet-stream',
        },
        conversationId
      );

      // Send message with attachment
      const trimmed = text.trim();
      setText('');
      
      const messageData = {
        conversation_id: conversationId,
        content: trimmed || '', // Allow empty content with attachment
        attachment_url: uploadResult.url,
        attachment_type: file.mimeType || 'file',
      };
      
      const newMessage = await messagesAPI.send(messageData);
      
      // Add to local state
      setMessages(prev => [...prev, newMessage]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      
    } catch (e) {
      console.log('attach error', e?.message || e);
      Alert.alert('Upload failed', e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const openUrl = async (url) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch { }
  };

  const renderAttachment = (item, mine) => {
    if (!item.attachment_url) return null;
    const isImage = (item.attachment_type || '').startsWith('image/');
    if (isImage) {
      return (
        <TouchableOpacity onPress={() => openUrl(item.attachment_url)} activeOpacity={0.8} style={{ marginTop: 8 }}>
          <Image source={{ uri: item.attachment_url }} style={styles.previewImage} />
          <Text style={[styles.previewHint, mine && { color: '#E8FFE8' }]}>Tap to view full</Text>
        </TouchableOpacity>
      );
    }
    // Non-image: show a small file card
    const nameGuess = item.attachment_url.split('/').pop();
    return (
      <TouchableOpacity onPress={() => openUrl(item.attachment_url)} activeOpacity={0.8} style={[styles.fileCard, mine ? styles.fileCardMine : styles.fileCardTheirs]}>
        <Text style={[styles.fileName, mine && { color: '#fff' }]} numberOfLines={1}>
          {nameGuess}
        </Text>
        <Text style={[styles.fileMeta, mine && { color: '#E8FFE8' }]}>{item.attachment_type || 'file'}</Text>
        <Text style={[styles.fileOpen, mine && { color: '#E8FFE8' }]}>Open</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }) => {
    const mine = item.sender_user_id === userId;
    const prev = messages[index - 1];
    const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(item.created_at).toDateString();

    return (
      <View style={{ marginBottom: 4 }}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateLabel}>{formatDateLabel(item.created_at)}</Text>
          </View>
        )}

        <View style={[styles.messageRow, mine ? styles.rowMine : styles.rowTheirs]}>
          {!mine && <Image source={AVATAR_INCOMING} style={styles.avatarSmall} />}

          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {!!item.content && (
              <Text style={[styles.messageText, mine ? styles.textMine : styles.textTheirs]}>
                {item.content}
              </Text>
            )}

            {renderAttachment(item, mine)}

            <View style={styles.metaRow}>
              <Text style={[styles.timeLabel, mine ? { color: 'rgba(255,255,255,0.7)' } : { color: '#9CA3AF' }]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {mine && (
                <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={attachAndSend}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={BRAND_GREEN} />
              ) : (
                <Ionicons name="add-circle-outline" size={28} color="#6B7280" />
              )}
            </TouchableOpacity>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, (!text.trim() && !uploading) && styles.sendButtonDisabled]}
              onPress={send}
              disabled={!text.trim() && !uploading || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardContainer: { flex: 1, backgroundColor: '#F2F4F7' }, // Light gray chat background
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontWeight: '500' },

  listContent: { paddingVertical: 16, paddingHorizontal: 12 },

  dateSeparator: { alignSelf: 'center', marginVertical: 12, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dateLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },

  avatarSmall: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#E5E7EB' },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: BRAND_GREEN,
    borderBottomRightRadius: 4, // "Tail" effect
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4, // "Tail" effect
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  messageText: { fontSize: 16, lineHeight: 22 },
  textMine: { color: '#FFFFFF' },
  textTheirs: { color: '#1F2937' },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 2 },
  timeLabel: { fontSize: 10 },

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: { padding: 6 },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#1F2937',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },

  // Attachments
  previewImage: { width: 200, height: 140, borderRadius: 12, backgroundColor: '#f0f0f0', marginBottom: 4 },
  previewHint: { fontSize: 10, opacity: 0.8 },

  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', marginTop: 4 },
  fileName: { fontSize: 14, fontWeight: '600', maxWidth: 140 },
  fileMeta: { fontSize: 10, opacity: 0.7, marginTop: 2 },
});
