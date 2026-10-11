import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverBaseApi, mensajeErrorLogin } from '../src/lib/apiConfig.js';

test('en desarrollo usa el proxy local cuando no hay URL', () => {
  assert.equal(resolverBaseApi(undefined, true), '/api');
});
test('en producción no apunta silenciosamente al dominio del frontend', () => {
  assert.equal(resolverBaseApi('', false), null);
});
test('agrega /api solo una vez a la URL publica', () => {
  assert.equal(resolverBaseApi('https://backend.example/'), 'https://backend.example/api');
  assert.equal(resolverBaseApi('https://backend.example/api'), 'https://backend.example/api');
  assert.equal(resolverBaseApi('https://backend.example/servicio/api/'), 'https://backend.example/servicio/api');
});
test('conserva /api cuando hay proxy explicito', () => {
  assert.equal(resolverBaseApi('/api'), '/api');
});
test('rechaza URL invalida o con credenciales', () => {
  assert.equal(resolverBaseApi('backend.example'), null);
  assert.equal(resolverBaseApi('https://usuario:password@backend.example'), null);
});
test('muestra la causa de un login 404', () => {
  assert.match(mensajeErrorLogin({ response: { status: 404 } }), /VITE_API_URL/);
  assert.match(mensajeErrorLogin({ code: 'API_NOT_CONFIGURED' }), /Vercel/);
});
