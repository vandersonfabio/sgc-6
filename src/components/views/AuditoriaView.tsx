import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  FileCode,
  ShieldCheck,
  Search,
  Lock,
  Clock,
  Filter,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const { auditoriaLogs, operadores, currentOperator } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('todas');

  const filteredLogs = auditoriaLogs.filter((log) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (log.acao || '').toLowerCase().includes(term) ||
      (log.tabela || '').toLowerCase().includes(term) ||
      (log.operador_nome || '').toLowerCase().includes(term) ||
      (log.id_operador || '').toLowerCase().includes(term) ||
      JSON.stringify(log.detalhes || {}).toLowerCase().includes(term);

    const matchesOperacao = filterOperacao === 'todas' || log.acao === filterOperacao;

    return matchesSearch && matchesOperacao;
  });

  const formatDataHora = (dStr?: string | null) => {
    if (!dStr) return 'N/A';
    try {
      return new Date(dStr).toLocaleString('pt-BR');
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Trilha de Auditoria & Rastreabilidade (RLS Supabase)
            </h1>
            <p className="text-xs text-slate-500">
              Registro inalterável de todas as operações de cautela, devolução, cadastro e movimentação com identificação de operador • 6º BPM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono">
            Total de Logs: <strong>{auditoriaLogs.length}</strong>
          </span>
        </div>
      </div>

      {/* RLS Security Explanatory Card */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start space-x-3">
        <Lock className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">Garantia de Segurança por Row Level Security (RLS)</div>
          <p className="text-slate-600">
            No Supabase (PostgreSQL), cada transação grava explicitamente o UUID do operador autenticado (<code className="text-indigo-600 font-bold">auth.uid()</code>). As políticas de RLS garantem que armeiros e operadores de rádio só executem mutações em seus respectivos módulos, enquanto o P4 e Superusuário detêm visibilidade institucional total.
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por ação, tabela, operador ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-600 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Tipo de Ação:</span>
          <select
            value={filterOperacao ?? 'todas'}
            onChange={(e) => setFilterOperacao(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-600 shadow-xs"
          >
            <option value="todas">Todas as Ações</option>
            <option value="CRIAR_CAUTELA">CRIAR_CAUTELA</option>
            <option value="DEVOLVER_CAUTELA">DEVOLVER_CAUTELA</option>
            <option value="CADASTRAR_ITEM">CADASTRAR_ITEM</option>
            <option value="CADASTRAR_LOTE">CADASTRAR_LOTE</option>
            <option value="CRIAR_ALOCACAO">CRIAR_ALOCACAO</option>
            <option value="FINALIZAR_ALOCACAO">FINALIZAR_ALOCACAO</option>
            <option value="CADASTRAR_POLICIAL">CADASTRAR_POLICIAL</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">Data / Hora</th>
              <th className="p-3">Ação Realizada</th>
              <th className="p-3">Tabela / Módulo</th>
              <th className="p-3">Operador Responsável (UUID)</th>
              <th className="p-3">Detalhes da Transação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={`${log.id_log || 'log'}-${idx}`} className="hover:bg-slate-50 font-sans transition">
                  <td className="p-3 text-slate-600 whitespace-nowrap text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDataHora(log.data_hora)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                        log.acao.includes('CRIAR')
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : log.acao.includes('DEVOLVER') || log.acao.includes('FINALIZAR')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {log.acao}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-mono text-[11px]">
                    {log.tabela}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 text-xs">
                      {log.operador_nome || 'Operador'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      UUID: {log.id_operador ? (log.id_operador.length > 18 ? `${log.id_operador.slice(0, 18)}...` : log.id_operador) : 'N/A'}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-lg font-mono text-[10px] text-slate-700 overflow-x-auto">
                      {JSON.stringify(log.detalhes)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
