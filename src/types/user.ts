import type { Movie } from './movie';
import type { Series } from './series';

// ============================================================================
// INTERFACE (O esqueleto do Perfil do Usuário e seu Diário)
// ============================================================================
export interface User {
  uid: string;
  name: string;
  email: string;
  watchedMovies: Movie[];
  watchedSeries: Series[];
  
  // Dica: Com base no seu databaseService.ts anterior, sabemos que 
  // o usuário também salva o tema e os anos. Podemos deixá-los aqui como opcionais!
  themeId?: string;
  availableYears?: number[];
}