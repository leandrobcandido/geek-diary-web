import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // Espera formato YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS_OF_WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Trata a data inicial com segurança
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o calendário se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincroniza a visualização se o valor mudar externamente
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  // Cálculos do Calendário
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const selectedDateString = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    onChange(selectedDateString);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Selecionar data';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return 'Selecionar data';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Montagem da grade de dias
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const parsedValueDate = value ? new Date(value + 'T12:00:00') : null;
  const isSelectedDay = (day: number) => {
    return parsedValueDate && 
      parsedValueDate.getDate() === day && 
      parsedValueDate.getMonth() === currentMonth && 
      parsedValueDate.getFullYear() === currentYear;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão de Disparo (Substitui o Input original) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-app-input text-app-text px-4 py-3.5 rounded-xl outline-none flex items-center justify-between transition-all border border-transparent hover:border-white/5 cursor-pointer text-left font-medium shadow-sm"
      >
        <span>{formatDisplayDate(value)}</span>
        <Calendar size={18} className="text-app-text-muted" />
      </button>

      {/* Painel do Calendário Flutuante */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-50 bg-app-surface border border-app-input rounded-2xl p-4 shadow-2xl w-full max-w-[320px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          
          {/* Cabeçalho do Calendário */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1.5 text-app-text-muted hover:text-app-text hover:bg-app-input rounded-lg transition-colors cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            
            <span className="font-bold text-sm text-app-text">
              {MONTHS[currentMonth]} de {currentYear}
            </span>
            
            <button onClick={handleNextMonth} className="p-1.5 text-app-text-muted hover:text-app-text hover:bg-app-input rounded-lg transition-colors cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((day, idx) => (
              <span key={idx} className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted/60 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Grade de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;
              
              const active = isSelectedDay(day);
              
              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={(e) => handleDayClick(day, e)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center h-9 w-9 mx-auto
                    ${active 
                      ? 'bg-app-primary text-white shadow-md shadow-app-primary/20 scale-105' 
                      : 'text-app-text hover:bg-app-input hover:text-app-primary'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}