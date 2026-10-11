import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/pages/Scan.jsx', import.meta.url), 'utf8');

test('el escáner no usa la variable eliminada CONF_FIJA', () => {
  assert.doesNotMatch(src, /\bCONF_FIJA\b/);
});

test('el indicador usa la confianza seleccionada', () => {
  assert.match(src, /const \[confianza, setConfianza\] = useState\(CONF_INICIAL\)/);
  assert.match(src, /Math\.round\(confianza \* 100\)/);
});
