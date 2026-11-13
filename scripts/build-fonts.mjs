import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// --- Fuentes locales y licencias ---
// Cada SVG lleva su fuente para conservar el aspecto al rasterizarlo en PDF.
const families = {
  'Trade Winds': 'trade-winds',
  'Permanent Marker': 'permanent-marker',
  'DM Sans': 'dm-sans',
  Oswald: 'oswald',
  'Space Grotesk': 'space-grotesk',
  'Playfair Display': 'playfair-display',
};
await mkdir('dist/licenses', { recursive: true });
const css = {};
for (const [family, slug] of Object.entries(families)) {
  const root = `node_modules/@fontsource/${slug}`;
  const font = await readFile(`${root}/files/${slug}-latin-400-normal.woff2`);
  css[family] =
    `@font-face{font-family:'${family}';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');}`;
  await copyFile(`${root}/LICENSE`, `dist/licenses/${slug}.txt`);
}
const code = `globalThis.StudioFonts = ${JSON.stringify(css)};\nconst fontStyle = document.createElement('style');\nfontStyle.textContent = Object.values(globalThis.StudioFonts).join('');\ndocument.head.appendChild(fontStyle);`;
await writeFile('dist/fonts.js', (await transform(code, { minify: true, target: 'es2020' })).code);
