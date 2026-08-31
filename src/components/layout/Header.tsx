import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Radio,
  Crosshair,
  Award,
  ChevronDown,
  LogOut,
  UserCog,
  User,
  BadgeCheck,
} from 'lucide-react';
import { useDatabase } from '../../services/store';
import { PerfilAcesso } from '../../types/database';

interface HeaderProps {
  activeModule?: string;
  onNavigateToOperadores?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeModule, onNavigateToOperadores }) => {
  const { currentOperador, currentPolicial, perfil, logout, canManageOperadores } = useDatabase();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getPerfilBadge = (p: PerfilAcesso) => {
    switch (p) {
      case 'Superuser':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'P4':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'Armeiro':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'Rádio':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      case 'Comandante':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/60';
    }
  };

  const getPerfilIcon = (p: PerfilAcesso) => {
    switch (p) {
      case 'Superuser':
        return <Shield className="w-3.5 h-3.5" />;
      case 'P4':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'Armeiro':
        return <Crosshair className="w-3.5 h-3.5" />;
      case 'Rádio':
        return <Radio className="w-3.5 h-3.5" />;
      case 'Comandante':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'OP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 sm:px-6 border-b border-slate-700 shadow-lg sticky top-0 z-40">
      {/* Left: 6BPM Bento Badge & Title */}
      <div className="flex items-center gap-3.5">
        <div className="bg-blue-600 px-2.5 py-1.5 rounded-md font-black text-sm text-white tracking-wider shadow-md flex items-center justify-center">
          6BPM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold leading-none tracking-tight text-white">SGC-6</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hidden sm:inline-block">
              Caicó / Seridó - RN
            </span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">
            Gestão e Cautela de Patrimônio • PMRN
          </p>
        </div>
      </div>

      {/* Right: Operator info, Role Switcher and Actions */}
      <div className="flex items-center gap-2.5">
        {/* RBAC Operator Profile Menu */}
        <div className="relative">
          <button
            id="btn-operador-menu"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">
                {currentPolicial.patente} {currentPolicial.nome_guerra}
              </p>
              <p className="text-[10px] text-blue-400 font-mono tracking-tight font-semibold">
                {perfil === 'P4' ? 'GESTOR LOGÍSTICO (P4)' : perfil === 'Comandante' ? 'COMANDO GERAL (LEITURA)' : perfil.toUpperCase()}
              </p>
            </div>
            <div className="h-9 w-9 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 text-xs font-bold text-slate-200 shadow-inner">
              {getInitials(currentPolicial.nome_guerra || currentPolicial.nome_completo)}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu for Session info & Actions */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operador Autenticado
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPerfilBadge(perfil)}`}>
                    {perfil}
                  </span>
                </div>
                <p className="text-xs font-bold text-white">
                  {currentPolicial.patente} {currentPolicial.nome_completo}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                  <span>Matrícula: {currentPolicial.matricula}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                  {currentOperador.email}
                </p>
              </div>

              {/* Management quick action */}
              {canManageOperadores && onNavigateToOperadores && (
                <div className="p-2 border-b border-slate-800">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateToOperadores();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-blue-400" />
                    <span>Gerenciar Operadores & Senhas</span>
                  </button>
                </div>
              )}

              {/* Logout Option */}
              <div className="p-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Encerrar Sessão (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Quick Logout Button */}
        <button
          id="btn-quick-logout"
          onClick={handleLogout}
          className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
          title="Encerrar Sessão Segura"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-semibold">Sair</span>
        </button>
      </div>
    </header>
  );
};
