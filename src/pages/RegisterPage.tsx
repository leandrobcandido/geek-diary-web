import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft } from 'lucide-react';

import { register } from '@/services/firebase/authService';
import { Button } from '@/components/ui/Button';

// Ajuste o caminho do logo se necessário
import logo from '@/assets/logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();

  // Estados dos campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de UI e Validação
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validação do Formulário (Espelhando a lógica do Flutter)
  const validateForm = () => {
    setError(null);
    if (!name.trim()) return "Insira seu nome completo.";
    if (!email.includes('@')) return "Insira um e-mail válido.";
    if (password.length < 6) return "A senha deve ter no mínimo 6 caracteres.";
    if (password !== confirmPassword) return "As senhas não coincidem.";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página padrão do <form>
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(name.trim(), email.trim(), password);
      // O Firebase Auth fará o login automático após o registro.
      // O App.tsx vai detectar o currentUser e redirecionar para a Home.
    } catch (err: any) {
      // Limpa o prefixo técnico da Exception (se houver) e exibe o erro
      const errorMessage = err.message || err.toString().replace('Error: ', '');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-app-bg text-app-text flex flex-col transition-colors duration-300">
      
      {/* CABEÇALHO TRANSPARENTE COM BOTÃO DE VOLTAR */}
      <header className="absolute top-0 left-0 w-full z-50 p-4">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer inline-flex items-center"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      {/* ÁREA CENTRAL DO FORMULÁRIO */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative z-10 pt-20">
        
        {/* LOGO E TÍTULO */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <img src={logo} alt="Geek Diary Logo" className="w-24 h-24 object-contain mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-black tracking-tight">Geek Diary</h1>
          <p className="text-app-text-muted mt-2">Crie sua conta para começar</p>
        </div>

        {/* MENSAGEM DE ERRO (Alternativa ao SnackBar) */}
        {error && (
          <div className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-red-500 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
          
          {/* NOME COMPLETO */}
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input 
              type="text" 
              placeholder="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-app-input pl-12 pr-4 py-4 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-base font-medium"
              required
            />
          </div>

          {/* E-MAIL */}
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input 
              type="email" 
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-app-input pl-12 pr-4 py-4 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-base font-medium"
              required
            />
          </div>

          {/* SENHA */}
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-app-input pl-12 pr-12 py-4 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-base font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* CONFIRMAR SENHA */}
          <div className="relative mb-2">
            <ShieldCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input 
              type={showConfirmPassword ? 'text' : 'password'} 
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-app-input pl-12 pr-12 py-4 rounded-xl border border-transparent focus:outline-none focus:border-app-primary transition-all text-base font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* BOTÃO DE CADASTRO */}
          <div className="mt-4">
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              Cadastrar
            </Button>
          </div>

        </form>

        {/* LINK PARA VOLTAR AO LOGIN */}
        <p className="mt-8 text-sm text-app-text-muted">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-bold text-app-primary hover:underline transition-all">
            Faça Login
          </Link>
        </p>

      </main>
    </div>
  );
}