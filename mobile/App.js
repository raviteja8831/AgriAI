import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SnackbarProvider } from './src/components/SnackbarProvider';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';

import store from './src/store';
import { loadStoredAuth } from './src/store/authSlice';
import { theme, colors } from './src/utils/theme';
import DrawerContent from './src/components/DrawerContent';

import IntroScreen from './src/screens/IntroScreen';
import LoginScreen from './src/screens/LoginScreen';
import StayConnectedScreen from './src/screens/StayConnectedScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FarmsScreen from './src/screens/FarmsScreen';
import FarmDetailScreen from './src/screens/FarmDetailScreen';
import CropsScreen from './src/screens/CropsScreen';
import CropDetailScreen from './src/screens/CropDetailScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SoilScreen from './src/screens/SoilScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CommunicationSettingsScreen from './src/screens/CommunicationSettingsScreen';
import TermsScreen from './src/screens/TermsScreen';
import ContactScreen from './src/screens/ContactScreen';
import AboutScreen from './src/screens/AboutScreen';
import ShopScreen from './src/screens/ShopScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import CoinsScreen from './src/screens/CoinsScreen';
import WinAssuredScreen from './src/screens/WinAssuredScreen';
import CashbackScreen from './src/screens/CashbackScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } } });

const headerStyle = { backgroundColor: colors.primary };
const headerTintColor = '#fff';
const headerTitleStyle = { fontWeight: '700' };
const HIDDEN_ITEM_STYLE = { height: 0, margin: 0, padding: 0, overflow: 'hidden' };

// Hamburger menu button — shown in nested Stack screens so user can still open drawer
const MenuButton = ({ navigation }) => (
  <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 16 }}>
    <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
  </TouchableOpacity>
);

// Hamburger menu — shown on the Profile screen. Switches the drawer's active route to
// Dashboard first, then opens the sidebar on top of it — so picking a menu item
// navigates there as usual, but dismissing the drawer (tap outside/swipe) reveals
// Dashboard instead of landing back on Profile.
const BackButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => {
      navigation.navigate('Dashboard');
      navigation.openDrawer();
    }}
    style={{ paddingHorizontal: 16 }}
  >
    <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
  </TouchableOpacity>
);

function FarmsStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        // Show menu button as the left icon in all Farms sub-screens
        headerLeft: ({ canGoBack }) =>
          canGoBack ? undefined : <MenuButton navigation={navigation} />,
      }}
    >
      <Stack.Screen name="FarmsList" component={FarmsScreen} options={{ title: 'My Farms' }} />
      <Stack.Screen name="FarmDetail" component={FarmDetailScreen} options={{ title: 'Farm Details' }} />
    </Stack.Navigator>
  );
}

function CropsStack({ navigation }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? undefined : <MenuButton navigation={navigation} />,
      }}
    >
      <Stack.Screen name="CropsList" component={CropsScreen} options={{ title: 'Crops' }} />
      <Stack.Screen name="CropDetail" component={CropDetailScreen} options={{ title: 'Crop Details' }} />
    </Stack.Navigator>
  );
}

function AppDrawer({ onDrawerOpenChange }) {
  // @react-navigation/drawer computes the drawer's closed-position offset from the
  // window width at mount/layout time. On devices whose width changes at runtime
  // (foldables, Surface-style tablets resizing between multi-window/tablet mode),
  // that offset can go stale after an Android configuration change, leaving a
  // sliver of the drawer visible even when closed. Remounting on width change
  // forces a fresh measurement.
  const { width } = useWindowDimensions();

  return (
    <Drawer.Navigator
      key={width}
      drawerContent={(props) => <DrawerContent {...props} onDrawerOpenChange={onDrawerOpenChange} />}
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        drawerType: 'front',
        drawerStyle: {
          width: '80%', borderTopRightRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden',
          // Android draws elevation shadow outside the view's own bounds, so it isn't
          // clipped by overflow:hidden — on some devices/densities that leaves a faint
          // sliver visible at the screen edge even when the drawer is fully closed.
          elevation: 0, shadowOpacity: 0,
        },
        drawerActiveBackgroundColor: colors.primaryLight + '30',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textPrimary,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen}  options={{ title: 'Home',          drawerIcon: () => <Text>🏠</Text> }} />
      <Drawer.Screen name="Farms"     component={FarmsStack}       options={{ title: 'My Farms',      drawerIcon: () => <Text>🏡</Text>, headerShown: false }} />
      <Drawer.Screen name="Crops"     component={CropsStack}       options={{ title: 'Crops',         drawerIcon: () => <Text>🌿</Text>, headerShown: false }} />
      <Drawer.Screen name="Weather"   component={WeatherScreen}    options={{ title: 'Weather',       drawerIcon: () => <Text>🌤️</Text> }} />
      <Drawer.Screen name="Calendar"  component={CalendarScreen}   options={{ title: 'Crop Calendar', drawerIcon: () => <Text>📅</Text> }} />
      <Drawer.Screen name="Soil"      component={SoilScreen}       options={{ title: 'Soil Analysis', drawerIcon: () => <Text>🧪</Text> }} />
      <Drawer.Screen name="Communication" component={CommunicationSettingsScreen} options={{ title: 'Communication Settings', drawerIcon: () => <Text>💬</Text> }} />
      <Drawer.Screen name="Terms"     component={TermsScreen}      options={{ title: 'Terms & Conditions', drawerIcon: () => <Text>📄</Text> }} />
      <Drawer.Screen name="Contact"   component={ContactScreen}    options={{ title: 'Contact Us',    drawerIcon: () => <Text>📩</Text> }} />
      <Drawer.Screen name="About"     component={AboutScreen}      options={{ title: 'About App',     drawerIcon: () => <Text>ℹ️</Text> }} />
      {/* Reached only via the Cashback/Coins/Win-assured rows in DrawerContent — collapsed
          to zero height so DrawerItemList's auto-generated list doesn't show them, without
          touching state/index (which broke Dashboard's tap-to-navigate — see git history). */}
      <Drawer.Screen name="Coins" component={CoinsScreen} options={{ title: 'Coins', drawerItemStyle: HIDDEN_ITEM_STYLE }} />
      <Drawer.Screen name="WinAssured" component={WinAssuredScreen} options={{ title: 'Win Assured ₹100', drawerItemStyle: HIDDEN_ITEM_STYLE }} />
      <Drawer.Screen name="Cashback" component={CashbackScreen} options={{ title: 'Cashback Balance', drawerItemStyle: HIDDEN_ITEM_STYLE }} />
      {/* Reached only via the bell icon in the Home header — see comment above. */}
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', drawerItemStyle: HIDDEN_ITEM_STYLE }} />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'My Profile',
          drawerIcon: () => <Text>👤</Text>,
          headerLeft: () => <BackButton navigation={navigation} />,
        })}
      />
    </Drawer.Navigator>
  );
}

// Bottom tab bar shown above the device's system nav buttons on every main screen.
// Home hosts the existing drawer (Farms, Weather, Calendar, etc. stay reachable via
// the hamburger menu there); Shop and Profile are quick-access tabs alongside it.
function RootTabs() {
  // The drawer nested inside the Home tab reports its open/closed state up here so
  // the tab bar can hide while the drawer is sliding out — otherwise it stays visible
  // underneath/beside the drawer since it belongs to the outer (Tab) navigator.
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: drawerOpen ? { display: 'none' } : { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      >
        {() => <AppDrawer onDrawerOpenChange={setDrawerOpen} />}
      </Tab.Screen>
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, loaded, user, freshLogin } = useSelector((s) => s.auth);
  const [introSeen, setIntroSeen] = useState(null); // null = not yet checked

  useEffect(() => {
    dispatch(loadStoredAuth());
    AsyncStorage.getItem('introSeen').then((v) => setIntroSeen(v === 'true'));
  }, []);

  const finishIntro = () => {
    AsyncStorage.setItem('introSeen', 'true').catch(() => {});
    setIntroSeen(true);
  };

  if (!loaded || introSeen === null) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
      <Text style={{ fontSize: 64 }}>🌾</Text>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 16 }} />
    </View>
  );

  // New user = name still equals phone number placeholder
  const needsOnboarding = isAuthenticated && user && !user.onboarded
    && (user.name === user.phone || !user.name);

  return (
    <NavigationContainer
      documentTitle={{
        formatter: (options, route) => options?.title ?? route?.name ?? 'AgriAI — Smart Farming',
      }}
    >
      {!introSeen ? (
        <IntroScreen onDone={finishIntro} />
      ) : !isAuthenticated ? (
        <AuthStack />
      ) : freshLogin ? (
        <StayConnectedScreen />
      ) : needsOnboarding ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <RootTabs />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <StatusBar style="light" backgroundColor={colors.primary} />
            <SnackbarProvider>
              <RootNavigator />
            </SnackbarProvider>
          </PaperProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
