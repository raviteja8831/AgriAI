import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Text, Avatar, Divider } from "react-native-paper";
import {
  DrawerContentScrollView,
  DrawerItem,
  useDrawerStatus,
} from "@react-navigation/drawer";
import { CommonActions, DrawerActions, useLinkBuilder } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { colors } from "../utils/theme";
import { BASE_URL } from "../utils/api";
import { capitalize } from "../utils/format";
import { getCashbackBalance, getCoinsBalance } from "../utils/rewards";

// Same route mapping as @react-navigation/drawer's DrawerItemList, but with a
// trailing arrow on every label to match the arrow style used in the rewards rows above.
function DrawerItemsWithArrows({ state, navigation, descriptors }) {
  const { buildHref } = useLinkBuilder();

  return state.routes.map((route, i) => {
    const focused = i === state.index;

    const onPress = () => {
      const event = navigation.emit({
        type: "drawerItemPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        navigation.dispatch({
          ...(focused
            ? DrawerActions.closeDrawer()
            : CommonActions.navigate(route.name, undefined, { merge: true })),
          target: state.key,
        });
      }
    };

    const {
      title,
      drawerLabel,
      drawerIcon,
      drawerLabelStyle,
      drawerItemStyle,
      drawerAllowFontScaling,
    } = descriptors[route.key].options;

    const label =
      drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name;

    return (
      <DrawerItem
        key={route.key}
        label={({ color }) => (
          <View style={styles.itemLabelRow}>
            <Text
              numberOfLines={1}
              allowFontScaling={drawerAllowFontScaling}
              style={[{ color, fontWeight: "500", flex: 1 }, drawerLabelStyle]}
            >
              {typeof label === "function" ? label({ focused, color }) : label}
            </Text>
            <Text style={[styles.itemArrow, { color }]}>›</Text>
          </View>
        )}
        icon={drawerIcon}
        focused={focused}
        style={drawerItemStyle}
        href={buildHref(route.name, route.params)}
        onPress={onPress}
      />
    );
  });
}

export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [cashbackBalance, setCashbackBalance] = useState(null);
  const [coinsBalance, setCoinsBalance] = useState(null);
  const drawerStatus = useDrawerStatus();

  useEffect(() => {
    props.onDrawerOpenChange?.(drawerStatus === "open");
  }, [drawerStatus]);

  useEffect(() => {
    let cancelled = false;
    getCashbackBalance(user?.id).then((bal) => {
      if (!cancelled) setCashbackBalance(bal);
    });
    getCoinsBalance(user?.id).then((bal) => {
      if (!cancelled) setCoinsBalance(bal);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const goToProfile = () => {
    props.navigation.closeDrawer();
    props.navigation.navigate("Profile");
  };

  const goTo = (routeName) => () => {
    props.navigation.closeDrawer();
    props.navigation.navigate(routeName);
  };

  return (
    <SafeAreaView style={styles.root}>
      <DrawerContentScrollView
        {...props}
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          onPress={() => props.navigation.closeDrawer()}
          style={styles.backBtn}
          hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.profileCard}>
          {user?.profile_image ? (
            <Avatar.Image
              size={80}
              source={{
                uri: `${BASE_URL.replace("/api", "")}${user.profile_image}`,
              }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={user?.name?.[0]?.toUpperCase() || "F"}
              style={styles.avatar}
            />
          )}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.userName}>{capitalize(user?.name)}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <Pressable
              onPress={goToProfile}
              style={({ pressed }) => [
                styles.updateProfileWrap,
                pressed && styles.updateProfileWrapPressed,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.updateProfile,
                    pressed && styles.updateProfilePressed,
                  ]}
                >
                  Update Profile
                </Text>
              )}
            </Pressable>
          </View>
        </View>
        <Divider style={{ marginTop: 16, marginBottom: 4 }} />

        <Text style={styles.rewardsHeading}>Your Rewards & Benefits</Text>
        <Pressable onPress={goTo("Cashback")} style={styles.rewardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardLabel}>Cashback Balance</Text>
            <Text style={styles.rewardValue}>₹{cashbackBalance ?? 0}</Text>
          </View>
          <Text style={styles.rewardArrow}>›</Text>
        </Pressable>
        <Pressable onPress={goTo("Coins")} style={styles.rewardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardLabel}>Coins</Text>
            <Text style={styles.rewardValue}>{coinsBalance ?? 0} coins</Text>
          </View>
          <Text style={styles.rewardArrow}>›</Text>
        </Pressable>
        <Pressable onPress={goTo("WinAssured")} style={styles.rewardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardLabel}>🎁 Refer & Earn</Text>
            <Text style={styles.rewardSubtext}>Refer & Win assured ₹100</Text>
          </View>
          <Text style={styles.rewardArrow}>›</Text>
        </Pressable>
        <Divider style={{ marginTop: 12, marginBottom: 4 }} />

        <DrawerItemsWithArrows {...props} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(logout())}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  container: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginLeft: 16,
    padding: 4,
  },
  backArrow: { fontSize: 24, color: colors.textPrimary },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  avatar: { backgroundColor: colors.secondary },
  userName: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
  userPhone: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  updateProfileWrap: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  updateProfileWrapPressed: { backgroundColor: colors.info + "20" },
  updateProfile: { color: colors.info, fontSize: 12, fontWeight: "600" },
  updateProfilePressed: { textDecorationLine: "underline" },
  rewardsHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginBottom: 6,
  },
  rewardLabel: { fontSize: 13, color: colors.textSecondary },
  rewardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  rewardSubtext: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.secondary,
    marginTop: 2,
  },
  rewardArrow: { fontSize: 24, color: colors.textSecondary },
  itemLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  itemArrow: { fontSize: 18, marginLeft: 8, opacity: 0.6 },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.info,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
