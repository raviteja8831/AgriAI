import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../store/authSlice';
import { colors } from '../utils/theme';

export default function CommunicationSettingsScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const optIn = user?.marketingOptIn !== false;

  const toggle = () => dispatch(updateUser({ marketingOptIn: !optIn }));

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🙌</Text>
      <Text style={styles.title}>Stay Connected</Text>
      <Text style={styles.body}>
        Stay connected with AgriAI — we'll send the latest farming news, new product
        launches and special discounts via WhatsApp and SMS.
      </Text>
      <View style={styles.checkboxRow}>
        <Checkbox status={optIn ? 'checked' : 'unchecked'} onPress={toggle} color={colors.primary} />
        <Text style={styles.checkboxLabel} onPress={toggle}>
          Yes, keep me updated via WhatsApp & SMS
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 32, paddingTop: 48 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingRight: 16, paddingVertical: 4, elevation: 1 },
  checkboxLabel: { color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
});
