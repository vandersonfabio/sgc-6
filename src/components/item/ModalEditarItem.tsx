import React, { useState } from 'react';
import { useDatabase, calcularDiasManutencao } from '../../services/store';
import { ItemComDetalhes, StatusItem, ModuloTipo } from '../../types/database';
import {
  X,
  Edit,
  AlertCircle,
  Shield,
  Radio,
  Truck,
  Monitor,
  Package,
  CheckCircle2,
  Trash2,
  Info,
  Wrench,
  Clock,
} from 'lucide-react';

interface ModalEditarItemProps {
  item: ItemComDetalhes;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalEditarItem: React.FC<ModalEditarItemProps> = ({ item, onClose, onSuccess }) => {
  const { db } = useDatabase();

  const tiposMateriais = db.getTiposMateriais(item.modulo);

  // Find linked tipo material or match by name
  const [selectedTipoId, setSelectedTipoId] = useState<number | ''>(
    item.id_tipo_material ||
      tiposMateriais.find((t) => t.nome.toLowerCase() === item.tipo_item.toLowerCase())?.id_tipo_material ||
      ''
  );

  const selectedTipo = tiposMateriais.find((t) => t.id_tipo_material === Number(selectedTipoId));

  // Basic Info
  const [tipoItem, setTipoItem] = useState(item.tipo_item || '');
  const [marca, setMarca] = useState(item.marca || '');
  const [modelo, setModelo] = useState(item.modelo || '');
  const [numeroSerie, setNumeroSerie] = useState(item.numero_serie || '');
  const [numeroTombo, setNumeroTombo] = useState(item.numero_tombo || '');
  const [status, setStatus] = useState<StatusItem>(item.status);
  const [observacao, setObservacao] = useState(item.observacao || '');
  const [dataInicioManutencao, setDataInicioManutencao] = useState(
    item.data_inicio_manutencao
      ? item.data_inicio_manutencao.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [motivoManutencao, setMotivoManutencao] = useState(item.motivo_manutencao || '');

  // Detalhe Arma
  const [calibre, setCalibre] = useState(item.detalhe_arma?.calibre || '9mm');
  const [numeroSigma, setNumeroSigma] = useState(item.detalhe_arma?.numero_sigma || '');
  const [brasaoGravado, setBrasaoGravado] = useState(item.detalhe_arma?.brasao_gravado ?? true);
  const [qtdCarregadores, setQtdCarregadores] = useState(item.detalhe_arma?.qtd_carregadores ?? 3);
  const [carregadoresCoincidem, setCarregadoresCoincidem] = useState(item.detalhe_arma?.carregadores_coincidem_numeracao ?? true);

  // Detalhe Colete
  const [generoColete, setGeneroColete] = useState<'Masculino' | 'Feminino' | 'Unissex'>(item.detalhe_colete?.genero || 'Masculino');
  const [tamanhoColete, setTamanhoColete] = useState(item.detalhe_colete?.tamanho || 'M');
  const [nivelProtecao, setNivelProtecao] = useState(item.detalhe_colete?.nivel_protecao || 'III-A');
  const [validadeColete, setValidadeColete] = useState(item.detalhe_colete?.data_validade || item.detalhe_impo?.data_validade || '');

  // Detalhe Comunicação
  const [imeiMac, setImeiMac] = useState(item.detalhe_comunicacao?.imei_mac || '');
  const [numeroLinha, setNumeroLinha] = useState(item.detalhe_comunicacao?.numero_linha || '');

  // Detalhe Viatura
  const [placa, setPlaca] = useState(item.detalhe_viatura?.placa || '');
  const [prefixo, setPrefixo] = useState(item.detalhe_viatura?.prefixo || '');
  const [renavam, setRenavam] = useState(item.detalhe_viatura?.renavam || '');
  const [chassi, setChassi] = useState(item.detalhe_viatura?.chassi || '');

  // Detalhe Informática
  const [configResumida, setConfigResumida] = useState(item.detalhe_informatica?.configuracao_resumida || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getCategoriaEspecializada = () => {
    if (selectedTipo) return String(selectedTipo.categoria_especializada).toLowerCase();
    if (item.detalhe_arma) return 'arma';
    if (item.detalhe_colete) return 'colete';
    if (item.detalhe_impo) return 'impo';
    if (item.detalhe_comunicacao) return 'comunicacao';
    if (item.detalhe_viatura) return 'viatura';
    if (item.detalhe_informatica) return 'informatica';
    return 'nenhuma';
  };

  const categoriaEspecializada = getCategoriaEspecializada();
  const isViatura = item.modulo === 'Viaturas' || categoriaEspecializada === 'viatura';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate Serial Number & Tombo based on TipoMaterial
    if (selectedTipo) {
      if (selectedTipo.exige_numero_serie && !numeroSerie.trim()) {
        setErrorMessage(`O Número de Série é OBRIGATÓRIO para o tipo "${selectedTipo.nome}".`);
        return;
      }
      if (selectedTipo.exige_numero_tombo && !numeroTombo.trim()) {
        setErrorMessage(`O Número de Tombo é OBRIGATÓRIO para o tipo "${selectedTipo.nome}".`);
        return;
      }
    }

    const isManutencao = status === 'Manutenção' || status === 'Danificado / Avariado';

    const itemDados = {
      id_tipo_material: selectedTipo?.id_tipo_material || item.id_tipo_material || null,
      tipo_item: tipoItem,
      marca: marca || null,
      modelo: modelo || null,
      numero_serie: isViatura || selectedTipo?.permite_numero_serie === false ? null : numeroSerie.replace(/\s+/g, '') || null,
      numero_tombo: isViatura || selectedTipo?.permite_numero_tombo === false ? null : numeroTombo.replace(/\s+/g, '') || null,
      status,
      observacao: observacao || null,
      data_inicio_manutencao: isManutencao
        ? (dataInicioManutencao ? new Date(dataInicioManutencao + 'T12:00:00Z').toISOString() : new Date().toISOString())
        : null,
      motivo_manutencao: isManutencao ? (motivoManutencao.trim() || null) : null,
    };

    let detalhes: any = {};

    if (categoriaEspecializada === 'arma') {
      detalhes.arma = {
        calibre,
        numero_sigma: numeroSigma || null,
        brasao_gravado: brasaoGravado,
        qtd_carregadores: qtdCarregadores,
        carregadores_coincidem_numeracao: carregadoresCoincidem,
      };
    } else if (categoriaEspecializada === 'colete') {
      detalhes.colete = {
        genero: generoColete,
        tamanho: tamanhoColete,
        nivel_protecao: nivelProtecao,
        data_validade: validadeColete,
      };
    } else if (categoriaEspecializada === 'impo') {
      detalhes.impo = {
        data_validade: validadeColete,
      };
    } else if (categoriaEspecializada === 'comunicacao') {
      detalhes.comunicacao = {
        imei_mac: imeiMac || null,
        numero_linha: numeroLinha || null,
      };
    } else if (isViatura) {
      if (!placa.trim()) {
        setErrorMessage('A placa oficial da viatura é obrigatória.');
        return;
      }
      detalhes.viatura = {
        placa: placa.toUpperCase().trim(),
        prefixo: prefixo.toUpperCase().trim() || 'VTR-0600',
        renavam: renavam.trim() || null,
        chassi: chassi.toUpperCase().trim() || null,
      };
    } else if (categoriaEspecializada === 'informatica' || item.detalhe_informatica) {
      detalhes.informatica = {
        configuracao_resumida: configResumida || null,
      };
    }

    const res = db.atualizarItem(item.id_item, itemDados, detalhes);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar dados do patrimônio.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Editar Patrimônio #{item.id_item}</h2>
              <p className="text-xs text-slate-500">
                Módulo {item.modulo} • Atualização cadastral, conservação e modo de controle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo Material Info Banner */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-700">Tipo de Material Vinculado: </span>
            <select
              value={selectedTipoId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTipoId(val ? Number(val) : '');
                const t = tiposMateriais.find((tm) => tm.id_tipo_material === Number(val));
                if (t) {
                  setTipoItem((prev) => (!prev || tiposMateriais.some((tm) => tm.nome === prev) ? t.nome : prev));
                }
              }}
              className="ml-2 bg-white border border-slate-300 rounded p-1 text-xs font-semibold text-slate-900"
            >
              {tiposMateriais.map((t) => (
                <option key={t.id_tipo_material} value={t.id_tipo_material}>
                  {t.nome} [{t.modo_controle}]
                </option>
              ))}
            </select>
          </div>
          {selectedTipo && (
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                Modo: {selectedTipo.modo_controle}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Status Operacional</label>
              <select
                value={status ?? 'Disponível'}
                onChange={(e) => setStatus(e.target.value as StatusItem)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs font-semibold"
              >
                <option value="Disponível">🟢 Disponível (Pronto para Cautela / Alocação)</option>
                <option value="Cautelado" disabled>
                  🔵 Cautelado (Gerenciado via Cautela)
                </option>
                <option value="Alocado" disabled>
                  🟣 Alocado (Gerenciado via Alocação)
                </option>
                <option value="Manutenção">🟡 Em Manutenção / Revisão</option>
                <option value="Danificado / Avariado">🟠 Danificado / Avariado</option>
                <option value="Em apuração">⚖️ Em Apuração (Retido pela Justiça / Perícia / IPM)</option>
                <option value="Extraviado">🔴 Extraviado (Furto / Roubo / Perda)</option>
                <option value="Descarregado">⚫ Descarregado (Fora de Carga / Fora de Posse)</option>
                <option value="Baixado">⚫ Baixado (Baixa Patrimonial Definitiva)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Descrição / Nome do Item</label>
              <input
                type="text"
                value={tipoItem}
                onChange={(e) => setTipoItem(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                required
              />
            </div>
          </div>

          {/* Maintenance Details Panel (when status is Manutenção or Danificado) */}
          {(status === 'Manutenção' || status === 'Danificado / Avariado') && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-amber-700" />
                  <span>Controle de Manutenção e Oficina</span>
                </div>
                {(() => {
                  const dias = calcularDiasManutencao(dataInicioManutencao);
                  const isCritico = dias > 30;
                  const isAtencao = dias > 7 && dias <= 30;
                  return (
                    <div
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isCritico
                          ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                          : isAtencao
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {dias === 0 ? 'Entrada Hoje (0 dias)' : dias === 1 ? '1 dia parado' : `${dias} dias em manutenção`}
                        {isCritico && ' • Crítico (+30d)'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 text-[11px] font-bold mb-1">
                    Data de Entrada na Manutenção *
                  </label>
                  <input
                    type="date"
                    value={dataInicioManutencao}
                    onChange={(e) => setDataInicioManutencao(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600 shadow-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Utilizada para o cálculo automatizado de tempo de retenção na oficina.
                  </p>
                </div>
                <div>
                  <label className="block text-slate-800 text-[11px] font-bold mb-1">
                    Oficina / Motivo / Ordem de Serviço (OS)
                  </label>
                  <input
                    type="text"
                    value={motivoManutencao}
                    onChange={(e) => setMotivoManutencao(e.target.value)}
                    placeholder="Ex: Auto Mecânica Seridó • OS #409 (Troca de embreagem)"
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Nome do prestador, número do chamado ou diagnóstico resumido.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Marca / Fabricante</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Identifiers */}
          {isViatura ? (
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <div className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>Identificação da Viatura:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-bold">Prefixo Oficial *</label>
                  <input
                    type="text"
                    value={prefixo}
                    onChange={(e) => setPrefixo(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-bold">Placa Oficial *</label>
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1 font-semibold">RENAVAM</label>
                  <input
                    type="text"
                    value={renavam}
                    onChange={(e) => setRenavam(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Chassi</label>
                  <input
                    type="text"
                    value={chassi}
                    onChange={(e) => setChassi(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Nº de Série{' '}
                  {selectedTipo?.exige_numero_serie ? (
                    <span className="text-red-600 font-bold">* (Obrigatório)</span>
                  ) : selectedTipo?.permite_numero_serie ? (
                    <span className="text-slate-400 font-normal">(Opcional)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Não aplicável)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ex: ACH192834 (sem espaços)"
                  value={numeroSerie}
                  disabled={selectedTipo?.permite_numero_serie === false}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault();
                  }}
                  onChange={(e) => setNumeroSerie(e.target.value.replace(/\s+/g, ''))}
                  required={selectedTipo?.exige_numero_serie}
                  className={`w-full border rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs ${
                    selectedTipo?.permite_numero_serie === false
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Nº de Tombo Patrimonial{' '}
                  {selectedTipo?.exige_numero_tombo ? (
                    <span className="text-red-600 font-bold">* (Obrigatório)</span>
                  ) : selectedTipo?.permite_numero_tombo ? (
                    <span className="text-slate-400 font-normal">(Opcional)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Não aplicável)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ex: TB-6BPM-001 (sem espaços)"
                  value={numeroTombo}
                  disabled={selectedTipo?.permite_numero_tombo === false}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault();
                  }}
                  onChange={(e) => setNumeroTombo(e.target.value.replace(/\s+/g, ''))}
                  required={selectedTipo?.exige_numero_tombo}
                  className={`w-full border rounded-lg p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs ${
                    selectedTipo?.permite_numero_tombo === false
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Specific Sub-tables */}
          {(categoriaEspecializada === 'arma' || item.detalhe_arma) && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
              <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <span>Detalhes de Armamento (detalhe_arma):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Calibre</label>
                  <input
                    type="text"
                    value={calibre}
                    onChange={(e) => setCalibre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Registro SIGMA</label>
                  <input
                    type="text"
                    value={numeroSigma}
                    onChange={(e) => setNumeroSigma(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Qtd Carregadores</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={qtdCarregadores}
                    onChange={(e) => setQtdCarregadores(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 pt-1 text-[11px]">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={brasaoGravado}
                    onChange={(e) => setBrasaoGravado(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Brasão PM Gravado</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carregadoresCoincidem}
                    onChange={(e) => setCarregadoresCoincidem(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Carregadores com mesma numeração</span>
                </label>
              </div>
            </div>
          )}

          {(categoriaEspecializada === 'colete' || item.detalhe_colete) && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
              <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <span>Detalhes de Proteção Balística (detalhe_colete):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Gênero</label>
                  <select
                    value={generoColete}
                    onChange={(e) => setGeneroColete(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Unissex">Unissex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Tamanho</label>
                  <input
                    type="text"
                    value={tamanhoColete}
                    onChange={(e) => setTamanhoColete(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Nível Proteção</label>
                  <input
                    type="text"
                    value={nivelProtecao}
                    onChange={(e) => setNivelProtecao(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Data Validade</label>
                  <input
                    type="date"
                    value={validadeColete}
                    onChange={(e) => setValidadeColete(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {(categoriaEspecializada === 'comunicacao' || item.detalhe_comunicacao) && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-700" />
                <span>Identificação de Telecomunicação (detalhe_comunicacao):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">IMEI / ID de Rádio / MAC</label>
                  <input
                    type="text"
                    value={imeiMac}
                    onChange={(e) => setImeiMac(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Nº Linha Funcional / Canal</label>
                  <input
                    type="text"
                    value={numeroLinha}
                    onChange={(e) => setNumeroLinha(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {(categoriaEspecializada === 'informatica' || item.detalhe_informatica) && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-700" />
                <span>Especificação de TI (detalhe_informatica):</span>
              </div>
              <div>
                <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Configuração Resumida / Hardware</label>
                <input
                  type="text"
                  value={configResumida}
                  onChange={(e) => setConfigResumida(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-1">Observações do Patrimônio</label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition flex items-center space-x-1.5"
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
