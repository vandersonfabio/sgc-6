import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { ModuloTipo, Unidade } from '../../types/database';
import {
  X,
  Building2,
  Truck,
  Monitor,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';

interface ModalNovaAlocacaoProps {
  modulo: ModuloTipo;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalNovaAlocacao: React.FC<ModalNovaAlocacaoProps> = ({ modulo, onClose, onSuccess }) => {
  const { db, unidades } = useDatabase();

  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | ''>('');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available items of this module
  const availableItems = db
    .getItensComDetalhes(modulo)
    .filter((it) => it.status === 'Disponível');

  const handleToggleItem = (id_item: number) => {
    if (selectedItemIds.includes(id_item)) {
      setSelectedItemIds(selectedItemIds.filter((id) => id !== id_item));
    } else {
      setSelectedItemIds([...selectedItemIds, id_item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedUnidadeId) {
      setErrorMessage('Selecione a Unidade ou Destacamento (DPM) de destino.');
      return;
    }

    if (selectedItemIds.length === 0) {
      setErrorMessage('Selecione ao menos um item patrimonial para alocar.');
      return;
    }

    const res = db.createAlocacao({
      id_unidade: Number(selectedUnidadeId),
      itensIds: selectedItemIds,
    });

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao registrar alocação.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nova Alocação de Carga • {modulo}
              </h2>
              <p className="text-xs text-slate-500">
                Transferência patrimonial para Companhia ou Destacamento Policial (DPM) • 6º BPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Unidade Destino */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              1. Unidade / Companhia / Destacamento de Destino
            </label>
            <select
              value={selectedUnidadeId ?? ''}
              onChange={(e) => setSelectedUnidadeId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-600 shadow-xs"
            >
              <option value="" disabled>
                Selecione a Unidade do 6º BPM...
              </option>
              {unidades.map((u) => (
                <option key={u.id_unidade} value={u.id_unidade}>
                  [{u.tipo_unidade}] {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Seleção de Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900">
                2. Selecione os Itens Disponíveis ({availableItems.length} na Reserva Geral)
              </label>
              <span className="text-[11px] text-indigo-700 font-bold">
                {selectedItemIds.length} selecionados
              </span>
            </div>

            {availableItems.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium">
                Nenhum item disponível para alocação no momento. Todos os itens de {modulo} já estão alocados ou em manutenção.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                {availableItems.map((it, itIdx) => {
                  const isChecked = selectedItemIds.includes(it.id_item);
                  return (
                    <div
                      key={`${it.id_item || 'aloc-it'}-${itIdx}`}
                      onClick={() => handleToggleItem(it.id_item)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {it.tipo_item} {it.marca} {it.modelo}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {it.detalhe_viatura && `Placa: ${it.detalhe_viatura.placa} • Chassi: ${it.detalhe_viatura.chassi}`}
                            {it.detalhe_informatica && it.detalhe_informatica.configuracao_resumida}
                            {!it.detalhe_viatura && !it.detalhe_informatica && (it.numero_tombo || it.numero_serie || 'Sem numeração')}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                        {it.numero_tombo || it.numero_serie || `ID-${it.id_item}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={availableItems.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Registrar Alocação de Carga</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
