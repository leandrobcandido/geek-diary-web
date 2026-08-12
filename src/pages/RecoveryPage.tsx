import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, LockKeyhole } from 'lucide-react';

import { sendPasswordReset } from '@/services/firebase/authService';
import { Button } from '@/components/ui/Button';

export default function RecoveryPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      setError("Informe um e-mail válido.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
      setEmail(''); // Limpa o campo após o sucesso
    } catch (err: any) {
      const errorMessage = err.message || err.toString().replace('Error: ', '');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300">
      
      {/* CABEÇALHO TRANSPARENTE */}
      <header className="absolute top-0 left-0 w-full z-50 p-4">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer inline-flex items-center"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative z-10 pt-20">
        
        {/* ÍCONE E TEXTOS */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <div className="w-20 h-20 bg-app-primary/10 rounded-full flex items-center justify-center mb-6">
            <LockKeyhole size={40} className="text-app-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Esqueceu sua senha?</h1>
          <p className="text-app-text-muted text-sm leading-relaxed">
            Insira o e-mail associado à sua conta e enviaremos um link para você redefinir sua senha.
          </p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* MENSAGEM DE SUCESSO */}
        {success && (
          <div className="w-full p-4 mb-6 bg-app-primary/10 border border-app-primary/50 rounded-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-app-primary text-center">
              Link de recuperação enviado! Verifique sua caixa de entrada (e a pasta de spam).
            </p>
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleRecovery} className="w-full flex flex-col gap-4">
          <div className="relative mb-2">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input 
              type="email" 
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              className="w-full bg-app-input pl-12 pr-4 py-4 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-sm font-medium disabled:opacity-50"
              required
            />
          </div>

          {!success ? (
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              Enviar Link
            </Button>
          ) : (
            <Button type="button" onClick={() => navigate('/login')} variant="outline">
              Voltar ao Login
            </Button>
          )}
        </form>

      </main>
    </div>
  );
}