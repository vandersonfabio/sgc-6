import React from 'react';
import { useDatabase } from '../../services/store';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Crosshair,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';

export const ArmasGraficosAnalytics: React.FC = () => {
  const { db, lotes } = useDatabase();

  const allItens = db.getItensComDetalhes('Armas');
  const allCautelas = db.getCautelasCompletas('Armas');
  const activeCautelas = allCautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

  // Filter only genuine munitions
  const municoesLotes = lotes.filter(
    (l) =>
      l.modulo === 'Armas' &&
      (l.calibre !== null ||
        l.tipo_item.toLowerCase().includes('muni') ||
        l.tipo_item.toLowerCase().includes('cartucho'))
  );

  // Exclude discharged/unloaded items that are no longer in battalion custody
  const activeItens = allItens.filter((i) => i.status !== 'Descarregado' && i.status !== 'Baixado');

  // 1. Calculations by firearm type (active in inventory)
  const pistolas = activeItens.filter((i) => i.tipo_item.toLowerCase().includes('pistola'));
  const fuzis = activeItens.filter((i) => i.tipo_item.toLowerCase().includes('fuzil'));
  const carabinas = activeItens.filter(
    (i) => i.tipo_item.toLowerCase().includes('carabina') || i.tipo_item.toLowerCase().includes('submetralhadora')
  );
  const espingardas = activeItens.filter(
    (i) => i.tipo_item.toLowerCase().includes('espingarda') || i.tipo_item.toLowerCase().includes('pump')
  );
  const coletes = activeItens.filter((i) => i.tipo_item.toLowerCase().includes('colete'));
  const escudos = activeItens.filter((i) => i.tipo_item.toLowerCase().includes('escudo'));

  // Armament categories data for BarChart
  const armasData = [
    {
      categoria: 'Pistolas',
      total: pistolas.length,
      disponivel: pistolas.filter((i) => i.status === 'Disponível').length,
      cautelado: pistolas.filter((i) => i.status === 'Cautelado').length,
      manutencao: pistolas.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
    {
      categoria: 'Fuzis',
      total: fuzis.length,
      disponivel: fuzis.filter((i) => i.status === 'Disponível').length,
      cautelado: fuzis.filter((i) => i.status === 'Cautelado').length,
      manutencao: fuzis.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
    {
      categoria: 'Carabinas',
      total: carabinas.length,
      disponivel: carabinas.filter((i) => i.status === 'Disponível').length,
      cautelado: carabinas.filter((i) => i.status === 'Cautelado').length,
      manutencao: carabinas.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
    {
      categoria: 'Espingardas 12',
      total: espingardas.length,
      disponivel: espingardas.filter((i) => i.status === 'Disponível').length,
      cautelado: espingardas.filter((i) => i.status === 'Cautelado').length,
      manutencao: espingardas.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
    {
      categoria: 'Coletes Balísticos',
      total: coletes.length,
      disponivel: coletes.filter((i) => i.status === 'Disponível').length,
      cautelado: coletes.filter((i) => i.status === 'Cautelado').length,
      manutencao: coletes.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
    {
      categoria: 'Escudos Balísticos',
      total: escudos.length,
      disponivel: escudos.filter((i) => i.status === 'Disponível').length,
      cautelado: escudos.filter((i) => i.status === 'Cautelado').length,
      manutencao: escudos.filter((i) => i.status === 'Danificado / Avariado' || i.status === 'Manutenção').length,
    },
  ];

  // 2. Calculations for munitions by caliber (exclusive to operacionais: .40, 5.56, 7.62, 12 GA)
  const getMunicaoPorCalibre = (calibrePattern: string) => {
    const lotesDoCalibre = municoesLotes.filter((l) =>
      (l.calibre || '').toLowerCase().includes(calibrePattern.toLowerCase()) ||
      l.tipo_item.toLowerCase().includes(calibrePattern.toLowerCase()) ||
      (l.modelo || '').toLowerCase().includes(calibrePattern.toLowerCase())
    );

    const saldoCofre = lotesDoCalibre.reduce((acc, l) => acc + l.quantidade_atual, 0);

    // Cautelado
    let saldoCautelado = 0;
    const loteIds = new Set(lotesDoCalibre.map((l) => l.id_lote));
    for (const c of activeCautelas) {
      for (const cl of c.lotes) {
        if (loteIds.has(cl.lote.id_lote)) {
          saldoCautelado += cl.quantidade;
        }
      }
    }

    return {
      saldoCofre,
      saldoCautelado,
      total: saldoCofre + saldoCautelado,
    };
  };

  const mun40 = getMunicaoPorCalibre('.40');
  const mun556 = getMunicaoPorCalibre('5.56');
  const mun762 = getMunicaoPorCalibre('7.62');
  const mun12 = getMunicaoPorCalibre('12');

  const municoesChartData = [
    {
      calibre: '.40 S&W',
      noCofre: mun40.saldoCofre,
      emCautela: mun40.saldoCautelado,
      total: mun40.total,
    },
    {
      calibre: '5.56x45mm NATO',
      noCofre: mun556.saldoCofre,
      emCautela: mun556.saldoCautelado,
      total: mun556.total,
    },
    {
      calibre: '7.62x51mm NATO',
      noCofre: mun762.saldoCofre,
      emCautela: mun762.saldoCautelado,
      total: mun762.total,
    },
    {
      calibre: '12 GA (Calibre 12)',
      noCofre: mun12.saldoCofre,
      emCautela: mun12.saldoCautelado,
      total: mun12.total,
    },
  ];

  // 3. Status distribution for PieChart
  const totalDisponivel = allItens.filter((i) => i.status === 'Disponível').length;
  const totalCautelado = allItens.filter((i) => i.status === 'Cautelado').length;
  const totalAlocado = allItens.filter((i) => i.status === 'Alocado').length;
  const totalManutencao = allItens.filter((i) => i.status === 'Manutenção' || i.status === 'Danificado / Avariado').length;
  const totalEmApuracao = allItens.filter((i) => i.status === 'Em apuração').length;
  const totalExtraviado = allItens.filter((i) => i.status === 'Extraviado').length;
  const totalDescarregado = allItens.filter((i) => i.status === 'Descarregado' || i.status === 'Baixado').length;

  const statusPieData = [
    { name: 'Disponível no Cofre', value: totalDisponivel, color: '#16a34a' },
    { name: 'Em Cautela (Serviço)', value: totalCautelado, color: '#2563eb' },
    { name: 'Alocado em Setor/DPM', value: totalAlocado, color: '#6366f1' },
    { name: 'Manutenção / Avaria', value: totalManutencao, color: '#eab308' },
    { name: 'Em Apuração (Justiça/IPM)', value: totalEmApuracao, color: '#9333ea' },
    { name: 'Extraviado', value: totalExtraviado, color: '#dc2626' },
    { name: 'Descarregado (Fora de Carga)', value: totalDescarregado, color: '#64748b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pistolas */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Pistolas</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{pistolas.length}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              {pistolas.filter((i) => i.status === 'Disponível').length} no cofre
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {pistolas.filter((i) => i.status === 'Cautelado').length} em serviço
          </span>
        </div>

        {/* Fuzis */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Fuzis</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{fuzis.length}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              {fuzis.filter((i) => i.status === 'Disponível').length} no cofre
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {fuzis.filter((i) => i.status === 'Cautelado').length} em serviço
          </span>
        </div>

        {/* Carabinas */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Carabinas</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{carabinas.length}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              {carabinas.filter((i) => i.status === 'Disponível').length} no cofre
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {carabinas.filter((i) => i.status === 'Cautelado').length} em serviço
          </span>
        </div>

        {/* Munições .40 S&W */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Munição .40 S&W</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{mun40.total.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] text-slate-500 font-semibold">un.</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {mun40.saldoCofre.toLocaleString('pt-BR')} no cofre • {mun40.saldoCautelado} caut.
          </span>
        </div>

        {/* Munições 5.56 */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Munição 5.56mm</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{mun556.total.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] text-slate-500 font-semibold">un.</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {mun556.saldoCofre.toLocaleString('pt-BR')} no cofre • {mun556.saldoCautelado} caut.
          </span>
        </div>

        {/* Munições 7.62 */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Munição 7.62mm</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{mun762.total.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] text-slate-500 font-semibold">un.</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {mun762.saldoCofre.toLocaleString('pt-BR')} no cofre • {mun762.saldoCautelado} caut.
          </span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Armamentos por Categoria */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Inventário de Armamentos e Equipamentos por Categoria</span>
              </h3>
              <p className="text-xs text-slate-500">Distribuição entre disponível no cofre e em serviço ordinário</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={armasData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                <XAxis dataKey="categoria" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="disponivel" name="No Cofre (Disponível)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cautelado" name="Em Cautela (Serviço)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="manutencao" name="Manutenção / Avaria" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Munições por Calibre */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Saldo Físico de Munições por Calibre (Cofre vs Cautela)</span>
              </h3>
              <p className="text-xs text-slate-500">Controle total de cartuchos operacionais do 6º BPM</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={municoesChartData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                <XAxis dataKey="calibre" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString('pt-BR')} un.`, '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="noCofre" name="Saldo no Cofre" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emCautela" name="Distribuído em Cautela" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Detailed Breakdown Table & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4 text-emerald-600" />
            <span>Situação do Armamento</span>
          </h3>
          <p className="text-xs text-slate-500">Disponibilidade percentual dos patrimônios bélicos</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} itens`, 'Quantidade']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            {statusPieData.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Ammunition Table Summary */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resumo Consolidado de Calibres e Dotação Bélica</h3>
              <p className="text-xs text-slate-500">Contagem analítica de cartuchos por calibre no 6º BPM</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              Total Geral: {(mun40.total + mun556.total + mun762.total + mun12.total).toLocaleString('pt-BR')} un.
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Calibre</th>
                  <th className="p-3">Destinação Principal</th>
                  <th className="p-3 text-right">No Cofre</th>
                  <th className="p-3 text-right">Em Cautela</th>
                  <th className="p-3 text-right">Total Geral</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {municoesChartData.map((row, idx) => (
                  <tr key={`${row.calibre}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{row.calibre}</td>
                    <td className="p-3 text-slate-600">
                      {row.calibre.includes('.40') && 'Pistolas PT 100 / Carabina CTT40'}
                      {row.calibre.includes('5.56') && 'Fuzis IMBEL IA2 / Taurus T4'}
                      {row.calibre.includes('7.62') && 'Fuzis FAL 7.62 / Atirador de Precisão'}
                      {row.calibre.includes('12') && 'Espingardas CBC Military 3.0'}
                    </td>
                    <td className="p-3 text-right font-black text-amber-700">
                      {row.noCofre.toLocaleString('pt-BR')} un.
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700">
                      {row.emCautela.toLocaleString('pt-BR')} un.
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {row.total.toLocaleString('pt-BR')} un.
                    </td>
                    <td className="p-3 text-center">
                      {row.noCofre > 200 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Normal
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Atenção
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
