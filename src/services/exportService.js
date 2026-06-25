const archiver = require('archiver');
const sharp = require('sharp');
const fs = require('fs');
const { rutaAbsoluta } = require('./recorteService');

// Tamaño uniforme de salida para TODAS las imágenes del dataset.
const SALIDA_PX = 600;

// Construye un ZIP de dataset YOLO. Cada imagen es una FOTO NÍTIDA centrada en
// un panel detectado, a 600x600 px, con su etiqueta (el panel queda al centro).
//
//   dataset/
//     images/        foto centrada de cada panel confirmado (600x600 jpg)
//     labels/        .txt YOLO por imagen (class_id cx cy w h, normalizado)
//     classes.txt    índice -> nombre de clase
//     coordenadas.csv  id, clase, confianza, lat, lng, archivo
//     README.txt
async function construirZipDataset(res, { detecciones, nombreSesion, modeloNombre }) {
  const clases = [];
  const claseId = (nombre) => {
    let i = clases.indexOf(nombre);
    if (i === -1) {
      clases.push(nombre);
      i = clases.length - 1;
    }
    return i;
  };

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    throw err;
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="dataset_${Date.now()}.zip"`);
  archive.pipe(res);

  const filasCsv = ['id,clase,confianza,lat,lng,archivo'];

  for (const d of detecciones) {
    const rutaAbs = rutaAbsoluta(d.recorte_path);
    if (!rutaAbs || !fs.existsSync(rutaAbs)) continue;

    const nombreBase = `panel_${String(d.id).padStart(5, '0')}`;
    const id = claseId(d.clase);

    // Foto centrada redimensionada a 600x600 (sin deformar, ya es cuadrada)
    const meta = await sharp(rutaAbs).metadata();
    const buffer600 = await sharp(rutaAbs)
      .resize(SALIDA_PX, SALIDA_PX, { fit: 'fill' })
      .jpeg({ quality: 90 })
      .toBuffer();
    archive.append(buffer600, { name: `dataset/images/${nombreBase}.jpg` });

    // Etiqueta YOLO: el panel está centrado en la foto. Tamaño de caja
    // proporcional al tamaño original de la imagen capturada.
    const w = meta.width ? Math.min(1, d.bbox_w / meta.width) : 0.3;
    const h = meta.height ? Math.min(1, d.bbox_h / meta.height) : 0.3;
    const labelLine = `${id} 0.500000 0.500000 ${w.toFixed(6)} ${h.toFixed(6)}`;
    archive.append(labelLine + '\n', { name: `dataset/labels/${nombreBase}.txt` });

    filasCsv.push(
      `${d.id},${d.clase},${Number(d.confianza).toFixed(4)},${d.lat},${d.lng},${nombreBase}.jpg`
    );
  }

  archive.append(clases.join('\n') + '\n', { name: 'dataset/classes.txt' });
  archive.append(filasCsv.join('\n') + '\n', { name: 'dataset/coordenadas.csv' });

  const readme = [
    'DATASET SATELITAL YOLO',
    '======================',
    `Sesion: ${nombreSesion || 'sin nombre'}`,
    `Modelo: ${modeloNombre || 'desconocido'}`,
    `Paneles confirmados: ${detecciones.length}`,
    `Clases: ${clases.join(', ') || 'ninguna'}`,
    `Tamano de imagen: ${SALIDA_PX}x${SALIDA_PX} px`,
    '',
    'Cada imagen es una foto NITIDA centrada en un panel detectado (zoom alto).',
    'Estructura (lista para reentrenar):',
    '  images/   Foto 600x600 centrada en el panel.',
    '  labels/   .txt YOLO (class_id cx cy w h). El panel esta al centro.',
    '  classes.txt      Indice de clases.',
    '  coordenadas.csv  Coordenadas geograficas de cada panel.',
  ].join('\n');
  archive.append(readme, { name: 'dataset/README.txt' });

  await archive.finalize();
}

module.exports = { construirZipDataset };
