import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  TipoMaterial,
  ModuloTipo,
  ModoControleMaterial,
  CategoriaEspecializada,
} from '../../types/database';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Shield,
  Tag,
  Boxes,
  Info,
  AlertOctagon,
} from 'lucide-react';

export const CatalogoMateriaisView: React.FC = () => {
  const { db, tiposMateriais, isSuperuser, canManageUnidades } = useDatabase();

  const [filterModulo, setFilterModulo] = useState<string>('todos');
  const [filterModo, setFilterModo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoMaterial | null>(null);

  // Form State
  const [formModulo, setFormModulo] = useState<ModuloTipo>('Armas');
  const [formNome, setFormNome] = useState('');
  const [formModo, setFormModo] = useState<ModoControleMaterial>('INDIVIDUAL');
  const [formPermiteSerie, setFormPermiteSerie] = useState(true);
  const [formExigeSerie, setFormExigeSerie] = useState(true);
  const [formPermiteTombo, setFormPermiteTombo] = useState(true);
  const [formExigeTombo, setFormExigeTombo] = useState(false);
  const [formCategoriaEsp, setFormCategoriaEsp] = useState<CategoriaEspecializada>('arma');
  const [formDescricao, setFormDescricao] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<{ id: number; nome: string } | null>(null);

  const consolidatedStock = db.getEstoqueConsolidado();

  const filteredTipos = tiposMateriais.filter((t) => {
    const matchesModulo = filterModulo === 'todos' || t.modulo === filterModulo;
    const matchesModo = filterModo === 'todos' || t.modo_controle === filterModo;
    const matchesSearch =
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModulo && matchesModo && matchesSearch;
  });

    const handleOpenCreate = () => {
      setEditingTipo(null);
      setFormModulo('Armas');
      setFormNome('');
      setFormModo('INDIVIDUAL');
      setFormPermiteSerie(true);
      setFormExigeSerie(true);
      setFormPermiteTombo(true);
      setFormExigeTombo(false);
      setFormCategoriaEsp('arma');
      setFormDescricao('');
      setErrorMessage(null);
      setModalOpen(true);
    };

    const handleOpenEdit = (tipo: TipoMaterial) => {
      setEditingTipo(tipo);
      setFormModulo(tipo.modulo);
      setFormNome(tipo.nome);
      setFormModo(tipo.modo_controle);
      setFormPermiteSerie(tipo.permite_numero_serie);
      setFormExigeSerie(tipo.exige_numero_serie);
      setFormPermiteTombo(tipo.permite_numero_tombo);
      setFormExigeTombo(tipo.exige_numero_tombo);
      setFormCategoriaEsp(tipo.categoria_especializada);
      setFormDescricao(tipo.descricao || '');
      setErrorMessage(null);
      setModalOpen(true);
    };

    const handleDelete = (id_tipo: number, nome: string) => {
      setTipoToDelete({ id: id_tipo, nome });
    };

    const confirmDelete = () => {
      if (!tipoToDelete) return;
      const res = db.excluirTipoMaterial(tipoToDelete.id);
      if (res.success) {
        setSuccessMessage(`Tipo de material "${tipoToDelete.nome}" excluído com sucesso.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        setTipoToDelete(null);
      } else {
        setErrorMessage(res.error || 'Erro ao excluir tipo de material.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (!formNome.trim()) {
        setErrorMessage('Informe o nome do material.');
        return;
      }

      if (editingTipo) {
        const res = db.atualizarTipoMaterial(editingTipo.id_tipo_material, {
          modulo: formModulo,
          nome: formNome.trim(),
          modo_controle: formModo,
          permite_numero_serie: formPermiteSerie,
          exige_numero_serie: formExigeSerie,
          permite_numero_tombo: formPermiteTombo,
          exige_numero_tombo: formExigeTombo,
          categoria_especializada: formCategoriaEsp,
          descricao: formDescricao.trim() || undefined,
        });

        if (res.success) {
          setSuccessMessage(`Tipo de material "${formNome}" atualizado com sucesso.`);
          setTimeout(() => setSuccessMessage(null), 4000);
          setModalOpen(false);
        } else {
          setErrorMessage(res.error || 'Erro ao atualizar tipo de material.');
        }
      } else {
        const res = db.cadastrarTipoMaterial({
          modulo: formModulo,
          nome: formNome.trim(),
          modo_controle: formModo,
          permite_numero_serie: formPermiteSerie,
          exige_numero_serie: formExigeSerie,
          permite_numero_tombo: formPermiteTombo,
          exige_numero_tombo: formExigeTombo,
          categoria_especializada: formCategoriaEsp,
          descricao: formDescricao.trim() || undefined,
        });

        if (res.success) {
          setSuccessMessage(`Tipo de material "${formNome}" cadastrado com sucesso.`);
          setTimeout(() => setSuccessMessage(null), 4000);
          setModalOpen(false);
        } else {
          setErrorMessage(res.error || 'Erro ao cadastrar tipo de material.');
        }
      }
    };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Catálogo e Modos de Controle de Materiais</h1>
            <p className="text-xs text-slate-500">
              Parametrização de regras: Individual (Nº Série/Tombo), Quantidade (Lotes) e Híbrido • 6º BPM
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Tipo de Material</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Tipos</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{tiposMateriais.length}</div>
          <div className="text-[10px] text-slate-500">Definições canônicas ativas</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Controle Individual</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {tiposMateriais.filter((t) => t.modo_controle === 'INDIVIDUAL').length}
          </div>
          <div className="text-[10px] text-slate-500">Armas, Coletes, Viaturas, Rádios</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Controle Quantidade</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {tiposMateriais.filter((t) => t.modo_controle === 'QUANTIDADE').length}
          </div>
          <div className="text-[10px] text-slate-500">Munições CBC, Insumos</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Controle Híbrido</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {tiposMateriais.filter((t) => t.modo_controle === 'HIBRIDO').length}
          </div>
          <div className="text-[10px] text-slate-500">Algemas, Bastões, Lanternas, Coletes Refl.</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar tipo de material por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterModulo ?? 'todos'}
            onChange={(e) => setFilterModulo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600"
          >
            <option value="todos">Todos os Módulos</option>
            <option value="Armas">Bélico (Armas)</option>
            <option value="Comunicação">Comunicação</option>
            <option value="Viaturas">Viaturas</option>
            <option value="Informática">Informática</option>
            <option value="Móveis e Diversos">Móveis e Diversos</option>
          </select>

          <select
            value={filterModo ?? 'todos'}
            onChange={(e) => setFilterModo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600"
          >
            <option value="todos">Todos os Modos</option>
            <option value="INDIVIDUAL">INDIVIDUAL</option>
            <option value="QUANTIDADE">QUANTIDADE</option>
            <option value="HIBRIDO">HÍBRIDO</option>
          </select>
        </div>
      </div>

      {/* Table of Material Types */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Material / Módulo</th>
                <th className="py-3 px-3">Modo de Controle</th>
                <th className="py-3 px-3">Nº de Série</th>
                <th className="py-3 px-3">Tombo Patrimonial</th>
                <th className="py-3 px-3">Categoria Detalhe</th>
                <th className="py-3 px-3 text-center">Estoque Consolidado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTipos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum tipo de material encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTipos.map((tipo, idx) => {
                  const stock = consolidatedStock.find(
                    (s) => s.tipo_material.id_tipo_material === tipo.id_tipo_material
                  );
                  return (
                    <tr key={`${tipo.id_tipo_material || 'tipo'}-${idx}`} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{tipo.nome}</div>
                        <div className="text-[10px] text-slate-500">
                          {tipo.modulo} {tipo.descricao ? `• ${tipo.descricao}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            tipo.modo_controle === 'INDIVIDUAL'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : tipo.modo_controle === 'QUANTIDADE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {tipo.modo_controle}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        {tipo.exige_numero_serie ? (
                          <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Obrigatório
                          </span>
                        ) : tipo.permite_numero_serie ? (
                          <span className="text-slate-600 font-normal">Opcional</span>
                        ) : (
                          <span className="text-slate-400 italic">Não se aplica</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        {tipo.exige_numero_tombo ? (
                          <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Obrigatório
                          </span>
                        ) : tipo.permite_numero_tombo ? (
                          <span className="text-slate-600 font-normal">Opcional</span>
                        ) : (
                          <span className="text-slate-400 italic">Não se aplica</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        <span className="capitalize text-slate-600 font-mono">
                          {String(tipo.categoria_especializada).toLowerCase() === 'nenhuma'
                            ? 'Padrão'
                            : `detalhe_${String(tipo.categoria_especializada).toLowerCase()}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {stock ? (
                          <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <span className="font-bold text-slate-900">{stock.total_fisico} un.</span>
                            {stock.qtd_individual_total > 0 && stock.qtd_lote_total > 0 && (
                              <span className="text-[10px] text-slate-500">
                                ({stock.qtd_individual_total} ind. + {stock.qtd_lote_total} em lote)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">0 un.</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(tipo)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                          title="Editar Parâmetros"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tipo.id_tipo_material, tipo.nome)}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition"
                          title="Excluir Tipo de Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo / Editar Tipo de Material */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingTipo ? `Editar Tipo: ${editingTipo.nome}` : 'Novo Tipo de Material'}
                  </h2>
                  <p className="text-xs text-slate-500">Definição canônica de regras patrimoniais</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Módulo Vinculado</label>
                  <select
                    value={formModulo ?? 'Armas'}
                    onChange={(e) => setFormModulo(e.target.value as ModuloTipo)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-semibold"
                  >
                    <option value="Armas">Armas (Material Bélico)</option>
                    <option value="Comunicação">Comunicação</option>
                    <option value="Viaturas">Viaturas</option>
                    <option value="Informática">Informática</option>
                    <option value="Móveis e Diversos">Móveis e Diversos</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Modo de Controle</label>
                  <select
                    value={formModo ?? 'INDIVIDUAL'}
                    onChange={(e) => {
                      const modo = e.target.value as ModoControleMaterial;
                      setFormModo(modo);
                      if (modo === 'QUANTIDADE') {
                        setFormPermiteSerie(false);
                        setFormExigeSerie(false);
                        setFormPermiteTombo(false);
                        setFormExigeTombo(false);
                      } else if (modo === 'INDIVIDUAL') {
                        setFormPermiteSerie(true);
                        setFormPermiteTombo(true);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL (Unidade única)</option>
                    <option value="QUANTIDADE">QUANTIDADE (Lote / Granel)</option>
                    <option value="HIBRIDO">HÍBRIDO (Individual ou Lote)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Nome do Material / Equipamento</label>
                <input
                  type="text"
                  placeholder="Ex: Pistola, Colete Balístico, Algema, Lanterna Tática, Cartucho CBC 9mm"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              {/* Identifier Permissions & Requirements */}
              {formModo !== 'QUANTIDADE' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-800 text-[11px]">Regras de Identificadores:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermiteSerie}
                          onChange={(e) => {
                            setFormPermiteSerie(e.target.checked);
                            if (!e.target.checked) setFormExigeSerie(false);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">Permite Nº de Série</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer pl-4">
                        <input
                          type="checkbox"
                          checked={formExigeSerie}
                          disabled={!formPermiteSerie}
                          onChange={(e) => setFormExigeSerie(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-600">Obrigatório no cadastro</span>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermiteTombo}
                          onChange={(e) => {
                            setFormPermiteTombo(e.target.checked);
                            if (!e.target.checked) setFormExigeTombo(false);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">Permite Nº de Tombo</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer pl-4">
                        <input
                          type="checkbox"
                          checked={formExigeTombo}
                          disabled={!formPermiteTombo}
                          onChange={(e) => setFormExigeTombo(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-600">Obrigatório no cadastro</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Tabela de Detalhes Especializados</label>
                  <select
                    value={formCategoriaEsp ?? 'nenhuma'}
                    onChange={(e) => setFormCategoriaEsp(e.target.value as CategoriaEspecializada)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value="nenhuma">Nenhuma (Padrão genérico)</option>
                    <option value="arma">detalhe_arma (Sigma, calibre, brasão, carregadores)</option>
                    <option value="colete">detalhe_colete (Gênero, tamanho, nível, validade)</option>
                    <option value="impo">detalhe_impo (Validade químico)</option>
                    <option value="comunicacao">detalhe_comunicacao (IMEI/MAC, linha)</option>
                    <option value="viatura">detalhe_viatura (Placa, prefixo, Renavam, chassi)</option>
                    <option value="informatica">detalhe_informatica (Configuração de TI)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Descrição / Instruções</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Utilizado para controle de algemas com ou sem tombo do BPM..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Tipo de Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for deletion */}
      {tipoToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Confirmar Exclusão de Categoria</h3>
                <p className="text-xs text-rose-700">Catálogo do Sistema</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <p className="text-sm text-slate-800 leading-relaxed">
                Confirma a exclusão do Tipo de Material{' '}
                <strong className="text-slate-900 font-bold">"{tipoToDelete.nome}"</strong>?
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ Se houver itens patrimoniais cadastrados vinculados a este tipo de material, a exclusão será bloqueada.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setTipoToDelete(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center space-x-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
