import { Platform } from 'react-native';

/**
 * أدوات الويب: PWA (manifest + service worker) ووسوم الميتا ودعم RTL
 * والروابط العميقة (?surah=2&ayah=255).
 * كل الدوال هنا آمنة الاستدعاء على المنصات الأخرى (لا تفعل شيئًا).
 */

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

function ensureMeta(attrs: Record<string, string>) {
  if (!isWeb) return;
  const selector = Object.keys(attrs)
    .map((k) => `[${k}="${attrs[k]}"]`)
    .join('');
  if (document.head.querySelector(`meta${selector}`)) return;
  const el = document.createElement('meta');
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

function ensureLink(rel: string, href: string, extra?: Record<string, string>) {
  if (!isWeb) return;
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const el = document.createElement('link');
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

/** يهيّئ الصفحة كـ PWA قابلة للتثبيت */
export function setupPWA() {
  if (!isWeb) return;
  try {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.title = 'أثر أمال — صدقة جارية';

    // فرض اتجاه RTL على جذر التطبيق (react-native-web يعتمد على CSS direction)
    if (!document.getElementById('athar-rtl-style')) {
      const style = document.createElement('style');
      style.id = 'athar-rtl-style';
      style.textContent =
        'html,body,#root{direction:rtl;}' +
        'body{margin:0;background-color:#FAF7F0;-webkit-font-smoothing:antialiased;}' +
        '[dir="ltr"],.ltr{direction:ltr;}' +
        '@media (prefers-color-scheme: dark){body{background-color:#0D1411;}}';
      document.head.appendChild(style);
    }

    ensureMeta({ name: 'description', content: 'أثر أمال — صدقة جارية عن روح أمال محمود النهر: قراءة القرآن الكريم والأذكار والدعاء.' });
    ensureMeta({ name: 'theme-color', content: '#123F2D' });
    ensureMeta({ name: 'apple-mobile-web-app-capable', content: 'yes' });
    ensureMeta({ name: 'apple-mobile-web-app-title', content: 'أثر أمال' });
    ensureMeta({ name: 'mobile-web-app-capable', content: 'yes' });
    ensureMeta({ name: 'robots', content: 'index, follow' });

    ensureLink('manifest', 'manifest.webmanifest');
    ensureLink('icon', 'icons/icon-192.png', { type: 'image/png', sizes: '192x192' });
    ensureLink('icon', 'icons/icon-512.png', { type: 'image/png', sizes: '512x512' });
    ensureLink('apple-touch-icon', 'icons/apple-touch-icon.png');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
          /* العمل دون اتصال ميزة إضافية — لا نكسر التطبيق عند فشلها */
        });
      });
    }
  } catch {
    /* noop */
  }
}

export interface DeepLink {
  surah?: number;
  ayah?: number;
}

/** يقرأ معاملات الرابط العميق */
export function readDeepLink(): DeepLink {
  if (!isWeb) return {};
  try {
    const p = new URLSearchParams(window.location.search);
    const surah = Number(p.get('surah'));
    const ayah = Number(p.get('ayah'));
    return {
      surah: Number.isFinite(surah) && surah >= 1 && surah <= 114 ? surah : undefined,
      ayah: Number.isFinite(ayah) && ayah >= 1 ? ayah : undefined,
    };
  } catch {
    return {};
  }
}

/** يحدّث شريط العنوان ليعكس الموضع الحالي (بدون إعادة تحميل) */
export function writeDeepLink(surah?: number, ayah?: number) {
  if (!isWeb) return;
  try {
    const url = new URL(window.location.href);
    if (surah) url.searchParams.set('surah', String(surah));
    else url.searchParams.delete('surah');
    if (ayah) url.searchParams.set('ayah', String(ayah));
    else url.searchParams.delete('ayah');
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* noop */
  }
}

export function clearDeepLink() {
  if (!isWeb) return;
  try {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* noop */
  }
}

/** فتح رابط خارجي في تبويب جديد (ويب) */
export function openExternal(url: string) {
  if (isWeb) {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    } catch {
      /* fallthrough */
    }
  }
  try {
    // على المنصات الأصلية نعرض الرابط نصيًا لأن Linking قد لا يكون متاحًا
    // eslint-disable-next-line no-console
    console.log('رابط:', url);
  } catch {
    /* noop */
  }
}

export function webOrigin(): string {
  if (!isWeb) return '';
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}
