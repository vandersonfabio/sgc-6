import React, { useState } from 'react';
import { CautelaCompleta, ModuloTipo } from '../../types/database';
import {
  Search,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileDown,
  User,
  Crosshair,
  AlertOctagon,
} from 'lucide-react';
import { PdfReportService } from '../../services/pdfReportService';
import { useDatabase } from '../../services/store';

interface TabelaCautelasAndamentoProps {
  modulo?: ModuloTipo;
  cautelas: CautelaCompleta[];
  onDarBaixa: (cautela: CautelaCompleta) => void;
  onVerComprovante: (cautela: CautelaCompleta) => void;
  onRegistrarDisparo?: (cautela: CautelaCompleta) => void;
  onRegistrarExtravio?: (cautela: CautelaCompleta) => void;
}

export const TabelaCautelasAndamento: React.FC<TabelaCautelasAndamentoProps> = ({
  modulo,
  cautelas,
  onDarBaixa,
  onVerComprovante,
  onRegistrarDisparo,
  onRegistrarExtravio,
}) => {
  const { db } = useDatabase();
  const [searchMatricula, setSearchMatricula] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'Temporária' | 'Permanente' | 'atrasadas'>('todos');

  const now = new Date();

  const cautelasFiltradas = cautelas.filter((c) => {
    // Check if open or overdue
    if (c.status !== 'Aberta' && c.status !== 'Atrasada') return false;

    const term = searchMatricula.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.policial.matricula.toLowerCase().includes(term) ||
      c.policial.nome_guerra.toLowerCase().includes(term) ||
      c.policial.nome_completo.toLowerCase().includes(term) ||
      c.itens.some(
        (ci) =>
          ci.item.tipo_item.toLowerCase().includes(term) ||
          (ci.item.numero_serie || '').toLowerCase().includes(term) ||
          (ci.item.numero_tombo || '').toLowerCase().includes(term) ||
          (ci.item.detalhe_arma?.calibre || '').toLowerCase().includes(term)
      );

    const isAtrasada =
      c.status === 'Atrasada' ||
      (c.tipo === 'Temporária' && c.data_prevista_devolucao && new Date(c.data_prevista_devolucao) < now);

    if (filtroTipo === 'atrasadas') return matchesSearch && isAtrasada;
    if (filtroTipo === 'Temporária') return matchesSearch && c.tipo === 'Temporária';
    if (filtroTipo === 'Permanente') return matchesSearch && c.tipo === 'Permanente';

    return matchesSearch;
  });

  const formatHora = (dStr: string) => {
    return new Date(dStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatData = (dStr: string) => {
    return new Date(dStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-3">
      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Matrícula (ex: PM-240992-1), Nome ou Tombo/Série..."
            value={searchMatricula}
            onChange={(e) => setSearchMatricula(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1 rounded-md transition ${
                filtroTipo === 'todos' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({cautelas.length})
            </button>
            <button
              onClick={() => setFiltroTipo('Temporária')}
              className={`px-3 py-1 rounded-md transition ${
                filtroTipo === 'Temporária' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Temporárias
            </button>
            <button
              onClick={() => setFiltroTipo('Permanente')}
              className={`px-3 py-1 rounded-md transition ${
                filtroTipo === 'Permanente' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Permanentes
            </button>
            <button
              onClick={() => setFiltroTipo('atrasadas')}
              className={`px-3 py-1 rounded-md transition ${
                filtroTipo === 'atrasadas' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Atrasadas
            </button>
          </div>

          <button
            onClick={() => PdfReportService.gerarRelatorioCautelas(db, modulo)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Exportar Relatório em PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-red-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table view of Cautelas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">ID / Retirada</th>
              <th className="p-3">Policial Militar (Recebedor)</th>
              <th className="p-3">Matrícula</th>
              <th className="p-3">Modalidade</th>
              <th className="p-3">Equipamentos & Munições Cauteladas</th>
              <th className="p-3">Previsão / Status</th>
              <th className="p-3 text-right">Ações de Baixa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cautelasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5" />
                  <p className="font-bold text-slate-900 text-xs">Nenhuma cautela pendente encontrada.</p>
                  <p className="text-[11px] text-slate-400">Todos os materiais estão disponíveis na reserva ou não correspondem à busca.</p>
                </td>
              </tr>
            ) : (
              cautelasFiltradas.map((c, cIdx) => {
                const isAtrasada =
                  c.status === 'Atrasada' ||
                  (c.tipo === 'Temporária' && c.data_prevista_devolucao && new Date(c.data_prevista_devolucao) < now);

                return (
                  <tr
                    key={`${c.id_cautela || 'caut'}-${cIdx}`}
                    className={`transition hover:bg-slate-50/80 ${
                      isAtrasada ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        #{String(c.id_cautela).padStart(3, '0')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatData(c.data_retirada)} às {formatHora(c.data_retirada)}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {c.policial.patente} {c.policial.nome_guerra}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.policial.nome_completo}
                      </div>
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {c.policial.matricula}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          c.tipo === 'Permanente'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {c.tipo}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="space-y-1">
                        {c.itens.map((ci, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-slate-800">
                            <span className="font-semibold">• {ci.item.tipo_item} {ci.item.marca} {ci.item.modelo}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              [{ci.item.numero_tombo || ci.item.numero_serie || 'S/N'}]
                            </span>
                            {ci.item.detalhe_arma?.calibre && (
                              <span className="text-[10px] text-blue-700 font-bold">
                                ({ci.item.detalhe_arma.calibre})
                              </span>
                            )}
                          </div>
                        ))}
                        {c.lotes.map((cl, idx) => (
                          <div key={idx} className="text-amber-800 font-semibold text-[11px]">
                            • {cl.quantidade}x Munições {cl.lote.calibre} (Lote: {cl.lote.lote_fabricacao})
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-3">
                      {isAtrasada ? (
                        <div>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>EM ATRASO</span>
                          </span>
                          {c.data_prevista_devolucao && (
                            <div className="text-[10px] text-red-700 font-semibold mt-0.5">
                              Previsto: {formatHora(c.data_prevista_devolucao)}
                            </div>
                          )}
                        </div>
                      ) : c.tipo === 'Permanente' ? (
                        <span className="text-[11px] text-purple-700 font-semibold">Carga Pessoal</span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>No Prazo</span>
                          </span>
                          {c.data_prevista_devolucao && (
                            <div className="text-[10px] text-slate-500">
                              Até {formatHora(c.data_prevista_devolucao)} ({formatData(c.data_prevista_devolucao)})
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
                        {onRegistrarDisparo && (
                          <button
                            onClick={() => onRegistrarDisparo(c)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition"
                            title="Registrar Disparo / Reposição de Munições desta Cautela"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                            <span>Disparo</span>
                          </button>
                        )}
                        {onRegistrarExtravio && (
                          <button
                            onClick={() => onRegistrarExtravio(c)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold border border-rose-200 transition"
                            title="Registrar Extravio / BO de Itens desta Cautela"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                            <span>Extravio</span>
                          </button>
                        )}
                        <button
                          onClick={() => onVerComprovante(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="Imprimir / Ver Comprovante"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDarBaixa(c)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
                          title="Dar baixa no material"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Dar Baixa</span>
                        </button>
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
  );
};
