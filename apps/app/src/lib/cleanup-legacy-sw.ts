/**
 * Pod tym samym adresem działał wcześniej prototyp HTML z service workerem, który trzymał
 * starą wersję w pamięci podręcznej. Przy starcie wyrejestrowujemy go i czyścimy cache;
 * jeśli coś było zarejestrowane, przeładowujemy stronę raz.
 */
import { Platform } from 'react-native';

export async function cleanupLegacyServiceWorker(): Promise<void> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const had = regs.length > 0;
    await Promise.all(regs.map((r) => r.unregister()));
    if ('caches' in globalThis) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if (had && !sessionStorage.getItem('legacy-sw-cleared')) {
      sessionStorage.setItem('legacy-sw-cleared', '1');
      setTimeout(() => location.reload(), 300);
    }
  } catch {
    // brak uprawnień / tryb prywatny – ignorujemy
  }
}
