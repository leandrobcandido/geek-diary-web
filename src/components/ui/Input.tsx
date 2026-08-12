import { type InputHTMLAttributes, useState, type ElementType } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ElementType;
}

export function Input({ icon: Icon, type, className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPasswordType = type === 'password';
  const currentType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon size={20} className="text-app-textMuted" />
        </div>
      )}
      
      <input
        type={currentType}
        {...props}
        className={`w-full bg-app-input ${Icon ? 'pl-12' : 'pl-4'} ${isPasswordType ? 'pr-12' : 'pr-4'} py-3.5 rounded-xl border border-transparent focus:outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary transition-all text-app-text placeholder-app-textMuted ${className}`}
      />
      
      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-app-textMuted hover:text-app-text transition-colors cursor-pointer"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}