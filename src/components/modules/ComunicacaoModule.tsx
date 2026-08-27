import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  Radio,
  Smartphone,
  Plus,
  RotateCcw,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Wifi,
  Package,
  Layers,
  Edit,
  FileDown,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ArrowRightLeft,
  BarChart3,
  ShieldCheck,
  Building2,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderPlus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ModalNovaCautela } from '../cautela/ModalNovaCautela';
import { ModalDevolucao } from '../cautela/ModalDevolucao';
import { TermoCautelaPrint } from '../cautela/TermoCautelaPrint';
import { ModalNovoItem } from '../item/ModalNovoItem';
import { ModalEditarItem } from '../item/ModalEditarItem';
import { ModalNovaAlocacao } from '../alocacao/ModalNovaAlocacao';
import { ModalRealocarItem } from '../alocacao/ModalRealocarItem';
import { TabelaCautelasAndamento } from '../cautela/TabelaCautelasAndamento';
import { PdfReportService } from '../../services/pdfReportService';
import { CautelaCompleta, ItemComDetalhes } from '../../types/database';

type SortField = 'tombo_serie' | 'tipo' | 'marca_modelo' | 'detalhes' | 'status' | 'lotacao';
type SortDirection = 'asc' | 'desc';

export const ComunicacaoModule: React.FC = () => {
  const { db, canPerformAlocacao } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Disponível' | 'Alocado' | 'Cautelado' | 'Manutenção'>('Todos');
  const [sortField, setSortField] = useState<SortField>('tombo_serie');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showCharts, setShowCharts] = useState(true);

  const [showNovaCautelaModal, setShowNovaCautelaModal] = useState(false);
  const [showNovaAlocacaoModal, setShowNovaAlocacaoModal] = useState(false);
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [selectedCautelaDevolucao, setSelectedCautelaDevolucao] = useState<CautelaCompleta | null>(null);
  const [selectedCautelaPrint, setSelectedCautelaPrint] = useState<CautelaCompleta | null>(null);
  const [selectedItemEdit, setSelectedItemEdit] = useState<ItemComDetalhes | null>(null);
  const [selectedItemRealocar, setSelectedItemRealocar] = useState<ItemComDetalhes | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemComDetalhes | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const allItens = db.getItensComDetalhes('Comunicação');
  const allCautelas = db.getCautelasCompletas('Comunicação');
  const allAlocacoes = db.getAlocacoesCompletas('Comunicação');

  const totalEquipamentos = allItens.length;
  const radiosDisponiveis = allItens.filter((i) => i.status === 'Disponível').length;
  const equipamentosAlocados = allItens.filter((i) => i.status === 'Alocado').length;
  const cautelasAtivas = allCautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');
  const itensManutencao = allItens.filter(
    (i) => i.status === 'Manutenção' || i.status === 'Danificado / Avariado'
  ).length;

  const filteredItens = allItens.filter((i) => {
    if (statusFilter !== 'Todos') {
      if (statusFilter === 'Manutenção') {
        if (i.status !== 'Manutenção' && i.status !== 'Danificado / Avariado') return false;
      } else if (i.status !== statusFilter) {
        return false;
      }
    }

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      i.tipo_item.toLowerCase().includes(term) ||
      (i.marca || '').toLowerCase().includes(term) ||
      (i.modelo || '').toLowerCase().includes(term) ||
      (i.numero_serie || '').toLowerCase().includes(term) ||
      (i.numero_tombo || '').toLowerCase().includes(term) ||
      (i.detalhe_comunicacao?.imei_mac || '').toLowerCase().includes(term) ||
      (i.detalhe_comunicacao?.numero_linha || '').toLowerCase().includes(term) ||
      (i.alocacao_atual?.unidade_nome || '').toLowerCase().includes(term)
    );
  });

  const sortedItens = [...filteredItens].sort((a, b) => {
    let valA = '';
    let valB = '';

    switch (sortField) {
      case 'tombo_serie':
        valA = a.numero_tombo || a.numero_serie || '';
        valB = b.numero_tombo || b.numero_serie || '';
        break;
      case 'tipo':
        valA = a.tipo_item || '';
        valB = b.tipo_item || '';
        break;
      case 'marca_modelo':
        valA = `${a.marca || ''} ${a.modelo || ''}`.trim();
        valB = `${b.marca || ''} ${b.modelo || ''}`.trim();
        break;
      case 'detalhes':
        valA = a.detalhe_comunicacao?.numero_linha || a.detalhe_comunicacao?.imei_mac || a.observacao || '';
        valB = b.detalhe_comunicacao?.numero_linha || b.detalhe_comunicacao?.imei_mac || b.observacao || '';
        break;
      case 'status':
        valA = a.status || '';
        valB = b.status || '';
        break;
      case 'lotacao':
        valA = a.cautela_atual
          ? `${a.cautela_atual.policial_nome}`
          : a.alocacao_atual?.unidade_nome || 'Sala de Rádio (Sede)';
        valB = b.cautela_atual
          ? `${b.cautela_atual.policial_nome}`
          : b.alocacao_atual?.unidade_nome || 'Sala de Rádio (Sede)';
        break;
    }

    const compare = valA.localeCompare(valB, 'pt-BR', { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? compare : -compare;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600" />
    );
  };

  // --- Prepare Data for Charts ---
  const unitMap: Record<string, { name: string; total: number }> = {
    sede: { name: 'Sala de Rádio (Sede)', total: 0 },
  };

  allItens.forEach((it) => {
    if (it.alocacao_atual && it.alocacao_atual.id_unidade !== 1 && !it.alocacao_atual.unidade_nome.toLowerCase().includes('sede')) {
      const uKey = `u_${it.alocacao_atual.id_unidade || it.alocacao_atual.unidade_nome}`;
      if (!unitMap[uKey]) {
        unitMap[uKey] = {
          name: it.alocacao_atual.unidade_nome.replace('Destacamento Policial Militar de ', 'DPM ').replace('Companhia PM - ', ''),
          total: 0,
        };
      }
      unitMap[uKey].total += 1;
    } else {
      unitMap.sede.total += 1;
    }
  });

  const chartDataUnidades = Object.values(unitMap)
    .sort((a, b) => b.total - a.total)
    .filter((u) => u.total > 0);

  const chartDataCondicao = [
    { name: 'Disponível', value: radiosDisponiveis, color: '#10b981' },
    { name: 'Alocado (CPMs/DPMs)', value: equipamentosAlocados, color: '#4f46e5' },
    { name: 'Cautelado (Policial)', value: allItens.filter((i) => i.status === 'Cautelado').length, color: '#2563eb' },
    { name: 'Manutenção / Oficina', value: allItens.filter((i) => i.status === 'Manutenção').length, color: '#f59e0b' },
    { name: 'Danificado / Avariado', value: allItens.filter((i) => i.status === 'Danificado / Avariado').length, color: '#e11d48' },
  ].filter((c) => c.value > 0);

  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    setErroExclusao(null);

    const res = db.excluirItem(itemParaExcluir.id_item);
    if (res.success) {
      setItemParaExcluir(null);
      setSuccessMessage('Equipamento de comunicação excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErroExclusao(res.error || 'Erro ao excluir equipamento.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Módulo 2: Comunicação & Rádio (P3/COPOM)</h1>
            <p className="text-xs text-slate-500">
              Controle de radiotransmissores HT digitais, rádios veiculares, smartphones funcionais e lotações • 6º BPM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
              showCharts
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Alternar exibição de gráficos estatísticos"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>{showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}</span>
          </button>

          <button
            onClick={() => PdfReportService.gerarRelatorioModulo(db, 'Comunicação')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer"
            title="Exportar Relatório Oficial de Comunicação em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>

          {canPerformAlocacao && (
            <button
              onClick={() => setShowNovaAlocacaoModal(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>ALOCAR EM UNIDADE</span>
            </button>
          )}

          <button
            onClick={() => setShowNovaCautelaModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CAUTELAR RÁDIO / HT</span>
          </button>

          <button
            onClick={() => setShowNovoItemModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Cadastrar Equipamento</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Equipamentos</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalEquipamentos}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Rádios HT, veiculares e smartphones</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alocados (CPMs/DPMs)</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-indigo-600 tracking-tight">{equipamentosAlocados}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Em uso nas unidades do Batalhão</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponíveis (Sede)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{radiosDisponiveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Prontos / Sala de Rádio</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cautelas / Manutenção</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {cautelasAtivas.length + itensManutencao}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {cautelasAtivas.length} cautelados • {itensManutencao} em reparo
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in">
          {/* Chart 1: Equipment by Unit */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Distribuição de Equipamentos por Unidade / Destacamento
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {chartDataUnidades.length} locais ativos
              </span>
            </div>

            <div className="h-56 w-full">
              {chartDataUnidades.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataUnidades} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#475569' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => [`${value} equipamento(s)`, 'Quantidade']}
                    />
                    <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Sem dados para exibir no gráfico.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Equipment by Condition */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Condição e Estado dos Rádios
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {totalEquipamentos} totais
              </span>
            </div>

            <div className="h-44 w-full">
              {chartDataCondicao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataCondicao}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartDataCondicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => [`${value} item(ns)`, 'Quantidade']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Nenhum equipamento cadastrado.
                </div>
              )}
            </div>

            {/* Condition legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
              {chartDataCondicao.map((c) => (
                <div key={c.name} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600 truncate">{c.name}:</span>
                  <strong className="text-slate-900 font-mono">{c.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cautelas de Rádio Ativas em Tabela com Busca por Matrícula */}
      {cautelasAtivas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Cautelas de Comunicação em Andamento ({cautelasAtivas.length})
          </h2>
          <TabelaCautelasAndamento
            modulo="Comunicação"
            cautelas={cautelasAtivas}
            onDarBaixa={(c) => setSelectedCautelaDevolucao(c)}
            onVerComprovante={(c) => setSelectedCautelaPrint(c)}
          />
        </div>
      )}

      {/* Equipment List Table with Sorting and Actions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Inventário Geral de Radiocomunicação e Equipamentos ({sortedItens.length})
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie os rádios e celulares funcionais com busca, ordenação interativa e ações de realocação individual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(['Todos', 'Disponível', 'Alocado', 'Cautelado', 'Manutenção'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar modelo, tombo, série, IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('tombo_serie')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Tombo / Série"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Tombo / Nº Série</span>
                    {renderSortIcon('tombo_serie')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tipo')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Tipo de Equipamento"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Tipo</span>
                    {renderSortIcon('tipo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marca_modelo')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Marca / Modelo"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Marca / Modelo</span>
                    {renderSortIcon('marca_modelo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('detalhes')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Linha / IMEI / MAC"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Linha / IMEI / MAC</span>
                    {renderSortIcon('detalhes')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Condição / Status"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Condição / Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lotacao')}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition group"
                  title="Ordenar por Lotação / Emprego"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Lotação / Posse</span>
                    {renderSortIcon('lotacao')}
                  </div>
                </th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum equipamento encontrado com os filtros e termos pesquisados.
                  </td>
                </tr>
              ) : (
                sortedItens.map((it, idx) => (
                  <tr key={`${it.id_item || 'com'}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900 text-xs">
                      {it.numero_tombo || it.numero_serie || '-'}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {it.tipo_item}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {it.marca} {it.modelo}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {it.observacao || 'Equipamento de radiocomunicação'}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-emerald-800">
                      <div>{it.detalhe_comunicacao?.numero_linha || 'Rede Digital P25'}</div>
                      {it.detalhe_comunicacao?.imei_mac && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          MAC/IMEI: {it.detalhe_comunicacao.imei_mac}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                          it.status === 'Disponível'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : it.status === 'Alocado'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : it.status === 'Cautelado'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : it.status === 'Manutenção'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : it.status === 'Danificado / Avariado'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {it.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {it.cautela_atual ? (
                        <span className="text-blue-800 font-bold inline-flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                          <span>
                            {it.cautela_atual.policial_grad} {it.cautela_atual.policial_nome} (#{it.cautela_atual.id_cautela})
                          </span>
                        </span>
                      ) : it.alocacao_atual && it.alocacao_atual.id_unidade !== 1 && !it.alocacao_atual.unidade_nome.toLowerCase().includes('sede') ? (
                        <span className="text-indigo-700 font-bold inline-flex items-center space-x-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200/80">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{it.alocacao_atual.unidade_nome}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium inline-flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{it.alocacao_atual?.unidade_nome || 'Sala de Rádio (Sede)'}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Realocação Individual */}
                        {canPerformAlocacao && (
                          <button
                            onClick={() => setSelectedItemRealocar(it)}
                            className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer"
                            title="Realocar equipamento individualmente (para outra unidade ou retorno à sede)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Realocar</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedItemEdit(it)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          title="Editar Equipamento"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => {
                            setErroExclusao(null);
                            setItemParaExcluir(it);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Excluir Equipamento do Sistema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Realocar Individualmente */}
      {selectedItemRealocar && (
        <ModalRealocarItem
          item={selectedItemRealocar}
          modulo="Comunicação"
          onClose={() => setSelectedItemRealocar(null)}
          onSuccess={(msg) => {
            setSelectedItemRealocar(null);
            setSuccessMessage(msg || 'Movimentação realizada com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {showNovaAlocacaoModal && (
        <ModalNovaAlocacao
          modulo="Comunicação"
          onClose={() => setShowNovaAlocacaoModal(false)}
          onSuccess={() => {
            setShowNovaAlocacaoModal(false);
            setSuccessMessage('Alocação de comunicação realizada com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {showNovaCautelaModal && (
        <ModalNovaCautela
          modulo="Comunicação"
          onClose={() => setShowNovaCautelaModal(false)}
          onSuccess={(id) => {
            setShowNovaCautelaModal(false);
            setSuccessMessage(`Cautela de comunicação #${String(id).padStart(3, '0')} registrada com sucesso!`);
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {showNovoItemModal && (
        <ModalNovoItem
          modulo="Comunicação"
          onClose={() => setShowNovoItemModal(false)}
          onSuccess={() => {
            setShowNovoItemModal(false);
            setSuccessMessage('Equipamento de comunicação cadastrado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {selectedItemEdit && (
        <ModalEditarItem
          item={selectedItemEdit}
          onClose={() => setSelectedItemEdit(null)}
          onSuccess={() => {
            setSelectedItemEdit(null);
            setSuccessMessage('Equipamento atualizado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {selectedCautelaDevolucao && (
        <ModalDevolucao
          cautela={selectedCautelaDevolucao}
          onClose={() => setSelectedCautelaDevolucao(null)}
          onSuccess={() => {
            setSelectedCautelaDevolucao(null);
            setSuccessMessage('Baixa do rádio realizada com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {selectedCautelaPrint && (
        <TermoCautelaPrint
          cautela={selectedCautelaPrint}
          onClose={() => setSelectedCautelaPrint(null)}
        />
      )}

      {/* Modal Confirmação de Exclusão */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Excluir Equipamento</h3>
                <p className="text-xs text-rose-700">Comunicação & Rádio • 6º BPM</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {erroExclusao && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erroExclusao}</span>
                </div>
              )}

              <p className="text-sm text-slate-800">
                Tem certeza que deseja excluir o equipamento{' '}
                <strong className="text-slate-950">
                  {itemParaExcluir.tipo_item} {itemParaExcluir.marca} {itemParaExcluir.modelo} (Tombo/Série: {itemParaExcluir.numero_tombo || itemParaExcluir.numero_serie || 'S/N'})
                </strong>?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600 text-xs">
                <div className="flex justify-between">
                  <span>Condição / Status:</span>
                  <strong className="text-slate-900">{itemParaExcluir.status}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Lotação Atual:</span>
                  <strong className="text-slate-900">{itemParaExcluir.alocacao_atual?.unidade_nome || 'Sala de Rádio (Sede)'}</strong>
                </div>
              </div>

              <p className="text-rose-600 font-semibold text-[11px]">
                Esta ação removerá o equipamento permanentemente do inventário patrimonial.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Equipamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
