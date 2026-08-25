import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  Truck,
  Plus,
  Building2,
  FolderPlus,
  Search,
  CheckCircle2,
  Package,
  RotateCcw,
  MapPin,
  FileDown,
  Edit,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Filter,
} from 'lucide-react';
import { ModalNovaAlocacao } from '../alocacao/ModalNovaAlocacao';
import { ModalNovoItem } from '../item/ModalNovoItem';
import { ModalEditarItem } from '../item/ModalEditarItem';
import { PdfReportService } from '../../services/pdfReportService';
import { ItemComDetalhes } from '../../types/database';

export const ViaturasModule: React.FC = () => {
  const { db, canPerformAlocacao } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Disponível' | 'Alocado' | 'Manutenção'>('Todos');
  const [showNovaAlocacaoModal, setShowNovaAlocacaoModal] = useState(false);
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [selectedItemEdit, setSelectedItemEdit] = useState<ItemComDetalhes | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemComDetalhes | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const allItens = db.getItensComDetalhes('Viaturas');
  const allAlocacoes = db.getAlocacoesCompletas('Viaturas');

  const totalFrota = allItens.length;
  const viaturasAlocadas = allItens.filter((i) => i.status === 'Alocado').length;
  const viaturasDisponiveis = allItens.filter((i) => i.status === 'Disponível').length;
  const viaturasManutencao = allItens.filter(
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
      (i.detalhe_viatura?.placa || '').toLowerCase().includes(term) ||
      (i.detalhe_viatura?.prefixo || '').toLowerCase().includes(term)
    );
  });

  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    setErroExclusao(null);

    const res = db.excluirItem(itemParaExcluir.id_item);
    if (res.success) {
      setItemParaExcluir(null);
      setSuccessMessage('Viatura excluída do sistema com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErroExclusao(res.error || 'Erro ao excluir viatura.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Módulo 3: Viaturas & Frota Operacional</h1>
            <p className="text-xs text-slate-500">
              Controle por Tipo, Marca, Modelo, Placa, Prefixo e Lotações em CPMs/DPMs • 6º BPM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfReportService.gerarRelatorioViaturas(db)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer"
            title="Baixar Relatório Oficial da Frota em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>

          {canPerformAlocacao && (
            <button
              onClick={() => setShowNovaAlocacaoModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>ALOCAR EM UNIDADE</span>
            </button>
          )}
          <button
            onClick={() => setShowNovoItemModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm shadow-amber-600/30 transition cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Cadastrar Viatura</span>
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
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Frota Total</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalFrota}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Veículos cadastrados</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alocadas (CPMs/DPMs)</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-indigo-600 tracking-tight">{viaturasAlocadas}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Em patrulhamento regional</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponíveis (Sede)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{viaturasDisponiveis}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Prontas para serviço</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Manutenção / Avarias</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-rose-600 tracking-tight">{viaturasManutencao}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Oficina / aguardando peças</div>
          </div>
        </div>
      </div>

      {/* Alocações Ativas */}
      {allAlocacoes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Cargas Alocadas por Companhia e Destacamento (CPMs e DPMs)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <span className="font-semibold">
                          {it.detalhe_viatura?.prefixo || 'VTR'} - {it.marca} {it.modelo}
                        </span>
                        <span className="font-mono text-amber-700 font-bold text-[11px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {it.detalhe_viatura?.placa || '-'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Alocado por: {aloc.operador.policial.patente} {aloc.operador.policial.nome_guerra} (P/4 Logística)
                  </div>
                </div>

                {canPerformAlocacao && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => {
                        db.finalizarAlocacao(aloc.id_alocacao);
                        setSuccessMessage('Viatura retornada à sede com sucesso!');
                        setTimeout(() => setSuccessMessage(null), 4000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs inline-flex items-center space-x-1 font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retornar para Sede</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fleet Table (tipo, marca, modelo, placa, prefixo e status) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabela de Viaturas e Veículos Operacionais ({filteredItens.length})
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie a frota com busca rápida por prefixo, placa oficial, marca/modelo e ações de edição e exclusão.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(['Todos', 'Disponível', 'Alocado', 'Manutenção'] as const).map((st) => (
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
                placeholder="Buscar prefixo, placa, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Prefixo</th>
                <th className="p-3">Placa Oficial</th>
                <th className="p-3">Tipo de Veículo</th>
                <th className="p-3">Marca / Modelo</th>
                <th className="p-3">Status</th>
                <th className="p-3">Lotação / Emprego</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma viatura encontrada com os filtros e termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredItens.map((it, idx) => (
                  <tr key={`${it.id_item || 'vtr'}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {it.detalhe_viatura?.prefixo || 'VTR-0600'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 text-xs">
                      {it.detalhe_viatura?.placa || 'S/ PLACA'}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {it.tipo_item}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {it.marca} {it.modelo}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {it.observacao || 'Viatura operacional caracterizada'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                          it.status === 'Disponível'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : it.status === 'Alocado'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
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
                      {it.alocacao_atual ? (
                        <span className="text-indigo-700 font-bold">
                          {it.alocacao_atual.unidade_nome}
                        </span>
                      ) : (
                        <span className="text-slate-500">Pátio da Sede (Caicó)</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedItemEdit(it)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                          title="Editar Dados da Viatura"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-700" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setErroExclusao(null);
                            setItemParaExcluir(it);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Excluir Viatura do Sistema"
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

      {showNovaAlocacaoModal && (
        <ModalNovaAlocacao
          modulo="Viaturas"
          onClose={() => setShowNovaAlocacaoModal(false)}
          onSuccess={() => {
            setShowNovaAlocacaoModal(false);
            setSuccessMessage('Alocação de viatura realizada com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {showNovoItemModal && (
        <ModalNovoItem
          modulo="Viaturas"
          onClose={() => setShowNovoItemModal(false)}
          onSuccess={() => {
            setShowNovoItemModal(false);
            setSuccessMessage('Viatura cadastrada com sucesso na frota!');
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
            setSuccessMessage('Dados da viatura atualizados com sucesso!');
            setTimeout(() => setSuccessMessage(null), 4000);
          }}
        />
      )}

      {/* Modal Confirmação de Exclusão de Viatura */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Excluir Viatura</h3>
                <p className="text-xs text-rose-700">Frota de Viaturas • 6º BPM</p>
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
                Tem certeza que deseja excluir a viatura{' '}
                <strong className="text-slate-950">
                  {itemParaExcluir.detalhe_viatura?.prefixo || ''} - {itemParaExcluir.marca} {itemParaExcluir.modelo} (Placa {itemParaExcluir.detalhe_viatura?.placa || 'S/N'})
                </strong>?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600 text-xs">
                <div className="flex justify-between">
                  <span>Status Atual:</span>
                  <strong className="text-slate-900">{itemParaExcluir.status}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Lotação:</span>
                  <strong className="text-slate-900">{itemParaExcluir.alocacao_atual?.unidade_nome || 'Sede'}</strong>
                </div>
              </div>

              <p className="text-rose-600 font-semibold text-[11px]">
                Esta ação removerá o veículo permanentemente do inventário da frota.
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
                <span>Sim, Excluir Viatura</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
