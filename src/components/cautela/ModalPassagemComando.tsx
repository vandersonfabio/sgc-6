import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../services/store';
import { PdfReportService } from '../../services/pdfReportService';
import {
  X,
  FileText,
  Building2,
  UserCheck,
  ShieldCheck,
  Printer,
  Calendar,
  AlertCircle,
  Package,
} from 'lucide-react';

interface ModalPassagemComandoProps {
  initialUnidadeId?: number;
  onClose: () => void;
}

export const ModalPassagemComando: React.FC<ModalPassagemComandoProps> = ({
  initialUnidadeId,
  onClose,
}) => {
  const { db } = useDatabase();
  const unidades = db.getUnidades();
  const policiais = db.getPoliciais();

  const [idUnidade, setIdUnidade] = useState<number>(
    initialUnidadeId || (unidades[0]?.id_unidade ?? 1)
  );

  const [sucedidoMatricula, setSucedidoMatricula] = useState('');
  const [sucessorMatricula, setSucessorMatricula] = useState('');
  const [motivoPassagem, setMotivoPassagem] = useState('Passagem de Comando e Conferência Geral de Carga Bélica');

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

  const selectedUnidade = unidades.find((u) => u.id_unidade === idUnidade);

  // Auto-fill from selected policiais
  const pmSucedido = policiais.find((p) => p.matricula === sucedidoMatricula);
  const pmSucessor = policiais.find((p) => p.matricula === sucessorMatricula);

  // Count items currently in custody of this unit
  const todasCautelas = db.getCautelasCompletas();
  const cautelasAtivas = todasCautelas.filter(
    (c) =>
      (c.id_unidade === idUnidade || c.unidade?.id_unidade === idUnidade) &&
      (c.status === 'Aberta' || c.status === 'Atrasada')
  );

  const totalArmas = cautelasAtivas.reduce(
    (acc, c) =>
      acc +
      c.itens.filter(
        (ci) =>
          ci.item.modulo === 'Armas' &&
          (ci.item.tipo_item.toLowerCase().includes('pistola') ||
            ci.item.tipo_item.toLowerCase().includes('fuzil') ||
            ci.item.tipo_item.toLowerCase().includes('carabina') ||
            ci.item.tipo_item.toLowerCase().includes('espingarda') ||
            ci.item.tipo_item.toLowerCase().includes('revólver'))
      ).length,
    0
  );

  const totalColetes = cautelasAtivas.reduce(
    (acc, c) => acc + c.itens.filter((ci) => ci.item.tipo_item.toLowerCase().includes('colete')).length,
    0
  );

  const totalMunicoes = cautelasAtivas.reduce(
    (acc, c) => acc + c.lotes.reduce((lAcc, l) => lAcc + l.quantidade, 0),
    0
  );

  const handleGerarTermo = () => {
    PdfReportService.gerarTermoPassagemComandoSubunidade({
      db,
      id_unidade: idUnidade,
      comandanteSucedido: pmSucedido
        ? {
            posto: pmSucedido.patente,
            nome: pmSucedido.nome_completo,
            matricula: pmSucedido.matricula,
          }
        : undefined,
      comandanteSucessor: pmSucessor
        ? {
            posto: pmSucessor.patente,
            nome: pmSucessor.nome_completo,
            matricula: pmSucessor.matricula,
          }
        : undefined,
      motivoPassagem: motivoPassagem.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 text-indigo-200 border border-white/10 shadow-xs">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Termo de Passagem de Comando / Carga Geral
              </h2>
              <p className="text-xs text-indigo-200">
                Compilação oficial de inventário bélico por fração destacada
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Subunidade Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subunidade / Destacamento / Setor *
            </label>
            <select
              value={idUnidade}
              onChange={(e) => setIdUnidade(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              {unidades.map((u) => (
                <option key={u.id_unidade} value={u.id_unidade}>
                  [{u.tipo_unidade}] {u.nome} ({u.municipio || 'Caicó'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Resumo Card */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-indigo-700" />
              <span>Material atualmente em carga nesta unidade:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Armas de Fogo</span>
                <span className="font-extrabold text-indigo-900 text-sm">{totalArmas}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Coletes Balísticos</span>
                <span className="font-extrabold text-indigo-900 text-sm">{totalColetes}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Munições CBC</span>
                <span className="font-extrabold text-indigo-900 text-sm">{totalMunicoes} un</span>
              </div>
            </div>
          </div>

          {/* Comandante Sucedido (Entregando) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Comandante / Encarregado Sucedido (Transmitente)
            </span>
            <select
              value={sucedidoMatricula}
              onChange={(e) => setSucedidoMatricula(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Deixar em branco para preenchimento manual no documento impresso --</option>
              {policiais.map((p) => (
                <option key={p.id_policial} value={p.matricula}>
                  {p.patente} {p.nome_guerra} ({p.matricula}) - {p.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Comandante Sucessor (Recebendo) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Comandante / Encarregado Sucessor (Recebedor / Fiel Depositário)
            </span>
            <select
              value={sucessorMatricula}
              onChange={(e) => setSucessorMatricula(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Deixar em branco para preenchimento manual no documento impresso --</option>
              {policiais.map((p) => (
                <option key={p.id_policial} value={p.matricula}>
                  {p.patente} {p.nome_guerra} ({p.matricula}) - {p.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo / Observação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Finalidade / Motivo da Emissão
            </label>
            <input
              type="text"
              value={motivoPassagem}
              onChange={(e) => setMotivoPassagem(e.target.value)}
              placeholder="Ex: Passagem de Comando e Conferência Periódica de Inventário"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGerarTermo}
            className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar e Imprimir Termo PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
