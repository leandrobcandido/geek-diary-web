import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase/authService";
import { type User } from "../types";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O Firebase monitora a mudança de estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Aqui você poderia buscar os dados completos do seu User no Firestore
        // Por enquanto, mapeamos o básico do Firebase para o nosso modelo
        setCurrentUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Usuário",
          email: firebaseUser.email || "",
          watchedMovies: [],
          watchedSeries: [],
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Limpa o listener ao desmontar
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para facilitar o acesso em qualquer componente
export const useAuth = () => useContext(AuthContext);