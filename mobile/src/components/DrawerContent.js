import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { colors } from '../utils/theme';

export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const goToProfile = () => {
    props.navigation.closeDrawer();
    props.navigation.navigate('Profile');
  };

  return (
    <View style={styles.root}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.container} style={{ backgroundColor: colors.primary }}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.appName}>AgriAI</Text>
          <Text style={styles.tagline}>Smart Farming Platform</Text>
        </View>
        <TouchableOpacity style={styles.profileCard} onPress={goToProfile} activeOpacity={0.8}>
          <Avatar.Text size={44} label={user?.name?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <Divider style={{ marginTop: 16, marginBottom: 4 }} />
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  container: { flexGrow: 1, paddingTop: 0, backgroundColor: '#fff' },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 48, paddingBottom: 36 },
  logo: { fontSize: 36 },
  appName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 4 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: -24,
    padding: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  avatar: { backgroundColor: colors.secondary },
  userName: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  userPhone: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.textSecondary, fontSize: 24, fontWeight: '300' },
  logoutBtn: { position: 'absolute', bottom: '20%', left: 0, right: 0, alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: '600' },
});
