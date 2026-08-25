import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  Users,
  Search,
  Plus,
  Shield,
  BadgeCheck,
  Phone,
  FileText,
  AlertCircle,
  X,
  PlusCircle,
  Edit,
  FileDown,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { PatentePM, Policial } from '../../types/database';
import { ModalEditarPolicial } from './ModalEditarPolicial';
import { PdfReportService } from '../../services/pdfReportService';

type SortField = 'matricula' | 'patente' | 'nome_guerra' | 'nome_completo' | 'lotacao' | 'status' | 'cautelas';
type SortDirection = 'asc' | 'desc';

const patenteOrder: Record<string, number> = {
  'Cel PM': 1,
  'Ten Cel PM': 2,
  'Maj PM': 3,
  'Cap PM': 4,
  '1º Ten PM': 5,
  '2º Ten PM': 6,
  'Asp PM': 7,
  'Subten PM': 8,
  '1º Sgt PM': 9,
  '2º Sgt PM': 10,
  '3º Sgt PM': 11,
  'Cb PM': 12,
  'Sd PM': 13,
};

export const EfetivoView: React.FC = () => {
  const { db, policiais, unidades } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatente, setFilterPatente] = useState('todas');
  const [showModalNovoPolicial, setShowModalNovoPolicial] = useState(false);
  const [selectedPolicialEdit, setSelectedPolicialEdit] = useState<Policial | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('nome_completo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form states for new policial
  const [matricula, setMatricula] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [patente, setPatente] = useState<string>('Sd PM');
  const [idUnidade, setIdUnidade] = useState<number>(unidades[0]?.id_unidade || 1);
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPoliciais = policiais.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.matricula.toLowerCase().includes(term) ||
      p.nome_completo.toLowerCase().includes(term) ||
      p.nome_guerra.toLowerCase().includes(term) ||
      p.patente.toLowerCase().includes(term);

    const matchesPatente = filterPatente === 'todas' || p.patente === filterPatente;

    return matchesSearch && matchesPatente;
  });

  const sortedPoliciais = [...filteredPoliciais].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'matricula') {
      cmp = a.matricula.localeCompare(b.matricula);
    } else if (sortField === 'patente') {
      const orderA = patenteOrder[a.patente] ?? 99;
      const orderB = patenteOrder[b.patente] ?? 99;
      cmp = orderA - orderB;
    } else if (sortField === 'nome_guerra') {
      cmp = a.nome_guerra.localeCompare(b.nome_guerra, 'pt-BR', { sensitivity: 'base' });
    } else if (sortField === 'nome_completo') {
      cmp = a.nome_completo.localeCompare(b.nome_completo, 'pt-BR', { sensitivity: 'base' });
    } else if (sortField === 'lotacao') {
      const unitA = unidades.find((u) => u.id_unidade === (a.id_unidade_lotacao || a.id_unidade))?.nome || '';
      const unitB = unidades.find((u) => u.id_unidade === (b.id_unidade_lotacao || b.id_unidade))?.nome || '';
      cmp = unitA.localeCompare(unitB, 'pt-BR', { sensitivity: 'base' });
    } else if (sortField === 'status') {
      cmp = (a.status || '').localeCompare(b.status || '');
    } else if (sortField === 'cautelas') {
      const countA = db
        .getCautelasCompletas()
        .filter((c) => c.policial.matricula === a.matricula && (c.status === 'Aberta' || c.status === 'Atrasada')).length;
      const countB = db
        .getCautelasCompletas()
        .filter((c) => c.policial.matricula === b.matricula && (c.status === 'Aberta' || c.status === 'Atrasada')).length;
      cmp = countA - countB;
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const renderSortTh = (field: SortField, label: string, extraClass = '') => {
    const isSelected = sortField === field;
    return (
      <th
        className={`p-3 cursor-pointer select-none hover:bg-slate-100/90 transition group ${extraClass}`}
        onClick={() => handleSort(field)}
        title={`Clique para ordenar por ${label}`}
      >
        <div className="inline-flex items-center space-x-1.5 font-bold text-slate-700">
          <span>{label}</span>
          <span className="text-slate-400 group-hover:text-blue-600 transition">
            {isSelected ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const handleCadastrarPolicial = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!matricula || !nomeCompleto || !nomeGuerra) {
      setErrorMessage('Preencha os campos obrigatórios (Matrícula, Nome Completo e Nome de Guerra).');
      return;
    }

    const res = db.cadastrarPolicial({
      matricula: matricula.trim(),
      nome_completo: nomeCompleto.trim(),
      nome_guerra: nomeGuerra.trim(),
      patente,
      id_unidade: Number(idUnidade),
      id_unidade_lotacao: Number(idUnidade),
      status: 'Ativo',
      telefone: telefone || null,
      email: email || null,
    });

    if (res.success) {
      setShowModalNovoPolicial(false);
      setMatricula('');
      setNomeCompleto('');
      setNomeGuerra('');
      setTelefone('');
      setEmail('');
    } else {
      setErrorMessage(res.error || 'Erro ao cadastrar policial');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Efetivo Policial Militar (6º BPM)</h1>
            <p className="text-xs text-slate-500">
              Quadro de Oficiais e Praças habilitados para cautela e uso do patrimônio bélico e operacional • Caicó/RN
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfReportService.gerarRelatorioEfetivo(db)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Exportar Relação Geral do Efetivo em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>
          <button
            onClick={() => setShowModalNovoPolicial(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Policial Militar</span>
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por matrícula, nome de guerra ou nome completo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Graduação:</span>
          <select
            value={filterPatente ?? 'todas'}
            onChange={(e) => setFilterPatente(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="todas">Todas as Graduações</option>
            <option value="Cel PM">Cel PM (Coronel)</option>
            <option value="Ten Cel PM">Ten Cel PM (Tenente Coronel)</option>
            <option value="Maj PM">Maj PM (Major)</option>
            <option value="Cap PM">Cap PM (Capitão)</option>
            <option value="1º Ten PM">1º Ten PM (1º Tenente)</option>
            <option value="2º Ten PM">2º Ten PM (2º Tenente)</option>
            <option value="Subten PM">Subten PM (Subtenente)</option>
            <option value="1º Sgt PM">1º Sgt PM (1º Sargento)</option>
            <option value="2º Sgt PM">2º Sgt PM (2º Sargento)</option>
            <option value="3º Sgt PM">3º Sgt PM (3º Sargento)</option>
            <option value="Cb PM">Cb PM (Cabo)</option>
            <option value="Sd PM">Sd PM (Soldado)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              {renderSortTh('matricula', 'Matrícula')}
              {renderSortTh('patente', 'Graduação / Posto')}
              {renderSortTh('nome_guerra', 'Nome de Guerra')}
              {renderSortTh('nome_completo', 'Nome Completo')}
              {renderSortTh('lotacao', 'Lotação (Pelotão / OPM)')}
              {renderSortTh('status', 'Situação')}
              {renderSortTh('cautelas', 'Cautelas')}
              <th className="p-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPoliciais.map((p, idx) => {
              const cautelasDoPolicial = db
                .getCautelasCompletas()
                .filter((c) => c.policial.matricula === p.matricula && (c.status === 'Aberta' || c.status === 'Atrasada'));
              const unitId = p.id_unidade_lotacao || p.id_unidade;
              const unidadePolicial = unidades.find((u) => u.id_unidade === unitId);

              return (
                <tr key={`${p.id_policial || 'pol'}-${p.matricula || ''}-${idx}`} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-blue-700">{p.matricula}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center space-x-1.5 font-bold text-slate-900">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.patente}</span>
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{p.nome_guerra}</td>
                  <td className="p-3 text-slate-700">{p.nome_completo}</td>
                  <td className="p-3 text-slate-600">
                    {unidadePolicial ? (
                      <span className="inline-flex items-center space-x-1 font-semibold text-slate-800">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{unidadePolicial.sigla}</span>
                      </span>
                    ) : (
                      '6º BPM'
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                        p.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : p.status === 'Férias'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : p.status === 'Licença'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {cautelasDoPolicial.length > 0 ? (
                      <span className="font-bold text-amber-800 px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-[10px]">
                        {cautelasDoPolicial.length} ativa(s)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedPolicialEdit(p)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                      title="Editar Dados do Policial Militar"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-700" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro de Novo Policial */}
      {showModalNovoPolicial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Cadastrar Policial Militar</h3>
              </div>
              <button
                onClick={() => setShowModalNovoPolicial(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCadastrarPolicial} className="space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Graduação / Posto</label>
                <select
                  value={patente ?? 'Sd PM'}
                  onChange={(e) => setPatente(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="Cel PM">Cel PM (Coronel)</option>
                  <option value="Ten Cel PM">Ten Cel PM (Tenente Coronel)</option>
                  <option value="Maj PM">Maj PM (Major)</option>
                  <option value="Cap PM">Cap PM (Capitão)</option>
                  <option value="1º Ten PM">1º Ten PM (1º Tenente)</option>
                  <option value="2º Ten PM">2º Ten PM (2º Tenente)</option>
                  <option value="Subten PM">Subten PM (Subtenente)</option>
                  <option value="1º Sgt PM">1º Sgt PM (1º Sargento)</option>
                  <option value="2º Sgt PM">2º Sgt PM (2º Sargento)</option>
                  <option value="3º Sgt PM">3º Sgt PM (3º Sargento)</option>
                  <option value="Cb PM">Cb PM (Cabo)</option>
                  <option value="Sd PM">Sd PM (Soldado)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matrícula</label>
                  <input
                    type="text"
                    placeholder="Ex: PM-240992-1"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nome de Guerra</label>
                  <input
                    type="text"
                    placeholder="Ex: SILVA"
                    value={nomeGuerra}
                    onChange={(e) => setNomeGuerra(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Nome completo conforme boletim"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lotação (OPM / Pelotão)</label>
                <select
                  value={idUnidade ?? ''}
                  onChange={(e) => setIdUnidade(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                >
                  {unidades.map((u) => (
                    <option key={u.id_unidade} value={u.id_unidade}>
                      {u.sigla} - {u.nome} ({u.municipio})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telefone Contato</label>
                  <input
                    type="text"
                    placeholder="(84) 98800-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="nome@pm.rn.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovoPolicial(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs"
                >
                  Salvar Policial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Policial */}
      {selectedPolicialEdit && (
        <ModalEditarPolicial
          policial={selectedPolicialEdit}
          onClose={() => setSelectedPolicialEdit(null)}
          onSuccess={() => setSelectedPolicialEdit(null)}
        />
      )}
    </div>
  );
};
