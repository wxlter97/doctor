/**
 * Íconos de la app según Manual de Marca §05: fondo Tinta, banda Faro al pie, inicial en Archivo Black (Faro);
 * donde la banda cruza la letra, la letra va en Tinta. Salida: favicon.svg y PNG de la PWA en public/.
 *   pnpm --filter @medapoyo/web icons
 * La banda crece con cada app de la serie (20 → 40 → 68 → 88 sobre 108 px); MedHelp la usa en 0 (decisión de Walter).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';
import { chromium } from '@playwright/test';

const INITIAL = 'H';
const BAND = 0; // decidido por Walter: sin banda (ver docs/decisions.md ADR 020)
const FARO = '#FFDB00';
const TINTA = '#111111';
const SIZE = 108;
const FONT_SIZE = 54;

const root = join(import.meta.dirname, '..');
const fontFile = join(root, 'node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff');
const buf = readFileSync(fontFile);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Como CSS con line-height:1 centrado: la línea mide FONT_SIZE y (ascender+descender) se centra en ella.
const scale = FONT_SIZE / font.unitsPerEm;
const asc = font.ascender * scale;
const desc = -font.descender * scale;
const glyph = font.charToGlyph(INITIAL);
const advance = (glyph.advanceWidth ?? 0) * scale;
const baseline = SIZE / 2 - (asc + desc) / 2 + asc;
const path = glyph.getPath((SIZE - advance) / 2, baseline, FONT_SIZE).toPathData(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
${BAND > 0 ? `<defs><clipPath id="band"><rect x="0" y="${SIZE - BAND}" width="${SIZE}" height="${BAND}"/></clipPath></defs>` : ''}
<rect width="${SIZE}" height="${SIZE}" fill="${TINTA}"/>
<path d="${path}" fill="${FARO}"/>
${BAND > 0 ? `<rect x="0" y="${SIZE - BAND}" width="${SIZE}" height="${BAND}" fill="${FARO}"/>\n<path d="${path}" fill="${TINTA}" clip-path="url(#band)"/>` : ''}
</svg>
`;
writeFileSync(join(root, 'public/favicon.svg'), svg);

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
for (const [name, px] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]] as const) {
  const page = await browser.newPage({ viewport: { width: px, height: px } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${px}px;height:${px}px}</style>${svg}`);
  await page.screenshot({ path: join(root, 'public', name), omitBackground: false });
  await page.close();
}
await browser.close();
console.log(`Íconos generados (inicial ${INITIAL}, banda ${BAND}/${SIZE}).`);
