import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { colors } from '../utils/theme';

const PLACEHOLDER_REPLIES = [
  "🌾 I'm Arha, your farming assistant — still learning! Real AI-powered advice is coming soon.",
  "That's a great question. I can't give real farming advice just yet, but soon I will be able to.",
  "Arha is being trained on crop, soil and weather knowledge right now. Check back soon!",
];

let nextId = 1;
const makeMessage = (text, sender) => ({ id: nextId++, text, sender, ts: Date.now() });

// Stubbed to look like a real async API call (mirrors the shape a buffered
// backend response will have once Arha is wired to a real model), so
// swapping in the real request later only touches this function.
const getArhaReply = (userText) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const reply = PLACEHOLDER_REPLIES[Math.floor(Math.random() * PLACEHOLDER_REPLIES.length)];
      resolve(reply);
    }, 900);
  });

const Bubble = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowArha]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleArha]}>
        <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextArha}>{message.text}</Text>
      </View>
    </View>
  );
};

export default function ArhaScreen() {
  const [messages, setMessages] = useState([
    makeMessage("Namaste! I'm Arha 🌾 — ask me anything about your farm.", 'arha'),
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, makeMessage(text, 'user')]);
    setSending(true);
    const reply = await getArhaReply(text);
    setMessages((m) => [...m, makeMessage(reply, 'arha')]);
    setSending(false);
  }, [input, sending]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => <Bubble message={item} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>Arha is typing...</Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          placeholder="Ask Arha about your farm..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
          outlineStyle={styles.inputOutline}
          multiline
          onSubmitEditing={send}
          right={<TextInput.Icon icon="send" onPress={send} disabled={!input.trim() || sending} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowArha: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleArha: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, elevation: 1 },
  bubbleTextUser: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTextArha: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  typingText: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, maxHeight: 100, backgroundColor: colors.surface },
  inputOutline: { borderRadius: 20 },
});
