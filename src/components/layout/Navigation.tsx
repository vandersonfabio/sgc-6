import React from 'react';
import {
  Crosshair,
  Radio,
  Truck,
  Monitor,
  PackageCheck,
  Users,
  FileSpreadsheet,
  Database,
  Building2,
  Boxes,
  Plus,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { ModuloTipo } from '../../types/database';
import { useDatabase } from '../../services/store';

export type TabId =
  | 'armas'
  | 'comunicacao'
  | 'viaturas'
  | 'informatica'
  | 'moveis'
  | 'catalogo'
  | 'efetivo'
  | 'operadores'
  | 'unidades'
  | 'auditoria'
  | 'supabase_sql';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onNovaCautela?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab, onNovaCautela }) => {
  const { canAccessModule, canManageEfetivo, canManageOperadores, canManageUnidades, isSuperuser } = useDatabase();

  interface NavItem {
    id: TabId;
    label: string;
    description: string;
    icon: React.ReactNode;
    isModule: boolean;
    moduleName?: ModuloTipo;
    superuserOnly?: boolean;
    manageOperadoresOnly?: boolean;
  }

  const allItems: NavItem[] = [
    {
      id: 'armas',
      label: 'Armas',
      description: 'Material bélico, coletes e munições',
      icon: <Crosshair className="w-3.5 h-3.5" />,
      isModule: true,
      moduleName: 'Armas',
    },
    {
      id: 'comunicacao',
      label: 'Comunicação',
      description: 'Rádios HTs, móveis e smartphones',
      icon: <Radio className="w-3.5 h-3.5" />,
      isModule: true,
      moduleName: 'Comunicação',
    },
    {
      id: 'viaturas',
      label: 'Viaturas',
      description: 'Camionetes, viaturas e motocicletas',
      icon: <Truck className="w-3.5 h-3.5" />,
      isModule: true,
      moduleName: 'Viaturas',
    },
    {
      id: 'informatica',
      label: 'Informática',
      description: 'Desktops, monitores, nobreaks e TI',
      icon: <Monitor className="w-3.5 h-3.5" />,
      isModule: true,
      moduleName: 'Informática',
    },
    {
      id: 'moveis',
      label: 'Móveis',
      description: 'Cofres, mesas, ar condicionado',
      icon: <PackageCheck className="w-3.5 h-3.5" />,
      isModule: true,
      moduleName: 'Móveis e Diversos',
    },
    {
      id: 'catalogo',
      label: 'Catálogo de Materiais',
      description: 'Modos de controle (Individual, Quantidade, Híbrido)',
      icon: <Boxes className="w-3.5 h-3.5 text-indigo-500" />,
      isModule: false,
    },
    {
      id: 'efetivo',
      label: 'Efetivo',
      description: 'Policiais militares do 6º BPM',
      icon: <Users className="w-3.5 h-3.5" />,
      isModule: false,
    },
    {
      id: 'operadores',
      label: 'Operadores (RBAC)',
      description: 'Contas, senhas e perfis de acesso militar',
      icon: <UserCog className="w-3.5 h-3.5 text-purple-600" />,
      isModule: false,
      manageOperadoresOnly: true,
    },
    {
      id: 'unidades',
      label: 'Unidades & Setores',
      description: 'Gestão de BPM, CPMs, DPMs e Seções (Superuser)',
      icon: <Building2 className="w-3.5 h-3.5 text-amber-500" />,
      isModule: false,
      superuserOnly: true,
    },
    {
      id: 'auditoria',
      label: 'Auditoria',
      description: 'Rastreabilidade com UUID de operadores',
      icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
      isModule: false,
    },
    {
      id: 'supabase_sql',
      label: 'Esquema SQL',
      description: 'DDL e Políticas RLS',
      icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
      isModule: false,
    },
  ];

  // Strictly filter items based on user's profile access
  const visibleItems = allItems.filter((item) => {
    if (item.manageOperadoresOnly) {
      return canManageOperadores;
    }
    if (item.superuserOnly) {
      return isSuperuser || canManageUnidades;
    }
    if (item.isModule && item.moduleName) {
      return canAccessModule(item.moduleName);
    }
    if (item.id === 'catalogo') {
      return isSuperuser || canManageUnidades || canManageEfetivo;
    }
    if (item.id === 'efetivo' || item.id === 'auditoria') {
      return canManageEfetivo;
    }
    if (item.id === 'supabase_sql') {
      return true;
    }
    return false;
  });

  return (
    <nav className="h-12 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm sticky top-16 z-30 flex items-center px-4 justify-between rounded-xl">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600 font-semibold'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <span className="text-[11px] font-mono font-medium text-slate-400 uppercase">
          6º BPM • Caicó
        </span>
      </div>
    </nav>
  );
};
