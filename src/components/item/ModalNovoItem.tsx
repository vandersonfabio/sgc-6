import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../services/store';
import { ModuloTipo, StatusItem, TipoMaterial, ModoControleMaterial } from '../../types/database';
import {
  X,
  PlusCircle,
  AlertCircle,
  Shield,
  Radio,
  Truck,
  Monitor,
  Package,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ModalNovoItemProps {
  modulo: ModuloTipo;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalNovoItem: React.FC<ModalNovoItemProps> = ({ modulo, onClose, onSuccess }) => {
  const { db } = useDatabase();

  // Load available material catalog for this module
  const tiposMateriais = db.getTiposMateriais(modulo);

  // Selected Tipo Material
  const [selectedTipoId, setSelectedTipoId] = useState<number | ''>(
    tiposMateriais.length > 0 ? tiposMateriais[0].id_tipo_material : ''
  );

  const selectedTipo = tiposMateriais.find((t) => t.id_tipo_material === Number(selectedTipoId));

  // Tab: 'individual' (Item individual) or 'lote' (Lote / Quantidade)
  const [tabType, setTabType] = useState<'individual' | 'lote'>('individual');

  // Sync tab with selectedTipo control mode
  useEffect(() => {
    if (selectedTipo) {
      if (selectedTipo.modo_controle === 'QUANTIDADE') {
        setTabType('lote');
      } else if (selectedTipo.modo_controle === 'INDIVIDUAL') {
        setTabType('individual');
      }
      setTipoItem((prev) => {
        if (!prev || tiposMateriais.some((t) => t.nome === prev)) {
          return selectedTipo.nome;
        }
        return prev;
      });
    }
  }, [selectedTipoId]);

  // Common Fields
  const [tipoItem, setTipoItem] = useState(selectedTipo?.nome || '');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [numeroTombo, setNumeroTombo] = useState('');
  const [status, setStatus] = useState<StatusItem>('Disponível');
  const [observacao, setObservacao] = useState('');

  // Detalhe Arma de Fogo
  const [calibre, setCalibre] = useState('9mm');
  const [numeroSigma, setNumeroSigma] = useState('');
  const [brasaoGravado, setBrasaoGravado] = useState(true);
  const [qtdCarregadores, setQtdCarregadores] = useState(3);
  const [carregadoresCoincidem, setCarregadoresCoincidem] = useState(true);

  // Detalhe Proteção (Colete / Escudo)
  const [generoColete, setGeneroColete] = useState<'Masculino' | 'Feminino' | 'Unissex'>('Masculino');
  const [tamanhoColete, setTamanhoColete] = useState('M');
  const [nivelProtecao, setNivelProtecao] = useState('III-A');
  const [validadeProtecao, setValidadeProtecao] = useState('');

  // Detalhe IMPO / Espargidor
  const [validadeImpo, setValidadeImpo] = useState('');

  // Detalhe Comunicação
  const [imeiMac, setImeiMac] = useState('');
  const [numeroLinha, setNumeroLinha] = useState('');

  // Detalhe Viatura
  const [placa, setPlaca] = useState('');
  const [prefixo, setPrefixo] = useState('');
  const [renavam, setRenavam] = useState('');
  const [chassi, setChassi] = useState('');

  // Detalhe Informática
  const [configResumida, setConfigResumida] = useState('');

  // Quantidade / Estoque Fields (Munições ou Materiais Híbridos / Quantitativos)
  const [loteValidade, setLoteValidade] = useState('');
  const [loteQtd, setLoteQtd] = useState(100);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine current active specialized detail category (strictly from selectedTipo, never from typed strings or fallbacks)
  const getCategoriaEspecializada = (): string => {
    if (selectedTipo) {
      return String(selectedTipo.categoria_especializada).toLowerCase();
    }
    return 'nenhuma';
  };

  const categoriaEspecializada = getCategoriaEspecializada();
  const isViatura = modulo === 'Viaturas' || categoriaEspecializada === 'viatura';
  // ONLY genuine firearm ammunition type (e.g. id 8 or explicit ARMA category in Lote mode) is considered Municao Lote
  const isMunicaoLote =
    modulo === 'Armas' &&
    (selectedTipo?.id_tipo_material === 8 ||
      (selectedTipo?.categoria_especializada === 'ARMA' && (tabType === 'lote' || selectedTipo?.modo_controle === 'QUANTIDADE')));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Cadastrar Quantidade / Estoque
    if (tabType === 'lote' || selectedTipo?.modo_controle === 'QUANTIDADE') {
      if (!tipoItem || loteQtd <= 0) {
        setErrorMessage('Preencha a descrição do material e informe uma quantidade válida (> 0).');
        return;
      }

      const res = db.cadastrarLote({
        modulo,
        id_tipo_material: selectedTipo?.id_tipo_material || null,
        tipo_item: tipoItem,
        marca: marca || null,
        modelo: modelo || null,
        calibre: isMunicaoLote && calibre.trim() ? calibre.trim() : null,
        lote_fabricacao: null,
        data_validade: loteValidade ? loteValidade : null,
        quantidade_atual: loteQtd,
        observacao: observacao || null,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Erro ao cadastrar estoque quantitativo.');
      }
      return;
    }

    // 2. Cadastrar Item Patrimonial Individual
    if (!tipoItem) {
      setErrorMessage('Informe o tipo do item.');
      return;
    }

    // Validate Serial Number based on TipoMaterial rules
    if (selectedTipo) {
      if (selectedTipo.exige_numero_serie && !numeroSerie.trim()) {
        setErrorMessage(`O Número de Série é OBRIGATÓRIO para o tipo "${selectedTipo.nome}".`);
        return;
      }
      if (selectedTipo.exige_numero_tombo && !numeroTombo.trim()) {
        setErrorMessage(`O Número de Tombo Patrimonial é OBRIGATÓRIO para o tipo "${selectedTipo.nome}".`);
        return;
      }
    }

    const itemPayload = {
      modulo,
      id_tipo_material: selectedTipo?.id_tipo_material || null,
      tipo_item: tipoItem,
      marca: marca || null,
      modelo: modelo || null,
      numero_serie: isViatura || selectedTipo?.permite_numero_serie === false ? null : numeroSerie.replace(/\s+/g, '') || null,
      numero_tombo: isViatura || selectedTipo?.permite_numero_tombo === false ? null : numeroTombo.replace(/\s+/g, '') || null,
      status,
      observacao: observacao || null,
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
        data_validade: validadeProtecao,
      };
    } else if (categoriaEspecializada === 'impo') {
      detalhes.impo = {
        data_validade: validadeImpo,
      };
    } else if (categoriaEspecializada === 'comunicacao') {
      detalhes.comunicacao = {
        imei_mac: imeiMac || null,
        numero_linha: numeroLinha || null,
      };
    } else if (categoriaEspecializada === 'viatura' || modulo === 'Viaturas') {
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
    } else if (categoriaEspecializada === 'informatica') {
      detalhes.informatica = {
        configuracao_resumida: configResumida || null,
      };
    }

    const res = db.cadastrarItem(itemPayload, detalhes);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Erro ao cadastrar patrimônio.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Cadastro • {modulo}</h2>
              <p className="text-xs text-slate-500">Inclusão conforme catálogo e modo de controle do 6º BPM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SELEÇÃO DO TIPO DE MATERIAL CANÔNICO */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 space-y-2 text-xs">
          <label className="block font-bold text-slate-900">
            Selecione o Tipo de Material (Regras e Modo de Controle):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedTipoId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTipoId(val ? Number(val) : '');
              }}
              className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              {tiposMateriais.map((t) => (
                <option key={t.id_tipo_material} value={t.id_tipo_material}>
                  {t.nome} • [{t.modo_controle}]
                </option>
              ))}
            </select>

            {selectedTipo && (
              <div className="p-2 bg-white rounded-lg border border-blue-200 text-[11px] text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-800">Modo: </span>
                  <span className="font-semibold">{selectedTipo.modo_controle}</span>
                </div>
                <div className="flex gap-1.5 text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-medium ${
                      selectedTipo.exige_numero_serie
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : selectedTipo.permite_numero_serie
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Série: {selectedTipo.exige_numero_serie ? 'Obrigatória' : selectedTipo.permite_numero_serie ? 'Opcional' : 'Não se aplica'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-medium ${
                      selectedTipo.exige_numero_tombo
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : selectedTipo.permite_numero_tombo
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Tombo: {selectedTipo.exige_numero_tombo ? 'Obrigatório' : selectedTipo.permite_numero_tombo ? 'Opcional' : 'Não se aplica'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection if HIBRIDO */}
        {selectedTipo?.modo_controle === 'HIBRIDO' && (
          <div className="flex border-b border-slate-200 bg-slate-100/70 p-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTabType('individual')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                tabType === 'individual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Cadastrar Unidade Individual (Patrimônio)</span>
            </button>
            <button
              type="button"
              onClick={() => setTabType('lote')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                tabType === 'lote'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cadastrar Estoque por Quantidade</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tabType === 'lote' || selectedTipo?.modo_controle === 'QUANTIDADE' ? (
            /* Quantidade / Estoque Coletivo */
            <div className="space-y-3">
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Materiais controlados por <strong>QUANTIDADE</strong> (munições, cartuchos, insumos) são contabilizados por saldo numérico, sem necessidade de identificadores individuais fictícios ou número de lote.
                </span>
              </div>

              <div className={`grid ${isMunicaoLote ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Nome / Descrição do Material</label>
                  <input
                    type="text"
                    value={tipoItem}
                    onChange={(e) => setTipoItem(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    required
                  />
                </div>
                {isMunicaoLote && (
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Calibre da Munição <span className="text-amber-600">*</span>
                    </label>
                    <select
                      value={calibre ?? '9mm'}
                      onChange={(e) => setCalibre(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    >
                      <option value="9mm">9mm</option>
                      <option value=".40 S&W">.40 S&W</option>
                      <option value="5.56x45mm">5.56x45mm</option>
                      <option value="7.62x51mm">7.62x51mm</option>
                      <option value="12 GA">12 GA</option>
                      <option value=".38 SPL">.38 SPL</option>
                      <option value=".380 ACP">.380 ACP</option>
                      <option value=".50 BMG">.50 BMG</option>
                      <option value="Outro">Outro Calibre</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Fabricante / Marca (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: CBC, Condor, Poly Defensor"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Modelo / Tipo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Gold Hex Ponta Oca 124gr, GL-108/CS"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Quantidade Inicial a Adicionar *</label>
                  <input
                    type="number"
                    min={1}
                    value={loteQtd}
                    onChange={(e) => setLoteQtd(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-600 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Data de Validade <span className="text-slate-400 font-normal">(Opcional / Deixar em branco caso não aplicável)</span>
                  </label>
                  <input
                    type="date"
                    value={loteValidade}
                    onChange={(e) => setLoteValidade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Item Individual */
            <div className="space-y-4">
              {/* Status Selector & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Status Inicial</label>
                  <select
                    value={status ?? 'Disponível'}
                    onChange={(e) => setStatus(e.target.value as StatusItem)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs font-semibold"
                  >
                    <option value="Disponível">🟢 Disponível (Pronto para Cautela / Alocação)</option>
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

              {/* Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ex: Taurus, Beretta, Motorola, Toyota, Inbraterr, Algemas Brasil"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: TS9, APX 2000, Hilux 4x4, Tático Dobradiça"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Identifiers: Serial Number & Tombo adaptively rendered */}
              {isViatura ? (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                  <div className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-amber-700" />
                    <span>Identificação Operacional da Viatura (Identificada por Placa e Prefixo):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-bold">Prefixo Oficial *</label>
                      <input
                        type="text"
                        placeholder="Ex: VTR-0601, ROCAM-06"
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
                        placeholder="Ex: PMR-0601"
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs font-mono font-bold text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] mb-1 font-semibold">RENAVAM (Opcional)</label>
                      <input
                        type="text"
                        placeholder="01234567890"
                        value={renavam}
                        onChange={(e) => setRenavam(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] mb-1 font-semibold">Chassi (Opcional)</label>
                      <input
                        type="text"
                        placeholder="9BR..."
                        value={chassi}
                        onChange={(e) => setChassi(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Serial Number */}
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
                      placeholder={
                        selectedTipo?.permite_numero_serie === false
                          ? 'Item sem número de série'
                          : 'Ex: ACH192834 (sem espaços)'
                      }
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

                  {/* Tombo */}
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
                      placeholder={
                        selectedTipo?.permite_numero_tombo === false
                          ? 'Item sem número de tombo'
                          : 'Ex: TB-6BPM-001 (sem espaços)'
                      }
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

              {/* Specific Sub-tables & Details */}
              {categoriaEspecializada === 'arma' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                  <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    <span>Detalhes de Arma de Fogo (detalhe_arma):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Calibre</label>
                      <select
                        value={calibre ?? '9mm'}
                        onChange={(e) => setCalibre(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                      >
                        <option value="9mm">9mm Luger</option>
                        <option value=".40 S&W">.40 S&W</option>
                        <option value="5.56x45mm">5.56x45mm NATO</option>
                        <option value="7.62x51mm">7.62x51mm NATO</option>
                        <option value="12 GA">12 GA</option>
                        <option value=".380 ACP">.380 ACP</option>
                        <option value=".38 SPL">.38 SPL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Registro SIGMA</label>
                      <input
                        type="text"
                        placeholder="Ex: SIGMA-098234"
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

              {categoriaEspecializada === 'colete' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                  <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    <span>Detalhes de Proteção Balística (detalhe_colete):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Gênero</label>
                      <select
                        value={generoColete ?? 'Masculino'}
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
                      <select
                        value={tamanhoColete ?? 'G'}
                        onChange={(e) => setTamanhoColete(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                      >
                        <option value="P">P</option>
                        <option value="M">M</option>
                        <option value="G">G</option>
                        <option value="GG">GG</option>
                        <option value="XG">XG</option>
                        <option value="Único">Único (Escudo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Nível Proteção</label>
                      <select
                        value={nivelProtecao ?? 'III-A'}
                        onChange={(e) => setNivelProtecao(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 font-bold"
                      >
                        <option value="II">Nível II</option>
                        <option value="III-A">Nível III-A</option>
                        <option value="III">Nível III</option>
                        <option value="IV">Nível IV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Data Validade</label>
                      <input
                        type="date"
                        value={validadeProtecao}
                        onChange={(e) => setValidadeProtecao(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {categoriaEspecializada === 'impo' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                  <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    <span>Detalhes de IMPO / Espargidor (detalhe_impo):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Data de Validade do Agente Químico</label>
                      <input
                        type="date"
                        value={validadeImpo}
                        onChange={(e) => setValidadeImpo(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {categoriaEspecializada === 'comunicacao' && (
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
                        placeholder="Ex: 869234059182301 ou ID-0620"
                        value={imeiMac}
                        onChange={(e) => setImeiMac(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Nº Linha Funcional / Canal</label>
                      <input
                        type="text"
                        placeholder="Ex: (27) 99823-4567 / CH-06-OP"
                        value={numeroLinha}
                        onChange={(e) => setNumeroLinha(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {categoriaEspecializada === 'informatica' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                  <div className="font-bold text-blue-900 text-[11px] flex items-center space-x-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-700" />
                    <span>Especificação de TI (detalhe_informatica):</span>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[10px] mb-1 font-semibold">Configuração Resumida / Hardware</label>
                    <input
                      type="text"
                      placeholder="Ex: Core i7 16GB RAM 512GB SSD Windows 11 Pro"
                      value={configResumida}
                      onChange={(e) => setConfigResumida(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observações Gerais */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Observações do Patrimônio / Cautela</label>
            <textarea
              rows={2}
              placeholder="Ex: Equipamento novo recebido via Diretoria de Apoio Logístico (DAL) conforme NF 18239."
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar no Patrimônio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
