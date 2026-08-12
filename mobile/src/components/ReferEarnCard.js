import React from 'react';
import { View, StyleSheet, Pressable, Share } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useSelector } from 'react-redux';
import { useSnackbar } from './SnackbarProvider';
import { colors } from '../utils/theme';
import { getReferralCode, getReferralMessage } from '../utils/referral';

export default function ReferEarnCard() {
  const { user } = useSelector((s) => s.auth);
  const snack = useSnackbar();
  const code = getReferralCode(user);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    snack.showSuccess('Referral code copied!');
  };

  const handleInvite = async () => {
    try {
      await Share.share({ message: getReferralMessage(user) });
    } catch {
      snack.showError('Could not open share sheet');
    }
  };

  return (
    <View>
      <Text style={styles.heading}>🎁 Refer & Earn</Text>
      <View style={styles.panel}>
        <Text style={styles.message}>
          Earn ₹100 for every friend who joins AgriAI using your code!
        </Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>Referral code: {code}</Text>
          <IconButton icon="content-copy" size={18} style={styles.icon} onPress={handleCopyCode} />
        </View>
        <Pressable onPress={handleInvite} style={styles.action}>
          <IconButton icon="share-variant" size={18} style={styles.icon} onPress={handleInvite} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 15, fontWeight: '600', color: colors.textPrimary,
    marginHorizontal: 12, marginTop: 4, paddingHorizontal: 8, paddingVertical: 12,
  },
  panel: { marginHorizontal: 16, marginBottom: 8, paddingLeft: 8 },
  message: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  code: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  // IconButton carries its own internal padding around the glyph; pull it left
  // so the icon sits flush against the preceding text with no visible gap.
  icon: { margin: 0, marginLeft: -8 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 14, color: colors.textPrimary, marginLeft: -6 },
});
