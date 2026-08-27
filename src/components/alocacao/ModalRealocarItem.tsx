import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { ItemComDetalhes, StatusItem, ModuloTipo } from '../../types/database';
import {
  X,
  Truck,
  Building2,
  MapPin,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ShieldCheck,
  Radio,
  Smartphone,
  Monitor,
  Cpu,
  Armchair,
  Package,
} from 'lucide-react';

interface ModalRealocarItemProps {
  item: ItemComDetalhes;
  modulo?: ModuloTipo;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}

export const ModalRealocarItem: React.FC<ModalRealocarItemProps> = ({
  item,
  modulo,
  onClose,
  onSuccess,
}) => {
  const { db, unidades } = useDatabase();

  const currentModulo = modulo || (item.modulo_sistema as ModuloTipo) || 'Móveis e Diversos';
  const isCurrentlyAlocado = item.status === 'Alocado' && !!item.alocacao_atual;
  
  const defaultSedeName =
    currentModulo === 'Viaturas'
      ? 'Pátio da Sede (Caicó)'
      : currentModulo === 'Comunicação'
      ? 'Sala de Rádio / P3 (Sede)'
      : currentModulo === 'Informática'
      ? 'Depósito de TI / P4 (Sede)'
      : 'Depósito Geral da P4 (Sede)';

  const currentUnidadeNome = item.alocacao_atual?.unidade_nome || defaultSedeName;

  // Action type: 'retornar_sede' | 'transferir_unidade'
  const [tipoAcao, setTipoAcao] = useState<'retornar_sede' | 'transferir_unidade'>(
    isCurrentlyAlocado ? 'retornar_sede' : 'transferir_unidade'
  );

  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | ''>(
    item.alocacao_atual?.id_unidade || ''
  );

  const [novoStatus, setNovoStatus] = useState<StatusItem>(
    isCurrentlyAlocado && tipoAcao === 'retornar_sede' ? 'Disponível' : 'Alocado'
  );

  const [motivo, setMotivo] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionChange = (acao: 'retornar_sede' | 'transferir_unidade') => {
    setTipoAcao(acao);
    if (acao === 'retornar_sede') {
      setNovoStatus('Disponível');
    } else {
      setNovoStatus('Alocado');
    }
  };

  const getModuleIcon = () => {
    switch (currentModulo) {
      case 'Viaturas':
        return <Truck className="w-5 h-5" />;
      case 'Comunicação':
        return <Radio className="w-5 h-5" />;
      case 'Informática':
        return <Monitor className="w-5 h-5" />;
      case 'Móveis e Diversos':
      default:
        return <Armchair className="w-5 h-5" />;
    }
  };

  const getItemIdentifier = () => {
    if (item.detalhe_viatura) {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-xs bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded">
            {item.detalhe_viatura.prefixo || 'VTR'}
          </span>
          <span className="font-mono font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-amber-300">
            {item.detalhe_viatura.placa || 'S/ PLACA'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        {item.numero_tombo && (
          <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
            Tombo: {item.numero_tombo}
          </span>
        )}
        {item.numero_serie && (
          <span className="font-mono text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
            Série: {item.numero_serie}
          </span>
        )}
        {item.detalhe_comunicacao?.imei_mac && (
          <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            MAC: {item.detalhe_comunicacao.imei_mac}
          </span>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (tipoAcao === 'transferir_unidade') {
        if (!selectedUnidadeId) {
          setErrorMessage('Selecione a Unidade, Setor ou Destacamento de destino.');
          setIsSubmitting(false);
          return;
        }

        const res = db.realocarItem({
          id_item: item.id_item,
          id_unidade_destino: Number(selectedUnidadeId),
          novoStatus: 'Alocado',
          motivo: motivo.trim() || undefined,
        });

        if (res.success) {
          const targetUnid = unidades.find((u) => u.id_unidade === Number(selectedUnidadeId));
          onSuccess(
            `Item "${item.tipo_item} ${item.modelo || ''}" realocado para ${targetUnid?.nome || 'nova unidade'} com sucesso!`
          );
        } else {
          setErrorMessage(res.error || 'Erro ao transferir item para unidade.');
          setIsSubmitting(false);
        }
      } else {
        // Retornar para Sede
        const res = db.devolverItemAlocacao(
          item.id_item,
          novoStatus,
          motivo.trim() || undefined
        );

        if (res.success) {
          onSuccess(
            `Item "${item.tipo_item} ${item.modelo || ''}" retornado à sede (Status: ${novoStatus}) com sucesso!`
          );
        } else {
          setErrorMessage(res.error || 'Erro ao retornar item para a sede.');
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado na movimentação.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-xs font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Movimentação & Realocação Patrimonial
              </h2>
              <p className="text-xs text-slate-400">
                Transferência entre Unidades/Setores ou Retorno à Sede • 6º BPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-800">
              {getModuleIcon()}
            </div>
            <div>
              {getItemIdentifier()}
              <p className="font-bold text-slate-900 text-xs mt-1">
                {item.tipo_item} - {item.marca} {item.modelo}
              </p>
              {item.detalhe_informatica?.configuracao_resumida && (
                <p className="text-[10px] text-slate-500 font-mono">
                  {item.detalhe_informatica.configuracao_resumida}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lotação Atual</div>
            <div className="font-bold text-indigo-900 text-xs">{currentUnidadeNome}</div>
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold mt-1 ${
                item.status === 'Disponível'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : item.status === 'Alocado'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Status: {item.status}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Escolha da Ação */}
          <div>
            <label className="block font-bold text-slate-900 mb-2">
              1. Selecione o Tipo de Movimentação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleActionChange('retornar_sede')}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                  tipoAcao === 'retornar_sede'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    tipoAcao === 'retornar_sede'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Retornar para a Sede (P4)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Reserva Geral / Depósito de Material do 6º BPM
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleActionChange('transferir_unidade')}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                  tipoAcao === 'transferir_unidade'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    tipoAcao === 'transferir_unidade'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Alocar em outra Unidade / Setor</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Transferir para CPM / DPM / Seção
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Selecionar Unidade de Destino (se transferir) */}
          {tipoAcao === 'transferir_unidade' && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block font-bold text-slate-900">
                2. Unidade, Setor ou Destacamento de Destino
              </label>
              <select
                value={selectedUnidadeId}
                onChange={(e) => setSelectedUnidadeId(Number(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-600 shadow-xs"
              >
                <option value="" disabled>
                  Selecione a Unidade ou Setor do 6º BPM...
                </option>
                {unidades.map((u) => (
                  <option key={u.id_unidade} value={u.id_unidade}>
                    [{u.tipo_unidade}] {u.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Condição do Material / Status pós-movimentação */}
          {tipoAcao === 'retornar_sede' && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block font-bold text-slate-900">
                2. Condição do Material na Chegada à Sede
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNovoStatus('Disponível')}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                    novoStatus === 'Disponível'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <div className="text-[11px]">Disponível</div>
                  <div className="text-[9px] text-slate-500">Pronto p/ redistribuição</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNovoStatus('Manutenção')}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                    novoStatus === 'Manutenção'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <div className="text-[11px]">Manutenção</div>
                  <div className="text-[9px] text-slate-500">Revisão técnica</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNovoStatus('Danificado / Avariado')}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                    novoStatus === 'Danificado / Avariado'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <div className="text-[11px]">Avariado</div>
                  <div className="text-[9px] text-slate-500">Requer reparos/baixa</div>
                </button>
              </div>
            </div>
          )}

          {/* 4. Motivo / Justificativa */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              3. Motivo / Justificativa da Movimentação (Opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Remanejamento para novo setor, recolhimento para manutenção..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-600 shadow-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Salvando...'
                  : tipoAcao === 'transferir_unidade'
                  ? 'Confirmar Transferência'
                  : 'Confirmar Retorno à Sede'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
