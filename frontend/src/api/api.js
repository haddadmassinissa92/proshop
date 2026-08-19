// Si VITE_API_URL n'est pas défini (ex: fichier .env manquant en prod),
// on retombe sur localhost pour le dev plutôt que de planter silencieusement
// toutes les requêtes avec une URL "undefined/api/...".
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    "[config] VITE_API_URL n'est pas défini — utilisation de la valeur par défaut :",
    API_URL
  );
}

export const getMediaUrl = (path) => {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanPath = path.replace('/public', '');

  return `${API_URL}${cleanPath}`;
};
