import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  Crosshair,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  Printer,
  Package,
  Layers,
  Shield,
  FileText,
  AlertOctagon,
  Users,
  Box,
  Edit,
  FileDown,
  Info,
  History,
} from 'lucide-react';
import { ModalNovaCautela } from '../cautela/ModalNovaCautela';
import { ModalDevolucao } from '../cautela/ModalDevolucao';
import { TermoCautelaPrint } from '../cautela/TermoCautelaPrint';
import { ModalNovoItem } from '../item/ModalNovoItem';
import { ModalEditarItem } from '../item/ModalEditarItem';
import { ModalRegistrarExtravio } from '../armas/ModalRegistrarExtravio';
import { ModalRegistrarDisparo } from '../armas/ModalRegistrarDisparo';
import { ModalEditarMunicao } from '../armas/ModalEditarMunicao';
import { ArmasGraficosAnalytics } from '../armas/ArmasGraficosAnalytics';
import { TabelaCautelasAndamento } from '../cautela/TabelaCautelasAndamento';
import { PdfReportService } from '../../services/pdfReportService';
import { CautelaCompleta, ItemComDetalhes, EstoqueLote } from '../../types/database';

export const ArmasModule: React.FC = () => {
  const { db, policiais, lotes, registrosExtravio, registrosDisparo, canCreateOrEditItems, canManageCautelas } = useDatabase();
  const canManage = canManageCautelas('Armas');
  const canCreateOrEdit = canCreateOrEditItems('Armas');

  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'cautelas' | 'armas' | 'municoes' | 'disparos' | 'extravios' | 'permanentes'
  >('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCalibre, setFilterCalibre] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Modals
  const [showNovaCautelaModal, setShowNovaCautelaModal] = useState(false);
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [showRegistrarExtravioModal, setShowRegistrarExtravioModal] = useState(false);
  const [showRegistrarDisparoModal, setShowRegistrarDisparoModal] = useState(false);
  const [selectedCautelaForDisparo, setSelectedCautelaForDisparo] = useState<CautelaCompleta | null>(null);
  const [selectedCautelaForExtravio, setSelectedCautelaForExtravio] = useState<CautelaCompleta | null>(null);
  const [showEditarMunicaoModal, setShowEditarMunicaoModal] = useState(false);
  const [selectedMunicaoEdit, setSelectedMunicaoEdit] = useState<EstoqueLote | null>(null);
  const [isGeneralMaterialEdit, setIsGeneralMaterialEdit] = useState(false);
  const [loteParaExcluir, setLoteParaExcluir] = useState<EstoqueLote | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [selectedCautelaDevolucao, setSelectedCautelaDevolucao] = useState<CautelaCompleta | null>(null);
  const [selectedCautelaPrint, setSelectedCautelaPrint] = useState<CautelaCompleta | null>(null);
  const [selectedItemEdit, setSelectedItemEdit] = useState<ItemComDetalhes | null>(null);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data queries
  const allItens = db.getItensComDetalhes('Armas');
  const allCautelas = db.getCautelasCompletas('Armas');
  const armasLotes = db.getLotes('Armas');
  const estoqueConsolidado = db.getEstoqueConsolidado('Armas');

  // Separate munitions from non-serialized other items
  const genuineMunicoes = armasLotes.filter(
    (l) => (l.calibre !== null && l.calibre !== undefined && l.calibre.trim() !== '') || l.id_tipo_material === 8
  );
  const outrosNaoSerializados = armasLotes.filter(
    (l) => !((l.calibre !== null && l.calibre !== undefined && l.calibre.trim() !== '') || l.id_tipo_material === 8)
  );

  // 1. Efetivo total cadastrado
  const efetivoTotal = policiais.filter((p) => p.status === 'Ativo').length;

  // 2. Total de Armamento no estoque ativo sob nossa posse (exclui armamentos Descarregados e Baixados)
  const armamentosAtivos = allItens.filter((i) => i.status !== 'Descarregado' && i.status !== 'Baixado');
  const totalArmamentoGeral = armamentosAtivos.length;

  // 3. Armamento atualmente disponível na reserva
  const armamentoDisponivel = allItens.filter((i) => i.status === 'Disponível').length;

  const cautelasAtivas = allCautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');
  const cautelasPermanentes = allCautelas.filter((c) => c.tipo === 'Permanente' && c.status === 'Aberta');

  // 4 & 5. Munições Livres (em cofre) e Total Geral (em cofre + cauteladas)
  const municoesDisponiveis = genuineMunicoes.reduce((acc, l) => acc + l.quantidade_atual, 0);
  const genuineMunicoesIds = new Set(genuineMunicoes.map((m) => m.id_lote));
  const municoesCauteladasTotal = cautelasAtivas.reduce((acc, c) => {
    return (
      acc +
      c.lotes.reduce((lacc, ce) => {
        return genuineMunicoesIds.has(ce.lote.id_lote) ? lacc + ce.quantidade : lacc;
      }, 0)
    );
  }, 0);
  const totalMunicoesGeral = municoesDisponiveis + municoesCauteladasTotal;

  // 6. Alerta de Cautelas em atraso
  const now = new Date();
  const cautelasAtrasadas = allCautelas.filter((c) => {
    if (c.status === 'Atrasada') return true;
    if (c.status === 'Aberta' && c.tipo === 'Temporária' && c.data_prevista_devolucao) {
      return new Date(c.data_prevista_devolucao) < now;
    }
    return false;
  });

  // 7. Alerta crítico de Coletes e Escudos vencidos
  const coletes = allItens.filter((i) => (i.tipo_item.toLowerCase().includes('colete') || i.tipo_item.toLowerCase().includes('escudo')) && i.detalhe_colete);
  const coletesVencidos = coletes.filter((c) => {
    if (!c.detalhe_colete?.data_validade) return false;
    return new Date(c.detalhe_colete.data_validade) <= now;
  });
  const coletesAVencer = coletes.filter((c) => {
    if (!c.detalhe_colete?.data_validade) return false;
    const valDate = new Date(c.detalhe_colete.data_validade);
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
    return valDate > now && valDate <= thirtyDaysAhead;
  });

  const filteredArmas = allItens.filter((it) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      it.tipo_item.toLowerCase().includes(term) ||
      (it.marca || '').toLowerCase().includes(term) ||
      (it.modelo || '').toLowerCase().includes(term) ||
      (it.numero_serie || '').toLowerCase().includes(term) ||
      (it.numero_tombo || '').toLowerCase().includes(term) ||
      (it.detalhe_arma?.numero_sigma || '').toLowerCase().includes(term);

    const matchesCalibre =
      filterCalibre === 'todos' ||
      (it.detalhe_arma && it.detalhe_arma.calibre === filterCalibre);

    const matchesStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'ativos' && it.status !== 'Descarregado' && it.status !== 'Baixado') ||
      it.status === filterStatus;

    return matchesSearch && matchesCalibre && matchesStatus;
  });

  const formatHora = (dStr: string) => {
    return new Date(dStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatData = (dStr: string) => {
    return new Date(dStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Sub-Navigation & Module Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Módulo 1: Material Bélico (Armaria)</h1>
            <p className="text-xs text-slate-500">
              Controle de armas de fogo, coletes balísticos, escudos, munições CBC, reposição de disparos e extravios • 6º BPM
            </p>
          </div>
        </div>

        {/* Action CTAs: Apenas Nova Cautela e Cadastrar Material destacados */}
        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <button
              id="btn-abrir-nova-cautela"
              onClick={() => setShowNovaCautelaModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-md shadow-emerald-600/30 transition transform hover:-translate-y-0.5 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>NOVA CAUTELA</span>
            </button>
          )}
          {canCreateOrEdit && (
            <button
              id="btn-cadastrar-armamento"
              onClick={() => setShowNovoItemModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Cadastrar Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 7 DASHBOARD CARDS & ALERTS (Bento Grid layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Efetivo 6º BPM</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{efetivoTotal}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">PMs cadastrados</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Estoque Armas</span>
            <Box className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalArmamentoGeral}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Total de patrimônios</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Armas Disponíveis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{armamentoDisponivel}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Prontas na reserva</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Total Munições</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalMunicoesGeral}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cartuchos gerais</div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5. Munições Livres</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 tracking-tight">{municoesDisponiveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">No cofre do armeiro</div>
          </div>
        </div>

        {/* Card 6 (Atraso) */}
        <div
          className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition ${
            cautelasAtrasadas.length > 0
              ? 'bg-red-50 border-red-300 ring-1 ring-red-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                cautelasAtrasadas.length > 0 ? 'text-red-700 font-black' : 'text-slate-400'
              }`}
            >
              6. Cautelas em Atraso
            </span>
            <Clock className={`w-4 h-4 ${cautelasAtrasadas.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black tracking-tight ${
                cautelasAtrasadas.length > 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {cautelasAtrasadas.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {cautelasAtrasadas.length > 0 ? 'ALERTA: Cobrar devolução' : 'Sem atrasos'}
            </div>
          </div>
        </div>

        {/* Card 7 (Coletes Vencidos) */}
        <div
          className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition ${
            coletesVencidos.length > 0
              ? 'bg-red-50 border-red-300 ring-1 ring-red-400'
              : coletesAVencer.length > 0
              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                coletesVencidos.length > 0
                  ? 'text-red-700 font-black'
                  : coletesAVencer.length > 0
                  ? 'text-amber-700'
                  : 'text-slate-400'
              }`}
            >
              7. Coletes / Validade
            </span>
            <ShieldAlert
              className={`w-4 h-4 ${
                coletesVencidos.length > 0
                  ? 'text-red-600'
                  : coletesAVencer.length > 0
                  ? 'text-amber-600'
                  : 'text-slate-400'
              }`}
            />
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black tracking-tight ${
                coletesVencidos.length > 0
                  ? 'text-red-600'
                  : coletesAVencer.length > 0
                  ? 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {coletesVencidos.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {coletesVencidos.length > 0
                ? 'CRÍTICO: Recolher'
                : coletesAVencer.length > 0
                ? `${coletesAVencer.length} a vencer (30d)`
                : '100% no prazo'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-xs gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-3 py-2 rounded-lg transition ${
            activeSubTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Painel Geral
        </button>
        <button
          onClick={() => setActiveSubTab('cautelas')}
          className={`px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === 'cautelas'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Cautelas Ativas</span>
          {cautelasAtivas.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'cautelas' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {cautelasAtivas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('armas')}
          className={`px-3 py-2 rounded-lg transition ${
            activeSubTab === 'armas'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Armas & Coletes ({allItens.length})
        </button>
        <button
          onClick={() => setActiveSubTab('municoes')}
          className={`px-3 py-2 rounded-lg transition ${
            activeSubTab === 'municoes'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Munições ({totalMunicoesGeral} un.)
        </button>
        <button
          onClick={() => setActiveSubTab('disparos')}
          className={`px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === 'disparos'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Disparos & Reposições ({registrosDisparo.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('extravios')}
          className={`px-3 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === 'extravios'
              ? 'bg-rose-700 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Extravios & Ocorrências ({registrosExtravio.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('permanentes')}
          className={`px-3 py-2 rounded-lg transition ${
            activeSubTab === 'permanentes'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cargas Permanentes ({cautelasPermanentes.length})
        </button>
      </div>

      {/* TAB CONTENT: 1. Dashboard Overview */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Active Overdue Warning */}
          {cautelasAtrasadas.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start space-x-3 shadow-xs">
              <AlertOctagon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Atenção Armeiro de Serviço: Cautelas com Prazo Expirado</h3>
                <p className="text-xs text-red-700 mt-1">
                  Existem <strong>{cautelasAtrasadas.length}</strong> cautela(s) cujo horário de turno já encerrou e o armamento não foi devolvido ao cofre da reserva.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setActiveSubTab('cautelas')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    Ver Cautelas Atrasadas para Baixa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos Analíticos e Estatísticas do Batalhão */}
          <ArmasGraficosAnalytics />

          {/* Quick Table for Cautelas em Andamento */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Cautelas Ativas no Turno de Serviço</span>
              </h2>
              <button
                onClick={() => setActiveSubTab('cautelas')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Ver Tabela Completa de Cautelas →
              </button>
            </div>

            <TabelaCautelasAndamento
              modulo="Armas"
              cautelas={cautelasAtivas}
              onDarBaixa={(c) => setSelectedCautelaDevolucao(c)}
              onVerComprovante={(c) => setSelectedCautelaPrint(c)}
              onRegistrarDisparo={(c) => {
                setSelectedCautelaForDisparo(c);
                setShowRegistrarDisparoModal(true);
              }}
              onRegistrarExtravio={(c) => {
                setSelectedCautelaForExtravio(c);
                setShowRegistrarExtravioModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Cautelas em Andamento */}
      {activeSubTab === 'cautelas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Gerenciamento e Baixa de Cautelas Operacionais
              </h2>
              <p className="text-xs text-slate-500">
                Pesquise diretamente pela matrícula do militar para agilizar a conferência e devolução
              </p>
            </div>
          </div>

          <TabelaCautelasAndamento
            modulo="Armas"
            cautelas={cautelasAtivas}
            onDarBaixa={(c) => setSelectedCautelaDevolucao(c)}
            onVerComprovante={(c) => setSelectedCautelaPrint(c)}
            onRegistrarDisparo={(c) => {
              setSelectedCautelaForDisparo(c);
              setShowRegistrarDisparoModal(true);
            }}
            onRegistrarExtravio={(c) => {
              setSelectedCautelaForExtravio(c);
              setShowRegistrarExtravioModal(true);
            }}
          />
        </div>
      )}

      {/* TAB CONTENT: 3. Inventário de Armas e Coletes */}
      {activeSubTab === 'armas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por tipo, marca, tombo, série ou SIGMA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-600 font-medium">Calibre:</span>
                <select
                  value={filterCalibre ?? 'todos'}
                  onChange={(e) => setFilterCalibre(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 shadow-xs"
                >
                  <option value="todos">Todos os Calibres</option>
                  <option value="9mm">9mm</option>
                  <option value=".40 S&W">.40 S&W</option>
                  <option value="5.56x45mm">5.56x45mm</option>
                  <option value="12 GA">12 GA</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-600 font-medium">Status:</span>
                <select
                  value={filterStatus ?? 'todos'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 shadow-xs font-medium"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativos">Em Carga (Ativos no Estoque)</option>
                  <option value="Disponível">🟢 Disponível no Cofre</option>
                  <option value="Cautelado">🔵 Em Cautela (Serviço)</option>
                  <option value="Alocado">🟣 Alocado em Setor/DPM</option>
                  <option value="Manutenção">🟡 Em Manutenção</option>
                  <option value="Danificado / Avariado">🟠 Danificado / Avariado</option>
                  <option value="Em apuração">⚖️ Em Apuração (Justiça/IPM)</option>
                  <option value="Extraviado">🔴 Extraviado</option>
                  <option value="Descarregado">⚫ Descarregado (Fora de Carga)</option>
                  <option value="Baixado">⚫ Baixado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Tombo / Série</th>
                  <th className="p-3">Equipamento / Modelo</th>
                  <th className="p-3">Especificações Bélicas</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Custódia / Localização</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArmas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Nenhum armamento ou equipamento encontrado para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filteredArmas.map((it, idx) => {
                    const isColeteVencido =
                      it.detalhe_colete && it.detalhe_colete.data_validade && new Date(it.detalhe_colete.data_validade) <= now;

                    return (
                      <tr key={`${it.id_item || 'item'}-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          <div>{it.numero_tombo || '-'}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Série: {it.numero_serie || 'S/N'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">
                            {it.tipo_item} {it.marca} {it.modelo}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {it.observacao || 'Sem observações'}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">
                          {it.detalhe_arma && (
                            <div>
                              <span className="font-bold text-blue-700">{it.detalhe_arma.calibre}</span>
                              {it.detalhe_arma.numero_sigma && (
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  SIGMA: {it.detalhe_arma.numero_sigma}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 block">
                                {it.detalhe_arma.qtd_carregadores} Carregadores
                              </span>
                            </div>
                          )}
                          {it.detalhe_colete && (
                            <div>
                              <span className="font-semibold text-indigo-700">
                                {it.detalhe_colete.nivel_protecao} (Tam: {it.detalhe_colete.tamanho})
                              </span>
                              {it.detalhe_colete.data_validade && (
                                <span
                                  className={`text-[10px] block font-semibold ${
                                    isColeteVencido ? 'text-red-600 font-bold' : 'text-emerald-700'
                                  }`}
                                >
                                  Validade: {it.detalhe_colete.data_validade} {isColeteVencido && '• VENCIDO!'}
                                </span>
                              )}
                            </div>
                          )}
                          {!it.detalhe_arma && !it.detalhe_colete && '-'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                              it.status === 'Disponível'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : it.status === 'Cautelado'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : it.status === 'Alocado'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : it.status === 'Manutenção'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : it.status === 'Em apuração'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : it.status === 'Extraviado'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : it.status === 'Danificado / Avariado'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : it.status === 'Descarregado'
                                ? 'bg-slate-200 text-slate-700 border border-slate-300 line-through'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">
                          {it.cautela_atual ? (
                            <div>
                              <div className="font-bold text-blue-800">
                                {it.cautela_atual.policial_grad} {it.cautela_atual.policial_nome}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Mat: {it.cautela_atual.policial_matricula}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Reserva 6º BPM (Cofre)</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {canCreateOrEdit ? (
                            <button
                              onClick={() => setSelectedItemEdit(it)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                              title="Editar Dados ou Estado"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-700" />
                              <span>Editar</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Consulta</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Munições e Calibres em Estoque (TABELA EDITÁVEL E EXCLUÍVEL) */}
      {activeSubTab === 'municoes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Inventário Físico de Munições por Calibre (Tabela Operacional)
              </h2>
              <p className="text-xs text-slate-500">
                Controle simplificado por calibre e fabricante • Edição e exclusão direta com baixa segura
              </p>
            </div>
            {canCreateOrEdit && (
              <button
                onClick={() => {
                  setSelectedMunicaoEdit(null);
                  setShowEditarMunicaoModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Estoque de Munição</span>
              </button>
            )}
          </div>

          {/* Search bar for munitions */}
          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por calibre (ex: 9mm, 5.56, .40, .38), marca ou especificação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium shrink-0">
              Total: <strong>{totalMunicoesGeral.toLocaleString('pt-BR')}</strong> un. de cartuchos
            </span>
          </div>

          {/* Tabela de Munições */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Calibre</th>
                  <th className="p-3">Fabricante / Marca</th>
                  <th className="p-3">Especificação / Tipo</th>
                  <th className="p-3 text-right">No Cofre (Disponível)</th>
                  <th className="p-3 text-right">Em Cautela (Serviço)</th>
                  <th className="p-3 text-right">Total Geral</th>
                  <th className="p-3">Observações / Finalidade</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {genuineMunicoes.filter((l) => {
                  const t = searchTerm.toLowerCase();
                  return (
                    (l.calibre || '').toLowerCase().includes(t) ||
                    (l.marca || '').toLowerCase().includes(t) ||
                    (l.modelo || '').toLowerCase().includes(t) ||
                    (l.observacao || '').toLowerCase().includes(t)
                  );
                }).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Nenhum registro de munição encontrado com o filtro informado.
                    </td>
                  </tr>
                ) : (
                  genuineMunicoes
                    .filter((l) => {
                      const t = searchTerm.toLowerCase();
                      return (
                        (l.calibre || '').toLowerCase().includes(t) ||
                        (l.marca || '').toLowerCase().includes(t) ||
                        (l.modelo || '').toLowerCase().includes(t) ||
                        (l.observacao || '').toLowerCase().includes(t)
                      );
                    })
                    .map((lote, idx) => {
                      // Calculate cautelado for this lote
                      let qtdCautelada = 0;
                      for (const c of cautelasAtivas) {
                        for (const ce of c.lotes) {
                          if (ce.lote.id_lote === lote.id_lote) {
                            qtdCautelada += ce.quantidade;
                          }
                        }
                      }
                      const totalUnidade = lote.quantidade_atual + qtdCautelada;

                      return (
                        <tr key={`${lote.id_lote || 'lote'}-${idx}`} className="hover:bg-slate-50 transition">
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-black text-xs font-mono">
                              {lote.calibre || lote.tipo_item}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {lote.marca || 'CBC'}
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {lote.modelo || 'Padrão Operacional'}
                          </td>
                          <td className="p-3 text-right font-black text-amber-700 text-sm">
                            {lote.quantidade_atual.toLocaleString('pt-BR')} un.
                          </td>
                          <td className="p-3 text-right font-bold text-blue-700">
                            {qtdCautelada > 0 ? `${qtdCautelada.toLocaleString('pt-BR')} un.` : '—'}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            {totalUnidade.toLocaleString('pt-BR')} un.
                          </td>
                          <td className="p-3 max-w-xs text-slate-500 truncate" title={lote.observacao}>
                            {lote.observacao || 'Carga da Reserva Bélica'}
                          </td>
                          <td className="p-3 text-center">
                            {canCreateOrEdit ? (
                              <div className="inline-flex items-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setIsGeneralMaterialEdit(false);
                                    setSelectedMunicaoEdit(lote);
                                    setShowEditarMunicaoModal(true);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                                  title="Editar Estoque"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setLoteParaExcluir(lote);
                                    setErroExclusao(null);
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                                  title="Excluir Registro"
                                >
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Consulta</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Outros Materiais Não Serializados (Consumo Operacional - Isolados de Munições) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Outros Materiais Não Serializados (Consumo Operacional / Acessórios)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Itens controlados por quantidade que não são cartuchos de armas de fogo (não contabilizados no somatório de munições)
                </p>
              </div>
              {canCreateOrEdit && (
                <button
                  onClick={() => {
                    setIsGeneralMaterialEdit(true);
                    setSelectedMunicaoEdit(null);
                    setShowEditarMunicaoModal(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Material Não Serializado</span>
                </button>
              )}
            </div>

            {outrosNaoSerializados.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                Nenhum outro material não serializado cadastrado.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Material</th>
                      <th className="p-3">Marca / Fabricante</th>
                      <th className="p-3">Modelo</th>
                      <th className="p-3 text-right">Saldo em Estoque</th>
                      <th className="p-3">Observações</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outrosNaoSerializados.map((lote, idx) => (
                      <tr key={`${lote.id_lote || 'outros'}-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{lote.tipo_item}</td>
                        <td className="p-3 text-slate-700">{lote.marca || '—'}</td>
                        <td className="p-3 text-slate-600">{lote.modelo || '—'}</td>
                        <td className="p-3 text-right font-black text-slate-900">{lote.quantidade_atual} un.</td>
                        <td className="p-3 text-slate-500">{lote.observacao || '—'}</td>
                        <td className="p-3 text-center">
                          {canCreateOrEdit ? (
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setIsGeneralMaterialEdit(true);
                                  setSelectedMunicaoEdit(lote);
                                  setShowEditarMunicaoModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setLoteParaExcluir(lote);
                                  setErroExclusao(null);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                              >
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Consulta</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Disparos em Serviço & Reposições (NOVO) */}
      {activeSubTab === 'disparos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Histórico de Disparos em Serviço e Reposição de Munições
              </h2>
              <p className="text-xs text-slate-500">
                Registro formal de munições deflagradas em confrontos ou operações e abatimento automático do estoque
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowRegistrarDisparoModal(true)}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs transition"
              >
                <Crosshair className="w-4 h-4" />
                <span>Registrar Disparos / Repor Munições</span>
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data / Registro</th>
                  <th className="p-3">Policial Militar</th>
                  <th className="p-3">Calibre & Balística</th>
                  <th className="p-3">BO / Ocorrência</th>
                  <th className="p-3">Estojos Recolhidos</th>
                  <th className="p-3">Histórico / Fato</th>
                  <th className="p-3">Armeiro Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrosDisparo.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Nenhum registro de disparo ou reposição cadastrado.
                    </td>
                  </tr>
                ) : (
                  registrosDisparo.map((disp, idx) => (
                    <tr key={`${disp.id_disparo || 'disp'}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{formatData(disp.data_fato)}</div>
                        <div className="text-[10px] text-slate-500">{formatHora(disp.data_fato)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-blue-900">{disp.policial_grad} {disp.policial_nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Mat: {disp.policial_matricula}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-amber-900">
                          {disp.qtd_disparada} tiros ({disp.calibre})
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Reposição: {disp.qtd_reposta} munições
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {disp.numero_bo_ipm}
                        {disp.local_fato && (
                          <div className="text-[10px] font-normal text-slate-500 font-sans">
                            {disp.local_fato}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {disp.estojos_recolhidos ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Sim ({disp.qtd_estojos_recolhidos || disp.qtd_disparada} cápsulas)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Não recolhidas
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-700 text-[11px] line-clamp-2" title={disp.historico_circunstanciado}>
                          {disp.historico_circunstanciado}
                        </p>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {disp.operador_nome}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Extravios & Ocorrências (NOVO) */}
      {activeSubTab === 'extravios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ocorrências de Extravio, Furto e Perda de Material Bélico
              </h2>
              <p className="text-xs text-slate-500">
                Histórico de armamentos, coletes e munições extraviadas, BOs e portarias de IPM instauradas
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowRegistrarExtravioModal(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs transition"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Registrar Extravio</span>
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data / BO</th>
                  <th className="p-3">Tipo Ocorrência</th>
                  <th className="p-3">Policial Responsável</th>
                  <th className="p-3">Itens Extraviados</th>
                  <th className="p-3">Munições</th>
                  <th className="p-3">Histórico / Providências</th>
                  <th className="p-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrosExtravio.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Nenhum registro de extravio cadastrado.
                    </td>
                  </tr>
                ) : (
                  registrosExtravio.map((ext, idx) => (
                    <tr key={`${ext.id_extravio || 'ext'}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-rose-900">{ext.numero_bo_ipm}</div>
                        <div className="text-[10px] text-slate-500">{formatData(ext.data_fato)}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px]">
                          {ext.tipo_ocorrencia}
                        </span>
                      </td>
                      <td className="p-3">
                        {ext.policial_nome ? (
                          <div>
                            <div className="font-bold text-slate-900">{ext.policial_grad} {ext.policial_nome}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Mat: {ext.policial_matricula}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Reserva Geral</span>
                        )}
                      </td>
                      <td className="p-3">
                        {ext.itens_extraviados.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <div className="space-y-1">
                            {ext.itens_extraviados.map((item, idx) => (
                              <div key={idx} className="font-semibold text-rose-950 text-[11px]">
                                • {item.tipo_item} {item.marca} {item.modelo}
                                <span className="font-mono text-[10px] text-slate-600 block">
                                  Série: {item.numero_serie || 'S/N'} | Tombo: {item.numero_tombo || 'S/T'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {ext.municoes_extraviadas.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          ext.municoes_extraviadas.map((mun, idx) => (
                            <div key={idx} className="text-amber-900 font-bold text-[11px]">
                              {mun.quantidade} un. {mun.calibre}
                            </div>
                          ))
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-800 text-[11px] font-medium line-clamp-2" title={ext.historico_circunstanciado}>
                          {ext.historico_circunstanciado}
                        </p>
                        {ext.providencias_adotadas && (
                          <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">
                            Providências: {ext.providencias_adotadas}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {ext.operador_nome}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. Cargas Pessoais / Permanentes */}
      {activeSubTab === 'permanentes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Polícia Militar do RN • Cargas Permanentes de Arma e Colete
            </h2>
          </div>

          <TabelaCautelasAndamento
            modulo="Armas"
            cautelas={cautelasPermanentes}
            onDarBaixa={(c) => setSelectedCautelaDevolucao(c)}
            onVerComprovante={(c) => setSelectedCautelaPrint(c)}
          />
        </div>
      )}

      {/* MODAL: Nova Cautela */}
      {showNovaCautelaModal && (
        <ModalNovaCautela
          modulo="Armas"
          onClose={() => setShowNovaCautelaModal(false)}
          onSuccess={(id_cautela) => {
            setShowNovaCautelaModal(false);
            setSuccessMessage(`Cautela #${String(id_cautela).padStart(3, '0')} gerada e registrada com sucesso no sistema!`);
          }}
        />
      )}

      {/* MODAL: Novo Item */}
      {showNovoItemModal && (
        <ModalNovoItem
          modulo="Armas"
          onClose={() => setShowNovoItemModal(false)}
          onSuccess={() => {
            setShowNovoItemModal(false);
            setSuccessMessage('Item cadastrado com sucesso no inventário bélico!');
          }}
        />
      )}

      {/* MODAL: Registrar Extravio */}
      {showRegistrarExtravioModal && (
        <ModalRegistrarExtravio
          preSelectedCautelaId={selectedCautelaForExtravio?.id_cautela}
          onClose={() => {
            setShowRegistrarExtravioModal(false);
            setSelectedCautelaForExtravio(null);
          }}
          onSuccess={(id_extravio) => {
            setShowRegistrarExtravioModal(false);
            setSelectedCautelaForExtravio(null);
            setSuccessMessage(`Extravio #${id_extravio} registrado com sucesso. Patrimônios baixados/extraviados no sistema.`);
          }}
        />
      )}

      {/* MODAL: Registrar Disparo */}
      {showRegistrarDisparoModal && (
        <ModalRegistrarDisparo
          preSelectedCautelaId={selectedCautelaForDisparo?.id_cautela}
          onClose={() => {
            setShowRegistrarDisparoModal(false);
            setSelectedCautelaForDisparo(null);
          }}
          onSuccess={(id_disparo) => {
            setShowRegistrarDisparoModal(false);
            setSelectedCautelaForDisparo(null);
            setSuccessMessage(`Disparo #${id_disparo} e reposição de munições registrados com sucesso! Estoque abatido.`);
          }}
        />
      )}

      {/* MODAL: Editar Item */}
      {selectedItemEdit && (
        <ModalEditarItem
          item={selectedItemEdit}
          onClose={() => setSelectedItemEdit(null)}
          onSuccess={() => {
            setSelectedItemEdit(null);
            setSuccessMessage('Patrimônio atualizado com sucesso!');
          }}
        />
      )}

      {/* MODAL: Devolução / Dar Baixa */}
      {selectedCautelaDevolucao && (
        <ModalDevolucao
          cautela={selectedCautelaDevolucao}
          onClose={() => setSelectedCautelaDevolucao(null)}
          onSuccess={() => {
            setSelectedCautelaDevolucao(null);
            setSuccessMessage('Baixa e recolhimento efetuados com sucesso. Itens devolvidos à reserva!');
          }}
        />
      )}

      {/* MODAL: Termo de Cautela (Printable Comprovante) */}
      {selectedCautelaPrint && (
        <TermoCautelaPrint
          cautela={selectedCautelaPrint}
          onClose={() => setSelectedCautelaPrint(null)}
        />
      )}

      {/* MODAL: Cadastrar / Editar Munição ou Material Não Serializado */}
      {showEditarMunicaoModal && (
        <ModalEditarMunicao
          municao={selectedMunicaoEdit}
          isGeneralMaterial={isGeneralMaterialEdit}
          onClose={() => {
            setShowEditarMunicaoModal(false);
            setSelectedMunicaoEdit(null);
          }}
          onSuccess={() => {
            setShowEditarMunicaoModal(false);
            setSelectedMunicaoEdit(null);
            setSuccessMessage('Estoque atualizado com sucesso no sistema!');
          }}
        />
      )}

      {/* MODAL: Confirmação de Exclusão de Lote / Estoque */}
      {loteParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Confirmar Exclusão de Registro</h3>
                <p className="text-xs text-rose-700">Reserva de Armamento • 6º BPM</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {erroExclusao && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erroExclusao}</span>
                </div>
              )}

              <p className="text-sm text-slate-800 leading-relaxed">
                Tem certeza que deseja excluir o registro de estoque de{' '}
                <strong className="text-slate-900 font-bold">
                  "{loteParaExcluir.calibre || loteParaExcluir.tipo_item}"
                </strong>{' '}
                ({loteParaExcluir.marca || ''} {loteParaExcluir.modelo || ''}) com saldo físico de{' '}
                <strong className="text-rose-700 font-bold">{loteParaExcluir.quantidade_atual} unidades</strong>?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ Esta ação removerá o material do inventário do 6º BPM. Se houver cautelas ativas pendentes contendo este item, a exclusão será bloqueada para preservar a integridade fiscal.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setLoteParaExcluir(null);
                  setErroExclusao(null);
                }}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = db.excluirLote(loteParaExcluir.id_lote);
                  if (res.success) {
                    setSuccessMessage(
                      `Registro "${loteParaExcluir.calibre || loteParaExcluir.tipo_item}" excluído com sucesso!`
                    );
                    setLoteParaExcluir(null);
                    setErroExclusao(null);
                  } else {
                    setErroExclusao(res.error || 'Erro ao excluir o registro de estoque.');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center space-x-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Sim, Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
