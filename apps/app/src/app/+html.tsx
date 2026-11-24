import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const title = 'Kalkulator poligraficzny';
const description = 'Bezpłatnie oblicz liczbę użytków na arkuszu, zapotrzebowanie na papier i jego wagę.';
const url = 'https://sokol798.github.io/kalkulator-poligraficzny/';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
