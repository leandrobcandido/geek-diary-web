import { 
  getFirestore,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  collection, 
  getDoc, 
  setDoc, 
  updateDoc,
  writeBatch, 
  arrayUnion, 
  arrayRemove, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDocFromCache, // 🔥 NOVO: Busca direta do cache offline
  getDocsFromCache // 🔥 NOVO: Busca direta do cache offline
} from "firebase/firestore";
import { app } from "./firebaseConfig";
import { type Movie, type Series } from "../../types";

// export const db = initializeFirestore(app, {
//   localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
// });
export const db = getFirestore(app);

const userDoc = (uid: string) => doc(db, 'users', uid);
const moviesColl = (uid: string) => collection(db, 'users', uid, 'watchedMovies');
const seriesColl = (uid: string) => collection(db, 'users', uid, 'watchedSeries');

// ============================================================================
// SERVIÇOS DE USUÁRIO (Blindados contra rede lenta)
// ============================================================================

export const ensureUserExists = async (uid: string, email: string, name: string): Promise<void> => {
  try {
    const ref = userDoc(uid);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      await setDoc(ref, {
        name: name,
        email: email,
        availableYears: [new Date().getFullYear()],
        themeId: 'dark'
      }, { merge: true });
    }
  } catch (error) {
    // 🔥 MÁGICA: Se der erro de rede, apenas ignoramos em vez de travar o app inteiro!
    console.warn("Rede instável: Ignorando verificação de usuário no boot.", error);
  }
};

export const updateUserNameInDb = async (uid: string, newName: string): Promise<void> => {
  try {
    await updateDoc(userDoc(uid), { name: newName });
  } catch (e) {
    throw new Error(`Erro ao atualizar nome no banco: ${e}`);
  }
};

export const getUser = async (uid: string): Promise<Record<string, any>> => {
  try {
    const snap = await getDoc(userDoc(uid));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    try {
      const snapCache = await getDocFromCache(userDoc(uid));
      return snapCache.exists() ? snapCache.data() : {};
    } catch (cacheErr) {
      throw new Error(`Erro ao buscar usuário (Online e Cache falharam)`);
    }
  }
};

export const updateUserTheme = async (uid: string, themeId: string): Promise<void> => {
  try {
    await setDoc(userDoc(uid), { themeId }, { merge: true });
  } catch (e) {
    throw new Error(`Erro ao salvar tema: ${e}`);
  }
};

export const getAvailableYears = async (uid: string): Promise<number[]> => {
  const currentYear = new Date().getFullYear();
  
  try {
    const snap = await getDoc(userDoc(uid));
    
    if (snap.exists()) {
      const data = snap.data();
      const years = data?.availableYears; // Extrai com segurança
      
      // Se for um array válido e tiver itens
      if (Array.isArray(years) && years.length > 0) {
        return years.sort((a, b) => a - b);
      }
    }
  } catch (e) {
    console.warn("Falha na rede. Resgatando anos do cache offline...");
    try {
      const snapCache = await getDocFromCache(userDoc(uid));
      
      if (snapCache.exists()) {
        const data = snapCache.data();
        const years = data?.availableYears;
        
        if (Array.isArray(years) && years.length > 0) {
          return years.sort((a, b) => a - b);
        }
      }
    } catch (cacheErr) {
      console.warn("Cache inacessível para os anos.");
    }
  }
  
  return [currentYear];
};

// ============================================================================
// LÓGICA DE LIMPEZA INTERNA
// ============================================================================

const cleanupYears = async (uid: string, year: number): Promise<void> => {
  try {
    const mQuery = query(moviesColl(uid), where('watchedYear', '==', year), limit(1));
    const sQuery = query(seriesColl(uid), where('watchedYear', '==', year), limit(1));

    const [moviesSnap, seriesSnap] = await Promise.all([getDocs(mQuery), getDocs(sQuery)]);

    if (moviesSnap.empty && seriesSnap.empty) {
      await updateDoc(userDoc(uid), {
        availableYears: arrayRemove(year)
      });
    }
  } catch (e) {
    console.warn("Falha ao limpar anos não utilizados (tentará novamente depois).");
  }
};

// ============================================================================
// SERVIÇOS DE FILMES & SÉRIES (Blindados com Fallback Offline)
// ============================================================================
// As funções add/update/delete permanecem iguais pois dependem do Firestore resolver o sync offline sozinho.

export const addMovie = async (uid: string, movie: Movie): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const movieRef = doc(moviesColl(uid)); 
    const { id, ...movieData } = movie; 
    batch.set(movieRef, movieData);
    batch.update(userDoc(uid), { availableYears: arrayUnion(movie.watchedYear) });
    await batch.commit();
  } catch (e) { throw new Error(`Não foi possível salvar o filme: ${e}`); }
};

export const updateMovie = async (uid: string, movie: Movie, oldYear: number): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para atualização.");
  try {
    const batch = writeBatch(db);
    const movieRef = doc(moviesColl(uid), movie.id);
    const { id, ...movieData } = movie;
    batch.update(movieRef, movieData);
    batch.update(userDoc(uid), { availableYears: arrayUnion(movie.watchedYear) });
    await batch.commit();
    if (oldYear !== movie.watchedYear) await cleanupYears(uid, oldYear);
  } catch (e) { throw new Error(`Erro ao atualizar filme: ${e}`); }
};

export const deleteMovie = async (uid: string, movie: Movie): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para exclusão.");
  try {
    const batch = writeBatch(db);
    batch.delete(doc(moviesColl(uid), movie.id));
    await batch.commit();
    await cleanupYears(uid, movie.watchedYear);
  } catch (e) { throw new Error(`Erro ao excluir o filme: ${e}`); }
};

export const getMoviesByYear = async (uid: string, year: number): Promise<Movie[]> => {
  const q = query(moviesColl(uid), where('watchedYear', '==', year), orderBy('watchedDate', 'desc'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
  } catch (e) {
    console.warn(`Rede instável: Buscando filmes de ${year} no cache...`);
    try {
      const snapCache = await getDocsFromCache(q);
      return snapCache.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
    } catch (cacheErr) {
      return [];
    }
  }
};

export const addSeries = async (uid: string, series: Series): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const seriesRef = doc(seriesColl(uid));
    const { id, ...seriesData } = series;
    batch.set(seriesRef, seriesData);
    batch.update(userDoc(uid), { availableYears: arrayUnion(series.watchedYear) });
    await batch.commit();
  } catch (e) { throw new Error(`Não foi possível salvar a temporada: ${e}`); }
};

export const updateSeries = async (uid: string, series: Series, oldYear: number): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para atualização.");
  try {
    const batch = writeBatch(db);
    const seriesRef = doc(seriesColl(uid), series.id);
    const { id, ...seriesData } = series;
    batch.update(seriesRef, seriesData);
    batch.update(userDoc(uid), { availableYears: arrayUnion(series.watchedYear) });
    await batch.commit();
    if (oldYear !== series.watchedYear) await cleanupYears(uid, oldYear);
  } catch (e) { throw new Error(`Erro ao atualizar série: ${e}`); }
};

export const deleteSeries = async (uid: string, series: Series): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para exclusão.");
  try {
    const batch = writeBatch(db);
    batch.delete(doc(seriesColl(uid), series.id));
    await batch.commit();
    await cleanupYears(uid, series.watchedYear);
  } catch (e) { throw new Error(`Erro ao excluir a série: ${e}`); }
};

export const getSeriesByYear = async (uid: string, year: number): Promise<Series[]> => {
  const q = query(seriesColl(uid), where('watchedYear', '==', year), orderBy('watchedDate', 'desc'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
  } catch (e) {
    console.warn(`Rede instável: Buscando séries de ${year} no cache...`);
    try {
      const snapCache = await getDocsFromCache(q);
      return snapCache.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
    } catch (cacheErr) {
      return [];
    }
  }
};