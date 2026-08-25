import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Navigation, TabId } from './components/layout/Navigation';
import { ArmasModule } from './components/modules/ArmasModule';
import { ComunicacaoModule } from './components/modules/ComunicacaoModule';
import { ViaturasModule } from './components/modules/ViaturasModule';
import { InformaticaModule } from './components/modules/InformaticaModule';
import { MoveisModule } from './components/modules/MoveisModule';
import { EfetivoView } from './components/views/EfetivoView';
import { OperadoresView } from './components/views/OperadoresView';
import { UnidadesView } from './components/views/UnidadesView';
import { CatalogoMateriaisView } from './components/views/CatalogoMateriaisView';
import { AuditoriaView } from './components/views/AuditoriaView';
import { SupabaseSqlView } from './components/views/SupabaseSqlView';
import { LoginView } from './components/auth/LoginView';
import { useDatabase } from './services/store';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { ModuloTipo } from './types/database';

export default function App() {
  const { isAuthenticated, currentOperator, canAccessModule, canManageOperadores, isSuperuser, canManageUnidades } = useDatabase();
  const [activeTab, setActiveTab] = useState<TabId>('armas');

  // Automatic adjustment if current operator doesn't have access to default 'armas' tab (e.g. Radio operator)
  useEffect(() => {
    if (currentOperator.tipo_perfil === 'Rádio' && activeTab === 'armas') {
      setActiveTab('comunicacao');
    }
    if (activeTab === 'unidades' && !isSuperuser && !canManageUnidades) {
      setActiveTab('armas');
    }
    if (activeTab === 'operadores' && !canManageOperadores) {
      setActiveTab('armas');
    }
  }, [currentOperator, activeTab, isSuperuser, canManageUnidades, canManageOperadores]);

  // If not authenticated, present the institutional Login view
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setActiveTab('armas')} />;
  }

  // Check if active tab is an asset module and verify access
  const isAssetModule = ['armas', 'comunicacao', 'viaturas', 'informatica', 'moveis'].includes(activeTab);
  let moduleName: ModuloTipo | null = null;
  if (activeTab === 'armas') moduleName = 'Armas';
  else if (activeTab === 'comunicacao') moduleName = 'Comunicação';
  else if (activeTab === 'viaturas') moduleName = 'Viaturas';
  else if (activeTab === 'informatica') moduleName = 'Informática';
  else if (activeTab === 'moveis') moduleName = 'Móveis e Diversos';

  const isUnidadesRestricted = activeTab === 'unidades' && !isSuperuser && !canManageUnidades;
  const isOperadoresRestricted = activeTab === 'operadores' && !canManageOperadores;
  const hasAccess = (!moduleName || canAccessModule(moduleName)) && !isUnidadesRestricted && !isOperadoresRestricted;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Institutional Top Header */}
      <Header onNavigateToOperadores={() => setActiveTab('operadores')} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col space-y-4">
        {/* Role-Aware Navigation Bar */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Dynamic Content View */}
        <main className="flex-1">
          {!hasAccess ? (
            /* Restricted Access Notice by RLS/RBAC */
            <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Acesso Restrito • Bloqueio RLS Supabase
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  O perfil atual <strong>({currentOperator.tipo_perfil})</strong> do operador{' '}
                  <strong>{currentOperator.policial.nome_guerra}</strong> não possui privilégios para acessar este menu.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (currentOperator.tipo_perfil === 'Rádio') setActiveTab('comunicacao');
                    else setActiveTab('armas');
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retornar ao Módulo Autorizado</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'armas' && <ArmasModule />}
              {activeTab === 'comunicacao' && <ComunicacaoModule />}
              {activeTab === 'viaturas' && <ViaturasModule />}
              {activeTab === 'informatica' && <InformaticaModule />}
              {activeTab === 'moveis' && <MoveisModule />}
              {activeTab === 'catalogo' && <CatalogoMateriaisView />}
              {activeTab === 'efetivo' && <EfetivoView />}
              {activeTab === 'operadores' && <OperadoresView />}
              {activeTab === 'unidades' && <UnidadesView />}
              {activeTab === 'auditoria' && <AuditoriaView />}
              {activeTab === 'supabase_sql' && <SupabaseSqlView />}
            </>
          )}
        </main>
      </div>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-[11px] text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SGC-6 • Sistema de Gestão e Cautela do 6º BPM</strong> • Polícia Militar do Rio Grande do Norte (PMRN)
          </div>
          <div className="text-slate-500 font-mono text-[10px]">
            Sede: Caicó/RN • Seridó Potiguar • Backend Supabase PostgreSQL + RLS
          </div>
        </div>
      </footer>
    </div>
  );
}
