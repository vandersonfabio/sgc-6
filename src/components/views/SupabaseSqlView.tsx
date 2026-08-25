import React, { useState, useEffect } from 'react';
import {
  supabaseSqlScript,
  rlsPoliciesSqlScript,
  disableRlsSqlScript,
  enableSecureRlsAndRealtimeSqlScript,
} from '../../services/supabaseSchemaSql';
import {
  Database,
  Copy,
  Check,
  Shield,
  FileCode,
  Layers,
  Terminal,
  ExternalLink,
  Server,
  Link,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Key,
  Globe,
  Radio,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Crosshair,
  Users,
  Building,
  CheckCircle,
  Unlock,
  AlertTriangle,
  Zap,
  UserCheck,
} from 'lucide-react';
import {
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabaseClient';
import { useDatabase } from '../../services/store';
import { TableStats, runSupabaseFullDiagnostics, FullDiagnosticReport } from '../../services/supabaseSync';

export const SupabaseSqlView: React.FC = () => {
  const { db, syncStatus, syncAllToSupabase, pullAllFromSupabase, getSupabaseTableStats } = useDatabase();
  const [activeSubTab, setActiveSubTab] = useState<'conn' | 'sync' | 'diag' | 'secure_rls' | 'unlock' | 'ddl' | 'guide'>('diag');
  const [copied, setCopied] = useState(false);

  // Connection settings state
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [activeConfig, setActiveConfig] = useState(getActiveSupabaseConfig());

  // Diagnostic state
  const [diagReport, setDiagReport] = useState<FullDiagnosticReport | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  // Sync operations state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [tableStats, setTableStats] = useState<TableStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const active = getActiveSupabaseConfig();
    setActiveConfig(active);
    if (active.config) {
      setUrlInput(active.config.url);
      setKeyInput(active.config.anonKey);
      fetchStats();
      handleRunDiagnostics();
    }
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    const report = await runSupabaseFullDiagnostics();
    setDiagReport(report);
    setIsRunningDiag(false);
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    const res = await getSupabaseTableStats();
    setIsLoadingStats(false);
    if (res.success && res.stats) {
      setTableStats(res.stats);
    }
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    setIsTesting(true);

    const res = await testSupabaseConnection(urlInput, keyInput);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveCustomSupabaseConfig(urlInput, keyInput);
      setActiveConfig(getActiveSupabaseConfig());
      fetchStats();
    }
  };

  const handleClear = () => {
    clearCustomSupabaseConfig();
    setUrlInput('');
    setKeyInput('');
    setTestResult(null);
    setTableStats(null);
    setActiveConfig(getActiveSupabaseConfig());
  };

  const handlePushAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncAllToSupabase();
    setIsSyncing(false);
    setSyncFeedback(res);
    fetchStats();
  };

  const handlePullAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await pullAllFromSupabase();
    setIsSyncing(false);
    setSyncFeedback(res);
    fetchStats();
  };

  const currentScript =
    activeSubTab === 'ddl'
      ? supabaseSqlScript
      : activeSubTab === 'secure_rls'
      ? enableSecureRlsAndRealtimeSqlScript
      : activeSubTab === 'unlock'
      ? disableRlsSqlScript
      : enableSecureRlsAndRealtimeSqlScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Realtime & RLS Status Alert */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800 flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              <span>Sincronização Bidirecional em Tempo Real (WebSockets)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Ativo
              </span>
            </div>
            <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
              O sistema agora escuta alterações no banco de dados Supabase via WebSockets. Quando você ou outro armeiro alterar dados no Supabase, a interface atualiza instantaneamente sem necessidade de recarregar a página.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveSubTab('secure_rls')}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 whitespace-nowrap shadow-xs transition"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Blindar RLS & Realtime</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Integração Supabase & Banco PostgreSQL
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  activeConfig.config
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {activeConfig.config ? 'Supabase Conectado' : 'Modo Standalone / Cache Local'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Conexão em nuvem, persistência relacional de armas, migrações DDL e sincronização do 6º BPM
            </p>
          </div>
        </div>

        {activeSubTab !== 'conn' && activeSubTab !== 'guide' && activeSubTab !== 'sync' && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition focus:ring-2 focus:ring-emerald-500"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveSubTab('diag')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'diag'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>1. Diagnóstico & Realtime</span>
        </button>
        <button
          onClick={() => setActiveSubTab('conn')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'conn'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>2. Conexão do Projeto</span>
        </button>
        <button
          onClick={() => setActiveSubTab('secure_rls')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'secure_rls'
              ? 'border-blue-600 text-blue-800 bg-blue-50/80 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span>3. Blindagem RLS & Realtime (Recomendado)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('unlock')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'unlock'
              ? 'border-amber-600 text-amber-800 bg-amber-50/70 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Unlock className="w-4 h-4 text-amber-600" />
          <span>4. Desbloqueio RLS (Modo Permissivo)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'sync'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>5. Sincronização & BD</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ddl')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'ddl'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>6. Esquema DDL (Tabelas)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'guide'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>7. Passo a Passo</span>
        </button>
      </div>

      {/* Tab: Diagnóstico de Persistência */}
      {activeSubTab === 'diag' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Diagnóstico em Tempo Real do Banco Supabase</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    WebSockets Realtime Ativo
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verificação ponta a ponta: conectividade, existência das tabelas relacionais, testes de gravação com RLS e canal Realtime de sincronização bidirecional.
                </p>
              </div>

              <button
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? 'animate-spin' : ''}`} />
                <span>{isRunningDiag ? 'Executando Testes...' : 'Executar Diagnóstico Agora'}</span>
              </button>
            </div>

            {diagReport ? (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    diagReport.overallSuccess
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${diagReport.overallSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {diagReport.overallSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      {diagReport.overallSuccess
                        ? 'Banco Supabase 100% Operacional e Gravando!'
                        : 'Atenção: Ações Necessárias para Habilitar a Persistência'}
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {diagReport.overallSuccess
                        ? 'O banco respondeu com sucesso ao teste de leitura, gravação direta e integridade de catálogo. Seus cadastros reais de armas, efetivo e cautelas estão sendo persistidos nas tabelas PostgreSQL.'
                        : 'Identificamos pendências no PostgreSQL do Supabase que impedem a gravação dos dados reais. Siga as orientações abaixo para regularizar.'}
                    </p>
                  </div>
                </div>

                {/* Steps Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagReport.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition ${
                        step.status === 'success'
                          ? 'bg-white border-emerald-200 shadow-2xs'
                          : step.status === 'error'
                          ? 'bg-red-50/60 border-red-200 shadow-2xs'
                          : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {step.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                          {step.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                          <span className="font-bold text-xs text-slate-900">{step.name}</span>
                        </div>
                        {step.latencyMs !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {step.latencyMs}ms
                          </span>
                        )}
                      </div>

                      <p className={`text-xs mt-1.5 font-medium ${step.status === 'success' ? 'text-emerald-800' : step.status === 'error' ? 'text-red-800' : 'text-amber-800'}`}>
                        {step.message}
                      </p>

                      {step.details && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed border-t border-slate-100 pt-1.5">
                          {step.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action recommendations if not ok */}
                {!diagReport.overallSuccess && (
                  <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3 text-xs">
                    <div className="font-bold text-emerald-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span>Solução Rápida em 1 Clique no Supabase:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      <li>
                        Acesse a aba <button onClick={() => setActiveSubTab('unlock')} className="text-emerald-400 font-bold underline">3. Desbloqueio RLS</button> e clique no botão <strong>"Copiar Script SQL"</strong>.
                      </li>
                      <li>
                        Abra o <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline inline-flex items-center gap-1">SQL Editor do seu Supabase <ExternalLink className="w-3 h-3" /></a>.
                      </li>
                      <li>
                        Cole o código e clique em <strong>RUN</strong>.
                      </li>
                      <li>
                        Volte aqui e clique em <strong>"Executar Diagnóstico Agora"</strong> para ver tudo verde!
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Clique no botão acima para iniciar o teste automático de integridade e persistência.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Conexão do Projeto */}
      {activeSubTab === 'conn' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Form Box */}
            <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Configurar Credenciais do Supabase</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecte seu projeto hospedado no Supabase para persistência e sincronização direta do banco de dados relacional PostgreSQL.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? 'Conexão Bem-Sucedida!' : 'Falha na Conexão'}</div>
                    <div className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</div>
                    {testResult.latencyMs !== undefined && (
                      <div className="text-[10px] font-mono mt-1 text-slate-500">Latência do Ping: {testResult.latencyMs}ms</div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleTestAndSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL do Projeto Supabase (Project URL) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://seu-projeto.supabase.co"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Disponível em: <strong>Project Settings → API → Project URL</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chave Pública Anônima (Anon / Public Key) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Disponível em: <strong>Project Settings → API → Project API Keys (anon public)</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {activeConfig.config && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desconectar e Limpar</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testando Conexão...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5" />
                          <span>Testar & Salvar Conexão</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Status & Architecture Box */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Status do Banco de Dados</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Banco:</span>
                    <span className="font-semibold text-slate-800">PostgreSQL 15+</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Sincronização:</span>
                    <span className="font-semibold text-emerald-700">Automática em Tempo Real</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Origem Config:</span>
                    <span className="font-mono text-slate-700 uppercase font-bold text-[10px]">
                      {activeConfig.source === 'env' ? '.env.example' : activeConfig.source === 'custom' ? 'Configuração Manual' : 'Local Standalone'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Persistência Garantida</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Todas as armas, coletes e cautelas cadastradas são salvas no armazenamento local com chave prefixada e replicadas para as tabelas relacionais do Supabase PostgreSQL.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sincronização & Status do BD */}
      {activeSubTab === 'sync' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span>Painel de Sincronização e Reconciliação do Banco</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifique o estado dos dados cadastrados e force o envio (Push) ou recuperação (Pull) direta com o PostgreSQL do Supabase.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStats}
                  disabled={isLoadingStats}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span>Atualizar Contagens</span>
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  syncFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {syncFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold">{syncFeedback.success ? 'Operação Concluída!' : 'Erro na Sincronização'}</div>
                  <div className="text-[11px] mt-0.5">{syncFeedback.message}</div>
                </div>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  <span>Enviar Dados Locais para o Supabase (Push BD)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Envia todas as armas, lotes, policiais, unidades e cautelas cadastradas para as tabelas do PostgreSQL no Supabase.
                </p>
                <button
                  onClick={handlePushAll}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  <span>Enviar Tudo para o Supabase</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>Baixar Dados do Supabase para o Sistema (Pull BD)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Recupera os registros mais recentes gravados nas tabelas do Supabase e atualiza o estado da aplicação.
                </p>
                <button
                  onClick={handlePullAll}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                  <span>Puxar Dados do Supabase</span>
                </button>
              </div>
            </div>

            {/* Table Counters */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Registros Atuais por Tabela no Banco de Dados</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Crosshair className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.item_patrimonio ?? db.getItensComDetalhes('Armas').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Itens / Armas</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Shield className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.detalhe_arma ?? db.getItensComDetalhes('Armas').filter((i) => i.detalhe_arma).length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Detalhes Armas</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.policial ?? db.getPoliciais().length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Efetivo 6º BPM</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Building className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.unidade ?? db.getUnidades().length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Unidades / Cia</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Activity className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.cautela ?? db.getCautelasCompletas().length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Cautelas</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                  <Terminal className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-900">
                    {tableStats?.auditoria_sistema ?? db.getAuditoriaLogs().length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Auditorias</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Blindagem RLS / Tab 4: Desbloqueio RLS / Tab 6: DDL */}
      {(activeSubTab === 'secure_rls' || activeSubTab === 'unlock' || activeSubTab === 'ddl') && (
        <div className="space-y-4">
          {activeSubTab === 'secure_rls' ? (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-3">
              <div className="font-bold text-blue-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-700" />
                  <span>Script Oficial de Blindagem RLS (Row Level Security) + Supabase Realtime</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-bold text-[10px]">
                  Padrão Produção 6º BPM
                </span>
              </div>
              <p className="text-blue-900 leading-relaxed">
                Este script ativa o <strong>Row Level Security (RLS)</strong> protegendo as tabelas contra ataques ou acessos indevidos via terminal, ao mesmo tempo em que:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Realtime (WebSockets)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Publica todas as tabelas no canal <code>supabase_realtime</code> para sincronização instantânea.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-xs space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Sync Auth</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Gatilho automático sincroniza <code>operador_sistema</code> com <code>auth.users</code> com e-mail confirmado.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-xs space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auditoria Imutável</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <code>auditoria_sistema</code> só aceita INSERT. UPDATE e DELETE são bloqueados por RLS.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-xs space-y-1">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-amber-600" />
                    <span>Proteção Cautelas</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Cautelas registradas nunca podem ser excluídas (sem DELETE), apenas arquivadas.
                  </p>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-blue-950 font-semibold flex items-center gap-2">
                <span>Como aplicar:</span>
                <span>Copie o script abaixo, acesse o <strong>SQL Editor</strong> do Supabase, cole e clique em <strong>RUN</strong>.</span>
              </div>
            </div>
          ) : activeSubTab === 'unlock' ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-amber-700" />
                <span>Script de Desbloqueio e Liberação Imediata (Modo Matrícula PMRN)</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Este script desativa as restrições de bloqueio do RLS e garante que as inserções feitas através da chave <code>anon</code> da sua aplicação web sejam gravadas imediatamente no PostgreSQL do Supabase, sem exigir confirmação de e-mail ou reset de senhas confuso.
              </p>
              <div className="pt-1 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                <span>Instruções:</span>
                <span>Copie o script abaixo, acesse o <strong>SQL Editor</strong> do Supabase, cole e clique em <strong>RUN</strong>.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="font-bold text-emerald-700 flex items-center space-x-1.5">
                  <Server className="w-4 h-4" />
                  <span>Banco Relacional PostgreSQL</span>
                </div>
                <p className="text-slate-600">
                  10 tabelas relacionais com integridade referencial estrita, foreign keys em cascata e enums customizados.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="font-bold text-blue-700 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Row Level Security (RLS)</span>
                </div>
                <p className="text-slate-600">
                  Bloqueio de leitura e mutação a nível de linha de banco via <code className="text-blue-700 font-mono font-bold">auth.uid()</code> e RBAC de operadores.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="font-bold text-amber-700 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Audit Trigger & UUID</span>
                </div>
                <p className="text-slate-600">
                  Cada cautela e alocação exige o <code className="text-amber-700 font-mono font-bold">id_operador</code> (UUID) para rastreabilidade militar.
                </p>
              </div>
            </div>
          )}

          {/* Code Viewer */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="font-mono text-slate-300 ml-2">
                  {activeSubTab === 'ddl'
                    ? 'supabase_schema_6bpm.sql'
                    : activeSubTab === 'secure_rls'
                    ? 'supabase_blindagem_rls_realtime_6bpm.sql'
                    : 'desbloquear_rls_matricula_6bpm.sql'}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="hover:text-white transition flex items-center space-x-1 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>
            </div>

            <pre className="p-4 overflow-x-auto text-slate-300 font-mono text-xs leading-relaxed max-h-[550px] overflow-y-auto">
              <code>{currentScript}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Guide */}
      {activeSubTab === 'guide' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs text-slate-700">
          <h2 className="text-base font-bold text-slate-900">
            Guia Rápido de Implantação e Vinculação ao Supabase
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                1
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Crie ou abra seu projeto no Supabase</div>
                <p className="text-slate-600">
                  Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">supabase.com</a> e crie um novo projeto (ex: <code>sgc6-bpm-caico</code>).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                2
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Execute o Esquema DDL no SQL Editor</div>
                <p className="text-slate-600">
                  No painel do Supabase, abra a aba <strong>SQL Editor</strong>, copie o conteúdo da aba <strong>3. Esquema DDL</strong> e clique em <strong>RUN</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                3
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Copie as Credenciais de API</div>
                <p className="text-slate-600">
                  Vá em <strong>Project Settings → API</strong> e copie a <code>Project URL</code> e a <code>anon public key</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                4
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Vincule e Sincronize os Dados</div>
                <p className="text-slate-600">
                  Cole os valores na aba <strong>1. Conexão do Projeto Supabase</strong> e clique em <strong>Testar & Salvar Conexão</strong>. Em seguida, na aba <strong>2. Sincronização</strong>, clique em <strong>Enviar Tudo para o Supabase</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
