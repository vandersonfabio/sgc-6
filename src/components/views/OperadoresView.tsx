import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import {
  Shield,
  UserCheck,
  Crosshair,
  Radio,
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X,
  UserPlus,
  Clock,
  Mail,
  ShieldCheck,
  Check,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { PerfilAcesso, Policial, OperadorSistema } from '../../types/database';

export const OperadoresView: React.FC = () => {
  const {
    db,
    operadores,
    policiais,
    currentOperador,
    isSuperuser,
    canManageOperadores,
    cadastrarOperador,
    editarOperador,
    excluirOperador,
    syncAllOperadoresAuth,
  } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<string>('todos');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OperadorSistema | null>(null);
  const [isSyncingAuth, setIsSyncingAuth] = useState(false);

  // Form states for new operator
  const [selectedPolicialId, setSelectedPolicialId] = useState<number>(0);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<PerfilAcesso>('Armeiro');
  const [novaSenha, setNovaSenha] = useState('123');
  const [novoStatus, setNovoStatus] = useState<'Ativo' | 'Inativo' | 'Bloqueado'>('Ativo');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for editing operator
  const [editEmail, setEditEmail] = useState('');
  const [editPerfil, setEditPerfil] = useState<PerfilAcesso>('Armeiro');
  const [editSenha, setEditSenha] = useState('');
  const [editStatus, setEditStatus] = useState<'Ativo' | 'Inativo' | 'Bloqueado'>('Ativo');

  // Filter existing operators
  const filteredOperadores = operadores.filter(({ operador, policial }) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (operador.email || '').toLowerCase().includes(term) ||
      (policial?.nome_completo || '').toLowerCase().includes(term) ||
      (policial?.nome_guerra || '').toLowerCase().includes(term) ||
      (policial?.matricula || '').toLowerCase().includes(term);

    const matchesPerfil = filterPerfil === 'todos' || operador.perfil_acesso === filterPerfil;

    return matchesSearch && matchesPerfil;
  });

  // Policiais without operator account
  const policiaisDisponiveis = policiais.filter(
    (p) => !operadores.some((op) => op.operador.id_policial === p.id_policial)
  );

  const handleOpenNovo = () => {
    if (policiaisDisponiveis.length > 0) {
      const first = policiaisDisponiveis[0];
      setSelectedPolicialId(first.id_policial);
      setNovoEmail(first.email || `${first.nome_guerra.toLowerCase().replace(/\s+/g, '')}.6bpm@pm.rn.gov.br`);
    } else {
      setSelectedPolicialId(0);
      setNovoEmail('');
    }
    setNovoPerfil('Armeiro');
    setNovaSenha('123');
    setNovoStatus('Ativo');
    setErrorMessage(null);
    setShowNovoModal(true);
  };

  const handlePolicialChange = (pId: number) => {
    setSelectedPolicialId(pId);
    const pol = policiais.find((p) => p.id_policial === pId);
    if (pol) {
      setNovoEmail(pol.email || `${pol.nome_guerra.toLowerCase().replace(/\s+/g, '')}.6bpm@pm.rn.gov.br`);
    }
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPolicialId) {
      setErrorMessage('Selecione um Policial Militar do efetivo.');
      return;
    }
    if (!novoEmail.trim()) {
      setErrorMessage('Informe o e-mail institucional do operador.');
      return;
    }

    const res = cadastrarOperador({
      id_policial: selectedPolicialId,
      perfil_acesso: novoPerfil,
      email: novoEmail.trim(),
      senha: novaSenha.trim() || '123',
      status: novoStatus,
    });

    if (res.success) {
      setShowNovoModal(false);
      setSuccessMessage('Operador cadastrado e credenciado com sucesso no sistema!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(res.error || 'Erro ao cadastrar operador.');
    }
  };

  const handleOpenEdit = (op: OperadorSistema) => {
    setSelectedOp(op);
    setEditEmail(op.email || '');
    setEditPerfil(op.perfil_acesso);
    setEditStatus(op.status);
    setEditSenha('');
    setErrorMessage(null);
    setShowEditModal(true);
  };

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) return;

    setErrorMessage(null);
    const res = editarOperador(selectedOp.id_operador, {
      email: editEmail.trim(),
      perfil_acesso: editPerfil,
      status: editStatus,
      senha: editSenha.trim() || undefined,
    });

    if (res.success) {
      setShowEditModal(false);
      setSuccessMessage('Dados e credenciais do operador atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(res.error || 'Erro ao salvar alterações.');
    }
  };

  const handleSyncAuth = async () => {
    setIsSyncingAuth(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await syncAllOperadoresAuth();
      if (res.success) {
        setSuccessMessage(`Todas as contas (${res.count}) foram sincronizadas com o cofre Supabase Auth com sucesso!`);
      } else {
        setSuccessMessage(`Sincronização concluída com avisos em ${res.errors.length} conta(s).`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao sincronizar com Supabase Auth.');
    } finally {
      setIsSyncingAuth(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleExcluir = (op: OperadorSistema, nomePol: string) => {
    if (confirm(`Tem certeza que deseja revogar e excluir a conta de operador de ${nomePol}?`)) {
      const res = excluirOperador(op.id_operador);
      if (res.success) {
        setSuccessMessage('Conta de operador revogada com sucesso.');
        setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        alert(res.error || 'Erro ao excluir operador.');
      }
    }
  };

  const getPerfilBadge = (p: PerfilAcesso) => {
    switch (p) {
      case 'Superuser':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'P4':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Armeiro':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Rádio':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Comandante':
        return 'bg-amber-100 text-amber-900 border-amber-400 font-semibold';
    }
  };

  const getPerfilIcon = (p: PerfilAcesso) => {
    switch (p) {
      case 'Superuser':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'P4':
        return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
      case 'Armeiro':
        return <Crosshair className="w-3.5 h-3.5 text-amber-600" />;
      case 'Rádio':
        return <Radio className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Comandante':
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Gestão de Operadores do Sistema (RBAC)
            </h1>
            <p className="text-xs text-slate-500">
              Controle de contas, perfis de acesso militar e senhas gerenciados exclusivamente por Superuser e P4
            </p>
          </div>
        </div>

        {canManageOperadores && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="btn-sync-supabase-auth"
              onClick={handleSyncAuth}
              disabled={isSyncingAuth}
              title="Garante que todos os operadores estejam sincronizados no cofre oficial auth.users do Supabase"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAuth ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncingAuth ? 'Sincronizando...' : 'Sincronizar Supabase Auth'}</span>
            </button>
            <button
              id="btn-novo-operador"
              onClick={handleOpenNovo}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-500"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Operador</span>
            </button>
          </div>
        )}
      </div>

      {/* Auto-Sync Auth Informative Banner */}
      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Sincronização Automática com Supabase Auth:</strong> Todo operador cadastrado ou alterado aqui é automaticamente provisionado em <code>auth.users</code> com e-mail confirmado, sem necessidade de ir ao painel do Supabase.
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, matrícula, e-mail ou patente..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Perfil de Acesso:</span>
          <select
            value={filterPerfil ?? 'todos'}
            onChange={(e) => setFilterPerfil(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Perfis ({operadores.length})</option>
            <option value="Superuser">Superuser (Gestor Geral)</option>
            <option value="P4">P4 (Logística e Cautelas)</option>
            <option value="Armeiro">Armeiro (Módulo Armas)</option>
            <option value="Rádio">Rádio (Módulo Comunicação)</option>
            <option value="Comandante">Comandante (Visualização Geral / Leitura)</option>
          </select>
        </div>
      </div>

      {/* Operators List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Policial Militar</th>
                <th className="py-3 px-4">E-mail Institucional</th>
                <th className="py-3 px-4">Perfil Militar (RBAC)</th>
                <th className="py-3 px-4">Status da Conta</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOperadores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum operador encontrado com os critérios de busca.
                  </td>
                </tr>
              ) : (
                filteredOperadores.map(({ operador, policial }, idx) => {
                  const isCurrent = operador.id_operador === currentOperador.id_operador;
                  return (
                    <tr key={`${operador.id_operador || 'op'}-${idx}`} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-300">
                            {policial?.nome_guerra ? policial.nome_guerra.substring(0, 2).toUpperCase() : 'OP'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{policial ? `${policial.patente} ${policial.nome_guerra}` : operador.email}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">
                                  VOCÊ
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {policial ? `Matrícula: ${policial.matricula} • ${policial.nome_completo}` : operador.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{operador.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-2xs" style={{}} >
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${getPerfilBadge(operador.perfil_acesso)}`}>
                            {getPerfilIcon(operador.perfil_acesso)}
                            <span>{operador.perfil_acesso}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            operador.status === 'Ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : operador.status === 'Bloqueado'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {operador.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {operador.ultimo_login ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(operador.ultimo_login).toLocaleString('pt-BR')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nunca acessou</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageOperadores && (
                            <button
                              onClick={() => handleOpenEdit(operador)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Editar Perfil e Senha"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isSuperuser && !isCurrent && (
                            <button
                              onClick={() => handleExcluir(operador, `${policial.patente} ${policial.nome_guerra}`)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                              title="Revogar Conta de Operador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastrar Novo Operador */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Credenciar Novo Operador do Sistema</span>
              </div>
              <button onClick={() => setShowNovoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vincular ao Policial Militar <span className="text-red-500">*</span>
                </label>
                {policiaisDisponiveis.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Todos os policiais militares cadastrados no efetivo já possuem conta de operador associada. Cadastre um novo policial no módulo Efetivo primeiro.
                  </p>
                ) : (
                  <select
                    value={selectedPolicialId ?? ''}
                    onChange={(e) => handlePolicialChange(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {policiaisDisponiveis.map((pol) => (
                      <option key={pol.id_policial} value={pol.id_policial}>
                        {pol.patente} {pol.nome_guerra} — Matrícula: {pol.matricula} ({pol.nome_completo})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional (@pm.rn.gov.br) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="ex: nome.guerra@pm.rn.gov.br"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil de Acesso Militar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={novoPerfil ?? 'Armeiro'}
                    onChange={(e) => setNovoPerfil(e.target.value as PerfilAcesso)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Armeiro">Armeiro (Módulo Armas)</option>
                    <option value="Rádio">Rádio (Módulo Comunicação)</option>
                    <option value="P4">P4 (Gestor Logístico Geral)</option>
                    <option value="Comandante">Comandante (Visualização Geral / Somente Leitura)</option>
                    {isSuperuser && <option value="Superuser">Superuser (Administrador)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha Inicial de Acesso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Padrão: 123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Conta</label>
                <select
                  value={novoStatus ?? 'Ativo'}
                  onChange={(e) => setNovoStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ativo">Ativo (Habilitado para Login)</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Bloqueado">Bloqueado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNovoModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={policiaisDisponiveis.length === 0}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Salvar e Credenciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Operador */}
      {showEditModal && selectedOp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Editar Operador & Credenciais</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional (@pm.rn.gov.br) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil de Acesso Militar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editPerfil ?? 'Armeiro'}
                    onChange={(e) => setEditPerfil(e.target.value as PerfilAcesso)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Armeiro">Armeiro (Módulo Armas)</option>
                    <option value="Rádio">Rádio (Módulo Comunicação)</option>
                    <option value="P4">P4 (Gestor Logístico Geral)</option>
                    <option value="Comandante">Comandante (Visualização Geral / Somente Leitura)</option>
                    {isSuperuser && <option value="Superuser">Superuser (Administrador)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Conta</label>
                  <select
                    value={editStatus ?? 'Ativo'}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ativo">Ativo (Permite Login)</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Redefinir Senha de Acesso (Deixe em branco para manter a atual)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={editSenha}
                    onChange={(e) => setEditSenha(e.target.value)}
                    placeholder="Digite nova senha para o operador"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
