import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const output = process.argv[2] ?? 'apps/app/dist';
const indexPath = join(output, 'index.html');
const html = await readFile(indexPath, 'utf8');

if (!/<script\b[^>]*\bsrc="[^"]*\/_expo\/static\/js\/web\/[^"]+"/.test(html) || !html.includes('</head>')) {
  throw new Error('Eksport Expo nie zawiera skryptów potrzebnych do uruchomienia kalkulatora.');
}

const title = 'Kalkulator poligraficzny';
const description = 'Bezpłatnie oblicz liczbę użytków na arkuszu, zapotrzebowanie na papier i jego wagę.';
const metadata = [
  `<title>${title}</title>`,
  `<meta name="description" content="${description}">`,
  '<meta property="og:type" content="website">',
  `<meta property="og:title" content="${title}">`,
  `<meta property="og:description" content="${description}">`,
  '<meta property="og:url" content="https://sokol798.github.io/kalkulator-poligraficzny/">',
].join('\n');

const preparedHtml = html
  .replace('<html lang="en">', '<html lang="pl">')
  .replace(/<title>[^<]*<\/title>/, '')
  .replace('</head>', `${metadata}\n</head>`);
await writeFile(indexPath, preparedHtml);
await writeFile(join(output, '404.html'), preparedHtml);
await writeFile(join(output, '.nojekyll'), '');
