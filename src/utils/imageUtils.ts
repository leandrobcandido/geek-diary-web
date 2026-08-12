export const getFullImageURL = (path: string | null | undefined, size: string = 'w500') => {
  if (!path) return null;
  
  // Troque o 'w500' hardcoded na sua URL pela variável ${size}
  return `https://image.tmdb.org/t/p/${size}${path}`;
};