import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { ModuloTipo, TipoCautela, Policial, ItemComDetalhes, EstoqueLote } from '../../types/database';
import {
  X,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Crosshair,
  Radio,
  FileCheck,
  Package,
} from 'lucide-react';

interface ModalNovaCautelaProps {
  modulo: ModuloTipo;
  onClose: () => void;
  onSuccess: (id_cautela: number) => void;
}

export const ModalNovaCautela: React.FC<ModalNovaCautelaProps> = ({ modulo, onClose, onSuccess }) => {
  const { db, policiais, lotes } = useDatabase();

  const [tipo, setTipo] = useState<TipoCautela>('Temporária');
  const [selectedPolicialId, setSelectedPolicialId] = useState<number | ''>('');
  const [searchPolicial, setSearchPolicial] = useState('');
  const [searchEquipment, setSearchEquipment] = useState('');
  const [tempoServicoHoras, setTempoServicoHoras] = useState<number>(12);

  // Selected Items & Notes
  const [selectedItems, setSelectedItems] = useState<Array<{ id_item: number; observacao: string }>>([]);
  const [selectedLotes, setSelectedLotes] = useState<Array<{ id_lote: number; quantidade: number }>>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available items in the current module (Only "Disponível")
  const availableItems = db
    .getItensComDetalhes(modulo)
    .filter((it) => it.status === 'Disponível');

  // Available ammunition lots for this module
  const availableLotes = lotes.filter((l) => l.modulo === modulo && l.quantidade_atual > 0);

  // Filtered police
  const filteredPoliciais = policiais.filter((p) => {
    if (p.status !== 'Ativo') return false;
    const term = searchPolicial.toLowerCase();
    return (
      p.nome_guerra.toLowerCase().includes(term) ||
      p.matricula.toLowerCase().includes(term) ||
      p.nome_completo.toLowerCase().includes(term) ||
      p.patente.toLowerCase().includes(term)
    );
  });

  // Filtered equipment (search by tombo, número de série, nome/tipo, marca, modelo, calibre)
  const filteredEquipments = availableItems.filter((it) => {
    if (selectedItems.some((si) => si.id_item === it.id_item)) return false;
    const term = searchEquipment.toLowerCase();
    return (
      it.tipo_item.toLowerCase().includes(term) ||
      (it.marca || '').toLowerCase().includes(term) ||
      (it.modelo || '').toLowerCase().includes(term) ||
      (it.numero_serie || '').toLowerCase().includes(term) ||
      (it.numero_tombo || '').toLowerCase().includes(term) ||
      (it.detalhe_arma?.calibre || '').toLowerCase().includes(term) ||
      (it.detalhe_colete?.nivel_protecao || '').toLowerCase().includes(term) ||
      (it.detalhe_comunicacao?.numero_linha || '').toLowerCase().includes(term)
    );
  });

  const selectedPolicial = policiais.find((p) => p.id_policial === Number(selectedPolicialId));

  const handleAddItem = (id_item: number) => {
    if (selectedItems.some((i) => i.id_item === id_item)) return;
    const it = availableItems.find((i) => i.id_item === id_item);
    setSelectedItems([
      ...selectedItems,
      {
        id_item,
        observacao: it?.detalhe_arma
          ? `Entregue com ${it.detalhe_arma.qtd_carregadores} carregadores. Funcionamento testado.`
          : 'Entregue em perfeito estado operacional.',
      },
    ]);
    setSearchEquipment('');
  };

  const handleRemoveItem = (id_item: number) => {
    setSelectedItems(selectedItems.filter((i) => i.id_item !== id_item));
  };

  const handleUpdateItemObs = (id_item: number, obs: string) => {
    setSelectedItems(
      selectedItems.map((i) => (i.id_item === id_item ? { ...i, observacao: obs } : i))
    );
  };

  const handleAddLote = (id_lote: number) => {
    if (selectedLotes.some((l) => l.id_lote === id_lote)) return;
    const lote = availableLotes.find((l) => l.id_lote === id_lote);
    const defaultQty = Math.min(lote?.quantidade_atual || 30, 30);
    setSelectedLotes([...selectedLotes, { id_lote, quantidade: defaultQty }]);
  };

  const handleRemoveLote = (id_lote: number) => {
    setSelectedLotes(selectedLotes.filter((l) => l.id_lote !== id_lote));
  };

  const handleUpdateLoteQty = (id_lote: number, qty: number) => {
    setSelectedLotes(
      selectedLotes.map((l) => (l.id_lote === id_lote ? { ...l, quantidade: Math.max(1, qty) } : l))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPolicialId) {
      setErrorMessage('Selecione o policial militar recebedor.');
      return;
    }

    if (selectedItems.length === 0 && selectedLotes.length === 0) {
      setErrorMessage('Selecione ao menos um equipamento ou lote de munição.');
      return;
    }

    let dataPrevista: string | null = null;
    if (tipo === 'Temporária') {
      const d = new Date();
      d.setHours(d.getHours() + tempoServicoHoras);
      dataPrevista = d.toISOString();
    }

    const res = db.createCautela({
      id_policial: Number(selectedPolicialId),
      tipo,
      data_prevista_devolucao: dataPrevista,
      itens: selectedItems,
      lotes: selectedLotes,
    });

    if (res.success && res.id_cautela) {
      onSuccess(res.id_cautela);
    } else {
      setErrorMessage(res.error || 'Erro ao registrar cautela.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shadow-xs">
              {modulo === 'Armas' ? <Crosshair className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nova Cautela • {modulo === 'Armas' ? 'Material Bélico' : 'Comunicação'}
              </h2>
              <p className="text-xs text-slate-500">
                Registro operacional de saída com busca avançada de material e recebedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Tipo de Cautela */}
          <div>
            <label className="block font-bold text-slate-900 mb-2">1. Modalidade da Cautela</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('Temporária')}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                  tipo === 'Temporária'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Cautela Temporária (Serviço)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Empréstimo rápido para escala de 12h ou 24h de serviço
                  </div>
                </div>
              </button>

              {modulo === 'Armas' ? (
                <button
                  type="button"
                  onClick={() => setTipo('Permanente')}
                  className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                    tipo === 'Permanente'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 ring-1 ring-purple-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Cautela Permanente (Porte)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tutela contínua de arma/colete com portaria de carga
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-[11px] flex items-center">
                  Cautela Permanente disponível exclusivamente no Módulo de Armas.
                </div>
              )}
            </div>

            {tipo === 'Temporária' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Duração prevista do turno de serviço:</span>
                <div className="flex items-center space-x-2">
                  {[6, 12, 24, 48].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setTempoServicoHoras(hrs)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tempoServicoHoras === hrs
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {hrs} horas
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Seleção de Policial Militar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-900">
                2. Policial Militar Recebedor (Efetivo 6º BPM)
              </label>
              {selectedPolicial && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Selecionado</span>
                </span>
              )}
            </div>

            {selectedPolicial ? (
              <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {selectedPolicial.nome_guerra.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedPolicial.patente} {selectedPolicial.nome_guerra}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-blue-900 font-semibold border border-blue-200">
                        {selectedPolicial.matricula}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {selectedPolicial.nome_completo}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicialId('');
                    setSearchPolicial('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-red-700 border border-slate-200 text-xs font-semibold transition flex items-center space-x-1 shadow-xs"
                  title="Alterar policial militar"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Trocar Policial</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Digite a Matrícula (ex: PM-240992-1), Nome ou Graduação..."
                    value={searchPolicial}
                    onChange={(e) => setSearchPolicial(e.target.value)}
                    autoFocus={!selectedPolicialId}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs shadow-xs"
                  />
                  {searchPolicial && (
                    <button
                      type="button"
                      onClick={() => setSearchPolicial('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown list ONLY when searching */}
                {searchPolicial.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                    {filteredPoliciais.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-xs">
                        Nenhum policial ativo encontrado com "{searchPolicial}".
                      </div>
                    ) : (
                      filteredPoliciais.map((p, pIdx) => (
                        <button
                          key={`${p.id_policial || 'pol'}-${p.matricula || ''}-${pIdx}`}
                          type="button"
                          onClick={() => {
                            setSelectedPolicialId(p.id_policial);
                            setSearchPolicial('');
                          }}
                          className="w-full p-2.5 text-left flex items-center justify-between hover:bg-blue-50 transition group"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 group-hover:text-blue-900">
                              {p.patente} {p.nome_guerra}
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({p.nome_completo})
                            </span>
                          </div>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-800">
                            {p.matricula}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Materiais / Equipamentos com Busca por Tombo, Série ou Nome */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-900">
                3. Equipamento(s) para a Cautela ({selectedItems.length} selecionado{selectedItems.length === 1 ? '' : 's'})
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {availableItems.length} disponíveis na reserva
              </span>
            </div>

            <div className="relative space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar e adicionar equipamento por Tombo, Série ou Modelo (ex: TS9, APX, Colete, Linha)..."
                  value={searchEquipment}
                  onChange={(e) => setSearchEquipment(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs shadow-xs"
                />
                {searchEquipment && (
                  <button
                    type="button"
                    onClick={() => setSearchEquipment('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Equipment Search Results Dropdown ONLY when typing */}
              {searchEquipment.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                  {filteredEquipments.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      Nenhum equipamento disponível encontrado com "{searchEquipment}".
                    </div>
                  ) : (
                    filteredEquipments.map((it, eIdx) => (
                      <div
                        key={`${it.id_item || 'item'}-${eIdx}`}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">
                              {it.tipo_item} {it.marca} {it.modelo}
                            </span>
                            {it.detalhe_arma?.calibre && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                {it.detalhe_arma.calibre}
                              </span>
                            )}
                            {it.detalhe_colete && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                Tam: {it.detalhe_colete.tamanho} | Val: {it.detalhe_colete.data_validade}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-3">
                            <span>Tombo: <strong className="text-slate-700">{it.numero_tombo || '-'}</strong></span>
                            <span>Série: <strong className="text-slate-700">{it.numero_serie || '-'}</strong></span>
                            {it.detalhe_comunicacao?.numero_linha && (
                              <span className="text-emerald-700 font-semibold">Linha: {it.detalhe_comunicacao.numero_linha}</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddItem(it.id_item)}
                          className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Items List */}
              {selectedItems.length > 0 ? (
                <div className="space-y-2 border border-blue-200/80 rounded-xl p-3 bg-blue-50/30">
                  <div className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5 text-blue-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Itens Selecionados para Cautela ({selectedItems.length}):</span>
                  </div>
                  {selectedItems.map((si, sIdx) => {
                    const it = availableItems.find((i) => i.id_item === si.id_item);
                    if (!it) return null;
                    return (
                      <div key={`${si.id_item || 'sel'}-${sIdx}`} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">
                              {it.tipo_item} {it.marca} {it.modelo}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Tombo: {it.numero_tombo || '-'} • Série: {it.numero_serie || '-'}
                            </span>
                            {it.detalhe_arma?.calibre && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                {it.detalhe_arma.calibre}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(si.id_item)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Observações do estado de entrega / carregadores..."
                          value={si.observacao}
                          onChange={(e) => handleUpdateItemObs(si.id_item, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px] focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-center text-xs">
                  Nenhum equipamento adicionado ainda. Digite o tombo, série ou modelo na barra de busca acima para incluir nesta cautela.
                </div>
              )}
            </div>
          </div>

          {/* 4. Munições (Se módulo Armas) */}
          {modulo === 'Armas' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-900">
                  4. Munições e Calibres para o Serviço
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Quantidade padrão: 30 un.
                </span>
              </div>

              <select
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 shadow-xs"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddLote(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  + Adicionar munição por calibre/especificação (Padrão: 30 un)...
                </option>
                {availableLotes
                  .filter((l) => !selectedLotes.some((sl) => sl.id_lote === l.id_lote))
                  .map((l, lIdx) => (
                    <option key={`${l.id_lote || 'opt-lote'}-${lIdx}`} value={l.id_lote}>
                      {l.calibre ? `Calibre ${l.calibre}` : l.tipo_item} {l.marca ? `(${l.marca})` : ''} - Disponível: {l.quantidade_atual} un.
                    </option>
                  ))}
              </select>

              {selectedLotes.length > 0 && (
                <div className="mt-2 space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="font-bold text-slate-800 text-[11px]">Munições Adicionadas:</div>
                  {selectedLotes.map((sl, slIdx) => {
                    const lote = availableLotes.find((l) => l.id_lote === sl.id_lote);
                    if (!lote) return null;
                    return (
                      <div key={`${sl.id_lote || 'slote'}-${slIdx}`} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">
                            {lote.calibre ? `Calibre ${lote.calibre}` : lote.tipo_item} {lote.marca ? `- ${lote.marca}` : ''}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Disponível no cofre: {lote.quantidade_atual} un.
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500 font-medium">Qtd:</span>
                          <input
                            type="number"
                            min={1}
                            max={lote.quantidade_atual}
                            value={sl.quantidade}
                            onChange={(e) => handleUpdateLoteQty(sl.id_lote, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLote(sl.id_lote)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-500"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirmar e Registrar Cautela</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
