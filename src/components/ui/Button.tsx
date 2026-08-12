import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline'; // <-- Tipagem das variantes
  children: ReactNode;
}

export function Button({ 
  isLoading, 
  variant = 'primary', // 'primary' é o padrão se nada for passado
  children, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  
  // Dicionário de estilos para cada variante
  const variantStyles = {
    primary: 'bg-app-primary text-app-onPrimary hover:opacity-90',
    ghost: 'bg-transparent text-app-primary hover:bg-app-primary/10',
    outline: 'bg-transparent text-app-primary border border-app-primary hover:bg-app-primary/10',
  };

  // Cor do spinner de carregamento muda de acordo com o fundo
  const spinnerColor = variant === 'primary' ? 'border-app-onPrimary' : 'border-app-primary';

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      // Mesclamos as classes estruturais fixas com as classes da variante escolhida
      className={`w-full py-3.5 rounded-full font-bold text-lg transition-all disabled:opacity-50 mt-4 flex items-center justify-center min-h-14 cursor-pointer ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? (
        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${spinnerColor}`} />
      ) : (
        children
      )}
    </button>
  );
}