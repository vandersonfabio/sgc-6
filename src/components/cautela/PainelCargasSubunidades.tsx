import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../services/store';
import { CautelaCompleta, Unidade } from '../../types/database';
import {
  Building2,
  Plus,
  FileText,
  Edit,
  Printer,
  Search,
  Crosshair,
  Shield,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  Radio,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { ModalCargaSubunidade } from './ModalCargaSubunidade';
import { ModalEditarCargaSubunidade } from './ModalEditarCargaSubunidade';
import { ModalPassagemComando } from './ModalPassagemComando';
import { TermoCautelaPrint } from './TermoCautelaPrint';

interface PainelCargasSubunidadesProps {
  onAbrirNovaCarga: () => void;
  onAbrirPassagemComando: (unidadeId?: number) => void;
}

export const PainelCargasSubunidades: React.FC<PainelCargasSubunidadesProps> = ({
  onAbrirNovaCarga,
  onAbrirPassagemComando,
}) => {
  const { db } = useDatabase();
  const unidades = db.getUnidades();
  const todasCautelas = db.getCautelasCompletas();

  const [buscaTermo, setBuscaTermo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'DPM' | 'PELOTAO' | 'SETOR'>('TODAS');
  const [subunidadeExpandidaId, setSubunidadeExpandidaId] = useState<number | null>(null);

  // Selected Cautela for editing or printing
  const [cautelaParaEditar, setCautelaParaEditar] = useState<CautelaCompleta | null>(null);
  const [cautelaParaImprimir, setCautelaParaImprimir] = useState<CautelaCompleta | null>(null);

  // Group active loads by subunit
  const cargasSubunidadesAtivas = useMemo(() => {
    return todasCautelas.filter(
      (c) =>
        (c.destinatario_tipo === 'UNIDADE' || c.unidade !== undefined) &&
        (c.status === 'Aberta' || c.status === 'Atrasada')
    );
  }, [todasCautelas]);

  // Aggregate stats per unit
  const dadosUnidades = useMemo(() => {
    return unidades.map((u) => {
      const cargasUnidade = cargasSubunidadesAtivas.filter(
        (c) => c.id_unidade === u.id_unidade || c.unidade?.id_unidade === u.id_unidade
      );

      const totalArmas = cargasUnidade.reduce(
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

      const totalColetes = cargasUnidade.reduce(
        (acc, c) => acc + c.itens.filter((ci) => ci.item.tipo_item.toLowerCase().includes('colete')).length,
        0
      );

      const totalMunicoes = cargasUnidade.reduce(
        (acc, c) => acc + c.lotes.reduce((lAcc, l) => lAcc + l.quantidade, 0),
        0
      );

      const totalComunicacao = cargasUnidade.reduce(
        (acc, c) =>
          acc +
          c.itens.filter(
            (ci) =>
              ci.item.modulo === 'Comunicação' ||
              ci.item.tipo_item.toLowerCase().includes('rádio') ||
              ci.item.tipo_item.toLowerCase().includes('ht')
          ).length,
        0
      );

      return {
        unidade: u,
        cargas: cargasUnidade,
        totalArmas,
        totalColetes,
        totalMunicoes,
        totalComunicacao,
        possuiCargaAtiva: cargasUnidade.length > 0,
      };
    });
  }, [unidades, cargasSubunidadesAtivas]);

  // Restrict strictly to subunits that actually have active cargas
  const subunidadesComCargasAtivas = useMemo(() => {
    return dadosUnidades.filter((du) => du.possuiCargaAtiva);
  }, [dadosUnidades]);

  // Summary counts for filter buttons
  const contagens = useMemo(() => {
    return {
      todas: subunidadesComCargasAtivas.length,
      dpms: subunidadesComCargasAtivas.filter((du) => du.unidade.tipo_unidade === 'DPM').length,
      pelotoes: subunidadesComCargasAtivas.filter(
        (du) => du.unidade.tipo_unidade === 'Pelotão' || du.unidade.tipo_unidade === 'Companhia'
      ).length,
      setores: subunidadesComCargasAtivas.filter((du) => du.unidade.tipo_unidade === 'Setor').length,
      totalArmas: subunidadesComCargasAtivas.reduce((acc, du) => acc + du.totalArmas, 0),
      totalColetes: subunidadesComCargasAtivas.reduce((acc, du) => acc + du.totalColetes, 0),
      totalMunicoes: subunidadesComCargasAtivas.reduce((acc, du) => acc + du.totalMunicoes, 0),
    };
  }, [subunidadesComCargasAtivas]);

  // Filtered by search and type
  const unidadesFiltradas = useMemo(() => {
    return subunidadesComCargasAtivas.filter((du) => {
      const u = du.unidade;
      const matchTipo =
        filtroTipo === 'TODAS'
          ? true
          : filtroTipo === 'DPM'
          ? u.tipo_unidade === 'DPM'
          : filtroTipo === 'PELOTAO'
          ? u.tipo_unidade === 'Pelotão' || u.tipo_unidade === 'Companhia'
          : u.tipo_unidade === 'Setor';

      if (!matchTipo) return false;

      if (!buscaTermo.trim()) return true;
      const term = buscaTermo.toLowerCase();
      return (
        u.nome.toLowerCase().includes(term) ||
        (u.municipio || '').toLowerCase().includes(term) ||
        du.cargas.some(
          (c) =>
            c.policial.nome_guerra.toLowerCase().includes(term) ||
            c.policial.matricula.toLowerCase().includes(term) ||
            c.policial.nome_completo.toLowerCase().includes(term) ||
            String(c.id_cautela).includes(term) ||
            c.itens.some(
              (ci) =>
                ci.item.tipo_item.toLowerCase().includes(term) ||
                (ci.item.numero_serie || '').toLowerCase().includes(term) ||
                (ci.item.numero_tombo || '').toLowerCase().includes(term) ||
                (ci.item.detalhe_arma?.calibre || '').toLowerCase().includes(term)
            ) ||
            c.lotes.some(
              (cl) =>
                cl.lote.tipo_item.toLowerCase().includes(term) ||
                (cl.lote.calibre || '').toLowerCase().includes(term)
            )
        )
      );
    });
  }, [subunidadesComCargasAtivas, filtroTipo, buscaTermo]);

  const toggleExpandir = (unidadeId: number) => {
    setSubunidadeExpandidaId((prev) => (prev === unidadeId ? null : unidadeId));
  };

  return (
    <div className="space-y-4">
      {/* Submenu Action Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Cargas & Dotações de Subunidades (DPMs / Pelotões)
              </h2>
              <p className="text-xs text-indigo-200">
                Acompanhamento e controle de frações destacadas com material bélico em carga ativa
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAbrirNovaCarga}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVA CARGA DE SUBUNIDADE</span>
          </button>

          <button
            onClick={() => onAbrirPassagemComando()}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition transform hover:-translate-y-0.5 cursor-pointer border border-slate-700"
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>Passagem de Comando (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview of Active Loads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Subunidades com Carga</div>
            <div className="text-lg font-black text-slate-900">{contagens.todas}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Armas em Carga</div>
            <div className="text-lg font-black text-slate-900">{contagens.totalArmas}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Coletes em Carga</div>
            <div className="text-lg font-black text-slate-900">{contagens.totalColetes}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Munições em Carga</div>
            <div className="text-lg font-black text-slate-900">{contagens.totalMunicoes} un</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltroTipo('TODAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtroTipo === 'TODAS'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas Ativas ({contagens.todas})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('DPM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtroTipo === 'DPM'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            DPMs / Destacamentos ({contagens.dpms})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('PELOTAO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filtroTipo === 'PELOTAO'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pelotões / Companhias ({contagens.pelotoes})
          </button>
          {contagens.setores > 0 && (
            <button
              type="button"
              onClick={() => setFiltroTipo('SETOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filtroTipo === 'SETOR'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Setores ({contagens.setores})
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DPM, PM encarregado, Tombo, Série..."
            value={buscaTermo}
            onChange={(e) => setBuscaTermo(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Table of Subunits with Active Cargas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Subunidade / Município</th>
                <th className="p-3.5">Policial Militar Encarregado</th>
                <th className="p-3.5">Termo / Emissão</th>
                <th className="p-3.5 text-center">Armas</th>
                <th className="p-3.5 text-center">Coletes</th>
                <th className="p-3.5 text-center">Munições (CBC)</th>
                <th className="p-3.5 text-right">Ações da Carga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">
                        Nenhuma subunidade com carga ativa encontrada.
                      </p>
                      <p className="text-xs text-slate-500">
                        {buscaTermo.trim() || filtroTipo !== 'TODAS'
                          ? 'Nenhuma subunidade corresponde aos filtros ou termo de busca informado.'
                          : 'No momento, nenhuma subunidade ou destacamento possui material bélico em carga ativa.'}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={onAbrirNovaCarga}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Iniciar Nova Carga de Subunidade</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                unidadesFiltradas.map((du) => {
                  const u = du.unidade;
                  const cargaPrincipal = du.cargas[0];
                  const isExpandida = subunidadeExpandidaId === u.id_unidade;

                  // Collect all weapons in this carga
                  const armasDaCarga = cargaPrincipal?.itens.filter(
                    (ci) =>
                      ci.item.modulo === 'Armas' &&
                      !ci.item.tipo_item.toLowerCase().includes('colete')
                  ) || [];

                  // Collect all coletes
                  const coletesDaCarga = cargaPrincipal?.itens.filter((ci) =>
                    ci.item.tipo_item.toLowerCase().includes('colete')
                  ) || [];

                  // Collect all radios / comunicacao
                  const radiosDaCarga = cargaPrincipal?.itens.filter(
                    (ci) =>
                      ci.item.modulo === 'Comunicação' ||
                      ci.item.tipo_item.toLowerCase().includes('rádio') ||
                      ci.item.tipo_item.toLowerCase().includes('ht')
                  ) || [];

                  // Format date
                  const dataFormatada = cargaPrincipal?.data_cautela
                    ? new Date(cargaPrincipal.data_cautela).toLocaleDateString('pt-BR')
                    : '-';

                  return (
                    <React.Fragment key={u.id_unidade}>
                      <tr className="transition hover:bg-slate-50/80">
                        {/* Subunidade / Município */}
                        <td className="p-3.5 align-middle">
                          <div className="flex items-start space-x-2.5">
                            <button
                              type="button"
                              onClick={() => toggleExpandir(u.id_unidade)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition mt-0.5"
                              title={isExpandida ? 'Recolher detalhes' : 'Ver materiais em carga'}
                            >
                              {isExpandida ? (
                                <ChevronUp className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-1.5 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border border-slate-200">
                                  {u.tipo_unidade}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center space-x-1 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>Carga Ativa</span>
                                </span>
                              </div>
                              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {u.nome}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Município: <span className="text-slate-700 font-medium">{u.municipio || 'Caicó/RN'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Policial Encarregado */}
                        <td className="p-3.5 align-middle">
                          {cargaPrincipal ? (
                            <div>
                              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                                <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>
                                  {cargaPrincipal.policial.patente} {cargaPrincipal.policial.nome_guerra}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Matrícula: {cargaPrincipal.policial.matricula}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                {cargaPrincipal.policial.nome_completo}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Não designado</span>
                          )}
                        </td>

                        {/* Termo / Emissão */}
                        <td className="p-3.5 align-middle">
                          {cargaPrincipal ? (
                            <div>
                              <div className="font-mono font-bold text-indigo-900">
                                Termo #{String(cargaPrincipal.id_cautela).padStart(5, '0')}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Emissão: {dataFormatada}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Tipo: Permanente / Subunidade
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Armas */}
                        <td className="p-3.5 text-center align-middle">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                            <Crosshair className="w-3.5 h-3.5 text-red-600" />
                            <span className="font-extrabold text-slate-900">{du.totalArmas}</span>
                          </div>
                        </td>

                        {/* Coletes */}
                        <td className="p-3.5 text-center align-middle">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-extrabold text-slate-900">{du.totalColetes}</span>
                          </div>
                        </td>

                        {/* Munições */}
                        <td className="p-3.5 text-center align-middle">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-extrabold">{du.totalMunicoes} un</span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="p-3.5 text-right align-middle">
                          {cargaPrincipal ? (
                            <div className="inline-flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setCautelaParaEditar(cargaPrincipal)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-300 text-indigo-700 font-bold text-xs flex items-center space-x-1 shadow-2xs transition"
                                title="Editar carga (adicionar novos equipamentos, recolher armas ou transferir munições)"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setCautelaParaImprimir(cargaPrincipal)}
                                className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center space-x-1 shadow-2xs transition"
                                title="Imprimir Termo de Carga"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Termo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onAbrirPassagemComando(u.id_unidade)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center space-x-1 shadow-2xs transition"
                                title="Gerar Termo de Passagem de Comando em PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Passagem</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={onAbrirNovaCarga}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                            >
                              Iniciar Carga
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable row showing individual items in the carga */}
                      {isExpandida && cargaPrincipal && (
                        <tr className="bg-slate-50/90 border-t border-b border-slate-200">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                                <Building2 className="w-4 h-4 text-indigo-700" />
                                <span>Inventário Detalhado da Carga — {u.nome}</span>
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Termo #{String(cargaPrincipal.id_cautela).padStart(5, '0')} • {cargaPrincipal.itens.length} itens patrimoniados • {du.totalMunicoes} munições
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {/* Armas */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <div className="font-bold text-slate-900 flex items-center space-x-1 text-[11px] uppercase border-b border-slate-100 pb-1 text-red-700">
                                  <Crosshair className="w-3.5 h-3.5" />
                                  <span>Armas de Fogo ({armasDaCarga.length})</span>
                                </div>
                                {armasDaCarga.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">Nenhuma arma alocada.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {armasDaCarga.map((ci) => (
                                      <div
                                        key={ci.item.id_item}
                                        className="p-1.5 bg-slate-50 rounded border border-slate-100 text-[11px]"
                                      >
                                        <div className="font-bold text-slate-900">{ci.item.tipo_item}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {ci.item.marca} {ci.item.modelo} • Cal: {ci.item.detalhe_arma?.calibre || '-'}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-700">
                                          Série: {ci.item.numero_serie || '-'} {ci.item.numero_tombo ? `| Tombo: ${ci.item.numero_tombo}` : ''}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Coletes & Comunicação */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <div className="font-bold text-slate-900 flex items-center space-x-1 text-[11px] uppercase border-b border-slate-100 pb-1 text-blue-700">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Proteção & Rádios ({coletesDaCarga.length + radiosDaCarga.length})</span>
                                </div>
                                {coletesDaCarga.length === 0 && radiosDaCarga.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">Nenhum colete ou rádio alocado.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {coletesDaCarga.map((ci) => (
                                      <div
                                        key={ci.item.id_item}
                                        className="p-1.5 bg-slate-50 rounded border border-slate-100 text-[11px]"
                                      >
                                        <div className="font-bold text-slate-900">{ci.item.tipo_item}</div>
                                        <div className="text-[10px] text-slate-500">
                                          Tam: {ci.item.detalhe_colete?.tamanho || '-'} • Nível: {ci.item.detalhe_colete?.nivel_protecao || '-'}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-700">
                                          Série: {ci.item.numero_serie || '-'}
                                        </div>
                                      </div>
                                    ))}
                                    {radiosDaCarga.map((ci) => (
                                      <div
                                        key={ci.item.id_item}
                                        className="p-1.5 bg-slate-50 rounded border border-slate-100 text-[11px]"
                                      >
                                        <div className="font-bold text-slate-900">{ci.item.tipo_item}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {ci.item.marca} {ci.item.modelo}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-700">
                                          Série: {ci.item.numero_serie || '-'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Munições */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <div className="font-bold text-slate-900 flex items-center space-x-1 text-[11px] uppercase border-b border-slate-100 pb-1 text-emerald-700">
                                  <Package className="w-3.5 h-3.5" />
                                  <span>Dotação de Munições CBC ({du.totalMunicoes} un)</span>
                                </div>
                                {cargaPrincipal.lotes.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">Nenhuma munição alocada.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {cargaPrincipal.lotes.map((cl) => (
                                      <div
                                        key={cl.lote.id_lote}
                                        className="p-1.5 bg-slate-50 rounded border border-slate-100 text-[11px] flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="font-bold text-slate-900">{cl.lote.tipo_item}</div>
                                          <div className="text-[10px] text-slate-500">
                                            Calibre: {cl.lote.calibre || '-'} • Lote: {cl.lote.lote_fabricacao || '-'}
                                          </div>
                                        </div>
                                        <div className="font-extrabold text-emerald-700 text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                                          {cl.quantidade} un
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Editar Carga de Subunidade */}
      {cautelaParaEditar && (
        <ModalEditarCargaSubunidade
          cautela={cautelaParaEditar}
          onClose={() => setCautelaParaEditar(null)}
          onSuccess={() => {
            setCautelaParaEditar(null);
          }}
        />
      )}

      {/* MODAL: Termo de Cautela / Carga Print */}
      {cautelaParaImprimir && (
        <TermoCautelaPrint
          cautela={cautelaParaImprimir}
          onClose={() => setCautelaParaImprimir(null)}
        />
      )}
    </div>
  );
};
