import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Searchbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

export default function HomeHeader({
  searchQuery,
  onChangeSearch,
  onPressMenu,
  onPressRewards,
  onPressCoins,
  onPressAddress,
  onPressLanguage,
  language,
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row1}>
        <TouchableOpacity onPress={onPressMenu} style={styles.iconBtn}>
          <Text style={styles.iconText}>🏠</Text>
        </TouchableOpacity>

        <Searchbar
          placeholder="Search weather, crops, tools..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onChangeSearch}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
          icon="magnify"
          iconColor={colors.textSecondary}
          right={() => (
            <View style={styles.searchRightIcons}>
              <IconButton icon="camera" size={18} iconColor={colors.textSecondary} style={styles.searchIconBtn} />
              <IconButton icon="microphone" size={18} iconColor={colors.textSecondary} style={styles.searchIconBtn} />
            </View>
          )}
        />

        <TouchableOpacity onPress={onPressRewards} style={styles.iconBtn}>
          <Text style={styles.iconText}>🎁</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressCoins} style={styles.iconBtn}>
          <Text style={styles.iconText}>🪙</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row2}>
        <TouchableOpacity style={styles.addressRow} onPress={onPressAddress}>
          <Text style={styles.addressText} numberOfLines={1}>📍 Set your farm location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.langPill} onPress={onPressLanguage}>
          <Text style={styles.langPillText}>{language === 'hi' ? 'हिं' : language === 'te' ? 'తె' : 'EN'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.primary },
  row1: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingTop: 8 },
  iconBtn: { paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  searchbar: { flex: 1, height: 42, borderRadius: 21, elevation: 0, backgroundColor: '#fff' },
  searchbarInput: { fontSize: 14, minHeight: 0, alignSelf: 'center' },
  searchRightIcons: { flexDirection: 'row', alignItems: 'center' },
  searchIconBtn: { margin: 0 },
  row2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 },
  addressRow: { flex: 1, marginRight: 10 },
  addressText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  langPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  langPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
