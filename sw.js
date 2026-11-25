/* Wyłącznik starego service workera z poprzedniej wersji strony:
   czyści pamięć podręczną, wyrejestrowuje się i przeładowuje otwarte karty. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => /^kalkulator-v\d+$/.test(key)).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const c of clients) {
        if (c.url.startsWith(self.registration.scope)) c.navigate(c.url);
      }
    })(),
  );
});
