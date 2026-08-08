import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SnackbarProvider } from './src/components/SnackbarProvider';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';

import store from './src/store';
import { loadStoredAuth } from './src/store/authSlice';
import { theme, colors } from './src/utils/theme';
import DrawerContent from './src/components/DrawerContent';

import LoginScreen from './src/screens/LoginScreen';
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

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } } });

const headerStyle = { backgroundColor: colors.primary };
const headerTintColor = '#fff';
const headerTitleStyle = { fontWeight: '700' };

// Hamburger menu button — shown in nested Stack screens so user can still open drawer
const MenuButton = ({ navigation }) => (
  <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ paddingHorizontal: 16 }}>
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

function AppDrawer() {
  // On wide web screens, show permanent drawer (sidebar); on mobile, slide-over
  const drawerType = Platform.OS === 'web' ? 'permanent' : 'slide';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        drawerType,
        drawerStyle: Platform.OS === 'web' ? { width: 240 } : undefined,
        drawerActiveBackgroundColor: colors.primaryLight + '30',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textPrimary,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen}  options={{ title: 'Dashboard',     drawerIcon: () => '📊 ' }} />
      <Drawer.Screen name="Farms"     component={FarmsStack}       options={{ title: 'My Farms',      drawerIcon: () => '🏡 ', headerShown: false }} />
      <Drawer.Screen name="Crops"     component={CropsStack}       options={{ title: 'Crops',         drawerIcon: () => '🌿 ', headerShown: false }} />
      <Drawer.Screen name="Weather"   component={WeatherScreen}    options={{ title: 'Weather',       drawerIcon: () => '🌤️ ' }} />
      <Drawer.Screen name="Calendar"  component={CalendarScreen}   options={{ title: 'Crop Calendar', drawerIcon: () => '📅 ' }} />
      <Drawer.Screen name="Soil"      component={SoilScreen}       options={{ title: 'Soil Analysis', drawerIcon: () => '🧪 ' }} />
      <Drawer.Screen name="Profile"   component={ProfileScreen}    options={{ title: 'My Profile',    drawerIcon: () => '👤 ' }} />
    </Drawer.Navigator>
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
  const { isAuthenticated, loaded, user } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(loadStoredAuth()); }, []);

  if (!loaded) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
      <Text style={{ fontSize: 64 }}>🌾</Text>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 16 }} />
    </View>
  );

  // New user = name still equals phone number placeholder
  const needsOnboarding = isAuthenticated && user && !user.onboarded
    && (user.name === user.phone || !user.name);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : needsOnboarding ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <AppDrawer />
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
