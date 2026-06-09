import { ReactNode } from 'react';

interface GradientCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: 'blue' | 'gold' | 'green' | 'red' | 'purple';
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const gradients = {
  blue: 'from-[#1e3a8a] to-[#2563eb]',
  gold: 'from-[#C9A84C] to-[#d4b962]',
  green: 'from-[#16a34a] to-[#22c55e]',
  red: 'from-[#dc2626] to-[#ef4444]',
  purple: 'from-[#7c3aed] to-[#a78bfa]',
};

export function GradientCard({ title, value, icon, gradient, subtitle, action }: GradientCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
      
      {action && (
        <button
          onClick={action.onClick}
          className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/30"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
