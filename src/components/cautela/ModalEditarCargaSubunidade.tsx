import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../services/store';
import { CautelaCompleta, ItemComDetalhes } from '../../types/database';
import {
  X,
  Building2,
  User,
  Shield,
  Crosshair,
  Package,
  Radio,
  Plus,
  Trash2,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface ModalEditarCargaSubunidadeProps {
  cautela: CautelaCompleta;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarCargaSubunidade: React.FC<ModalEditarCargaSubunidadeProps> = ({
  cautela,
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
  const policiais = db.getPoliciais();
  const todosItens = db.getItensComDetalhes();
  const todosLotes = db.getLotes();

  // Encarregado
  const [selectedPolicialId, setSelectedPolicialId] = useState<number>(cautela.policial.id_policial);
  const [searchPolicial, setSearchPolicial] = useState('');
  const [isChangingPolicial, setIsChangingPolicial] = useState(false);

  // Observação da alteração
  const [observacaoAlt, setObservacaoAlt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Itens atualmente vinculados que o usuário optou por recolher para a reserva central
  const [itensRecolher, setItensRecolher] = useState<
    Array<{ id_item: number; status_destino: 'Disponível' | 'Manutenção'; observacao?: string }>
  >([]);

  // Novos itens da reserva central que o usuário quer adicionar à carga
  const [itensAdicionarIds, setItensAdicionarIds] = useState<number[]>([]);

  // Munições: estado das quantidades finais desejadas na carga
  // Inicializa com as quantidades já existentes na cautela
  const [lotesQuantidades, setLotesQuantidades] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const cl of cautela.lotes) {
      const lid = cl.lote?.id_lote;
      if (lid !== undefined) {
        map[lid] = cl.quantidade;
      }
    }
    return map;
  });

  // Aba para adicionar novos itens
  const [abaCategoria, setAbaCategoria] = useState<'armas' | 'coletes' | 'municoes' | 'comunicacao'>('armas');
  const [termoBuscaEstoque, setTermoBuscaEstoque] = useState('');

  // PM selection filtering
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

  const currentEncarregado = policiais.find((p) => p.id_policial === selectedPolicialId) || cautela.policial;

  // Itens disponíveis no estoque central
  const itensDisponiveisEstoque = useMemo(() => {
    return todosItens.filter((it) => it.status === 'Disponível');
  }, [todosItens]);

  const armasDisponiveis = useMemo(() => {
    return itensDisponiveisEstoque.filter(
      (i) =>
        i.modulo === 'Armas' &&
        !i.tipo_item.toLowerCase().includes('colete') &&
        (i.tipo_item.toLowerCase().includes('pistola') ||
          i.tipo_item.toLowerCase().includes('fuzil') ||
          i.tipo_item.toLowerCase().includes('carabina') ||
          i.tipo_item.toLowerCase().includes('espingarda') ||
          i.tipo_item.toLowerCase().includes('revólver'))
    );
  }, [itensDisponiveisEstoque]);

  const coletesDisponiveis = useMemo(() => {
    return itensDisponiveisEstoque.filter(
      (i) => i.tipo_item.toLowerCase().includes('colete') || i.tipo_item.toLowerCase().includes('placa')
    );
  }, [itensDisponiveisEstoque]);

  const comunicacaoDisponivel = useMemo(() => {
    return itensDisponiveisEstoque.filter(
      (i) => i.modulo === 'Comunicação' || i.tipo_item.toLowerCase().includes('rádio') || i.tipo_item.toLowerCase().includes('ht')
    );
  }, [itensDisponiveisEstoque]);

  const currentCategoryAddItems = useMemo(() => {
    let list: ItemComDetalhes[] = [];
    if (abaCategoria === 'armas') list = armasDisponiveis;
    else if (abaCategoria === 'coletes') list = coletesDisponiveis;
    else if (abaCategoria === 'comunicacao') list = comunicacaoDisponivel;

    if (!termoBuscaEstoque.trim()) return list;
    const term = termoBuscaEstoque.toLowerCase().trim();
    return list.filter(
      (it) =>
        it.tipo_item.toLowerCase().includes(term) ||
        (it.marca || '').toLowerCase().includes(term) ||
        (it.modelo || '').toLowerCase().includes(term) ||
        (it.numero_serie || '').toLowerCase().includes(term) ||
        (it.numero_tombo || '').toLowerCase().includes(term) ||
        (it.detalhe_arma?.calibre || '').toLowerCase().includes(term) ||
        (it.detalhe_colete?.tamanho || '').toLowerCase().includes(term) ||
        (it.detalhe_colete?.nivel_protecao || '').toLowerCase().includes(term)
    );
  }, [abaCategoria, armasDisponiveis, coletesDisponiveis, comunicacaoDisponivel, termoBuscaEstoque]);

  // Actions for existing items
  const handleToggleRecolherItem = (id_item: number, status_destino: 'Disponível' | 'Manutenção' = 'Disponível') => {
    setItensRecolher((prev) => {
      const exists = prev.find((i) => i.id_item === id_item);
      if (exists) {
        return prev.filter((i) => i.id_item !== id_item);
      }
      return [...prev, { id_item, status_destino, observacao: 'Recolhido para Reserva Central' }];
    });
  };

  const handleUpdateStatusDestinoRecolhimento = (id_item: number, status_destino: 'Disponível' | 'Manutenção') => {
    setItensRecolher((prev) =>
      prev.map((i) => (i.id_item === id_item ? { ...i, status_destino } : i))
    );
  };

  // Actions for adding items
  const handleToggleAdicionarItem = (id_item: number) => {
    setItensAdicionarIds((prev) =>
      prev.includes(id_item) ? prev.filter((id) => id !== id_item) : [...prev, id_item]
    );
  };

  // Actions for lotes
  const handleUpdateLoteQuantidadeFinal = (id_lote: number, qtd: number) => {
    const cleanQtd = Math.max(0, qtd);
    setLotesQuantidades((prev) => ({
      ...prev,
      [id_lote]: cleanQtd,
    }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Build lotesAjuste
    const lotesAjuste = Object.entries(lotesQuantidades).map(([id_lote_str, qtd]) => ({
      id_lote: Number(id_lote_str),
      quantidade_final: Number(qtd),
    }));

    const res = db.editarCargaSubunidade({
      id_cautela: cautela.id_cautela,
      novo_id_policial: selectedPolicialId !== cautela.policial.id_policial ? selectedPolicialId : undefined,
      observacao: observacaoAlt.trim() || undefined,
      itensAdicionar: itensAdicionarIds.map((id) => ({
        id_item: id,
        observacao_estado_entrega: `Adicionado à Carga de ${cautela.unidade?.nome || 'Subunidade'} em aditivo.`,
      })),
      itensRecolher: itensRecolher,
      lotesAjuste: lotesAjuste,
    });

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar carga da subunidade.');
    }
  };

  // Total active items currently in load
  const totalItensAtuais = cautela.itens.length - itensRecolher.length + itensAdicionarIds.length;
  const totalMunicoesFinais = Object.values(lotesQuantidades).reduce((acc: number, q: number) => acc + Number(q || 0), 0);

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
                  Gerenciar & Editar Carga • {cautela.unidade?.nome || 'Subunidade / DPM'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold font-mono border border-indigo-400/30">
                  Carga Nº {String(cautela.id_cautela).padStart(5, '0')}
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Adicione materiais, recolha armas/coletes ou transfira munições sem gerar registros de disparos
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

          {/* Top Bar: Subunidade & Encarregado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                Subunidade Titular da Carga
              </span>
              <div className="font-extrabold text-indigo-950 text-sm">
                {cautela.unidade?.nome || 'Subunidade Não Vinculada'}
              </div>
              <div className="text-[11px] text-indigo-700 mt-0.5">
                Tipo: {cautela.unidade?.tipo_unidade || 'Destacamento'} • Município: {cautela.unidade?.municipio || 'Caicó/RN'}
              </div>
            </div>

            {/* Encarregado Atual / Troca */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Policial Militar Encarregado (Fiel da Carga)
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangingPolicial(!isChangingPolicial)}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  {isChangingPolicial ? 'Manter Atual' : 'Substituir Encarregado'}
                </button>
              </div>

              {!isChangingPolicial ? (
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {currentEncarregado.patente} {currentEncarregado.nome_guerra} ({currentEncarregado.matricula})
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {currentEncarregado.nome_completo}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 mt-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar PM por nome ou matrícula..."
                      value={searchPolicial}
                      onChange={(e) => setSearchPolicial(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-md bg-white divide-y divide-slate-100">
                    {filteredPoliciais.map((p) => (
                      <button
                        key={p.id_policial}
                        type="button"
                        onClick={() => {
                          setSelectedPolicialId(p.id_policial);
                          setIsChangingPolicial(false);
                          setSearchPolicial('');
                        }}
                        className="w-full text-left px-2.5 py-1 text-xs hover:bg-indigo-50 flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">
                          {p.patente} {p.nome_guerra}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{p.matricula}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Itens Atuais na Carga (com opção de Recolher) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-indigo-700" />
                <span>1. Armamentos, Coletes e Equipamentos Atuais ({cautela.itens.length})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Clique em "Recolher" para retornar um item para a Reserva Central
              </span>
            </div>

            {cautela.itens.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Nenhum equipamento individual registrado nesta carga no momento.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cautela.itens.map((ci) => {
                  const isRecolhendo = itensRecolher.find((r) => r.id_item === ci.item.id_item);
                  return (
                    <div
                      key={ci.item.id_item}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                        isRecolhendo
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{ci.item.tipo_item} {ci.item.marca} {ci.item.modelo}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            [{ci.item.numero_tombo || ci.item.numero_serie || 'S/N'}]
                          </span>
                          {isRecolhendo && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 text-[10px] font-bold">
                              Será Recolhido para Reserva ({isRecolhendo.status_destino})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ci.observacao_estado_entrega || 'Conferido sem avarias'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isRecolhendo ? (
                          <>
                            <select
                              value={isRecolhendo.status_destino}
                              onChange={(e) =>
                                handleUpdateStatusDestinoRecolhimento(
                                  ci.item.id_item,
                                  e.target.value as 'Disponível' | 'Manutenção'
                                )
                              }
                              className="px-2 py-1 bg-white border border-rose-300 rounded text-[11px] font-bold text-rose-900 focus:outline-none"
                            >
                              <option value="Disponível">Reserva: Disponível</option>
                              <option value="Manutenção">Reserva: Manutenção</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleToggleRecolherItem(ci.item.id_item)}
                              className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition"
                            >
                              Cancelar Recolhimento
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleRecolherItem(ci.item.id_item, 'Disponível')}
                            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold flex items-center space-x-1 transition"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Recolher p/ Reserva</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Munições em Dotação (Adicionar ou Devolver saldo) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>2. Saldo de Munições da Subunidade</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Aumente ou diminua a quantidade conforme transferências reais (sem disparos)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {todosLotes.map((lote) => {
                const qtdAtualNaCarga = lotesQuantidades[lote.id_lote] || 0;
                const inicialNaCarga =
                  cautela.lotes.find((cl) => cl.lote?.id_lote === lote.id_lote)?.quantidade || 0;
                const diferenca = qtdAtualNaCarga - inicialNaCarga;

                return (
                  <div
                    key={lote.id_lote}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                      qtdAtualNaCarga > 0
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {lote.tipo_item} ({lote.calibre || '-'})
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Lote CBC: {lote.lote_fabricacao || '-'} • Reserva Central:{' '}
                        <strong className="text-emerald-700">{lote.quantidade_atual} un</strong>
                      </div>
                      {diferenca !== 0 && (
                        <div
                          className={`text-[10px] font-bold ${
                            diferenca > 0 ? 'text-indigo-700' : 'text-amber-700'
                          }`}
                        >
                          {diferenca > 0
                            ? `+${diferenca} un transferidas da Reserva Central`
                            : `${Math.abs(diferenca)} un recolhidas de volta p/ Reserva Central`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="0"
                        max={inicialNaCarga + lote.quantidade_atual}
                        value={qtdAtualNaCarga || ''}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateLoteQuantidadeFinal(lote.id_lote, Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                      <span className="text-[10px] text-slate-500 font-semibold">un</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Adicionar Novos Equipamentos da Reserva */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>3. Adicionar Novos Equipamentos à Carga ({itensAdicionarIds.length} selecionados)</span>
              </span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setAbaCategoria('armas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    abaCategoria === 'armas'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Armas ({armasDisponiveis.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAbaCategoria('coletes')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    abaCategoria === 'coletes'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Coletes ({coletesDisponiveis.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAbaCategoria('comunicacao')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    abaCategoria === 'comunicacao'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Rádios ({comunicacaoDisponivel.length})
                </button>
              </div>
            </div>

            {/* Caixa de Busca para Adicionar Novos Equipamentos */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar equipamentos disponíveis para adicionar (${
                  abaCategoria === 'armas'
                    ? 'pistola, fuzil, série, tombo, calibre...'
                    : abaCategoria === 'coletes'
                    ? 'tamanho, nível, série...'
                    : 'rádio, modelo, patrimônio...'
                })`}
                value={termoBuscaEstoque}
                onChange={(e) => setTermoBuscaEstoque(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
              {termoBuscaEstoque && (
                <button
                  type="button"
                  onClick={() => setTermoBuscaEstoque('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              {currentCategoryAddItems.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                  {termoBuscaEstoque.trim() ? (
                    <span>
                      Nenhum equipamento encontrado com o termo "<strong>{termoBuscaEstoque}</strong>" nesta categoria.
                    </span>
                  ) : (
                    <span>Nenhum equipamento disponível na Reserva Central nesta categoria.</span>
                  )}
                </div>
              ) : (
                currentCategoryAddItems.map((it) => {
                  const isSelected = itensAdicionarIds.includes(it.id_item);
                  return (
                    <div
                      key={it.id_item}
                      onClick={() => handleToggleAdicionarItem(it.id_item)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{it.tipo_item}</span>
                          {it.detalhe_arma?.calibre && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              Cal. {it.detalhe_arma.calibre}
                            </span>
                          )}
                          {it.detalhe_colete?.tamanho && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                              Tam. {it.detalhe_colete.tamanho}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {it.marca} {it.modelo} • Série: <strong className="font-mono text-slate-700">{it.numero_serie || '-'}</strong>
                          {it.numero_tombo ? ` • Tombo: ${it.numero_tombo}` : ''}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded pointer-events-none shrink-0"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Motivo da Alteração */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Justificativa / Motivo da Atualização da Carga (Auditoria)
            </label>
            <input
              type="text"
              placeholder="Ex: Ofício nº 88/2026 - P4 (Reforço operacional de fuzil e remanejamento de 50 munições)"
              value={observacaoAlt}
              onChange={(e) => setObservacaoAlt(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Footer Summary & Actions */}
          <div className="p-3 bg-indigo-900 text-white rounded-xl flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold block">Resumo Pós-Alteração:</span>
              <span className="text-indigo-200">
                {totalItensAtuais} equipamentos totais na subunidade • {totalMunicoesFinais} munições CBC
              </span>
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
                <span>Salvar Atualização de Carga</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
