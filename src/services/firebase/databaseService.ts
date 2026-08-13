import { 
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
  getDocs 
} from "firebase/firestore";
import { app } from "./firebaseConfig";
import { type Movie, type Series } from "../../types";

// Inicializa o Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// ============================================================================
// REFERÊNCIAS BASE
// ============================================================================
const userDoc = (uid: string) => doc(db, 'users', uid);
const moviesColl = (uid: string) => collection(db, 'users', uid, 'watchedMovies');
const seriesColl = (uid: string) => collection(db, 'users', uid, 'watchedSeries');

// ============================================================================
// SERVIÇOS DE USUÁRIO
// ============================================================================

export const ensureUserExists = async (uid: string, email: string, name: string): Promise<void> => {
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
    throw new Error(`Erro ao buscar usuário: ${e}`);
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
  const snap = await getDoc(userDoc(uid));
  const data = snap.data();

  if (snap.exists() && data?.availableYears) {
    const years = data.availableYears as number[];
    return years.sort((a, b) => a - b);
  }
  
  return [new Date().getFullYear()];
};

// ============================================================================
// LÓGICA DE LIMPEZA INTERNA
// ============================================================================

const cleanupYears = async (uid: string, year: number): Promise<void> => {
  const mQuery = query(moviesColl(uid), where('watchedYear', '==', year), limit(1));
  const sQuery = query(seriesColl(uid), where('watchedYear', '==', year), limit(1));

  const [moviesSnap, seriesSnap] = await Promise.all([getDocs(mQuery), getDocs(sQuery)]);

  if (moviesSnap.empty && seriesSnap.empty) {
    await updateDoc(userDoc(uid), {
      availableYears: arrayRemove(year)
    });
  }
};

// ============================================================================
// SERVIÇOS DE FILMES
// ============================================================================

export const addMovie = async (uid: string, movie: Movie): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const movieRef = doc(moviesColl(uid)); // Gera um ID automático
    
    // Removemos o id interno antes de salvar, se houver, ou apenas passamos o objeto
    const { id, ...movieData } = movie; 
    
    batch.set(movieRef, movieData);
    batch.update(userDoc(uid), {
      availableYears: arrayUnion(movie.watchedYear)
    });
    
    await batch.commit();
  } catch (e) {
    throw new Error(`Não foi possível salvar o filme: ${e}`);
  }
};

export const updateMovie = async (uid: string, movie: Movie, oldYear: number): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para atualização.");
  
  try {
    const batch = writeBatch(db);
    const movieRef = doc(moviesColl(uid), movie.id);
    const { id, ...movieData } = movie;

    batch.update(movieRef, movieData);
    batch.update(userDoc(uid), {
      availableYears: arrayUnion(movie.watchedYear)
    });

    await batch.commit();

    if (oldYear !== movie.watchedYear) {
      await cleanupYears(uid, oldYear);
    }
  } catch (e) {
    throw new Error(`Erro ao atualizar filme: ${e}`);
  }
};

export const deleteMovie = async (uid: string, movie: Movie): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para exclusão.");
  
  try {
    const batch = writeBatch(db);
    batch.delete(doc(moviesColl(uid), movie.id));
    await batch.commit();

    await cleanupYears(uid, movie.watchedYear);
  } catch (e) {
    throw new Error(`Erro ao excluir o filme: ${e}`);
  }
};

export const getMoviesByYear = async (uid: string, year: number): Promise<Movie[]> => {
  try {
    const q = query(
      moviesColl(uid), 
      where('watchedYear', '==', year), 
      orderBy('watchedDate', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
  } catch (e) {
    throw new Error(`Erro ao consultar filmes: ${e}`);
  }
};

// ============================================================================
// SERVIÇOS DE SÉRIES
// ============================================================================

export const addSeries = async (uid: string, series: Series): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const seriesRef = doc(seriesColl(uid));
    
    const { id, ...seriesData } = series;
    
    batch.set(seriesRef, seriesData);
    batch.update(userDoc(uid), {
      availableYears: arrayUnion(series.watchedYear)
    });
    
    await batch.commit();
  } catch (e) {
    throw new Error(`Não foi possível salvar a temporada: ${e}`);
  }
};

export const updateSeries = async (uid: string, series: Series, oldYear: number): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para atualização.");
  
  try {
    const batch = writeBatch(db);
    const seriesRef = doc(seriesColl(uid), series.id);
    const { id, ...seriesData } = series;

    batch.update(seriesRef, seriesData);
    batch.update(userDoc(uid), {
      availableYears: arrayUnion(series.watchedYear)
    });

    await batch.commit();

    if (oldYear !== series.watchedYear) {
      await cleanupYears(uid, oldYear);
    }
  } catch (e) {
    throw new Error(`Erro ao atualizar série: ${e}`);
  }
};

export const deleteSeries = async (uid: string, series: Series): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para exclusão.");
  
  try {
    const batch = writeBatch(db);
    batch.delete(doc(seriesColl(uid), series.id));
    await batch.commit();

    await cleanupYears(uid, series.watchedYear);
  } catch (e) {
    throw new Error(`Erro ao excluir a série: ${e}`);
  }
};

export const getSeriesByYear = async (uid: string, year: number): Promise<Series[]> => {
  try {
    const q = query(
      seriesColl(uid), 
      where('watchedYear', '==', year), 
      orderBy('watchedDate', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
  } catch (e) {
    throw new Error(`Erro ao consultar séries: ${e}`);
  }
};