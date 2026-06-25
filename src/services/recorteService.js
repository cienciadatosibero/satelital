// recorteService.js
// ---------------------------------------------------------------------------
// Guarda los recortes de detección como archivos .jpg en disco (NO en MySQL).
// En la BD solo se almacena la ruta relativa (recorte_path).
//
//   uploads/recortes/<sesionId>/det_<fila>.jpg
//
// El navegador los pide por URL:  /uploads/recortes/<sesionId>/<archivo>.jpg
// (servida como estática en app.js)
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', 'uploads', 'recortes');

function carpetaSesion(sesionId) {
  const dir = path.join(RAIZ, String(sesionId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Guarda un recorte base64 a disco y devuelve su ruta relativa (web).
// indice: número incremental dentro de la sesión (para el nombre).
function guardarRecorte(sesionId, indice, base64) {
  if (!base64) return null;
  const limpio = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(limpio, 'base64');
  const nombre = `det_${String(indice).padStart(5, '0')}.jpg`;
  const dir = carpetaSesion(sesionId);
  fs.writeFileSync(path.join(dir, nombre), buffer);
  // ruta relativa servida por express.static
  return `/uploads/recortes/${sesionId}/${nombre}`;
}

// Guarda la imagen COMPLETA de un cuadrante/celda y devuelve su ruta web.
function guardarCelda(sesionId, fila, col, base64) {
  if (!base64) return null;
  const limpio = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(limpio, 'base64');
  const nombre = `celda_${fila}_${col}.jpg`;
  const dir = carpetaSesion(sesionId);
  fs.writeFileSync(path.join(dir, nombre), buffer);
  return `/uploads/recortes/${sesionId}/${nombre}`;
}

// Ruta absoluta en disco a partir de la ruta web guardada en la BD.
function rutaAbsoluta(rutaWeb) {
  if (!rutaWeb) return null;
  const rel = rutaWeb.replace(/^\/uploads\//, '');
  return path.join(__dirname, '..', '..', 'uploads', rel);
}

// Borra todos los recortes de una sesión (al eliminar la sesión).
function borrarSesion(sesionId) {
  const dir = path.join(RAIZ, String(sesionId));
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { guardarRecorte, guardarCelda, rutaAbsoluta, borrarSesion };
