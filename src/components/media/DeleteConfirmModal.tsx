import { useState, useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  itemName: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting, itemName }: DeleteConfirmModalProps) {
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteInput, setDeleteInput] = useState('');

  // Gera um novo código sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setDeleteCode(Math.floor(1000 + Math.random() * 9000).toString());
      setDeleteInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-app-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-app-input flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-2">Excluir {itemName}?</h3>
        <p className="text-app-text-muted text-sm mb-6">
          Esta ação não pode ser desfeita. Digite o código abaixo para confirmar:
        </p>
        
        <span className="text-3xl font-black text-red-500 tracking-[0.5em] mb-4 pl-2 drop-shadow-sm">
          {deleteCode}
        </span>
        
        <input 
          type="text"
          maxLength={4}
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value.replace(/\D/g, ''))}
          className="bg-app-input text-center text-2xl font-bold tracking-[0.5em] pl-2 w-full max-w-50 py-3 rounded-xl mb-8 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all border border-transparent"
          placeholder="0000"
          autoFocus
        />
        
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-3 font-bold text-app-text bg-app-input hover:bg-app-input/80 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={deleteInput !== deleteCode || isDeleting}
            className="flex-1 py-3 font-bold text-white bg-red-500 disabled:opacity-30 disabled:hover:bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer flex justify-center items-center"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Excluir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}