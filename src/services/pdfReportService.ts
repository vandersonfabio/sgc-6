import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseEngine, calcularDiasManutencao } from './store';
import { ModuloTipo } from '../types/database';

export class PdfReportService {
  private static addHeader(doc: jsPDF, titulo: string, subtitulo?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Military Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ESTADO DO RIO GRANDE DO NORTE', pageWidth / 2, 12, { align: 'center' });
    doc.text('POLÍCIA MILITAR DO RIO GRANDE DO NORTE - PMRN', pageWidth / 2, 16.5, { align: 'center' });
    doc.text('COMANDO DE POLICIAMENTO REGIONAL II - CPR II', pageWidth / 2, 21, { align: 'center' });
    doc.text('6º BATALHÃO DE POLÍCIA MILITAR', pageWidth / 2, 25.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SEÇÃO DE LOGÍSTICA E PATRIMÔNIO (P/4 & RESERVA DE ARMAMENTO)', pageWidth / 2, 30, { align: 'center' });

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 33, pageWidth - 14, 33);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(titulo.toUpperCase(), pageWidth / 2, 40, { align: 'center' });

    if (subtitulo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(subtitulo, pageWidth / 2, 45, { align: 'center' });
    }
  }

  private static addFooter(doc: jsPDF, operadorNome?: string) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      const emitidoEm = new Date().toLocaleString('pt-BR');
      doc.text(
        `Emitido via SGC 6º BPM em ${emitidoEm} por: ${operadorNome || 'Operador do Sistema'}`,
        14,
        pageHeight - 9
      );
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 9, { align: 'right' });
    }
  }

  // 1. Relatório de Material Bélico (Inventário + Lotes)
  public static gerarRelatorioArmamento(db: DatabaseEngine) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;

    this.addHeader(
      doc,
      'RELATÓRIO GERAL DE CARGA E INVENTÁRIO BÉLICO',
      `Armaria, Munições CBC e Equipamentos Táticos do 6º BPM • Caicó/RN`
    );

    const itens = db.getItensComDetalhes('Armas');
    const lotes = db.getLotes('Armas');
    const cautelasAtivas = db.getCautelasCompletas('Armas').filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

    // Resumo Estatístico
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMO GERAL DO DEPÓSITO:', 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const totalItens = itens.length;
    const disp = itens.filter((i) => i.status === 'Disponível').length;
    const caut = itens.filter((i) => i.status === 'Cautelado').length;
    const man = itens.filter((i) => i.status === 'Manutenção' || i.status === 'Danificado / Avariado').length;
    const totalMun = lotes.reduce((acc, l) => acc + l.quantidade_atual, 0);

    doc.text(
      `• Total de Itens: ${totalItens}  |  • Disponíveis: ${disp}  |  • Em Cautela: ${caut}  |  • Avariados/Manutenção: ${man}  |  • Munições: ${totalMun} un.`,
      14,
      57
    );

    // Tabela de Itens
    const tableRows = itens.map((it) => [
      it.numero_tombo || '-',
      it.numero_serie || '-',
      `${it.tipo_item} ${it.marca || ''} ${it.modelo || ''}`.trim(),
      it.detalhe_arma?.calibre || it.detalhe_colete?.nivel_protecao || '-',
      it.detalhe_colete?.data_validade || (it.detalhe_arma ? `${it.detalhe_arma.qtd_carregadores} carr.` : '-'),
      it.status,
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['Tombo', 'Nº de Série', 'Equipamento / Modelo', 'Calibre / Nível', 'Validade / Acessórios', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Tabela de Munições
    if (currentY + 30 > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ESTOQUE DE MUNIÇÕES (LOTES CBC):', 14, currentY);

    const loteRows = lotes.map((l) => [
      l.lote_fabricacao,
      l.calibre || '-',
      `${l.tipo_item} ${l.marca || ''} ${l.modelo || ''}`.trim(),
      l.data_validade || 'Indeterminada',
      `${l.quantidade_atual} un.`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Lote de Fabricação', 'Calibre', 'Tipo / Descrição', 'Validade', 'Qtd Disponível']],
      body: loteRows,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [254, 252, 232] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Relatorio_Bélico_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // 2. Relatório de Viaturas Operacionais (Com Gráficos de Unidade, Condição e sem operador de alocação)
  public static gerarRelatorioViaturas(db: DatabaseEngine) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(
      doc,
      'RELATÓRIO OFICIAL DA FROTA DE VIATURAS',
      `6º Batalhão de Polícia Militar • Caicó/RN • Distribuição por Unidade e Condição Operacional`
    );

    const itens = db.getItensComDetalhes('Viaturas');
    const alocacoes = db.getAlocacoesCompletas('Viaturas');
    const totalFrota = itens.length;

    // --- 1. Cálculo da Distribuição por Condição ---
    const condicoes = [
      { label: 'Disponível (Pronta p/ Serviço)', key: 'Disponível', cor: [16, 185, 129] as [number, number, number] },
      { label: 'Alocado (Em Operação)', key: 'Alocado', cor: [79, 70, 229] as [number, number, number] },
      { label: 'Manutenção (Oficina)', key: 'Manutenção', cor: [245, 158, 11] as [number, number, number] },
      { label: 'Danificado / Avariado', key: 'Danificado / Avariado', cor: [225, 29, 72] as [number, number, number] },
    ];

    const condicoesData = condicoes.map((c) => {
      const count = itens.filter((i) => i.status === c.key).length;
      const pct = totalFrota > 0 ? ((count / totalFrota) * 100).toFixed(1) : '0.0';
      return { ...c, count, pct };
    });

    // --- 2. Cálculo da Distribuição por Unidade ---
    const unitMap: Record<string, { nome: string; count: number; condicoes: Record<string, number> }> = {};

    // Sede
    unitMap['sede'] = {
      nome: 'Pátio 6º BPM (Sede - Caicó)',
      count: 0,
      condicoes: { Disponível: 0, Alocado: 0, Manutenção: 0, 'Danificado / Avariado': 0 },
    };

    itens.forEach((it) => {
      const aloc = alocacoes.find(
        (a) => a.itens.some((itAloc) => itAloc.id_item === it.id_item) && a.status === 'Ativa'
      );

      if (aloc) {
        const uId = `unid_${aloc.unidade.id_unidade}`;
        if (!unitMap[uId]) {
          unitMap[uId] = {
            nome: aloc.unidade.nome,
            count: 0,
            condicoes: { Disponível: 0, Alocado: 0, Manutenção: 0, 'Danificado / Avariado': 0 },
          };
        }
        unitMap[uId].count += 1;
        unitMap[uId].condicoes[it.status] = (unitMap[uId].condicoes[it.status] || 0) + 1;
      } else {
        unitMap['sede'].count += 1;
        unitMap['sede'].condicoes[it.status] = (unitMap['sede'].condicoes[it.status] || 0) + 1;
      }
    });

    const unidadesList = Object.values(unitMap).sort((a, b) => b.count - a.count);

    // --- Desenhar Seção 1: Indicadores e Condição dos Veículos (Gráfico em Barras) ---
    let currentY = 50;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 42, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. CONDIÇÃO OPERACIONAL DA FROTA (ESTADO DOS VEÍCULOS)', 18, currentY + 6);

    let barY = currentY + 12;
    condicoesData.forEach((c) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${c.label}:`, 18, barY + 3.5);

      // Quantidade e percentual à direita
      doc.setFont('helvetica', 'bold');
      doc.text(`${c.count} VTR (${c.pct}%)`, 105, barY + 3.5);

      // Barra de fundo (cinza)
      const barMaxWidth = 75;
      const barX = 120;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barMaxWidth, 4.5, 1, 1, 'F');

      // Barra preenchida colorida
      const filledWidth = totalFrota > 0 ? (c.count / totalFrota) * barMaxWidth : 0;
      if (filledWidth > 0) {
        doc.setFillColor(c.cor[0], c.cor[1], c.cor[2]);
        doc.roundedRect(barX, barY, Math.max(filledWidth, 2), 4.5, 1, 1, 'F');
      }

      barY += 7;
    });

    currentY += 46;

    // --- Desenhar Seção 2: Distribuição por Unidade / DPM (Gráfico em Barras) ---
    const boxHeightUnidades = Math.min(62, 10 + unidadesList.length * 6.5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeightUnidades, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. QUANTITATIVO DE VIATURAS POR UNIDADE / DESTACAMENTO', 18, currentY + 6);

    let uBarY = currentY + 12;
    unidadesList.slice(0, 7).forEach((u) => {
      const pct = totalFrota > 0 ? ((u.count / totalFrota) * 100).toFixed(1) : '0.0';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      const trimmedName = u.nome.length > 38 ? u.nome.substring(0, 36) + '...' : u.nome;
      doc.text(trimmedName, 18, uBarY + 3.2);

      // Quantidade
      doc.setFont('helvetica', 'bold');
      doc.text(`${u.count} (${pct}%)`, 105, uBarY + 3.2);

      // Barra de gráfico
      const barMaxWidth = 75;
      const barX = 120;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, uBarY, barMaxWidth, 4, 1, 1, 'F');

      const filledWidth = totalFrota > 0 ? (u.count / totalFrota) * barMaxWidth : 0;
      if (filledWidth > 0) {
        doc.setFillColor(79, 70, 229); // Índigo
        doc.roundedRect(barX, uBarY, Math.max(filledWidth, 2), 4, 1, 1, 'F');
      }

      uBarY += 6.5;
    });

    currentY += boxHeightUnidades + 4;

    // --- Seção 3: Tabela Detalhada com os Veículos ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. INVENTÁRIO NOMINATIVO DA FROTA VEICULAR', 14, currentY);

    const tableRows = itens.map((it) => {
      const vtr = it.detalhe_viatura;
      const aloc = alocacoes.find(
        (a) => a.itens.some((itAloc) => itAloc.id_item === it.id_item) && a.status === 'Ativa'
      );
      
      // Conforme solicitado: Não precisa mostrar no relatório o usuário que fez a alocação
      const destino = aloc ? aloc.unidade.nome : 'Pátio 6º BPM (Sede)';

      let statusLabel: string = it.status;
      if (it.status === 'Manutenção' || it.status === 'Danificado / Avariado') {
        const dias = calcularDiasManutencao(it.data_inicio_manutencao);
        const diasStr = dias === 0 ? 'Entrada Hoje' : dias === 1 ? '1 dia' : `${dias} dias`;
        statusLabel = `${it.status} (${diasStr})${it.motivo_manutencao ? ` - ${it.motivo_manutencao}` : ''}`;
      }

      return [
        vtr?.prefixo || 'VTR-0600',
        vtr?.placa || '-',
        it.tipo_item,
        `${it.marca || ''} ${it.modelo || ''}`.trim(),
        statusLabel,
        destino,
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Prefixo', 'Placa Oficial', 'Tipo do Veículo', 'Marca / Modelo', 'Condição / Status', 'Lotação / Emprego']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Relatorio_Viaturas_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // 3. Relatório de Cautelas em Andamento (com busca / listagem completa)
  public static gerarRelatorioCautelas(db: DatabaseEngine, modulo?: ModuloTipo) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;

    const titulo = modulo
      ? `RELATÓRIO DE CAUTELAS EM ANDAMENTO - ${modulo.toUpperCase()}`
      : 'RELATÓRIO GERAL DE CAUTELAS ATIVAS E PENDÊNCIAS';

    this.addHeader(doc, titulo, '6º Batalhão de Polícia Militar • Caicó/RN • Livro de Registros de Cautela');

    let cautelas = db.getCautelasCompletas(modulo);
    cautelas = cautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');

    const tableRows = cautelas.map((c) => {
      const materiais = [
        ...c.itens.map((ci) => `${ci.item.tipo_item} ${ci.item.modelo || ''} (${ci.item.numero_tombo || ci.item.numero_serie || 'S/N'})`),
        ...c.lotes.map((cl) => `${cl.quantidade}x Mun. ${cl.lote.calibre}`),
      ].join('; ');

      const dataRet = new Date(c.data_retirada).toLocaleString('pt-BR');
      const dataPrev = c.data_prevista_devolucao
        ? new Date(c.data_prevista_devolucao).toLocaleString('pt-BR')
        : 'Permanente';

      return [
        `#${String(c.id_cautela).padStart(3, '0')}`,
        `${c.policial.patente} ${c.policial.nome_guerra}`,
        c.policial.matricula,
        c.tipo,
        materiais,
        dataRet,
        dataPrev,
        c.status,
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['ID', 'Policial Militar', 'Matrícula', 'Tipo', 'Equipamentos Cautelados', 'Data Retirada', 'Previsão Devolução', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Relatorio_Cautelas_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // 4. Relatório Geral do Módulo (Comunicação, Informática ou Móveis com Gráficos e Distribuição)
  public static gerarRelatorioModulo(db: DatabaseEngine, modulo: ModuloTipo) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;
    const pageWidth = doc.internal.pageSize.getWidth();

    this.addHeader(
      doc,
      `RELATÓRIO OFICIAL DE PATRIMÔNIO - ${modulo.toUpperCase()}`,
      `6º Batalhão de Polícia Militar • Caicó/RN • Distribuição por Unidade e Condição Operacional`
    );

    const itens = db.getItensComDetalhes(modulo);
    const alocacoes = db.getAlocacoesCompletas(modulo);
    const totalItens = itens.length;

    // --- 1. Cálculo da Distribuição por Condição ---
    const condicoes = [
      { label: 'Disponível (Pronto p/ Uso)', key: 'Disponível', cor: [16, 185, 129] as [number, number, number] },
      { label: 'Alocado (Em Setor / Unidade)', key: 'Alocado', cor: [79, 70, 229] as [number, number, number] },
      { label: 'Cautelado (Policial Militar)', key: 'Cautelado', cor: [37, 99, 235] as [number, number, number] },
      { label: 'Manutenção (Reparo)', key: 'Manutenção', cor: [245, 158, 11] as [number, number, number] },
      { label: 'Danificado / Avariado', key: 'Danificado / Avariado', cor: [225, 29, 72] as [number, number, number] },
    ];

    const condicoesData = condicoes
      .map((c) => {
        const count = itens.filter((i) => i.status === c.key).length;
        const pct = totalItens > 0 ? ((count / totalItens) * 100).toFixed(1) : '0.0';
        return { ...c, count, pct };
      })
      .filter((c) => c.count > 0 || c.key === 'Disponível' || c.key === 'Alocado');

    // --- 2. Cálculo da Distribuição por Unidade ---
    const defaultSedeName =
      modulo === 'Comunicação'
        ? 'Sala de Rádio / P3 (Sede)'
        : modulo === 'Informática'
        ? 'Depósito de TI / P4 (Sede)'
        : 'Depósito Geral da P4 (Sede)';

    const unitMap: Record<string, { nome: string; count: number }> = {};
    unitMap['sede'] = { nome: defaultSedeName, count: 0 };

    itens.forEach((it) => {
      if (it.alocacao_atual && it.alocacao_atual.id_unidade !== 1 && !it.alocacao_atual.unidade_nome.toLowerCase().includes('sede')) {
        const uId = `unid_${it.alocacao_atual.id_unidade || it.alocacao_atual.unidade_nome}`;
        if (!unitMap[uId]) {
          unitMap[uId] = { nome: it.alocacao_atual.unidade_nome, count: 0 };
        }
        unitMap[uId].count += 1;
      } else {
        unitMap['sede'].count += 1;
      }
    });

    const unidadesList = Object.values(unitMap).sort((a, b) => b.count - a.count);

    // --- Desenhar Seção 1: Indicadores e Condição dos Equipamentos (Gráfico em Barras) ---
    let currentY = 50;

    const boxHeightCondicoes = Math.max(38, 10 + condicoesData.length * 6.5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeightCondicoes, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`1. SITUAÇÃO / CONDIÇÃO PATRIMONIAL (${totalItens} ITENS)`, 18, currentY + 6);

    let barY = currentY + 11;
    condicoesData.forEach((c) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${c.label}:`, 18, barY + 3.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`${c.count} un. (${c.pct}%)`, 105, barY + 3.5);

      const barMaxWidth = 75;
      const barX = 120;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barMaxWidth, 4, 1, 1, 'F');

      const filledWidth = totalItens > 0 ? (c.count / totalItens) * barMaxWidth : 0;
      if (filledWidth > 0) {
        doc.setFillColor(c.cor[0], c.cor[1], c.cor[2]);
        doc.roundedRect(barX, barY, Math.max(filledWidth, 2), 4, 1, 1, 'F');
      }

      barY += 6.5;
    });

    currentY += boxHeightCondicoes + 4;

    // --- Desenhar Seção 2: Distribuição por Unidade / Setor (Gráfico em Barras) ---
    const boxHeightUnidades = Math.min(52, 10 + Math.min(unidadesList.length, 6) * 6.5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeightUnidades, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. QUANTITATIVO POR LOCAL / UNIDADE / SETOR', 18, currentY + 6);

    let uBarY = currentY + 11;
    unidadesList.slice(0, 6).forEach((u) => {
      const pct = totalItens > 0 ? ((u.count / totalItens) * 100).toFixed(1) : '0.0';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      const trimmedName = u.nome.length > 38 ? u.nome.substring(0, 36) + '...' : u.nome;
      doc.text(trimmedName, 18, uBarY + 3.2);

      doc.setFont('helvetica', 'bold');
      doc.text(`${u.count} (${pct}%)`, 105, uBarY + 3.2);

      const barMaxWidth = 75;
      const barX = 120;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, uBarY, barMaxWidth, 4, 1, 1, 'F');

      const filledWidth = totalItens > 0 ? (u.count / totalItens) * barMaxWidth : 0;
      if (filledWidth > 0) {
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(barX, uBarY, Math.max(filledWidth, 2), 4, 1, 1, 'F');
      }

      uBarY += 6.5;
    });

    currentY += boxHeightUnidades + 4;

    // --- Seção 3: Tabela de Itens ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. INVENTÁRIO NOMINATIVO DE MATERIAIS', 14, currentY);

    const themeColors: Record<string, [number, number, number]> = {
      'Comunicação': [5, 150, 105],
      'Informática': [8, 145, 178],
      'Móveis e Diversos': [124, 58, 237],
    };
    const headFill = themeColors[modulo] || [51, 65, 85];

    const tableRows = itens.map((it) => {
      let spec = it.observacao || '-';
      if (it.detalhe_comunicacao) {
        spec = `IMEI/MAC: ${it.detalhe_comunicacao.imei_mac || '-'} | Linha: ${it.detalhe_comunicacao.numero_linha || '-'}`;
      } else if (it.detalhe_informatica) {
        spec = it.detalhe_informatica.configuracao_resumida || '-';
      }

      let lotacao = defaultSedeName;
      if (it.cautela_atual) {
        lotacao = `Cautela #${it.cautela_atual.id_cautela}: ${it.cautela_atual.policial_grad} ${it.cautela_atual.policial_nome}`;
      } else if (it.alocacao_atual) {
        lotacao = it.alocacao_atual.unidade_nome;
      }

      return [
        it.numero_tombo || '-',
        it.numero_serie || '-',
        it.tipo_item,
        `${it.marca || ''} ${it.modelo || ''}`.trim(),
        spec,
        it.status,
        lotacao,
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Tombo', 'Nº Série', 'Tipo de Item', 'Marca / Modelo', 'Especificação', 'Status', 'Lotação / Emprego']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: headFill, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Relatorio_${modulo.replace(/\s+/g, '_')}_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // 5. Relatório do Efetivo do 6º BPM
  public static gerarRelatorioEfetivo(db: DatabaseEngine) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;

    this.addHeader(
      doc,
      'RELAÇÃO GERAL DO EFETIVO POLICIAL MILITAR',
      '6º Batalhão de Polícia Militar - Caicó/RN'
    );

    const policiais = db.getPoliciais();
    const unidades = db.getUnidades();

    const tableRows = policiais.map((p) => {
      const unitId = p.id_unidade_lotacao || p.id_unidade;
      const u = unidades.find((un) => un.id_unidade === unitId);
      return [
        p.matricula,
        p.patente,
        p.nome_guerra,
        p.nome_completo,
        u?.sigla || '-',
        p.status,
      ];
    });

    autoTable(doc, {
      startY: 52,
      head: [['Matrícula', 'Posto/Grad.', 'Nome de Guerra', 'Nome Completo', 'Lotação (OP/Pel)', 'Situação']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Relatorio_Efetivo_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // 6. Relatório da Estrutura Organizacional e Setores do 6º BPM
  public static gerarRelatorioEstruturaUnidades(db: DatabaseEngine) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { operador, policial } = db.getCurrentOperador();
    const opNome = `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`;

    this.addHeader(
      doc,
      'ESTRUTURA ORGANIZACIONAL, COMPANHIAS E DESTACAMENTOS',
      '6º Batalhão de Polícia Militar - Caicó/RN'
    );

    const unidades = db.getUnidades();
    const policiais = db.getPoliciais();
    const alocacoes = db.getAlocacoesCompletas();

    const tableRows = unidades.map((u) => {
      const superior = unidades.find((sup) => sup.id_unidade === u.id_unidade_superior);
      const efetivoCount = policiais.filter(
        (p) => p.id_unidade_lotacao === u.id_unidade || p.id_unidade === u.id_unidade
      ).length;
      const alocacoesCount = alocacoes.filter((a) => a.id_unidade === u.id_unidade && a.status === 'Ativa').length;

      return [
        `[${u.tipo_unidade}] ${u.sigla || ''}`.trim(),
        u.nome,
        u.municipio || 'Caicó',
        superior ? `${superior.sigla || superior.nome}` : 'Comando Geral (Raiz)',
        u.responsavel_nome || '-',
        `${efetivoCount} PMs / ${alocacoesCount} Cargas`,
      ];
    });

    autoTable(doc, {
      startY: 52,
      head: [['Tipo / Sigla', 'Nome da Unidade / Setor', 'Município', 'Subordinação', 'Comandante/Chefe', 'Efetivo / Cargas']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 1.8 },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc, opNome);
    doc.save(`Estrutura_Organizacional_6BPM_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
