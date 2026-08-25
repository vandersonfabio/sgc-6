import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { Policial } from '../../types/database';
import { X, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ModalEditarPolicialProps {
  policial: Policial;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarPolicial: React.FC<ModalEditarPolicialProps> = ({ policial, onClose, onSuccess }) => {
  const { db, unidades } = useDatabase();

  const [matricula, setMatricula] = useState(policial.matricula || '');
  const [patente, setPatente] = useState(policial.patente || 'Sd PM');
  const [nomeGuerra, setNomeGuerra] = useState(policial.nome_guerra || '');
  const [nomeCompleto, setNomeCompleto] = useState(policial.nome_completo || '');
  const [idUnidade, setIdUnidade] = useState<number | string>(
    policial.id_unidade || policial.id_unidade_lotacao || (unidades[0]?.id_unidade ?? '')
  );
  const [status, setStatus] = useState<Policial['status']>(policial.status || 'Ativo');
  const [telefone, setTelefone] = useState(policial.telefone || '');
  const [email, setEmail] = useState(policial.email || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = db.atualizarPolicial(policial.id_policial, {
      matricula: matricula.trim(),
      patente,
      nome_guerra: nomeGuerra.trim(),
      nome_completo: nomeCompleto.trim(),
      id_unidade: Number(idUnidade),
      id_unidade_lotacao: Number(idUnidade),
      status,
      telefone: telefone || null,
      email: email || null,
    });

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar dados do policial militar.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-6">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Editar Policial Militar</h2>
              <p className="text-xs text-slate-500">
                {policial.patente} {policial.nome_guerra} • Matrícula {policial.matricula}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Matrícula</label>
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Posto / Graduação</label>
              <select
                value={patente ?? 'Sd PM'}
                onChange={(e) => setPatente(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Nome de Guerra</label>
              <input
                type="text"
                value={nomeGuerra}
                onChange={(e) => setNomeGuerra(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Situação / Status</label>
              <select
                value={status ?? 'Ativo'}
                onChange={(e) => setStatus(e.target.value as Policial['status'])}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              >
                <option value="Ativo">🟢 Ativo (Pronto para Serviço)</option>
                <option value="Férias">🟡 Férias Regulamentares</option>
                <option value="Licença">🟠 Licença / Dispensa Médica</option>
                <option value="Inativo">🔴 Inativo / Reserva Remunerada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Nome Completo</label>
            <input
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Lotação (Companhia / Pelotão / Seção)</label>
            <select
              value={idUnidade ?? ''}
              onChange={(e) => setIdUnidade(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
            >
              {unidades.map((u) => (
                <option key={u.id_unidade} value={u.id_unidade}>
                  {u.sigla} - {u.nome} ({u.municipio})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Telefone Contato</label>
              <input
                type="text"
                placeholder="(84) 98800-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">E-mail Institucional</label>
              <input
                type="email"
                placeholder="nome@pm.rn.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

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
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition focus:ring-2 focus:ring-blue-500"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
