import React, { useState } from 'react';
import { useDatabase } from '../../services/store';
import { CautelaCompleta } from '../../types/database';
import {
  X,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  User,
} from 'lucide-react';

interface ModalRegistrarDisparoProps {
  onClose: () => void;
  onSuccess: (id_disparo: number) => void;
  preSelectedCautelaId?: number;
}

export const ModalRegistrarDisparo: React.FC<ModalRegistrarDisparoProps> = ({
  onClose,
  onSuccess,
  preSelectedCautelaId,
}) => {
  const { db, lotes } = useDatabase();

  const allCautelasArmas = db.getCautelasCompletas('Armas');
  const activeCautelas = allCautelasArmas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

  const [selectedCautelaId, setSelectedCautelaId] = useState<number | ''>(
    preSelectedCautelaId || (activeCautelas[0]?.id_cautela || '')
  );

  const selectedCautela = activeCautelas.find((c) => c.id_cautela === Number(selectedCautelaId));

  // Determine calibres from the selected cautela
  const armasNaCautela = selectedCautela?.itens.filter((i) => i.item.detalhe_arma) || [];
  const municoesNaCautela = selectedCautela?.lotes || [];

  const defaultCalibre =
    armasNaCautela[0]?.item.detalhe_arma?.calibre ||
    municoesNaCautela[0]?.lote.calibre ||
    '9mm';

  const [dataFato, setDataFato] = useState(new Date().toISOString().slice(0, 16));
  const [numeroBoIpm, setNumeroBoIpm] = useState('');
  const [localFato, setLocalFato] = useState('');
  const [calibre, setCalibre] = useState(defaultCalibre);
  const [qtdDisparada, setQtdDisparada] = useState(4);
  const [qtdReposta, setQtdReposta] = useState(4);
  const [estojosRecolhidos, setEstojosRecolhidos] = useState(true);
  const [qtdEstojos, setQtdEstojos] = useState(4);
  const [historico, setHistorico] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ammunition available in inventory for reposição
  const municoesEstoque = lotes.filter((l) => l.modulo === 'Armas');
  const loteEstoque = municoesEstoque.find((l) => l.calibre === calibre);
  const estoqueDisponivelCalibre = loteEstoque?.quantidade_atual || 0;

  // When selectedCautelaId changes, update default calibre
  const handleCautelaChange = (id: number) => {
    setSelectedCautelaId(id);
    const caut = activeCautelas.find((c) => c.id_cautela === id);
    if (caut) {
      const autoCal =
        caut.itens[0]?.item.detalhe_arma?.calibre ||
        caut.lotes[0]?.lote.calibre ||
        '9mm';
      setCalibre(autoCal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCautela) {
      setErrorMessage('Selecione a Cautela Ativa sob responsabilidade do policial militar.');
      return;
    }

    if (!numeroBoIpm.trim()) {
      setErrorMessage('Informe o número do BO / Parte de Ocorrência / IPM.');
      return;
    }

    if (qtdDisparada <= 0) {
      setErrorMessage('A quantidade de disparos deve ser maior que 0.');
      return;
    }

    if (qtdReposta > estoqueDisponivelCalibre) {
      setErrorMessage(
        `Estoque insuficiente para reposição! Calibre ${calibre} possui apenas ${estoqueDisponivelCalibre} un. disponíveis no cofre.`
      );
      return;
    }

    if (!historico.trim()) {
      setErrorMessage('Preencha o histórico circunstanciado dos disparos efetuados.');
      return;
    }

    const res = db.cadastrarDisparo({
      data_fato: new Date(dataFato).toISOString(),
      id_policial: selectedCautela.id_policial,
      id_cautela: selectedCautela.id_cautela,
      calibre,
      id_lote: loteEstoque?.id_lote || null,
      qtd_disparada: qtdDisparada,
      qtd_reposta: qtdReposta,
      estojos_recolhidos: estojosRecolhidos,
      qtd_estojos_recolhidos: estojosRecolhidos ? qtdEstojos : 0,
      numero_bo_ipm: numeroBoIpm.trim(),
      local_fato: localFato.trim() || undefined,
      historico_circunstanciado: historico.trim(),
    });

    if (res.success && res.id_disparo) {
      onSuccess(res.id_disparo);
    } else {
      setErrorMessage(res.error || 'Erro ao registrar disparo e reposição.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">
                Registro de Disparo em Serviço e Reposição de Munições
              </h2>
              <p className="text-xs text-amber-700">
                Vínculo Direto à Cautela Ativa • Abatimento de Munições do Cofre • 6º BPM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-amber-100/50 hover:bg-amber-100 text-amber-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeCautelas.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
              <div className="font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Nenhuma cautela de armamento em andamento</span>
              </div>
              <p className="text-xs">
                Para registrar disparos, o policial deve possuir uma cautela ativa (temporária ou permanente) de armamento e munições registrada no sistema.
              </p>
            </div>
          ) : (
            /* 1. Seleção da Cautela Ativa */
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="block font-bold text-slate-900 text-xs">
                1. Cautela Ativa do Policial Militar <span className="text-amber-600">*</span>
              </label>
              <select
                required
                value={selectedCautelaId ?? ''}
                onChange={(e) => handleCautelaChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-600 shadow-xs"
              >
                {activeCautelas.map((c) => {
                  const armasResumo = c.itens.map((i) => `${i.item.tipo_item} ${i.item.modelo || ''}`).join(', ') || 'Sem armas';
                  const munResumo = c.lotes.map((l) => `${l.quantidade} un (${l.lote.calibre})`).join(', ') || 'Sem munição vinculada';
                  return (
                    <option key={c.id_cautela} value={c.id_cautela}>
                      Cautela #{c.id_cautela} • {c.policial.patente} {c.policial.nome_guerra} ({c.policial.matricula}) • {armasResumo} [{munResumo}]
                    </option>
                  );
                })}
              </select>

              {/* Informações detalhadas da Cautela selecionada */}
              {selectedCautela && (
                <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-900">
                        {selectedCautela.policial.patente} {selectedCautela.policial.nome_completo}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        Mat: {selectedCautela.policial.matricula}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                      Cautela {selectedCautela.tipo}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Armamentos sob Cautela:</span>
                      {selectedCautela.itens.length === 0 ? (
                        <span className="text-slate-400">Nenhum armamento listado</span>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                          {selectedCautela.itens.map((it) => (
                            <li key={it.item.id_item}>
                              {it.item.tipo_item} {it.item.marca} {it.item.modelo} (Série: {it.item.numero_serie || it.item.numero_tombo || 'S/N'})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Munições em Posse:</span>
                      {selectedCautela.lotes.length === 0 ? (
                        <span className="text-slate-400">Sem munições fracionadas</span>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                          {selectedCautela.lotes.map((l) => (
                            <li key={l.lote.id_lote}>
                              {l.quantidade} un. {l.lote.calibre ? `Calibre ${l.lote.calibre}` : l.lote.tipo_item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Dados do Incidente / Ocorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Nº do BO / Parte de Ocorrência <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BO nº 2026/08-01044"
                value={numeroBoIpm}
                onChange={(e) => setNumeroBoIpm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Data e Hora do Incidente <span className="text-amber-600">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dataFato}
                onChange={(e) => setDataFato(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Local do Fato / Bairro / Cidade
            </label>
            <input
              type="text"
              placeholder="Ex: Av. Seridó, Centro, Caicó/RN"
              value={localFato}
              onChange={(e) => setLocalFato(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* 3. Controle Balístico e Reposição */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h3 className="font-bold text-amber-950 text-xs flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-amber-700" />
              <span>Controle Balístico, Disparos e Saída de Estoque</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 text-[11px] mb-1">
                  Calibre Disparado:
                </label>
                <select
                  value={calibre ?? '9mm'}
                  onChange={(e) => setCalibre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                >
                  <option value="9mm">9mm Luger</option>
                  <option value=".40 S&W">.40 S&W</option>
                  <option value="5.56x45mm">5.56x45mm</option>
                  <option value="7.62x51mm">7.62x51mm</option>
                  <option value="12 GA">12 GA</option>
                  <option value=".38 SPL">.38 SPL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 text-[11px] mb-1">
                  Qtd Disparada:
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={qtdDisparada}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQtdDisparada(v);
                    setQtdReposta(v);
                    if (estojosRecolhidos) setQtdEstojos(v);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 text-[11px] mb-1">
                  Qtd Reposta (Saída):
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={qtdReposta}
                  onChange={(e) => setQtdReposta(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>
            </div>

            {/* Estoque informativo */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
              <span>Saldo no Cofre da Reserva ({calibre}): <strong>{estoqueDisponivelCalibre} un.</strong></span>
              <span className="text-amber-800 font-medium">
                Após reposição restará: <strong>{Math.max(0, estoqueDisponivelCalibre - qtdReposta)} un.</strong>
              </span>
            </div>
          </div>

          {/* Recolhimento de Cápsulas */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={estojosRecolhidos}
                onChange={(e) => setEstojosRecolhidos(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Estojos / Cápsulas deflagradas foram recolhidas e apresentadas na Armaria</span>
            </label>

            {estojosRecolhidos && (
              <div className="mt-2.5 flex items-center space-x-3 text-xs text-slate-700">
                <span>Quantidade de estojos entregues:</span>
                <input
                  type="number"
                  min={1}
                  max={qtdDisparada}
                  value={qtdEstojos}
                  onChange={(e) => setQtdEstojos(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Histórico circunstanciado */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Histórico Circunstanciado do Emprego da Arma de Fogo <span className="text-amber-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva a dinâmica da ocorrência (ex: confronto armado com infratores da lei em via pública, legítima defesa de terceiro, abordagem de alto risco)..."
              value={historico}
              onChange={(e) => setHistorico(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Footer */}
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
              disabled={activeCautelas.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm shadow-amber-600/30 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Disparos e Abater Munições</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
