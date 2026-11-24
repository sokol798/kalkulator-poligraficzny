/**
 * Pod tym samym adresem działał wcześniej prototyp HTML z service workerem, który trzymał
 * starą wersję w pamięci podręcznej. Przy starcie wyrejestrowujemy go i czyścimy cache;
 * jeśli coś było zarejestrowane, przeładowujemy stronę raz.
 */
import { Platform } from 'react-native';

export async function cleanupLegacyServiceWorker(): Promise<void> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = (await navigator.serviceWorker.getRegistrations()).filter((registration) => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (!worker) return false;
      const path = new URL(worker.scriptURL).pathname;
      return path === '/kalkulator-poligraficzny/sw.js' && location.pathname.startsWith('/kalkulator-poligraficzny/');
    });
    const had = regs.length > 0;
    await Promise.all(regs.map((r) => r.unregister()));
    if ('caches' in globalThis) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => /^kalkulator-v\d+$/.test(key)).map((key) => caches.delete(key)));
    }
    if (had && !sessionStorage.getItem('legacy-sw-cleared')) {
      sessionStorage.setItem('legacy-sw-cleared', '1');
      setTimeout(() => location.reload(), 300);
    }
  } catch {
    // brak uprawnień / tryb prywatny – ignorujemy
  }
}
