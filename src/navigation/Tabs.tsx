import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { fonts, radius } from '../theme';
import { Icon } from '../components/Icon';
import HomeScreen from '../screens/HomeScreen';
import QuranScreen from '../screens/QuranScreen';
import AdhkarScreen from '../screens/AdhkarScreen';
import DuaScreen from '../screens/DuaScreen';
import WirdScreen from '../screens/WirdScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TABS: Record<string, { label: string; icon: string; activeIcon: string }> = {
  Home: { label: 'الرئيسية', icon: 'home-outline', activeIcon: 'home' },
  Quran: { label: 'القرآن', icon: 'book-outline', activeIcon: 'book' },
  Adhkar: { label: 'الأذكار', icon: 'leaf-outline', activeIcon: 'leaf' },
  Dua: { label: 'الدعاء', icon: 'heart-outline', activeIcon: 'heart' },
  Wird: { label: 'وردي', icon: 'sparkles-outline', activeIcon: 'sparkles' },
};

/** شريط تبويب سفلي مخصّص بهوية التطبيق */
function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, dailyWird } = useStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 6),
          shadowColor: theme.shadow,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name] ?? { label: route.name, icon: 'ellipse-outline', activeIcon: 'ellipse' };
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : meta.label;
        const showBadge = route.name === 'Wird' && dailyWird.percent > 0 && dailyWird.percent < 100;
        const duaBadge = route.name === 'Dua';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            style={({ pressed }) => [styles.tabItem, pressed && Platform.OS !== 'web' ? { opacity: 0.7 } : null]}
          >
            <View style={[styles.tabPill, { backgroundColor: focused ? theme.primarySoft : 'transparent' }]}>
              <Icon
                name={focused ? meta.activeIcon : meta.icon}
                size={21}
                color={focused ? theme.primary : theme.textMuted}
              />
              {showBadge || duaBadge ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: showBadge ? theme.gold : theme.ornamentSoft },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[styles.tabLabel, { color: focused ? theme.primary : theme.textMuted }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="Quran" component={QuranScreen} options={{ title: 'القرآن' }} />
      <Tab.Screen name="Adhkar" component={AdhkarScreen} options={{ title: 'الأذكار' }} />
      <Tab.Screen name="Dua" component={DuaScreen} options={{ title: 'الدعاء' }} />
      <Tab.Screen name="Wird" component={WirdScreen} options={{ title: 'وردي' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontFamily: fonts.uiBold, fontSize: 10.5 },
  badge: { position: 'absolute', top: 3, right: 9, width: 6, height: 6, borderRadius: 3 },
});
