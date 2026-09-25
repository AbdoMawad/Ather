import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Quran: undefined;
  Adhkar: undefined;
  Dua: undefined;
  Wird: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Surah: { sura: number; ayah?: number; from?: string } | undefined;
  Search: { initial?: string } | undefined;
  Bookmarks: undefined;
  AdhkarGroup: { id: string };
  Settings: undefined;
  About: undefined;
  WirdEditor: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
