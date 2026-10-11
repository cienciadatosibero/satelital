/**
 * Dev: Vite sirve /api mediante su proxy a localhost:3000.
 * Producción: VITE_API_URL=/api funciona con el proxy de vercel.json.
 * También se aceptan URLs completas si se despliega sin proxy.
 */
export function resolverBaseApi(configurada, desarrollo = false) {
  const valor = String(configurada ?? '').trim();
  if (!valor) return desarrollo ? '/api' : null;

  // Admitimos /api solo si el servidor tiene un proxy real para ese prefijo.
  if (valor.startsWith('/') && !valor.startsWith('//')) {
    return valor.replace(/\/+$/, '') || null;
  }

  try {
    const url = new URL(valor);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      return null;
    }
    const ruta = url.pathname.replace(/\/+$/, '');
    url.pathname = ruta.endsWith('/api') ? ruta : `${ruta}/api`;
    return url.href.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function mensajeErrorLogin(error) {
  if (error?.code === 'API_NOT_CONFIGURED') {
    return 'El servidor de acceso no está configurado. Configura VITE_API_URL en Vercel con la URL real de tu API y vuelve a desplegar el frontend.';
  }
  const status = error?.response?.status;
  if (status === 401) return 'Usuario o contraseña incorrectos.';
  if (status === 404) {
    return 'No se encontró la ruta de inicio de sesión en el servidor. Revisa VITE_API_URL y el despliegue del backend.';
  }
  if (status === 403) return 'Tu usuario no tiene permiso para acceder.';
  if (status >= 500) return 'El servidor de acceso presenta un problema. Revisa los registros del backend.';
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
    return 'No fue posible conectar con la API. Comprueba su dirección, disponibilidad y configuración CORS.';
  }
  return error?.response?.data?.message || error?.message || 'No se pudo iniciar sesión.';
}
