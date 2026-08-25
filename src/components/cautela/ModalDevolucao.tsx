import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { CautelaCompleta } from '../../types/database';
import {
  X,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  PackageCheck,
  ShieldAlert,
  AlertOctagon,
  Wrench,
  HelpCircle,
  Scale,
} from 'lucide-react';

interface ModalDevolucaoProps {
  cautela: CautelaCompleta;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalDevolucao: React.FC<ModalDevolucaoProps> = ({ cautela, onClose, onSuccess }) => {
  const { db } = useDatabase();

  const [devolucoes, setDevolucoes] = useState<
    Array<{
      id_item: number;
      observacao: string;
      status_destino: 'Disponível' | 'Manutenção' | 'Em apuração' | 'Extraviado';
    }>
  >(
    cautela.itens.map((ci) => ({
      id_item: ci.item.id_item,
      observacao: 'Material devolvido em perfeito estado operacional e limpo.',
      status_destino: 'Disponível',
    }))
  );

  const [lotesDevolvidos, setLotesDevolvidos] = useState<
    Array<{ id_lote: number; quantidadeTotal: number; quantidadeDevolvida: number }>
  >(
    cautela.lotes.map((cl) => {
      const loteId = cl.lote?.id_lote ?? cl.id_lote;
      return {
        id_lote: loteId,
        quantidadeTotal: cl.quantidade,
        quantidadeDevolvida: cl.quantidade,
      };
    })
  );

  const [reporEstoque, setReporEstoque] = useState(true);
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSetStatusDestino = (
    id_item: number,
    status: 'Disponível' | 'Manutenção' | 'Em apuração' | 'Extraviado'
  ) => {
    setDevolucoes(
      devolucoes.map((d) => {
        if (d.id_item === id_item) {
          let autoObs = d.observacao;
          if (status === 'Disponível') {
            autoObs = 'Material devolvido em perfeito estado operacional e limpo.';
          } else if (status === 'Manutenção') {
            autoObs = 'Apresenta avarias / necessidade de reparo ou limpeza na armaria.';
          } else if (status === 'Em apuração') {
            autoObs = 'Material retido pela Justiça / Perícia / IPM para apuração de fatos.';
          } else if (status === 'Extraviado') {
            autoObs = 'Material NÃO devolvido pelo policial (Extraviado/Subtraído em serviço).';
          }
          return {
            ...d,
            status_destino: status,
            observacao: autoObs,
          };
        }
        return d;
      })
    );
  };

  const handleUpdateObs = (id_item: number, obs: string) => {
    setDevolucoes(
      devolucoes.map((d) => (d.id_item === id_item ? { ...d, observacao: obs } : d))
    );
  };

  const handleUpdateQtdLote = (id_lote: number, qtd: number) => {
    setLotesDevolvidos(
      lotesDevolvidos.map((ld) =>
        ld.id_lote === id_lote
          ? { ...ld, quantidadeDevolvida: Math.max(0, Math.min(ld.quantidadeTotal, qtd)) }
          : ld
      )
    );
  };

  const hasExtravio = devolucoes.some((d) => d.status_destino === 'Extraviado');
  const hasManutencao = devolucoes.some((d) => d.status_destino === 'Manutenção');
  const hasMunicaoFaltante = lotesDevolvidos.some(
    (ld) => ld.quantidadeDevolvida < ld.quantidadeTotal
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = db.finalizarCautela({
      id_cautela: cautela.id_cautela,
      devolucoes: devolucoes.map((d) => ({
        id_item: d.id_item,
        status_destino: d.status_destino,
        observacao_estado_devolucao: d.observacao,
      })),
      lotesDevolvidos: lotesDevolvidos.map((ld) => ({
        id_lote: ld.id_lote,
        quantidadeDevolvida: ld.quantidadeDevolvida,
      })),
      reporEstoque,
      observacaoGeral: observacaoGeral.trim() || undefined,
    });

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao finalizar devolução.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Devolução e Conferência de Cautela • Nº {String(cautela.id_cautela).padStart(5, '0')}
              </h2>
              <p className="text-xs text-slate-500">
                Policial: <strong>{cautela.policial.patente} {cautela.policial.nome_guerra}</strong> ({cautela.policial.matricula})
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
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {(hasExtravio || hasMunicaoFaltante) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2.5">
              <AlertOctagon className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Atenção: Itens com Pendência ou Extravio Detectados</strong>
                <span>
                  Materiais marcados como <strong>Extraviado</strong> não retornarão ao saldo disponível da reserva e ficarão registrados no histórico do policial. Munições consumidas/disparadas não serão somadas ao cofre.
                </span>
              </div>
            </div>
          )}

          {/* Checklist de Itens para Inspeção */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900">
                1. Conferência e Estado Físico dos Equipamentos:
              </label>
              <span className="text-[11px] text-slate-500">Defina a condição de cada material</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cautela.itens.map((ci, ciIdx) => {
                const devState = devolucoes.find((d) => d.id_item === ci.item.id_item);
                const currentStatus = devState?.status_destino || 'Disponível';

                return (
                  <div
                    key={`${ci.item.id_item || 'item'}-${ciIdx}`}
                    className={`p-3.5 rounded-xl border transition ${
                      currentStatus === 'Disponível'
                        ? 'bg-slate-50 border-slate-200'
                        : currentStatus === 'Manutenção'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-rose-50 border-rose-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                          <span>{ci.item.tipo_item} {ci.item.marca} {ci.item.modelo}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            [{ci.item.numero_tombo || ci.item.numero_serie || 'S/N'}]
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Entrega: {ci.observacao_estado_entrega || 'Conforme'}
                        </div>
                      </div>

                      {/* Status Selector Buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetStatusDestino(ci.item.id_item, 'Disponível')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center space-x-1 ${
                            currentStatus === 'Disponível'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Conforme (Disponível)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatusDestino(ci.item.id_item, 'Manutenção')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center space-x-1 ${
                            currentStatus === 'Manutenção'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Manutenção</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatusDestino(ci.item.id_item, 'Em apuração')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center space-x-1 ${
                            currentStatus === 'Em apuração'
                              ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Scale className="w-3 h-3" />
                          <span>Em Apuração</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatusDestino(ci.item.id_item, 'Extraviado')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition inline-flex items-center space-x-1 ${
                            currentStatus === 'Extraviado'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <AlertOctagon className="w-3 h-3" />
                          <span>Extraviado</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Observações do armeiro na devolução..."
                      value={devState?.observacao || ''}
                      onChange={(e) => handleUpdateObs(ci.item.id_item, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-[11px] focus:outline-none focus:border-emerald-600 shadow-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Munições */}
          {cautela.lotes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900">2. Conferência de Munições Retornadas:</div>
                <span className="text-[11px] text-slate-500">Ajuste caso tenha havido disparo/consumo</span>
              </div>

              <div className="space-y-2">
                {cautela.lotes.map((cl, clIdx) => {
                  const loteId = cl.lote?.id_lote ?? cl.id_lote;
                  const loteDev = lotesDevolvidos.find((ld) => ld.id_lote === loteId);
                  const qtdDev = loteDev !== undefined ? loteDev.quantidadeDevolvida : cl.quantidade;
                  const diferenca = cl.quantidade - qtdDev;

                  return (
                    <div key={`${loteId}-${clIdx}`} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {cl.lote.tipo_item} {cl.lote.calibre}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Cauteladas: <strong>{cl.quantidade} un.</strong> • Lote: {cl.lote.lote_fabricacao || 'Padrão'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <label className="text-[11px] text-slate-600 font-semibold">Devolvidas:</label>
                          <input
                            type="number"
                            min={0}
                            max={cl.quantidade}
                            value={qtdDev}
                            onChange={(e) => handleUpdateQtdLote(loteId, Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-center"
                          />
                        </div>

                        {diferenca > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                            -{diferenca} Disparadas / Consumidas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={reporEstoque}
                  onChange={(e) => setReporEstoque(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Restituir as quantidades conferidas de volta ao saldo do cofre</span>
              </label>
            </div>
          )}

          {/* Observação Geral */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Observação Geral do Fechamento da Cautela (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Turno encerrado sem alterações operacionais..."
              value={observacaoGeral}
              onChange={(e) => setObservacaoGeral(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Confirmar Recebimento e Baixa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
