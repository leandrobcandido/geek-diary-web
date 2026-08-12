// ============================================================================
// INTERFACE UNIFICADA PARA LISTAGEM
// Atua como um "Adaptador" (Adapter Pattern), transformando objetos de 
// Filmes e Séries em um formato único e previsível para a tela de lista.
// ============================================================================

export interface MediaListItem<T = any> {
  /** Identificador único da mídia (geralmente o ID em string) */
  id: string;
  
  /** Título formatado para exibição principal (Nome da Série ou Título do Filme) */
  title: string;
  
  /** Título original no idioma de origem (opcional) */
  originalTitle?: string | null;
  
  /** Caminho do poster no TMDB (usado para montar a URL da imagem) */
  posterPath?: string | null;
  
  /** Data em que o usuário assistiu à mídia (convertida para objeto Date) */
  watchedDate: Date;
  
  /** Nota dada pelo usuário (de 0 a 10) */
  userRating: number;
  
  /** 
   * Guarda o objeto original (Movie ou Series) do banco de dados.
   * Ele é transportado "por baixo dos panos" para ser enviado à 
   * tela de Detalhes quando o usuário clicar no item.
   */
  rawItem: T;
}