import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, I18nManager, Platform, StyleSheet, Text, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { StoreProvider, useStore } from './src/state/store';
import { ToastProvider } from './src/components/ui';
import Tabs from './src/navigation/Tabs';
import SurahScreen from './src/screens/SurahScreen';
import SearchScreen from './src/screens/SearchScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import AdhkarGroupScreen from './src/screens/AdhkarGroupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import type { RootStackParamList } from './src/navigation/types';
import { readDeepLink, setupPWA } from './src/lib/web';
import { fonts as fontNames } from './src/theme';

// ---------------------------------------------------------------------------
// RTL — يُضبط قبل أول رسم
// ---------------------------------------------------------------------------
if (Platform.OS === 'web') {
  setupPWA();
} else {
  try {
    I18nManager.allowRTL(true);
    if (!I18nManager.getConstants().isRTL) I18nManager.forceRTL(true);
  } catch {
    /* noop */
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { theme, ready } = useStore();
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const deepLinkHandled = useRef(false);

  const navTheme: NavTheme = {
    ...(theme.name === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.name === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.bg,
      card: theme.headerBg,
      text: theme.text,
      border: theme.border,
      notification: theme.gold,
    },
    fonts: {
      regular: { fontFamily: fontNames.ui, fontWeight: '400' },
      medium: { fontFamily: fontNames.uiMedium, fontWeight: '500' },
      bold: { fontFamily: fontNames.uiBlack, fontWeight: '700' },
      heavy: { fontFamily: fontNames.uiBlack, fontWeight: '800' },
    },
  };

  // الروابط العميقة: ?surah=67&ayah=1
  useEffect(() => {
    if (!ready || deepLinkHandled.current) return;
    const link = readDeepLink();
    if (link.surah) {
      deepLinkHandled.current = true;
      const t = setTimeout(() => {
        try {
          navRef.reset({ index: 0, routes: [{ name: 'Surah', params: { sura: link.surah!, ayah: link.ayah } }] });
        } catch {
          /* noop */
        }
      }, 60);
      return () => clearTimeout(t);
    }
    deepLinkHandled.current = true;
  }, [ready, navRef]);

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: theme.bg },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Surah" component={SurahScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="AdhkarGroup" component={AdhkarGroupScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function BootSplash() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashInner}>
        <ActivityIndicator size="large" color="#C6A15B" />
        <Text style={styles.splashTitle}>أثر أمال</Text>
        <Text style={styles.splashSub}>صدقة جارية عن روح أمال محمود النهر</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    'Tajawal-Regular': require('./assets/fonts/Tajawal-Regular.ttf'),
    'Tajawal-Medium': require('./assets/fonts/Tajawal-Medium.ttf'),
    'Tajawal-Bold': require('./assets/fonts/Tajawal-Bold.ttf'),
    'Tajawal-ExtraBold': require('./assets/fonts/Tajawal-ExtraBold.ttf'),
    AmiriQuran: require('./assets/fonts/AmiriQuran.ttf'),
    'Amiri-Regular': require('./assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('./assets/fonts/Amiri-Bold.ttf'),
  });

  useEffect(() => {
    setupPWA();
  }, []);

  if (!fontsLoaded && !fontError) return <BootSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#123F2D', alignItems: 'center', justifyContent: 'center' },
  splashInner: { alignItems: 'center', gap: 10 },
  splashTitle: { fontFamily: 'Amiri-Bold', fontSize: 34, color: '#FBF6E9', marginTop: 14, letterSpacing: 1 },
  splashSub: { fontFamily: 'Tajawal-Medium', fontSize: 13, color: '#E3D6B6', textAlign: 'center' },
});
