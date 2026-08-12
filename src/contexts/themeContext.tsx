import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './authContext';
import { getUser, updateUserTheme } from '@/services/firebase/databaseService';

interface ThemeContextType {
  currentTheme: string;
  changeTheme: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  // Inicia lendo do cache local (rápido, evita piscar tela branca)
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('themeId') || 'dark';
  });

  // A MÁGICA: Sempre que o estado muda, injeta o atributo na tag <html> nativa
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('themeId', currentTheme);
  }, [currentTheme]);

  // Quando o usuário loga, busca o tema definitivo salvo no Firestore
  useEffect(() => {
    if (currentUser) {
      getUser(currentUser.uid).then(userData => {
        if (userData.themeId && userData.themeId !== currentTheme) {
          setCurrentTheme(userData.themeId);
        }
      });
    }
  }, [currentUser]);

  // Função disparada pelos botões na SettingsPage
  const changeTheme = async (themeId: string) => {
    setCurrentTheme(themeId); // Atualiza a UI imediatamente
    if (currentUser) {
      await updateUserTheme(currentUser.uid, themeId); // Salva no banco no background
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);