import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { CautelaCompleta, ItemComDetalhes } from '../../types/database';
import {
  X,
  AlertOctagon,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  User,
  Package,
} from 'lucide-react';

interface ModalRegistrarExtravioProps {
  onClose: () => void;
  onSuccess: (id_extravio: number) => void;
  preSelectedCautelaId?: number;
}

export const ModalRegistrarExtravio: React.FC<ModalRegistrarExtravioProps> = ({
  onClose,
  onSuccess,
  preSelectedCautelaId,
}) => {
  const { db, lotes } = useDatabase();

  const allCautelasArmas = db.getCautelasCompletas('Armas');
  const activeCautelas = allCautelasArmas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

  const [origem, setOrigem] = useState<'cautela' | 'reserva'>('cautela');
  const [selectedCautelaId, setSelectedCautelaId] = useState<number | ''>(
    preSelectedCautelaId || (activeCautelas[0]?.id_cautela || '')
  );

  const selectedCautela = activeCautelas.find((c) => c.id_cautela === Number(selectedCautelaId));

  const [dataFato, setDataFato] = useState(new Date().toISOString().slice(0, 16));
  const [numeroBoIpm, setNumeroBoIpm] = useState('');
  const [tipoOcorrencia, setTipoOcorrencia] = useState<
    'Extravio em Serviço' | 'Furto / Roubo' | 'Perda em Operação' | 'Sinistro / Acidente'
  >('Extravio em Serviço');
  const [historico, setHistorico] = useState('');
  const [providencias, setProvidencias] = useState('Lavratura de BO e abertura de Inquérito Policial Militar (IPM).');

  // Selected lost items & munitions
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [lostMunicoes, setLostMunicoes] = useState<
    Array<{ id_lote: number; tipo_item: string; calibre: string; quantidade: number }>
  >([]);

  const [searchItem, setSearchItem] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available items in general inventory if origem === 'reserva'
  const availableItemsReserva = db
    .getItensComDetalhes('Armas')
    .filter((it) => it.status === 'Disponível');

  const handleToggleItemCautela = (item: ItemComDetalhes) => {
    if (selectedItemIds.includes(item.id_item)) {
      setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id_item));
    } else {
      setSelectedItemIds([...selectedItemIds, item.id_item]);
    }
  };

  const handleUpdateLostMunicao = (id_lote: number, tipo_item: string, calibre: string, qtd: number) => {
    if (qtd <= 0) {
      setLostMunicoes(lostMunicoes.filter((m) => m.id_lote !== id_lote));
    } else {
      const exists = lostMunicoes.some((m) => m.id_lote === id_lote);
      if (exists) {
        setLostMunicoes(
          lostMunicoes.map((m) => (m.id_lote === id_lote ? { ...m, quantidade: qtd } : m))
        );
      } else {
        setLostMunicoes([...lostMunicoes, { id_lote, tipo_item, calibre, quantidade: qtd }]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (origem === 'cautela' && !selectedCautela) {
      setErrorMessage('Selecione a Cautela sob responsabilidade do militar.');
      return;
    }

    if (!numeroBoIpm.trim()) {
      setErrorMessage('Informe o número do BO, Portaria de IPM ou Sindicância.');
      return;
    }

    if (!historico.trim()) {
      setErrorMessage('Preencha o relato circunstanciado dos fatos.');
      return;
    }

    if (selectedItemIds.length === 0 && lostMunicoes.length === 0) {
      setErrorMessage('Selecione ao menos um armamento ou informe quantidade de munições extraviadas.');
      return;
    }

    // Resolve items
    const allItems = db.getItensComDetalhes('Armas');
    const itensExtraviados = selectedItemIds
      .map((id) => allItems.find((i) => i.id_item === id))
      .filter(Boolean)
      .map((i) => ({
        id_item: i!.id_item,
        tipo_item: i!.tipo_item,
        marca: i!.marca,
        modelo: i!.modelo,
        numero_serie: i!.numero_serie,
        numero_tombo: i!.numero_tombo,
        calibre: i!.detalhe_arma?.calibre,
      }));

    const res = db.cadastrarExtravio({
      data_fato: new Date(dataFato).toISOString(),
      id_policial: origem === 'cautela' ? selectedCautela?.id_policial : null,
      id_cautela: origem === 'cautela' ? selectedCautela?.id_cautela : null,
      numero_bo_ipm: numeroBoIpm.trim(),
      tipo_ocorrencia: tipoOcorrencia,
      itens_extraviados: itensExtraviados,
      municoes_extraviadas: lostMunicoes,
      historico_circunstanciado: historico.trim(),
      providencias_adotadas: providencias.trim() || undefined,
    });

    if (res.success && res.id_extravio) {
      onSuccess(res.id_extravio);
    } else {
      setErrorMessage(res.error || 'Erro ao registrar extravio.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">
                Registro de Extravio, Furto ou Perda de Material Bélico
              </h2>
              <p className="text-xs text-rose-700">
                Vínculo à Cautela do Policial Militar • Baixa Patrimonial e Instauração de IPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-100/50 hover:bg-rose-100 text-rose-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Origem da Carga */}
          <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-800 text-xs">Origem do Material Extraviado:</span>
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="origem"
                value="cautela"
                checked={origem === 'cautela'}
                onChange={() => setOrigem('cautela')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span>Material sob Cautela de Policial (Recomendado)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="origem"
                value="reserva"
                checked={origem === 'reserva'}
                onChange={() => setOrigem('reserva')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span>Cofre / Reserva Geral da Armaria</span>
            </label>
          </div>

          {/* Cautela Selecionada (se origem === 'cautela') */}
          {origem === 'cautela' && (
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
              <label className="block font-bold text-slate-900 text-xs">
                Selecione a Cautela Ativa do Policial Militar <span className="text-rose-600">*</span>
              </label>

              {activeCautelas.length === 0 ? (
                <p className="text-rose-700 text-xs font-medium">
                  Não há cautelas ativas no momento. Se o extravio ocorreu na reserva geral, marque a opção "Cofre / Reserva Geral".
                </p>
              ) : (
                <select
                  value={selectedCautelaId ?? ''}
                  onChange={(e) => {
                    setSelectedCautelaId(Number(e.target.value));
                    setSelectedItemIds([]);
                    setLostMunicoes([]);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-rose-600"
                >
                  {activeCautelas.map((c) => {
                    const armasResumo = c.itens.map((i) => `${i.item.tipo_item} ${i.item.modelo || ''}`).join(', ') || 'Sem armas';
                    return (
                      <option key={c.id_cautela} value={c.id_cautela}>
                        Cautela #{c.id_cautela} • {c.policial.patente} {c.policial.nome_guerra} ({c.policial.matricula}) • {armasResumo}
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Itens sob tutela desta cautela */}
              {selectedCautela && (
                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Marque os armamentos extraviados desta Cautela:</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Policial: {selectedCautela.policial.patente} {selectedCautela.policial.nome_guerra}
                    </span>
                  </div>

                  {selectedCautela.itens.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhum armamento individual registrado nesta cautela.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCautela.itens.map(({ item }) => {
                        const isChecked = selectedItemIds.includes(item.id_item);
                        return (
                          <label
                            key={item.id_item}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                              isChecked
                                ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleItemCautela(item)}
                                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                              />
                              <div>
                                <span>{item.tipo_item} {item.marca} {item.modelo}</span>
                                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                                  (Série: {item.numero_serie || 'S/N'} | Tombo: {item.numero_tombo || 'S/T'})
                                </span>
                              </div>
                            </div>
                            {item.detalhe_arma && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                {item.detalhe_arma.calibre}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Munições vinculadas a esta cautela */}
                  {selectedCautela.lotes.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="font-bold text-slate-900 text-xs block">
                        Munições em posse do militar (Informe quantas foram perdidas/extraviadas):
                      </span>
                      {selectedCautela.lotes.map((l) => {
                        const currentLost = lostMunicoes.find((m) => m.id_lote === l.lote.id_lote)?.quantidade || 0;
                        return (
                          <div
                            key={l.lote.id_lote}
                            className="p-2 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-amber-950">
                                {l.lote.calibre ? `Calibre ${l.lote.calibre}` : l.lote.tipo_item} ({l.lote.marca})
                              </span>
                              <span className="text-[10px] text-slate-500 ml-2">
                                (Em posse: {l.quantidade} un.)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] text-slate-600">Qtd extraviada:</span>
                              <input
                                type="number"
                                min={0}
                                max={l.quantidade}
                                value={currentLost}
                                onChange={(e) =>
                                  handleUpdateLostMunicao(
                                    l.lote.id_lote,
                                    l.lote.tipo_item,
                                    l.lote.calibre || 'Munição',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-center text-xs font-bold text-amber-900"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dados da Ocorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Tipo de Ocorrência <span className="text-rose-600">*</span>
              </label>
              <select
                value={tipoOcorrencia ?? 'Extravio em Serviço'}
                onChange={(e) => setTipoOcorrencia(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:border-rose-600"
              >
                <option value="Extravio em Serviço">Extravio em Serviço</option>
                <option value="Furto / Roubo">Furto / Roubo</option>
                <option value="Perda em Operação">Perda em Operação</option>
                <option value="Sinistro / Acidente">Sinistro / Acidente</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Nº do BO / Portaria IPM / Sindicância <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BO nº 2026/08-0192 ou IPM 044/2026-6ºBPM"
                value={numeroBoIpm}
                onChange={(e) => setNumeroBoIpm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Data e Hora do Fato <span className="text-rose-600">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={dataFato}
              onChange={(e) => setDataFato(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-rose-600"
            />
          </div>

          {/* Relato e Providências */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Histórico Circunstanciado dos Fatos <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva detalhadamente como se deu o extravio ou furto, local exato, circunstâncias operacionais, testemunhas e dinâmicas da perda..."
                value={historico}
                onChange={(e) => setHistorico(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Providências Administrativas / Inquérito
              </label>
              <input
                type="text"
                placeholder="Ex: Encaminhado à Corregedoria, lavrado BO na 3ª DRP Caicó, Portaria IPM nº..."
                value={providencias}
                onChange={(e) => setProvidencias(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-rose-600"
              />
            </div>
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
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/30 transition"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Registrar Extravio e Atualizar Patrimônio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
