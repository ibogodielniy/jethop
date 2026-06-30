// Rasterize public/icon.svg into favicon assets.
// Run:  node scripts/gen-favicon.mjs   (or: npm run gen:favicon)
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const svg = readFileSync(join(pub, 'icon.svg'));

const png = (size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' })
    .render()
    .asPng();

// Standalone PNGs referenced by index.html.
writeFileSync(join(pub, 'favicon-16.png'), png(16));
writeFileSync(join(pub, 'favicon-32.png'), png(32));
writeFileSync(join(pub, 'apple-touch-icon.png'), png(180));

// Multi-size .ico (16/32/48/64) — replaces the old default favicon.ico.
const ico = await pngToIco([png(16), png(32), png(48), png(64)]);
writeFileSync(join(pub, 'favicon.ico'), ico);

console.log('favicon assets written: favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png');
