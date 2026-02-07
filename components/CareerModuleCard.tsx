
import React from 'react';
import { CareerModule } from '../types';
import { Trash2, Briefcase, Award, Zap, BookOpen } from 'lucide-react';

interface Props {
  module: CareerModule;
  onDelete: (id: string) => void;
}

const IconMap = {
  experience: Briefcase,
  case_study: Award,
  skill: Zap,
  education: BookOpen
};

export const CareerModuleCard: React.FC<Props> = ({ module, onDelete }) => {
  const Icon = IconMap[module.type];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Icon size={18} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {module.type.replace('_', ' ')}
          </span>
        </div>
        <button 
          onClick={() => onDelete(module.id)}
          className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{module.title}</h3>
      <p className="text-xs font-medium text-blue-500 mb-2">{module.unit}</p>
      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
        {module.description}
      </p>
    </div>
  );
};
