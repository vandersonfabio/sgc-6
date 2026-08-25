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
} from 'lucide-react';
import { ModalNovaCautela } from '../cautela/ModalNovaCautela';
import { ModalDevolucao } from '../cautela/ModalDevolucao';
import { TermoCautelaPrint } from '../cautela/TermoCautelaPrint';
import { ModalNovoItem } from '../item/ModalNovoItem';
import { ModalEditarItem } from '../item/ModalEditarItem';
import { TabelaCautelasAndamento } from '../cautela/TabelaCautelasAndamento';
import { PdfReportService } from '../../services/pdfReportService';
import { CautelaCompleta, ItemComDetalhes } from '../../types/database';

export const ComunicacaoModule: React.FC = () => {
  const { db } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNovaCautelaModal, setShowNovaCautelaModal] = useState(false);
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [selectedCautelaDevolucao, setSelectedCautelaDevolucao] = useState<CautelaCompleta | null>(null);
  const [selectedCautelaPrint, setSelectedCautelaPrint] = useState<CautelaCompleta | null>(null);
  const [selectedItemEdit, setSelectedItemEdit] = useState<ItemComDetalhes | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const allItens = db.getItensComDetalhes('Comunicação');
  const allCautelas = db.getCautelasCompletas('Comunicação');

  const totalRadios = allItens.filter((i) => i.tipo_item.toLowerCase().includes('rádio') || i.tipo_item.toLowerCase().includes('ht')).length;
  const radiosDisponiveis = allItens.filter(
    (i) => (i.tipo_item.toLowerCase().includes('rádio') || i.tipo_item.toLowerCase().includes('ht')) && i.status === 'Disponível'
  ).length;
  const smartphones = allItens.filter((i) => i.tipo_item.toLowerCase().includes('smart') || i.tipo_item.toLowerCase().includes('celular'));
  const cautelasAtivas = allCautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

  const filteredItens = allItens.filter((i) => {
    const term = searchTerm.toLowerCase();
    return (
      i.tipo_item.toLowerCase().includes(term) ||
      (i.marca || '').toLowerCase().includes(term) ||
      (i.modelo || '').toLowerCase().includes(term) ||
      (i.numero_serie || '').toLowerCase().includes(term) ||
      (i.numero_tombo || '').toLowerCase().includes(term) ||
      (i.detalhe_comunicacao?.imei_mac || '').toLowerCase().includes(term) ||
      (i.detalhe_comunicacao?.numero_linha || '').toLowerCase().includes(term)
    );
  });

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
              Controle de radiotransmissores HT digitais, rádios veiculares e smartphones funcionais • 6º BPM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfReportService.gerarRelatorioModulo(db, 'Comunicação')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Exportar Relatório de Comunicação em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>
          <button
            onClick={() => setShowNovaCautelaModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="w-4 h-4" />
            <span>CAUTELAR RÁDIO / HT</span>
          </button>
          <button
            onClick={() => setShowNovoItemModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition"
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

      {/* KPI Cards (Bento Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Radiotransmissores</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalRadios}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">HTs e rádios veiculares</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HTs na Base</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{radiosDisponiveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Prontos / Bateria 100%</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Smartphones</span>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{smartphones.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Linhas operacionais ativas</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cautelas Ativas</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-amber-600 tracking-tight">{cautelasAtivas.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Equipamentos em campo</div>
          </div>
        </div>
      </div>

      {/* Cautelas de Rádio Ativas em Tabela com Busca por Matrícula */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Cautelas de Comunicação em Andamento (Gerenciamento e Baixa)
        </h2>
        <TabelaCautelasAndamento
          modulo="Comunicação"
          cautelas={cautelasAtivas}
          onDarBaixa={(c) => setSelectedCautelaDevolucao(c)}
          onVerComprovante={(c) => setSelectedCautelaPrint(c)}
        />
      </div>

      {/* Equipment List with Edit */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Inventário de Radiocomunicação e Equipamentos</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por modelo, IMEI, linha ou série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Equipamento</th>
                <th className="p-3">Identificação / MAC / IMEI</th>
                <th className="p-3">Linha / Frequência</th>
                <th className="p-3">Status</th>
                <th className="p-3">Localização / Posse</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItens.map((it, idx) => (
                <tr key={`${it.id_item || 'com'}-${idx}`} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {it.tipo_item} {it.marca} {it.modelo}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Tombo: {it.numero_tombo || '-'} • Série: {it.numero_serie || '-'}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {it.detalhe_comunicacao?.imei_mac || it.numero_serie || '-'}
                  </td>
                  <td className="p-3 text-emerald-700 font-semibold">
                    {it.detalhe_comunicacao?.numero_linha || 'Rede Digital P25'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                        it.status === 'Disponível'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : it.status === 'Cautelado'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : it.status === 'Danificado / Avariado'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : it.status === 'Manutenção'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {it.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">
                    {it.cautela_atual ? (
                      <div>
                        <span className="font-bold text-slate-900">
                          {it.cautela_atual.policial_grad} {it.cautela_atual.policial_nome}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Cautela #{it.cautela_atual.id_cautela}
                        </span>
                      </div>
                    ) : it.alocacao_atual ? (
                      <span className="text-indigo-700 font-semibold">
                        Alocado: {it.alocacao_atual.unidade_nome}
                      </span>
                    ) : (
                      <span className="text-slate-500">Sala de Rádio (Sede)</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedItemEdit(it)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                      title="Editar Item"
                    >
                      <Edit className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNovaCautelaModal && (
        <ModalNovaCautela
          modulo="Comunicação"
          onClose={() => setShowNovaCautelaModal(false)}
          onSuccess={(id) => {
            setShowNovaCautelaModal(false);
            setSuccessMessage(`Cautela de comunicação #${String(id).padStart(3, '0')} registrada com sucesso!`);
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
          }}
        />
      )}

      {selectedCautelaPrint && (
        <TermoCautelaPrint
          cautela={selectedCautelaPrint}
          onClose={() => setSelectedCautelaPrint(null)}
        />
      )}
    </div>
  );
};
