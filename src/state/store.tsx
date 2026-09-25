import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { StorageKeys, clearAll, loadJSON, saveJSON } from '../lib/storage';
import { dayKey, addDays, daysBetween, lastNDays } from '../lib/date';
import { ADHKAR_GROUPS, getGroup } from '../lib/adhkar';
import { QURAN_FONT_DEFAULT, QURAN_FONT_MAX, QURAN_FONT_MIN, themes, Theme, ThemeName } from '../theme';
import type { QuranScript } from '../lib/quran';

// ---------------------------------------------------------------------------
// الأنواع
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'system';
export type ReadingMode = 'ayah' | 'continuous';

export interface Settings {
  themeMode: ThemeMode;
  script: QuranScript;
  quranFontSize: number;
  readingMode: ReadingMode;
  haptics: boolean;
  keepScreenAwake: boolean;
}

export interface LastRead {
  sura: number;
  ayah: number;
  percent: number;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  sura: number;
  ayah: number;
  createdAt: number;
}

export type WirdType = 'count' | 'adhkar' | 'surah' | 'dua' | 'ayahs';

export interface WirdItem {
  id: string;
  title: string;
  subtitle: string;
  type: WirdType;
  target: number;
  /** معرّف مجموعة الأذكار (type=adhkar) أو رقم السورة (type=surah) */
  ref?: string | number;
  builtin: boolean;
  enabled: boolean;
  /** أيام الأسبوع التي يُطلب فيها الورد (0=الأحد … 5=الجمعة). فارغ = كل يوم */
  days?: number[];
  icon: string;
}

export interface WirdState {
  items: WirdItem[];
  counts: Record<string, Record<string, number>>;
}

export interface ReadingDay {
  ayahs: number;
  surahs: number[];
}

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  script: 'uthmani',
  quranFontSize: QURAN_FONT_DEFAULT,
  readingMode: 'ayah',
  haptics: true,
  keepScreenAwake: false,
};

const BUILTIN_WIRDS: WirdItem[] = [
  {
    id: 'w-morning',
    title: 'أذكار الصباح',
    subtitle: 'تُحتسب تلقائيًا من تقدّمك في الأذكار',
    type: 'adhkar',
    ref: 'morning',
    target: 1,
    builtin: true,
    enabled: true,
    icon: 'sunny-outline',
  },
  {
    id: 'w-evening',
    title: 'أذكار المساء',
    subtitle: 'تُحتسب تلقائيًا من تقدّمك في الأذكار',
    type: 'adhkar',
    ref: 'evening',
    target: 1,
    builtin: true,
    enabled: true,
    icon: 'moon-outline',
  },
  {
    id: 'w-mulk',
    title: 'سورة الملك',
    subtitle: 'قراءة سورة الملك — تُحتسب عند إتمامها',
    type: 'surah',
    ref: 67,
    target: 1,
    builtin: true,
    enabled: true,
    icon: 'book-outline',
  },
  {
    id: 'w-kahf',
    title: 'سورة الكهف',
    subtitle: 'يوم الجمعة فقط',
    type: 'surah',
    ref: 18,
    target: 1,
    builtin: true,
    enabled: true,
    days: [5],
    icon: 'book-outline',
  },
  {
    id: 'w-ayahs',
    title: 'قراءة ٢٠ آية',
    subtitle: 'تُحتسب تلقائيًا أثناء قراءة القرآن',
    type: 'ayahs',
    target: 20,
    builtin: true,
    enabled: true,
    icon: 'reader-outline',
  },
  {
    id: 'w-istighfar',
    title: 'الاستغفار ١٠٠ مرة',
    subtitle: 'أستغفر الله وأتوب إليه',
    type: 'count',
    target: 100,
    builtin: true,
    enabled: true,
    icon: 'sparkles-outline',
  },
  {
    id: 'w-tasbih',
    title: 'سبحان الله وبحمده ١٠٠',
    subtitle: 'التسبيح والتحميد',
    type: 'count',
    target: 100,
    builtin: true,
    enabled: false,
    icon: 'infinite-outline',
  },
  {
    id: 'w-salah',
    title: 'الصلاة على النبي ﷺ ١٠٠',
    subtitle: 'اللهم صلِّ وسلِّم على نبينا محمد',
    type: 'count',
    target: 100,
    builtin: true,
    enabled: false,
    icon: 'star-outline',
  },
  {
    id: 'w-dua',
    title: 'الدعاء لها ١٠ مرات',
    subtitle: 'يُحتسب تلقائيًا من صفحة الدعاء لها',
    type: 'dua',
    target: 10,
    builtin: true,
    enabled: true,
    icon: 'heart-outline',
  },
];

const DEFAULT_WIRD: WirdState = { items: BUILTIN_WIRDS, counts: {} };

// ---------------------------------------------------------------------------
// الحالة
// ---------------------------------------------------------------------------

interface StoreShape {
  ready: boolean;
  settings: Settings;
  theme: Theme;
  today: string;
  lastRead: LastRead | null;
  bookmarks: Bookmark[];
  /** { dayKey: { itemId: count } } */
  adhkarDaily: Record<string, Record<string, number>>;
  adhkarLifetime: Record<string, number>;
  wird: WirdState;
  /** { dayKey: count } */
  duaCounts: Record<string, number>;
  readingLog: Record<string, ReadingDay>;

  setSettings: (patch: Partial<Settings>) => void;
  setLastRead: (sura: number, ayah: number, percent: number) => void;
  toggleBookmark: (sura: number, ayah: number) => boolean;
  removeBookmark: (id: string) => void;
  isBookmarked: (sura: number, ayah: number) => boolean;

  adhkarCount: (itemId: string) => number;
  incAdhkar: (itemId: string, by?: number) => void;
  decAdhkar: (itemId: string) => void;
  completeAdhkar: (itemId: string) => void;
  resetAdhkarGroup: (groupId: string) => void;
  groupProgress: (groupId: string) => { done: number; total: number; percent: number };

  duaToday: number;
  duaTotal: number;
  incDua: () => void;

  wirdValue: (item: WirdItem) => number;
  incWird: (id: string, by?: number) => void;
  setWirdEnabled: (id: string, enabled: boolean) => void;
  addCustomWird: (title: string, subtitle: string, target: number) => void;
  removeWird: (id: string) => void;
  resetWirdToday: () => void;
  activeWirdsToday: WirdItem[];
  dailyWird: { completed: number; total: number; percent: number };
  streak: number;
  weekHistory: Array<{ key: string; label: string; percent: number; isToday: boolean }>;

  logAyahsRead: (sura: number, count: number) => void;
  markSurahCompleted: (sura: number) => void;
  ayahsReadToday: number;

  resetEverything: () => Promise<void>;
}

const StoreContext = createContext<StoreShape | null>(null);

const HISTORY_DAYS = 21;

function prune<T>(map: Record<string, T>, keep = HISTORY_DAYS): Record<string, T> {
  const keys = Object.keys(map).sort();
  if (keys.length <= keep) return map;
  const out: Record<string, T> = {};
  for (const k of keys.slice(keys.length - keep)) out[k] = map[k];
  return out;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [adhkarDaily, setAdhkarDaily] = useState<Record<string, Record<string, number>>>({});
  const [adhkarLifetime, setAdhkarLifetime] = useState<Record<string, number>>({});
  const [wird, setWird] = useState<WirdState>(DEFAULT_WIRD);
  const [duaCounts, setDuaCounts] = useState<Record<string, number>>({});
  const [readingLog, setReadingLog] = useState<Record<string, ReadingDay>>({});
  const [today, setToday] = useState<string>(() => dayKey());

  const loaded = useRef(false);

  // تحميل الحالة المحفوظة
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, lr, bm, ad, al, w, dc, rl] = await Promise.all([
        loadJSON<Settings>(StorageKeys.settings, DEFAULT_SETTINGS),
        loadJSON<LastRead | null>(StorageKeys.lastRead, null),
        loadJSON<Bookmark[]>(StorageKeys.bookmarks, []),
        loadJSON<Record<string, Record<string, number>>>(StorageKeys.adhkarDaily, {}),
        loadJSON<Record<string, number>>(StorageKeys.adhkarLifetime, {}),
        loadJSON<WirdState>(StorageKeys.wird, DEFAULT_WIRD),
        loadJSON<Record<string, number>>(StorageKeys.duaCount, {}),
        loadJSON<Record<string, ReadingDay>>(StorageKeys.readingLog, {}),
      ]);
      if (cancelled) return;
      setSettingsState({ ...DEFAULT_SETTINGS, ...s });
      setLastReadState(lr);
      setBookmarks(Array.isArray(bm) ? bm : []);
      setAdhkarDaily(ad);
      setAdhkarLifetime(al);
      // دمج الأوراد المدمجة الجديدة مع ما حفظه المستخدم
      const items = Array.isArray(w?.items) ? w.items : [];
      const byId = new Map(items.map((i) => [i.id, i]));
      const merged: WirdItem[] = BUILTIN_WIRDS.map((b) => {
        const existing = byId.get(b.id);
        return existing ? { ...b, enabled: existing.enabled } : b;
      });
      for (const it of items) if (!it.builtin) merged.push(it);
      setWird({ items: merged, counts: w?.counts ?? {} });
      setDuaCounts(dc);
      setReadingLog(rl);
      setToday(dayKey());
      loaded.current = true;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.settings, settings);
  }, [settings]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.lastRead, lastRead);
  }, [lastRead]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.bookmarks, bookmarks);
  }, [bookmarks]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.adhkarDaily, adhkarDaily);
  }, [adhkarDaily]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.adhkarLifetime, adhkarLifetime);
  }, [adhkarLifetime]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.wird, wird);
  }, [wird]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.duaCount, duaCounts);
  }, [duaCounts]);
  useEffect(() => {
    if (!loaded.current) return;
    saveJSON(StorageKeys.readingLog, readingLog);
  }, [readingLog]);

  // تحديث مفتاح اليوم عند تغيّره (منتصف الليل)
  useEffect(() => {
    const id = setInterval(() => {
      const k = dayKey();
      setToday((prev) => (prev === k ? prev : k));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const theme: Theme = useMemo(() => {
    const mode = settings.themeMode;
    const name: ThemeName =
      mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return themes[name];
  }, [settings.themeMode, systemScheme]);

  // -------------------------------------------------------------------------
  // الإعدادات
  // -------------------------------------------------------------------------
  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      next.quranFontSize = Math.min(
        QURAN_FONT_MAX,
        Math.max(QURAN_FONT_MIN, Math.round(next.quranFontSize))
      );
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // القراءة والعلامات
  // -------------------------------------------------------------------------
  const setLastRead = useCallback((sura: number, ayah: number, percent: number) => {
    setLastReadState((prev) => {
      if (prev && prev.sura === sura && prev.ayah === ayah) return prev;
      return { sura, ayah, percent: Math.max(0, Math.min(100, Math.round(percent))), updatedAt: Date.now() };
    });
  }, []);

  const isBookmarked = useCallback(
    (sura: number, ayah: number) => bookmarks.some((b) => b.sura === sura && b.ayah === ayah),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (sura: number, ayah: number) => {
      const exists = bookmarks.some((b) => b.sura === sura && b.ayah === ayah);
      if (exists) {
        setBookmarks((prev) => prev.filter((b) => !(b.sura === sura && b.ayah === ayah)));
        return false;
      }
      setBookmarks((prev) => [{ id: `${sura}:${ayah}`, sura, ayah, createdAt: Date.now() }, ...prev].slice(0, 500));
      return true;
    },
    [bookmarks]
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // -------------------------------------------------------------------------
  // الأذكار
  // -------------------------------------------------------------------------
  const adhkarCount = useCallback(
    (itemId: string) => adhkarDaily[today]?.[itemId] ?? 0,
    [adhkarDaily, today]
  );

  const incAdhkar = useCallback(
    (itemId: string, by = 1) => {
      setAdhkarDaily((prev) => {
        const day = { ...(prev[today] ?? {}) };
        day[itemId] = Math.max(0, (day[itemId] ?? 0) + by);
        return { ...prune(prev), [today]: day };
      });
      setAdhkarLifetime((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + by }));
    },
    [today]
  );

  const decAdhkar = useCallback(
    (itemId: string) => {
      setAdhkarDaily((prev) => {
        const day = { ...(prev[today] ?? {}) };
        const cur = day[itemId] ?? 0;
        if (cur <= 0) return prev;
        day[itemId] = cur - 1;
        return { ...prev, [today]: day };
      });
      setAdhkarLifetime((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1) }));
    },
    [today]
  );

  const completeAdhkar = useCallback(
    (itemId: string) => {
      let target = 1;
      for (const g of ADHKAR_GROUPS) {
        const it = g.items.find((x) => x.id === itemId);
        if (it) {
          target = it.count;
          break;
        }
      }
      const cur = adhkarDaily[today]?.[itemId] ?? 0;
      const delta = Math.max(0, target - cur);
      setAdhkarDaily((prev) => {
        const day = { ...(prev[today] ?? {}) };
        day[itemId] = Math.max(target, day[itemId] ?? 0);
        return { ...prune(prev), [today]: day };
      });
      if (delta > 0) {
        setAdhkarLifetime((p) => ({ ...p, [itemId]: (p[itemId] ?? 0) + delta }));
      }
    },
    [today, adhkarDaily]
  );

  const resetAdhkarGroup = useCallback(
    (groupId: string) => {
      const g = getGroup(groupId);
      if (!g) return;
      setAdhkarDaily((prev) => {
        const day = { ...(prev[today] ?? {}) };
        g.items.forEach((it) => {
          delete day[it.id];
        });
        return { ...prev, [today]: day };
      });
    },
    [today]
  );

  const groupProgress = useCallback(
    (groupId: string) => {
      const g = getGroup(groupId);
      if (!g) return { done: 0, total: 0, percent: 0 };
      const day = adhkarDaily[today] ?? {};
      let done = 0;
      for (const it of g.items) if ((day[it.id] ?? 0) >= it.count) done++;
      return { done, total: g.items.length, percent: g.items.length ? (done / g.items.length) * 100 : 0 };
    },
    [adhkarDaily, today]
  );

  // -------------------------------------------------------------------------
  // الدعاء لها
  // -------------------------------------------------------------------------
  const duaToday = duaCounts[today] ?? 0;
  const duaTotal = useMemo(() => Object.values(duaCounts).reduce((s, n) => s + n, 0), [duaCounts]);

  const incDua = useCallback(() => {
    setDuaCounts((prev) => {
      const pruned = prune(prev, 120);
      return { ...pruned, [today]: (pruned[today] ?? 0) + 1 };
    });
  }, [today]);

  // -------------------------------------------------------------------------
  // سجل القراءة
  // -------------------------------------------------------------------------
  const logAyahsRead = useCallback(
    (_sura: number, count: number) => {
      if (count <= 0) return;
      setReadingLog((prev) => {
        const day = prev[today] ?? { ayahs: 0, surahs: [] };
        return {
          ...prune(prev),
          [today]: { ayahs: day.ayahs + count, surahs: day.surahs },
        };
      });
    },
    [today]
  );

  const markSurahCompleted = useCallback(
    (sura: number) => {
      setReadingLog((prev) => {
        const day = prev[today] ?? { ayahs: 0, surahs: [] };
        if (day.surahs.includes(sura)) return prev;
        return { ...prune(prev), [today]: { ayahs: day.ayahs, surahs: [...day.surahs, sura] } };
      });
    },
    [today]
  );

  const ayahsReadToday = readingLog[today]?.ayahs ?? 0;

  // -------------------------------------------------------------------------
  // الورد اليومي
  // -------------------------------------------------------------------------
  const wirdValue = useCallback(
    (item: WirdItem): number => {
      switch (item.type) {
        case 'count':
          return wird.counts[today]?.[item.id] ?? 0;
        case 'dua':
          return duaCounts[today] ?? 0;
        case 'ayahs':
          return readingLog[today]?.ayahs ?? 0;
        case 'surah': {
          const n = Number(item.ref);
          return readingLog[today]?.surahs?.includes(n) ? 1 : 0;
        }
        case 'adhkar': {
          const gid = String(item.ref);
          const g = getGroup(gid);
          if (!g) return 0;
          const day = adhkarDaily[today] ?? {};
          const done = g.items.filter((it) => (day[it.id] ?? 0) >= it.count).length;
          return done >= g.items.length && g.items.length > 0 ? 1 : 0;
        }
        default:
          return 0;
      }
    },
    [wird.counts, today, duaCounts, readingLog, adhkarDaily]
  );

  const incWird = useCallback(
    (id: string, by = 1) => {
      setWird((prev) => {
        const day = { ...(prev.counts[today] ?? {}) };
        day[id] = Math.max(0, (day[id] ?? 0) + by);
        return { ...prev, counts: { ...prune(prev.counts), [today]: day } };
      });
    },
    [today]
  );

  const setWirdEnabled = useCallback((id: string, enabled: boolean) => {
    setWird((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, enabled } : i)),
    }));
  }, []);

  const addCustomWird = useCallback((title: string, subtitle: string, target: number) => {
    const id = `custom-${Date.now()}`;
    setWird((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id,
          title: title.trim() || 'ورد جديد',
          subtitle: subtitle.trim() || 'ورد مخصص',
          type: 'count',
          target: Math.max(1, Math.round(target)),
          builtin: false,
          enabled: true,
          icon: 'add-circle-outline',
        },
      ],
    }));
  }, []);

  const removeWird = useCallback((id: string) => {
    setWird((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id || i.builtin) }));
  }, []);

  const resetWirdToday = useCallback(() => {
    setWird((prev) => {
      const counts = { ...prev.counts };
      delete counts[today];
      return { ...prev, counts };
    });
  }, [today]);

  const activeWirdsToday = useMemo(() => {
    const dow = new Date().getDay();
    return wird.items.filter((i) => i.enabled && (!i.days || i.days.length === 0 || i.days.includes(dow)));
  }, [wird.items]);

  const dailyWird = useMemo(() => {
    const total = activeWirdsToday.length;
    let completed = 0;
    for (const it of activeWirdsToday) {
      if (wirdValue(it) >= it.target) completed++;
    }
    return { completed, total, percent: total ? (completed / total) * 100 : 0 };
  }, [activeWirdsToday, wirdValue]);

  /** نسبة إنجاز يوم معيّن (للسجل والسلسلة) */
  const percentForDay = useCallback(
    (key: string): number => {
      const dow = new Date(key + 'T00:00:00').getDay();
      const items = wird.items.filter(
        (i) => i.enabled && (!i.days || i.days.length === 0 || i.days.includes(dow))
      );
      if (items.length === 0) return 0;
      let completed = 0;
      for (const item of items) {
        let v = 0;
        switch (item.type) {
          case 'count':
            v = wird.counts[key]?.[item.id] ?? 0;
            break;
          case 'dua':
            v = duaCounts[key] ?? 0;
            break;
          case 'ayahs':
            v = readingLog[key]?.ayahs ?? 0;
            break;
          case 'surah':
            v = readingLog[key]?.surahs?.includes(Number(item.ref)) ? 1 : 0;
            break;
          case 'adhkar': {
            const g = getGroup(String(item.ref));
            if (!g) break;
            const day = adhkarDaily[key] ?? {};
            const done = g.items.filter((it) => (day[it.id] ?? 0) >= it.count).length;
            v = done >= g.items.length && g.items.length > 0 ? 1 : 0;
            break;
          }
        }
        if (v >= item.target) completed++;
      }
      return (completed / items.length) * 100;
    },
    [wird.items, wird.counts, duaCounts, readingLog, adhkarDaily]
  );

  const streak = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 365; i++) {
      const k = dayKey(addDays(new Date(), -i));
      const p = percentForDay(k);
      if (p >= 100) n++;
      else if (i === 0) continue; // اليوم لم يكتمل بعد — لا يكسر السلسلة
      else break;
    }
    return n;
  }, [percentForDay]);

  const weekHistory = useMemo(() => {
    const keys = lastNDays(7);
    return keys.map((k) => ({
      key: k,
      label: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][new Date(k + 'T00:00:00').getDay()],
      percent: percentForDay(k),
      isToday: k === today,
    }));
  }, [percentForDay, today]);

  // -------------------------------------------------------------------------
  // إعادة الضبط
  // -------------------------------------------------------------------------
  const resetEverything = useCallback(async () => {
    await clearAll();
    setSettingsState(DEFAULT_SETTINGS);
    setLastReadState(null);
    setBookmarks([]);
    setAdhkarDaily({});
    setAdhkarLifetime({});
    setWird({ items: BUILTIN_WIRDS, counts: {} });
    setDuaCounts({});
    setReadingLog({});
  }, []);

  const value: StoreShape = {
    ready,
    settings,
    theme,
    today,
    lastRead,
    bookmarks,
    adhkarDaily,
    adhkarLifetime,
    wird,
    duaCounts,
    readingLog,
    setSettings,
    setLastRead,
    toggleBookmark,
    removeBookmark,
    isBookmarked,
    adhkarCount,
    incAdhkar,
    decAdhkar,
    completeAdhkar,
    resetAdhkarGroup,
    groupProgress,
    duaToday,
    duaTotal,
    incDua,
    wirdValue,
    incWird,
    setWirdEnabled,
    addCustomWird,
    removeWird,
    resetWirdToday,
    activeWirdsToday,
    dailyWird,
    streak,
    weekHistory,
    logAyahsRead,
    markSurahCompleted,
    ayahsReadToday,
    resetEverything,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore يجب أن يُستخدم داخل StoreProvider');
  return ctx;
}

/** اختصار: الأيام منذ آخر قراءة */
export function daysSinceLastRead(ts?: number): number {
  if (!ts) return -1;
  return Math.max(0, daysBetween(dayKey(new Date(ts)), dayKey()));
}
