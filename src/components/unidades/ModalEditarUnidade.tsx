import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { Unidade, TipoUnidade } from '../../types/database';
import {
  Building2,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Shield,
  Trash2,
} from 'lucide-react';

interface ModalEditarUnidadeProps {
  unidade: Unidade;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteRequest?: (unidade: Unidade) => void;
}

export const ModalEditarUnidade: React.FC<ModalEditarUnidadeProps> = ({
  unidade,
  onClose,
  onSuccess,
  onDeleteRequest,
}) => {
  const { db, unidades, isSuperuser } = useDatabase();

  const [nome, setNome] = useState(unidade.nome || '');
  const [sigla, setSigla] = useState(unidade.sigla || '');
  const [tipoUnidade, setTipoUnidade] = useState<TipoUnidade>(
    (unidade.tipo_unidade as TipoUnidade) || 'DPM'
  );
  const [municipio, setMunicipio] = useState(unidade.municipio || 'Caicó');
  const [idUnidadeSuperior, setIdUnidadeSuperior] = useState<number | ''>(
    unidade.id_unidade_superior ?? ''
  );
  const [responsavelNome, setResponsavelNome] = useState(unidade.responsavel_nome || '');
  const [telefone, setTelefone] = useState(unidade.telefone || '');
  const [endereco, setEndereco] = useState(unidade.endereco || '');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSuperuser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Acesso Restrito</h2>
          <p className="text-xs text-slate-600">
            Apenas operadores com perfil de <strong>Superuser</strong> podem editar a estrutura de unidades e setores.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da unidade ou setor é obrigatório.');
      return;
    }

    if (idUnidadeSuperior !== '' && Number(idUnidadeSuperior) === unidade.id_unidade) {
      setError('Uma unidade não pode ser subordinada a ela mesma.');
      return;
    }

    setIsSubmitting(true);

    const res = db.atualizarUnidade(unidade.id_unidade, {
      nome: nome.trim(),
      sigla: sigla.trim() || undefined,
      tipo_unidade: tipoUnidade,
      municipio: municipio.trim() || 'Caicó',
      id_unidade_superior: idUnidadeSuperior === '' ? null : Number(idUnidadeSuperior),
      responsavel_nome: responsavelNome.trim() || null,
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
    });

    if (res.success) {
      setSuccessMsg(`Unidade "${nome}" atualizada com sucesso!`);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      setError(res.error || 'Erro ao atualizar unidade.');
      setIsSubmitting(false);
    }
  };

  // Filter out self from parent options to prevent circular hierarchy
  const availableParents = unidades.filter((u) => u.id_unidade !== unidade.id_unidade);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">Editar Unidade / Setor</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  ID #{unidade.id_unidade}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Alteração de dados cadastrais e subordinação hierárquica • 6º BPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Unidade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Estrutura <span className="text-rose-500">*</span>
              </label>
              <select
                value={tipoUnidade ?? 'DPM'}
                onChange={(e) => setTipoUnidade(e.target.value as TipoUnidade)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              >
                <option value="DPM">DPM (Destacamento Policial Militar)</option>
                <option value="CPM">CPM (Companhia de Polícia Militar)</option>
                <option value="Pelotão">Pelotão Especializado (ex: ROCAM, FT)</option>
                <option value="Setor">Setor / Seção Administrativa (ex: P4, P3, Reserva)</option>
                <option value="BPM">BPM (Batalhão / Quartel-General)</option>
              </select>
            </div>

            {/* Sigla / Código */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sigla / Código Curto
              </label>
              <input
                type="text"
                placeholder="Ex: 4ª CPM, DPM-TMB, P4"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome da Unidade / Setor <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: DPM Timbaúba dos Batistas ou 4ª CPM (Serra Negra do Norte)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Município */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Município / Localidade
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Caicó, Timbaúba dos Batistas"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>

            {/* Subordinação / Unidade Superior */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subordinação Hierárquica
              </label>
              <select
                value={idUnidadeSuperior ?? ''}
                onChange={(e) => setIdUnidadeSuperior(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              >
                <option value="">Sem subordinação (Raiz do Batalhão)</option>
                {availableParents.map((u) => (
                  <option key={u.id_unidade} value={u.id_unidade}>
                    [{u.tipo_unidade}] {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Responsável / Comandante */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Comandante / Chefe da Seção
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: 1º Sgt PM Silva, Cap PM Vanderson"
                  value={responsavelNome}
                  onChange={(e) => setResponsavelNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>

            {/* Telefone / Frequência Rádio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / Rádio Frequência
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: (84) 99888-7766 / HT Canal 04"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Endereço / Sede */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Endereço / Ponto de Referência
            </label>
            <input
              type="text"
              placeholder="Ex: Rua Cel. Martiniano, Centro, Caicó/RN"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {onDeleteRequest && unidade.id_unidade !== 1 ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(unidade);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Unidade</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
