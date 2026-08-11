import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { acknowledgeConnect, updateUser } from '../store/authSlice';
import { colors } from '../utils/theme';

export default function StayConnectedScreen() {
  const dispatch = useDispatch();
  const [optIn, setOptIn] = useState(true);

  const handleContinue = () => {
    dispatch(updateUser({ marketingOptIn: optIn }));
    dispatch(acknowledgeConnect());
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🙌</Text>
        <Text style={styles.title}>Thank you for logging in!</Text>
        <Text style={styles.body}>
          Stay connected with AgriAI — we'll send the latest farming news, new product
          launches and special discounts via WhatsApp and SMS.
        </Text>
        <View style={styles.checkboxRow}>
          <Checkbox
            status={optIn ? 'checked' : 'unchecked'}
            onPress={() => setOptIn((v) => !v)}
            color={colors.primary}
          />
          <Text style={styles.checkboxLabel} onPress={() => setOptIn((v) => !v)}>
            Yes, keep me updated via WhatsApp & SMS
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Button mode="contained" style={styles.btn} contentStyle={styles.btnContent} onPress={handleContinue}>
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingRight: 16, paddingVertical: 4 },
  checkboxLabel: { color: '#fff', fontSize: 13, flexShrink: 1 },
  footer: { padding: 24, paddingBottom: 40 },
  btn: { borderRadius: 12 },
  btnContent: { paddingVertical: 8 },
});
