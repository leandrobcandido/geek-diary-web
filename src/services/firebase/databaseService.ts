import { 
  getFirestore,
  doc, 
  collection, 
  getDoc, 
  setDoc, 
  updateDoc,
  arrayUnion, 
  arrayRemove, 
  query, 
  where,
  getDocs,
  getDocFromCache,
  getDocsFromCache,
  deleteDoc,
  deleteField
} from "firebase/firestore";
import { app } from "./firebaseConfig";
import { type Movie, type Series } from "../../types";

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Inicializa o Firestore de forma nativa e segura para qualquer navegador (incluindo iOS/Safari)
export const db = getFirestore(app);

const userDoc = (uid: string) => doc(db, 'users', uid);
const moviesColl = (uid: string) => collection(db, 'users', uid, 'watchedMovies');
const seriesColl = (uid: string) => collection(db, 'users', uid, 'watchedSeries');

// ============================================================================
// SERVIÇOS DE USUÁRIO
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
      const years = data?.availableYears; 
      
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
// LÓGICA DE SINCRONIZAÇÃO E AGREGAÇÃO (O CORAÇÃO DA HOMEPAGE)
// ============================================================================

const syncYearSummary = async (uid: string, year: number): Promise<void> => {
  const mQuery = query(moviesColl(uid), where('watchedYear', '==', year));
  const sQuery = query(seriesColl(uid), where('watchedYear', '==', year));

  const [mSnap, sSnap] = await Promise.all([getDocs(mQuery), getDocs(sQuery)]);

  const updates: Record<string, any> = {};

  const processSnap = (snap: any, type: 'Movies' | 'Series') => {
    if (snap.empty) {
      updates[`summary${type}.${year}`] = deleteField();
      return false;
    }

    let count = 0;
    let totalRating = 0;
    let ratedCount = 0;
    let latestDate = "";
    let latestBackdrop = null;

    snap.forEach((docSnap: any) => {
      const data = docSnap.data();
      count++;
      
      if (typeof data.userRating === 'number' && data.userRating > 0) {
        totalRating += data.userRating;
        ratedCount++;
      }
      
      const currentDate = data.watchedDate || "";
      if (currentDate >= latestDate) { 
        latestDate = currentDate;
        if (data.backdropPath) latestBackdrop = data.backdropPath;
      }
    });

    updates[`summary${type}.${year}`] = {
      count,
      avgRating: ratedCount > 0 ? Number((totalRating / ratedCount).toFixed(1)) : 0,
      lastWatchedDate: latestDate || null,
      backdropPath: latestBackdrop
    };
    return true;
  };

  const hasMovies = processSnap(mSnap, 'Movies');
  const hasSeries = processSnap(sSnap, 'Series');

  if (!hasMovies && !hasSeries) {
    updates.availableYears = arrayRemove(year);
  } else {
    updates.availableYears = arrayUnion(year);
  }

  await updateDoc(userDoc(uid), updates);
};

// ============================================================================
// SERVIÇOS DE FILMES
// ============================================================================

export const addMovie = async (uid: string, movie: Movie): Promise<void> => {
  try {
    const movieRef = doc(moviesColl(uid)); 
    const { id, ...movieData } = movie; 
    await setDoc(movieRef, movieData);
    await syncYearSummary(uid, movie.watchedYear);
  } catch (e) { throw new Error(`Não foi possível salvar o filme: ${e}`); }
};

export const updateMovie = async (uid: string, movie: Movie, oldYear: number): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para atualização.");
  try {
    const movieRef = doc(moviesColl(uid), movie.id);
    const { id, ...movieData } = movie;
    await updateDoc(movieRef, movieData);
    await syncYearSummary(uid, movie.watchedYear);
    
    if (oldYear !== movie.watchedYear) await syncYearSummary(uid, oldYear);
  } catch (e) { throw new Error(`Erro ao atualizar filme: ${e}`); }
};

export const deleteMovie = async (uid: string, movie: Movie): Promise<void> => {
  if (!movie.id) throw new Error("ID do filme é obrigatório para exclusão.");
  try {
    await deleteDoc(doc(moviesColl(uid), movie.id));
    await syncYearSummary(uid, movie.watchedYear);
  } catch (e) { throw new Error(`Erro ao excluir o filme: ${e}`); }
};

export const getMoviesByYear = async (uid: string, year: number): Promise<Movie[]> => {
  const q = query(moviesColl(uid), where('watchedYear', '==', year));
  
  try {
    const snap = await getDocs(q);
    const movies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
    
    return movies.sort((a, b) => {
      const dateA = a.watchedDate ? new Date(a.watchedDate).getTime() : 0;
      const dateB = b.watchedDate ? new Date(b.watchedDate).getTime() : 0;
      return dateB - dateA;
    });
  } catch (e) {
    console.warn(`Rede instável: Buscando filmes de ${year} no cache...`);
    try {
      const snapCache = await getDocsFromCache(q);
      const movies = snapCache.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));
      return movies.sort((a, b) => {
        const dateA = a.watchedDate ? new Date(a.watchedDate).getTime() : 0;
        const dateB = b.watchedDate ? new Date(b.watchedDate).getTime() : 0;
        return dateB - dateA;
      });
    } catch (cacheErr) {
      return [];
    }
  }
};

// ============================================================================
// SERVIÇOS DE SÉRIES
// ============================================================================

export const addSeries = async (uid: string, series: Series): Promise<void> => {
  try {
    const seriesRef = doc(seriesColl(uid));
    const { id, ...seriesData } = series;
    await setDoc(seriesRef, seriesData);
    await syncYearSummary(uid, series.watchedYear);
  } catch (e) { throw new Error(`Não foi possível salvar a série: ${e}`); }
};

export const updateSeries = async (uid: string, series: Series, oldYear: number): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para atualização.");
  try {
    const seriesRef = doc(seriesColl(uid), series.id);
    const { id, ...seriesData } = series;
    await updateDoc(seriesRef, seriesData);
    await syncYearSummary(uid, series.watchedYear);
    
    if (oldYear !== series.watchedYear) await syncYearSummary(uid, oldYear);
  } catch (e) { throw new Error(`Erro ao atualizar série: ${e}`); }
};

export const deleteSeries = async (uid: string, series: Series): Promise<void> => {
  if (!series.id) throw new Error("ID da série é obrigatório para exclusão.");
  try {
    await deleteDoc(doc(seriesColl(uid), series.id));
    await syncYearSummary(uid, series.watchedYear);
  } catch (e) { throw new Error(`Erro ao excluir a série: ${e}`); }
};

export const getSeriesByYear = async (uid: string, year: number): Promise<Series[]> => {
  const q = query(seriesColl(uid), where('watchedYear', '==', year));
  
  try {
    const snap = await getDocs(q);
    const series = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
    
    return series.sort((a, b) => {
      const dateA = a.watchedDate ? new Date(a.watchedDate).getTime() : 0;
      const dateB = b.watchedDate ? new Date(b.watchedDate).getTime() : 0;
      return dateB - dateA;
    });
  } catch (e) {
    console.warn(`Rede instável: Buscando séries de ${year} no cache...`);
    try {
      const snapCache = await getDocsFromCache(q);
      const series = snapCache.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
      return series.sort((a, b) => {
        const dateA = a.watchedDate ? new Date(a.watchedDate).getTime() : 0;
        const dateB = b.watchedDate ? new Date(b.watchedDate).getTime() : 0;
        return dateB - dateA;
      });
    } catch (cacheErr) {
      return [];
    }
  }
};