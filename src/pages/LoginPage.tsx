import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

import { login } from '@/services/firebase/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import logo from '@/assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (errorMsg) setErrorMsg('');
  };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      return setErrorMsg("Informe um e-mail válido.");
    }

    if (password.length < 6) {
      return setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error: any) {
      setErrorMsg(error.message?.replace('Error: ', '') || "Falha ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-app-bg text-app-text py-12 transition-colors duration-300">      
      <div className="w-full max-w-md bg-app-surface rounded-2xl p-8 sm:p-10 flex flex-col items-center">
        
        <img src={logo} alt="Geek Diary Logo" className="w-24 h-24 object-contain" />
        <h1 className="text-3xl font-bold mb-8">Geek Diary</h1>

        <form onSubmit={handleLogin} className="w-full space-y-4 flex flex-col">
          
          <Input
            type="email"
            placeholder="E-mail"
            icon={Mail}
            value={email}
            onChange={handleInputChange(setEmail)}
            required
          />

          <Input
            type="password"
            placeholder="Senha"
            icon={Lock}
            value={password}
            onChange={handleInputChange(setPassword)}
            required
          />

          {errorMsg && (
            <p className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2 rounded-lg animate-in fade-in">
              {errorMsg}
            </p>
          )}

          <Button type="submit" isLoading={isLoading}>
            Entrar
          </Button>
          
        </form>

        <div className="mt-8 flex flex-col items-center space-y-4">
          <Link 
            to="/recovery" 
            className="text-app-textMuted hover:text-app-text transition-colors text-sm font-medium"
          >
            Esqueci minha senha
          </Link>

          <div className="flex items-center text-sm">
            <span className="text-app-textMuted mr-1">Não tem uma conta?</span>
            <Link 
              to="/register" 
              className="text-app-primary font-bold hover:underline"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}