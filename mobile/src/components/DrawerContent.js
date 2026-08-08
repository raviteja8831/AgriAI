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

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>AgriAI</Text>
        <Text style={styles.tagline}>Smart Farming Platform</Text>
        <Divider style={styles.divider} />
        <View style={styles.userRow}>
          <Avatar.Text size={40} label={user?.name?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </View>
        </View>
      </View>
      <DrawerItemList {...props} />
      <Divider style={{ marginTop: 16 }} />
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 48 },
  logo: { fontSize: 36 },
  appName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 4 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 12 },
  divider: { backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: colors.secondary },
  userName: { color: '#fff', fontWeight: '600' },
  userPhone: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  logoutBtn: { padding: 16 },
  logoutText: { color: colors.error, fontSize: 16 },
});
