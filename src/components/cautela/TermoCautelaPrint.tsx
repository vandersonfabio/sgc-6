import React from 'react';
import { CautelaCompleta } from '../../types/database';
import { Printer, X, Shield, QrCode } from 'lucide-react';

interface TermoCautelaPrintProps {
  cautela: CautelaCompleta;
  onClose: () => void;
}

export const TermoCautelaPrint: React.FC<TermoCautelaPrintProps> = ({ cautela, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dStr?: string | null) => {
    if (!dStr) return 'N/A';
    const d = new Date(dStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Controls (Not printed) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Comprovante Oficial de Cautela • Nº {String(cautela.id_cautela).padStart(5, '0')}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper (White, High Contrast) */}
        <div className="p-8 bg-white text-slate-900 print:p-0 print:m-0 font-sans">
          {/* Header Militar */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-700">
              ESTADO DO RIO GRANDE DO NORTE • POLÍCIA MILITAR
            </div>
            <div className="text-xs font-semibold text-slate-700">
              COMANDO DE POLICIAMENTO REGIONAL II • 6º BATALHÃO DE POLÍCIA MILITAR
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              SEDE CAICÓ/RN • SISTEMA DE GESTÃO E CAUTELA (SGC-6)
            </div>
            <div className="mt-3 inline-block bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded">
              TERMO DE CAUTELA {cautela.tipo.toUpperCase()} Nº {String(cautela.id_cautela).padStart(5, '0')}/2026-6ºBPM
            </div>
          </div>

          {/* Dados do Policial */}
          <div className="mb-5 bg-slate-50 border border-slate-300 rounded-lg p-3.5 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              1. DADOS DO POLICIAL RECEBEDOR (RESPONSÁVEL)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 block">Graduação / Patente:</span>
                <span className="font-bold text-slate-900">{cautela.policial.patente}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nome de Guerra:</span>
                <span className="font-bold text-slate-900">{cautela.policial.nome_guerra}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Matrícula PM:</span>
                <span className="font-mono font-bold text-slate-900">{cautela.policial.matricula}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Nome Completo:</span>
                <span className="font-medium text-slate-900">{cautela.policial.nome_completo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tipo da Cautela:</span>
                <span className="font-bold text-blue-800">{cautela.tipo}</span>
              </div>
            </div>
          </div>

          {/* Dados da Operação e Datas */}
          <div className="mb-5 bg-slate-50 border border-slate-300 rounded-lg p-3.5 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              2. REGISTRO OPERACIONAL & PRAZOS
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 block">Data/Hora da Retirada:</span>
                <span className="font-bold text-slate-900">{formatDate(cautela.data_retirada)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Previsão de Devolução:</span>
                <span className="font-bold text-slate-900">
                  {cautela.data_prevista_devolucao ? formatDate(cautela.data_prevista_devolucao) : 'Tutela Contínua'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Operador de Entrega:</span>
                <span className="font-bold text-slate-900">
                  {cautela.operador_entrega.policial.patente} {cautela.operador_entrega.policial.nome_guerra}
                </span>
              </div>
            </div>
          </div>

          {/* Relação de Materiais Cautelados */}
          <div className="mb-5 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">
              3. MATERIAIS / EQUIPAMENTOS PATRIMONIAIS ENTREGUES
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2">Item / Modelo</th>
                    <th className="p-2">Nº Série / Tombo</th>
                    <th className="p-2">Especificação / Calibre</th>
                    <th className="p-2">Estado / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cautela.itens.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-slate-500 italic">
                        Nenhum item patrimonial individual vinculado.
                      </td>
                    </tr>
                  ) : (
                    cautela.itens.map((ci, idx) => {
                      const it = ci.item;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-900">
                            {it.tipo_item} {it.marca} {it.modelo}
                          </td>
                          <td className="p-2 font-mono text-slate-800">
                            {it.numero_serie || it.numero_tombo || 'S/N'}
                          </td>
                          <td className="p-2 text-slate-700">
                            {it.detalhe_arma?.calibre ||
                              it.detalhe_colete?.nivel_protecao ||
                              it.detalhe_comunicacao?.numero_linha ||
                              '-'}
                            {it.detalhe_arma && ` • ${it.detalhe_arma.qtd_carregadores} Carregadores`}
                          </td>
                          <td className="p-2 text-slate-600 italic">
                            {ci.observacao_estado_entrega || 'Conforme'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relação de Munições */}
          {cautela.lotes.length > 0 && (
            <div className="mb-5 text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                4. MUNIÇÕES E ITENS FRACIONADOS
              </div>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2">Tipo / Calibre</th>
                      <th className="p-2">Lote de Fabricação</th>
                      <th className="p-2">Fabricante / Modelo</th>
                      <th className="p-2 text-right">Qtd Entregue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cautela.lotes.map((cl, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-900">{cl.lote.tipo_item} ({cl.lote.calibre})</td>
                        <td className="p-2 font-mono text-slate-800">{cl.lote.lote_fabricacao}</td>
                        <td className="p-2 text-slate-700">{cl.lote.marca} {cl.lote.modelo}</td>
                        <td className="p-2 font-bold text-right text-slate-900">{cl.quantidade} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Termo de Compromisso e Assinaturas */}
          <div className="mt-6 pt-3 border-t border-slate-300 text-[11px] text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">TERMO DE RESPONSABILIDADE E GUARDA:</p>
            <p className="italic">
              Declaro que recebi os materiais bélicos/equipamentos acima descritos em perfeito estado de funcionamento e conservação. Comprometo-me a zelar pela sua guarda, manutenção e integridade, bem como a devolvê-los ao término do serviço ou quando solicitado, sob as penas do Código Penal Militar e do Regulamento Disciplinar da PMRN.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1"></div>
              <div className="font-bold text-slate-900">{cautela.policial.patente} {cautela.policial.nome_completo}</div>
              <div className="text-[10px] text-slate-500 font-mono">Policial Recebedor • Matrícula {cautela.policial.matricula}</div>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1"></div>
              <div className="font-bold text-slate-900">
                {cautela.operador_entrega?.policial ? `${cautela.operador_entrega.policial.patente} ${cautela.operador_entrega.policial.nome_completo}` : 'Armeiro Responsável'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Operador SGC-6 • UUID: {cautela.id_operador_entrega ? (cautela.id_operador_entrega.length > 18 ? `${cautela.id_operador_entrega.slice(0, 18)}...` : cautela.id_operador_entrega) : 'SGC-6'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
