import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  PackageCheck,
  Plus,
  Building2,
  FolderPlus,
  Search,
  CheckCircle2,
  Package,
  RotateCcw,
  Shield,
  Armchair,
  Layers,
  Edit,
  FileDown,
} from 'lucide-react';
import { ModalNovaAlocacao } from '../alocacao/ModalNovaAlocacao';
import { ModalNovoItem } from '../item/ModalNovoItem';
import { ModalEditarItem } from '../item/ModalEditarItem';
import { PdfReportService } from '../../services/pdfReportService';
import { ItemComDetalhes } from '../../types/database';

export const MoveisModule: React.FC = () => {
  const { db, canPerformAlocacao } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNovaAlocacaoModal, setShowNovaAlocacaoModal] = useState(false);
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [selectedItemEdit, setSelectedItemEdit] = useState<ItemComDetalhes | null>(null);

  const allItens = db.getItensComDetalhes('Móveis e Diversos');
  const allAlocacoes = db.getAlocacoesCompletas('Móveis e Diversos');

  const totalMoveis = allItens.length;
  const moveisAlocados = allItens.filter((i) => i.status === 'Alocado').length;
  const moveisDisponiveis = allItens.filter((i) => i.status === 'Disponível').length;

  const filteredItens = allItens.filter((i) => {
    const term = searchTerm.toLowerCase();
    return (
      i.tipo_item.toLowerCase().includes(term) ||
      (i.marca || '').toLowerCase().includes(term) ||
      (i.modelo || '').toLowerCase().includes(term) ||
      (i.numero_serie || '').toLowerCase().includes(term) ||
      (i.numero_tombo || '').toLowerCase().includes(term) ||
      (i.observacao || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Módulo 5: Móveis & Patrimônio Diverso</h1>
            <p className="text-xs text-slate-500">
              Cofres bélicos blindados, mobiliário de escritório, condicionadores de ar e bens permanentes • 6º BPM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfReportService.gerarRelatorioModulo(db, 'Móveis e Diversos')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Exportar Relatório em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>
          {canPerformAlocacao && (
            <button
              onClick={() => setShowNovaAlocacaoModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition focus:ring-2 focus:ring-indigo-500"
            >
              <FolderPlus className="w-4 h-4" />
              <span>ALOCAR EM UNIDADE/SETOR</span>
            </button>
          )}
          <button
            onClick={() => setShowNovoItemModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Cadastrar Mobiliário</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bens Mobiliários</span>
            <Armchair className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalMoveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bens tombados no 6º BPM</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alocados em Dependências</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-indigo-600 tracking-tight">{moveisAlocados}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Em uso em Caicó, Jardim e Jucurutu</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No Depósito da P4</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{moveisDisponiveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Disponíveis para redistribuição</div>
          </div>
        </div>
      </div>

      {/* Alocações */}
      {allAlocacoes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Alocações de Mobiliário e Estrutura</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAlocacoes.map((aloc, aIdx) => (
              <div key={`${aloc.id_alocacao || 'aloc'}-${aIdx}`} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {aloc.unidade.nome}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold uppercase">
                      {aloc.unidade.tipo_unidade}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs my-2">
                    {aloc.itens.map((it, itIdx) => (
                      <div key={`${it.id_item || 'item'}-${itIdx}`} className="flex justify-between items-center text-slate-800">
                        <span className="font-medium">• {it.tipo_item} {it.marca} {it.modelo}</span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {it.numero_tombo || it.numero_serie}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {canPerformAlocacao && (
                  <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => db.finalizarAlocacao(aloc.id_alocacao)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs inline-flex items-center space-x-1 font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retornar ao Almoxarifado</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Furniture Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Inventário de Mobiliário e Diversos</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar móvel por tombo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-purple-600 shadow-xs"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Nº Tombo / Série</th>
                <th className="p-3">Descrição do Bem Patrimonial</th>
                <th className="p-3">Status</th>
                <th className="p-3">Unidade / Local de Instalação</th>
                <th className="p-3">Observação</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItens.map((it, idx) => (
                <tr key={`${it.id_item || 'mov'}-${idx}`} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">
                    <div>{it.numero_tombo || '-'}</div>
                    <div className="text-[10px] text-slate-500 font-normal">Série: {it.numero_serie || 'S/N'}</div>
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {it.tipo_item} {it.marca} {it.modelo}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                        it.status === 'Disponível'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : it.status === 'Alocado'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : it.status === 'Danificado / Avariado'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {it.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">
                    {it.alocacao_atual ? (
                      <span className="text-indigo-700 font-bold">{it.alocacao_atual.unidade_nome}</span>
                    ) : (
                      <span className="text-slate-500">Almoxarifado P4 (Sede)</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {it.observacao || '-'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedItemEdit(it)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                      title="Editar Móvel"
                    >
                      <Edit className="w-3.5 h-3.5 text-purple-700" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNovaAlocacaoModal && (
        <ModalNovaAlocacao
          modulo="Móveis e Diversos"
          onClose={() => setShowNovaAlocacaoModal(false)}
          onSuccess={() => setShowNovaAlocacaoModal(false)}
        />
      )}

      {showNovoItemModal && (
        <ModalNovoItem
          modulo="Móveis e Diversos"
          onClose={() => setShowNovoItemModal(false)}
          onSuccess={() => setShowNovoItemModal(false)}
        />
      )}

      {selectedItemEdit && (
        <ModalEditarItem
          item={selectedItemEdit}
          onClose={() => setSelectedItemEdit(null)}
          onSuccess={() => setSelectedItemEdit(null)}
        />
      )}
    </div>
  );
};
