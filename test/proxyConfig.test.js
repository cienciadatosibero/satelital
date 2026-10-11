import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('la ruta /api se reenvía al backend antes del fallback SPA', () => {
  assert.equal(cfg.rewrites[0].source, '/api/:path*');
  assert.equal(cfg.rewrites[0].destination, 'https://satelital-backend.vercel.app/api/:path*');
  assert.equal(cfg.rewrites[1].destination, '/index.html');
});

test('en producción, el navegador llama a su mismo origen', () => {
  assert.match(readFileSync(new URL('../.env.production', import.meta.url), 'utf8'), /^VITE_API_URL=\/api\s*$/);
  assert.ok(!cfg.env || !Object.hasOwn(cfg.env, 'VITE_API_URL'));
});
