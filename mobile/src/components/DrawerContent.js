import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, SafeAreaView } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { colors } from '../utils/theme';
import { BASE_URL } from '../utils/api';
import { capitalize } from '../utils/format';

export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const goToProfile = () => {
    props.navigation.closeDrawer();
    props.navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.root}>
      <DrawerContentScrollView {...props} style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          {user?.profile_image ? (
            <Avatar.Image size={80} source={{ uri: `${BASE_URL.replace('/api', '')}${user.profile_image}` }} style={styles.avatar} />
          ) : (
            <Avatar.Text size={80} label={user?.name?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
          )}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{capitalize(user?.name)}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <Pressable onPress={goToProfile} style={({ pressed }) => [styles.updateProfileWrap, pressed && styles.updateProfileWrapPressed]}>
              {({ pressed }) => (
                <Text style={[styles.updateProfile, pressed && styles.updateProfilePressed]}>Update Profile</Text>
              )}
            </Pressable>
          </View>
        </View>
        <Divider style={{ marginTop: 16, marginBottom: 4 }} />
        <DrawerItemList {...props} />
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingTop: 0, paddingBottom: 16, backgroundColor: '#fff' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 48,
    padding: 14,
  },
  avatar: { backgroundColor: colors.secondary },
  userName: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  userPhone: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  updateProfileWrap: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  updateProfileWrapPressed: { backgroundColor: colors.info + '20' },
  updateProfile: { color: colors.info, fontSize: 12, fontWeight: '600' },
  updateProfilePressed: { textDecorationLine: 'underline' },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 16, alignItems: 'center',
    paddingVertical: 12, borderRadius: 10, backgroundColor: colors.info,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
