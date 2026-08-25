import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { Unidade, TipoUnidade } from '../../types/database';
import {
  Building2,
  Plus,
  Search,
  FileDown,
  Edit,
  Trash2,
  Shield,
  MapPin,
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Phone,
  User,
  Package,
} from 'lucide-react';
import { ModalNovaUnidade } from '../unidades/ModalNovaUnidade';
import { ModalEditarUnidade } from '../unidades/ModalEditarUnidade';
import { PdfReportService } from '../../services/pdfReportService';

export const UnidadesView: React.FC = () => {
  const { db, unidades, policiais, isSuperuser } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [selectedUnidadeEdit, setSelectedUnidadeEdit] = useState<Unidade | null>(null);
  const [unidadeParaExcluir, setUnidadeParaExcluir] = useState<Unidade | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const alocacoes = db.getAlocacoesCompletas();

  // Metrics
  const totalUnidades = unidades.length;
  const totalCpms = unidades.filter((u) => u.tipo_unidade === 'CPM').length;
  const totalDpms = unidades.filter((u) => u.tipo_unidade === 'DPM').length;
  const totalSetores = unidades.filter((u) => u.tipo_unidade === 'Setor' || u.tipo_unidade === 'Pelotão').length;

  // Filtered List
  const filteredUnidades = unidades.filter((u) => {
    // Tipo filter
    if (filterTipo === 'CPM' && u.tipo_unidade !== 'CPM') return false;
    if (filterTipo === 'DPM' && u.tipo_unidade !== 'DPM') return false;
    if (filterTipo === 'SETORES' && u.tipo_unidade !== 'Setor' && u.tipo_unidade !== 'Pelotão') return false;
    if (filterTipo === 'BPM' && u.tipo_unidade !== 'BPM') return false;

    // Search filter
    const term = searchTerm.toLowerCase();
    const matchName = u.nome.toLowerCase().includes(term);
    const matchSigla = (u.sigla || '').toLowerCase().includes(term);
    const matchMunicipio = (u.municipio || '').toLowerCase().includes(term);
    const matchResp = (u.responsavel_nome || '').toLowerCase().includes(term);

    return matchName || matchSigla || matchMunicipio || matchResp;
  });

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!unidadeParaExcluir) return;
    setDeleteError(null);

    const res = db.excluirUnidade(unidadeParaExcluir.id_unidade);
    if (res.success) {
      setDeleteSuccess(`Unidade "${unidadeParaExcluir.nome}" excluída com sucesso.`);
      setUnidadeParaExcluir(null);
      setTimeout(() => setDeleteSuccess(null), 4000);
    } else {
      setDeleteError(res.error || 'Erro ao excluir unidade.');
    }
  };

  if (!isSuperuser) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Acesso Restrito ao Superuser
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            O menu de gerenciamento de unidades e setores é restrito exclusivamente ao perfil de <strong>Superuser</strong> da administração do 6º BPM.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Institutional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-900 text-amber-400 border border-blue-800 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Gestão de Unidades, Companhias & Setores
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase">
                Acesso Superuser
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Controle hierárquico, criação, edição e exclusão de BPM, CPMs, DPMs, Pelotões e Seções Administrativas
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfReportService.gerarRelatorioEstruturaUnidades(db)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Exportar Estrutura Organizacional em PDF"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>Relatório PDF</span>
          </button>
          <button
            onClick={() => setShowNovoModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm shadow-blue-900/30 transition focus:ring-2 focus:ring-blue-900"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nova Unidade / Setor</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {deleteSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* KPI Cards (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Estruturas</span>
            <Building2 className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalUnidades}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cadastradas no 6º BPM</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Companhias (CPMs)</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-indigo-600 tracking-tight">{totalCpms}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Sedes operacionais regionais</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Destacamentos (DPMs)</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{totalDpms}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Municípios subordinados</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pelotões & Setores</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-amber-600 tracking-tight">{totalSetores}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Seções internas e especializados</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'TODOS', label: 'Todas as Estruturas' },
              { id: 'CPM', label: 'Companhias (CPMs)' },
              { id: 'DPM', label: 'Destacamentos (DPMs)' },
              { id: 'SETORES', label: 'Pelotões & Setores' },
              { id: 'BPM', label: 'Sede (BPM)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTipo(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterTipo === tab.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar unidade, sigla, município ou chefe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-900 focus:bg-white shadow-xs transition"
            />
          </div>
        </div>
      </div>

      {/* Units Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Tipo / Sigla</th>
              <th className="p-3.5">Nome da Unidade / Setor</th>
              <th className="p-3.5">Município</th>
              <th className="p-3.5">Subordinação Hierárquica</th>
              <th className="p-3.5">Efetivo Lotado</th>
              <th className="p-3.5">Materiais Alocados</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUnidades.map((u, idx) => {
              const superior = unidades.find((sup) => sup.id_unidade === u.id_unidade_superior);
              const efetivoCount = policiais.filter(
                (p) => p.id_unidade_lotacao === u.id_unidade || p.id_unidade === u.id_unidade
              ).length;
              const alocacoesCount = alocacoes.filter(
                (a) => a.id_unidade === u.id_unidade && a.status === 'Ativa'
              ).length;

              const badgeColor =
                u.tipo_unidade === 'BPM'
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : u.tipo_unidade === 'CPM'
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                  : u.tipo_unidade === 'DPM'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : u.tipo_unidade === 'Pelotão'
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300';

              return (
                <tr key={`${u.id_unidade || 'unidade'}-${idx}`} className="hover:bg-slate-50/80 transition">
                  {/* Tipo / Sigla */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${badgeColor}`}>
                        {u.tipo_unidade}
                      </span>
                      {u.sigla && (
                        <span className="font-mono text-slate-800 font-bold text-xs">
                          {u.sigla}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Nome & Responsável */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{u.nome}</div>
                    {u.responsavel_nome && (
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Chefe/Cmt: {u.responsavel_nome}</span>
                      </div>
                    )}
                    {u.telefone && (
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5 font-mono">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        <span>{u.telefone}</span>
                      </div>
                    )}
                  </td>

                  {/* Município */}
                  <td className="p-3.5 text-slate-700 whitespace-nowrap">
                    <div className="flex items-center space-x-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.municipio || 'Caicó'}</span>
                    </div>
                  </td>

                  {/* Subordinação */}
                  <td className="p-3.5 text-slate-600">
                    {superior ? (
                      <div className="flex items-center space-x-1 text-slate-700">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                          {superior.tipo_unidade}
                        </span>
                        <span className="font-semibold">{superior.sigla || superior.nome}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Comando Geral (Raiz)</span>
                    )}
                  </td>

                  {/* Efetivo */}
                  <td className="p-3.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{efetivoCount} PMs</span>
                    </span>
                  </td>

                  {/* Cargas */}
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        alocacoesCount > 0
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      <span>{alocacoesCount} Cargas</span>
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedUnidadeEdit(u)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                        title="Editar Unidade / Setor"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-800" />
                        <span>Editar</span>
                      </button>

                      {u.id_unidade !== 1 && (
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setUnidadeParaExcluir(u);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                          title="Excluir Unidade"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Novo */}
      {showNovoModal && (
        <ModalNovaUnidade
          onClose={() => setShowNovoModal(false)}
          onSuccess={() => setShowNovoModal(false)}
        />
      )}

      {/* Modal Editar */}
      {selectedUnidadeEdit && (
        <ModalEditarUnidade
          unidade={selectedUnidadeEdit}
          onClose={() => setSelectedUnidadeEdit(null)}
          onSuccess={() => setSelectedUnidadeEdit(null)}
          onDeleteRequest={(un) => {
            setSelectedUnidadeEdit(null);
            setUnidadeParaExcluir(un);
          }}
        />
      )}

      {/* Modal Confirmação de Exclusão */}
      {unidadeParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirmar Exclusão de Unidade
              </h3>
              <p className="text-xs text-slate-600">
                Tem certeza que deseja excluir a unidade{' '}
                <strong className="text-slate-900 font-bold">"{unidadeParaExcluir.nome}"</strong>?
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Verificação de Integridade e Vínculos:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Não pode possuir policiais lotados</li>
                <li>Não pode possuir alocações de materiais ou viaturas ativas</li>
                <li>Não pode possuir destacamentos ou setores subordinados</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setUnidadeParaExcluir(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
