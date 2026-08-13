import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, Palette, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/contexts/authContext';
import { useTheme } from '@/contexts/themeContext'; // <-- Usa o novo Hook
import { getUser } from '@/services/firebase/databaseService';
import { updateUserName } from '@/services/firebase/authService';

import { Button } from '@/components/ui/Button';

// Mock visual exato das cores configuradas no CSS para montar os Cards
const availableThemes = [
  { id: 'dark', name: 'DARK', surface: '#031A2B', primary: '#009688', secondary: '#02121E' },
  { id: 'light', name: 'LIGHT', surface: '#ffffff', primary: '#009688', secondary: '#F3F4F6' },
  { id: 'matrix', name: 'MATRIX', surface: '#000000', primary: '#848482', secondary: '#00FF41' },
  { id: 'barbie', name: 'BARBIE', surface: '#FCE4EC', primary: '#00B4D8', secondary: '#E91E63' },
  { id: 'killbill', name: 'KILL BILL', surface: '#1A1A1A', primary: '#8B0000', secondary: '#FFD700' },
  { id: 'bladerunner', name: 'BLADE RUNNER', surface: '#0D1117', primary: '#FF8C00', secondary: '#00CED1' },
  { id: 'grandbudapest', name: 'BUDAPEST', surface: '#F4A7B9', primary: '#673AB7', secondary: '#E89EAE' },
  { id: 'batman', name: 'THE BATMAN', surface: '#000000', primary: '#E61919', secondary: '#1A1A1A' },
  { id: 'amelie', name: 'AMÉLIE', surface: '#F5E6CA', primary: '#1B4D3E', secondary: '#850606' },
  { id: '2001', name: '2001', surface: '#ffffff', primary: '#D32F2F', secondary: '#000000' },
];

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { currentTheme, changeTheme } = useTheme(); // <-- Consome o tema global
  const navigate = useNavigate();

  const [originalName, setOriginalName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!currentUser) return;
      try {
        const userData = await getUser(currentUser.uid);
        const fetchedName = userData.name || currentUser.name || '';
        setOriginalName(fetchedName);
        setNameInput(fetchedName);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, [currentUser]);

  const canSaveName = nameInput.trim().length > 0 && nameInput.trim() !== originalName;

  const handleSaveName = async () => {
    if (!currentUser || !canSaveName) return;
    setIsSavingName(true);
    
    try {
      await updateUserName(nameInput.trim());
      setOriginalName(nameInput.trim());
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o perfil.");
    } finally {
      setIsSavingName(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300">
      
      <header className="bg-app-secondary sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Configurações</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-10">
        
        {/* NOME */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-app-text">
            <UserIcon size={20} className="text-app-primary" />
            <h2 className="text-xl font-bold">Informações Pessoais</h2>
          </div>
          <div className="bg-app-secondary p-6 rounded-2xl flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-app-text-muted mb-2 pl-1">Nome de exibição</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canSaveName) handleSaveName(); }}
                  className="w-full bg-app-input pl-11 pr-4 py-3.5 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all font-medium text-base"
                />
              </div>
            </div>
            <Button disabled={!canSaveName} isLoading={isSavingName} onClick={handleSaveName}>
              Salvar Alterações
            </Button>
          </div>
        </section>

        {/* TEMAS */}
        <section className="flex flex-col gap-4 pb-12">
          <div className="flex items-center justify-between text-app-text">
            <div className="flex items-center gap-2">
              <Palette size={20} className="text-app-primary" />
              <h2 className="text-xl font-bold">Aparência</h2>
            </div>
          </div>
          <p className="text-sm text-app-text-muted px-1 -mt-2">
            As alterações são aplicadas instantaneamente.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {availableThemes.map((theme) => {
              const isSelected = currentTheme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme.id)} // <-- Chama o provider!
                  className={`relative flex flex-col items-center justify-center h-28 rounded-2xl transition-all cursor-pointer border-2 overflow-hidden
                    ${isSelected 
                      ? 'border-app-primary shadow-[0_4px_15px_rgba(0,0,0,0.1)] scale-[1.02] ring-2 ring-app-primary/20' 
                      : 'border-transparent hover:border-app-text-muted/30'
                    }
                  `}
                  style={{ backgroundColor: theme.surface }}
                >
                  <span 
                    className="font-black tracking-widest text-sm mb-3 z-10 drop-shadow-md"
                    style={{ color: isSelected ? theme.primary : theme.secondary }}
                  >
                    {theme.name}
                  </span>
                  
                  <div className="flex gap-2 z-10">
                    <div className="w-8 h-2 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }}></div>
                    <div className="w-8 h-2 rounded-full shadow-sm" style={{ backgroundColor: theme.secondary }}></div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 text-app-primary animate-in zoom-in duration-200">
                      <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}