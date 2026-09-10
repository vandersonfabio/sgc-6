import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../services/store';
import { ModuloTipo, TipoCautela } from '../../types/database';
import {
  X,
  Building2,
  User,
  Shield,
  Crosshair,
  Package,
  Radio,
  FileCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';

interface ModalCargaSubunidadeProps {
  modulo?: ModuloTipo;
  onClose: () => void;
  onSuccess: (idCautela?: number) => void;
}

export const ModalCargaSubunidade: React.FC<ModalCargaSubunidadeProps> = ({
  modulo = 'Armas',
  onClose,
  onSuccess,
}) => {
  const { db } = useDatabase();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const unidades = db.getUnidades();
  const policiais = db.getPoliciais();
  const itensDisponiveis = db.getItensComDetalhes().filter((it) => it.status === 'Disponível');
  const lotesEstoque = db.getLotes().filter((l) => l.quantidade_atual > 0);

  // Subunit & Encarregado State
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number>(
    unidades[0]?.id_unidade ?? 1
  );
  const [searchPolicial, setSearchPolicial] = useState('');
  const [selectedPolicialId, setSelectedPolicialId] = useState<number | null>(null);

  // Modalidade & Documento
  const [tipoCarga, setTipoCarga] = useState<TipoCautela>('Permanente');
  const [diasPrevistos, setDiasPrevistos] = useState<number>(30);
  const [oficioPortaria, setOficioPortaria] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Selected Items & Ammunition
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedLotes, setSelectedLotes] = useState<Array<{ id_lote: number; quantidade: number }>>([]);

  // Category filter for available items
  const [categoriaAba, setCategoriaAba] = useState<'armas' | 'coletes' | 'comunicacao' | 'municoes'>('armas');
  const [termoBuscaItem, setTermoBuscaItem] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered PMs
  const filteredPoliciais = useMemo(() => {
    if (!searchPolicial.trim()) return policiais.slice(0, 10);
    const term = searchPolicial.toLowerCase();
    return policiais
      .filter(
        (p) =>
          p.matricula.toLowerCase().includes(term) ||
          p.nome_guerra.toLowerCase().includes(term) ||
          p.nome_completo.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [policiais, searchPolicial]);

  const selectedPolicial = policiais.find((p) => p.id_policial === selectedPolicialId);
  const selectedUnidade = unidades.find((u) => u.id_unidade === selectedUnidadeId);

  // Available Items by Category
  const armasDisponiveis = useMemo(() => {
    return itensDisponiveis.filter(
      (i) =>
        i.modulo === 'Armas' &&
        !i.tipo_item.toLowerCase().includes('colete') &&
        (i.tipo_item.toLowerCase().includes('pistola') ||
          i.tipo_item.toLowerCase().includes('fuzil') ||
          i.tipo_item.toLowerCase().includes('carabina') ||
          i.tipo_item.toLowerCase().includes('espingarda') ||
          i.tipo_item.toLowerCase().includes('revólver'))
    );
  }, [itensDisponiveis]);

  const coletesDisponiveis = useMemo(() => {
    return itensDisponiveis.filter(
      (i) => i.tipo_item.toLowerCase().includes('colete') || i.tipo_item.toLowerCase().includes('placa')
    );
  }, [itensDisponiveis]);

  const comunicacaoDisponivel = useMemo(() => {
    return itensDisponiveis.filter(
      (i) => i.modulo === 'Comunicação' || i.tipo_item.toLowerCase().includes('rádio') || i.tipo_item.toLowerCase().includes('ht')
    );
  }, [itensDisponiveis]);

  const lotesDisponiveis = useMemo(() => {
    return lotesEstoque.filter((l) => l.quantidade_atual > 0);
  }, [lotesEstoque]);

  const currentCategoryItems = useMemo(() => {
    let list: any[] = [];
    if (categoriaAba === 'armas') list = armasDisponiveis;
    else if (categoriaAba === 'coletes') list = coletesDisponiveis;
    else if (categoriaAba === 'comunicacao') list = comunicacaoDisponivel;

    if (!termoBuscaItem.trim()) return list;
    const term = termoBuscaItem.toLowerCase();
    return list.filter(
      (it) =>
        it.tipo_item.toLowerCase().includes(term) ||
        (it.marca || '').toLowerCase().includes(term) ||
        (it.modelo || '').toLowerCase().includes(term) ||
        (it.numero_serie || '').toLowerCase().includes(term) ||
        (it.numero_tombo || '').toLowerCase().includes(term)
    );
  }, [categoriaAba, armasDisponiveis, coletesDisponiveis, comunicacaoDisponivel, termoBuscaItem]);

  const toggleSelectItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleUpdateLoteQtd = (id_lote: number, qtd: number) => {
    const lote = lotesEstoque.find((l) => l.id_lote === id_lote);
    if (!lote) return;
    const cleanQtd = Math.max(0, Math.min(lote.quantidade_atual, qtd));

    setSelectedLotes((prev) => {
      const exists = prev.find((l) => l.id_lote === id_lote);
      if (cleanQtd === 0) {
        return prev.filter((l) => l.id_lote !== id_lote);
      }
      if (exists) {
        return prev.map((l) => (l.id_lote === id_lote ? { ...l, quantidade: cleanQtd } : l));
      }
      return [...prev, { id_lote, quantidade: cleanQtd }];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPolicialId) {
      setErrorMessage('Selecione o Policial Militar Encarregado que assinará a carga.');
      return;
    }

    if (selectedItemIds.length === 0 && selectedLotes.length === 0) {
      setErrorMessage('Selecione pelo menos um equipamento ou lote de munição para transferir à subunidade.');
      return;
    }

    let dataPrevista: string | undefined = undefined;
    if (tipoCarga === 'Temporária') {
      const d = new Date();
      d.setDate(d.getDate() + diasPrevistos);
      dataPrevista = d.toISOString();
    }

    const obsFinal = `${oficioPortaria ? `[DOC: ${oficioPortaria}] ` : ''}${observacoes}`.trim();

    const res = db.createCautela({
      id_policial: selectedPolicialId,
      id_unidade: selectedUnidadeId,
      destinatario_tipo: 'UNIDADE',
      tipo: tipoCarga,
      data_prevista_devolucao: dataPrevista,
      observacao: obsFinal || `Carga de Dotação - ${selectedUnidade?.nome || 'Subunidade'}`,
      itens: selectedItemIds.map((id) => ({
        id_item: id,
        observacao_estado_entrega: `Carga transferida para ${selectedUnidade?.nome || 'Subunidade'}. Conferido sem avarias.`,
      })),
      lotes: selectedLotes,
    });

    if (res.success) {
      onSuccess(res.id_cautela);
    } else {
      setErrorMessage(res.error || 'Erro ao registrar carga da subunidade.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-indigo-300 border border-white/10 shadow-xs">
              <Building2 className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">
                  Nova Carga / Dotação de Subunidade ou Destacamento
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase border border-indigo-400/30">
                  DPMs & Pelotões
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Transferência de lote bélico, coletes e munições para frações destacadas do 6º BPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grid: 1. Subunidade & Encarregado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subunidade */}
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200 space-y-2">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                1. Subunidade / Destacamento de Destino *
              </label>
              <select
                value={selectedUnidadeId}
                onChange={(e) => setSelectedUnidadeId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
              >
                {unidades.map((u) => (
                  <option key={u.id_unidade} value={u.id_unidade}>
                    [{u.tipo_unidade}] {u.nome} ({u.municipio || 'Caicó'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-indigo-800">
                Todo o material selecionado ficará registrado sob a tutela e responsabilidade desta fração.
              </p>
            </div>

            {/* Encarregado da Carga */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Policial Militar Encarregado (Recebedor / Comandante do DPM) *
              </label>
              {!selectedPolicial ? (
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por Matrícula ou Nome do PM..."
                      value={searchPolicial}
                      onChange={(e) => setSearchPolicial(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                    {filteredPoliciais.map((p) => (
                      <button
                        key={p.id_policial}
                        type="button"
                        onClick={() => {
                          setSelectedPolicialId(p.id_policial);
                          setSearchPolicial('');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 flex items-center justify-between transition"
                      >
                        <span className="font-bold text-slate-900">
                          {p.patente} {p.nome_guerra}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{p.matricula}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-indigo-200">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {selectedPolicial.patente} {selectedPolicial.nome_guerra}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Matrícula: {selectedPolicial.matricula} • {selectedPolicial.nome_completo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPolicialId(null)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 bg-red-50 rounded"
                  >
                    Trocar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modalidade & Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modalidade de Carga
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoCarga('Permanente')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                    tipoCarga === 'Permanente'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Permanente (Dotação)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCarga('Temporária')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                    tipoCarga === 'Temporária'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Temporária (Operação)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ofício / Portaria / Ordem de Serviço
              </label>
              <input
                type="text"
                placeholder="Ex: Ofício nº 142/2026 - P4/6º BPM"
                value={oficioPortaria}
                onChange={(e) => setOficioPortaria(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {tipoCarga === 'Temporária' ? 'Previsão de Retorno (Dias)' : 'Observações Gerais'}
              </label>
              {tipoCarga === 'Temporária' ? (
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={diasPrevistos}
                  onChange={(e) => setDiasPrevistos(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Ex: Reforço operacional de férias / carnaval"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              )}
            </div>
          </div>

          {/* Item Category Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCategoriaAba('armas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    categoriaAba === 'armas'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Armas de Fogo ({armasDisponiveis.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoriaAba('coletes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    categoriaAba === 'coletes'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Coletes Balísticos ({coletesDisponiveis.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoriaAba('municoes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    categoriaAba === 'municoes'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Munições CBC ({lotesDisponiveis.length} lotes)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoriaAba('comunicacao')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    categoriaAba === 'comunicacao'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Rádios & Tático ({comunicacaoDisponivel.length})</span>
                </button>
              </div>

              {categoriaAba !== 'municoes' && (
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar nesta lista..."
                    value={termoBuscaItem}
                    onChange={(e) => setTermoBuscaItem(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}
            </div>

            {/* Category Items List */}
            {categoriaAba !== 'municoes' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {currentCategoryItems.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                    Nenhum item disponível nesta categoria.
                  </div>
                ) : (
                  currentCategoryItems.map((it) => {
                    const isSelected = selectedItemIds.includes(it.id_item);
                    return (
                      <div
                        key={it.id_item}
                        onClick={() => toggleSelectItem(it.id_item)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{it.tipo_item}</div>
                          <div className="text-[10px] text-slate-500">
                            {it.marca} {it.modelo} • Série: <strong className="font-mono text-slate-700">{it.numero_serie || '-'}</strong> • Tombo: <strong className="font-mono text-slate-700">{it.numero_tombo || '-'}</strong>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 pointer-events-none"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Ammunition Lotes List */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {lotesDisponiveis.map((lote) => {
                  const currentSelected = selectedLotes.find((l) => l.id_lote === lote.id_lote)?.quantidade || 0;
                  return (
                    <div
                      key={lote.id_lote}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                        currentSelected > 0
                          ? 'bg-indigo-50 border-indigo-500 shadow-2xs'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {lote.tipo_item} ({lote.calibre || '-'})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Lote: {lote.lote_fabricacao || '-'} • Disponível na Reserva:{' '}
                          <strong className="text-emerald-700">{lote.quantidade_atual} un</strong>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min="0"
                          max={lote.quantidade_atual}
                          value={currentSelected || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateLoteQtd(lote.id_lote, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                        />
                        <span className="text-[10px] text-slate-500 font-semibold">un</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Summary Card */}
          <div className="p-3 bg-indigo-900 text-white rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileCheck className="w-5 h-5 text-indigo-300" />
              <div className="text-xs">
                <span className="font-bold block">Resumo do Lote de Carga:</span>
                <span className="text-indigo-200">
                  {selectedItemIds.length} equipamentos selecionados •{' '}
                  {selectedLotes.reduce((acc, l) => acc + l.quantidade, 0)} munições cartuchadas
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-200 hover:text-white hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Efetivar Carga de Subunidade</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
