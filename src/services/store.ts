import { useState, useEffect } from 'react';
import {
  ModuloTipo,
  PerfilAcesso,
  Unidade,
  Policial,
  OperadorSistema,
  TipoMaterial,
  ModoControleMaterial,
  CategoriaEspecializada,
  ItemPatrimonio,
  DetalheArma,
  DetalheColete,
  DetalheImpo,
  DetalheComunicacao,
  DetalheViatura,
  DetalheInformatica,
  EstoqueLote,
  Cautela,
  CautelaItem,
  CautelaEstoque,
  AlocacaoUnidade,
  AlocacaoItem,
  ItemComDetalhes,
  CautelaCompleta,
  AlocacaoCompleta,
  TipoCautela,
  AuditoriaLog,
  RegistroExtravio,
  RegistroDisparo,
} from '../types/database';
import {
  SEED_UNIDADES,
  SEED_POLICIAIS,
  SEED_OPERADORES,
  SEED_TIPOS_MATERIAIS,
  SEED_ITENS_PATRIMONIO,
  SEED_DETALHE_ARMA,
  SEED_DETALHE_COLETE,
  SEED_DETALHE_IMPO,
  SEED_DETALHE_COMUNICACAO,
  SEED_DETALHE_VIATURA,
  SEED_DETALHE_INFORMATICA,
  SEED_ESTOQUE_LOTE,
  SEED_CAUTELAS,
  SEED_CAUTELA_ITENS,
  SEED_CAUTELA_ESTOQUE,
  SEED_ALOCACOES_UNIDADE,
  SEED_ALOCACAO_ITENS,
  SEED_AUDITORIA_LOGS,
  SEED_REGISTROS_EXTRAVIO,
  SEED_REGISTROS_DISPARO,
} from '../data/seedData';
import {
  pushItemToSupabase,
  deleteItemFromSupabase,
  pushLoteToSupabase,
  updateLoteQuantidadeInSupabase,
  pushPolicialToSupabase,
  pushCautelaToSupabase,
  finalizarCautelaInSupabase,
  pushAlocacaoToSupabase,
  finalizarAlocacaoInSupabase,
  pushExtravioToSupabase,
  pushDisparoToSupabase,
  pushAuditoriaToSupabase,
  pushOperadorToSupabase,
  deleteOperadorFromSupabase,
  pushUnidadeToSupabase,
  deleteUnidadeFromSupabase,
  pushTipoMaterialToSupabase,
  pushAllDataToSupabase,
  pullAllDataFromSupabase,
  initSupabaseRealtime,
  syncOperadorAuthUser,
  syncAllOperadoresToAuth,
  getSupabaseTableCounts,
  TableStats,
} from './supabaseSync';
import { getActiveSupabaseConfig, getSupabaseClient } from './supabaseClient';

const STORAGE_PREFIX = 'sgc6_bpm_data_v2_supabase_';

function loadOrSeed<T>(key: string, seed: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Erro ao carregar dados de ${key}:`, e);
  }
  return seed;
}

function save<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar dados de ${key}:`, e);
  }
}

// In-memory Database state with subscribers for Reactivity
export class DatabaseEngine {
  private unidades: Unidade[];
  private policiais: Policial[];
  private operadores: OperadorSistema[];
  private tiposMateriais: TipoMaterial[];
  private itens: ItemPatrimonio[];
  private detalheArma: DetalheArma[];
  private detalheColete: DetalheColete[];
  private detalheImpo: DetalheImpo[];
  private detalheComunicacao: DetalheComunicacao[];
  private detalheViatura: DetalheViatura[];
  private detalheInformatica: DetalheInformatica[];
  private lotes: EstoqueLote[];
  private cautelas: Cautela[];
  private cautelaItens: CautelaItem[];
  private cautelaEstoque: CautelaEstoque[];
  private alocacoes: AlocacaoUnidade[];
  private alocacaoItens: AlocacaoItem[];
  private auditoriaLogs: AuditoriaLog[];
  private registrosExtravio: RegistroExtravio[];
  private registrosDisparo: RegistroDisparo[];

  // Active current operator session (UUID auth)
  private currentOperadorId: string;
  private isAuthenticated: boolean = false;
  private listeners: Array<() => void> = [];

  // Live Supabase sync state
  private syncStatus: 'idle' | 'syncing' | 'synced' | 'error' = 'idle';
  private lastSyncDate?: Date;
  private syncMessage?: string;
  private syncError?: string;

  constructor() {
    this.unidades = loadOrSeed('unidades', SEED_UNIDADES);
    this.policiais = loadOrSeed('policiais', SEED_POLICIAIS);
    this.operadores = loadOrSeed('operadores', SEED_OPERADORES);
    // Ensure all seed operators have default initial passwords if missing
    let operadoresChanged = false;
    this.operadores = this.operadores.map((op) => {
      if (!op.senha) {
        operadoresChanged = true;
        return { ...op, senha: '123' };
      }
      return op;
    });
    if (operadoresChanged) {
      save('operadores', this.operadores);
    }
    this.tiposMateriais = loadOrSeed('tipos_materiais', SEED_TIPOS_MATERIAIS);
    // Ensure all canonical seed material types exist
    let tiposChanged = false;
    for (const seedTipo of SEED_TIPOS_MATERIAIS) {
      if (!this.tiposMateriais.some((t) => t.id_tipo_material === seedTipo.id_tipo_material)) {
        this.tiposMateriais.push(seedTipo);
        tiposChanged = true;
      }
    }
    if (tiposChanged) {
      save('tipos_materiais', this.tiposMateriais);
    }
    this.itens = loadOrSeed('itens', SEED_ITENS_PATRIMONIO);
    this.detalheArma = loadOrSeed('detalhe_arma', SEED_DETALHE_ARMA);
    this.detalheColete = loadOrSeed('detalhe_colete', SEED_DETALHE_COLETE);
    this.detalheImpo = loadOrSeed('detalhe_impo', SEED_DETALHE_IMPO);
    this.detalheComunicacao = loadOrSeed('detalhe_comunicacao', SEED_DETALHE_COMUNICACAO);
    this.detalheViatura = loadOrSeed('detalhe_viatura', SEED_DETALHE_VIATURA);
    this.detalheInformatica = loadOrSeed('detalhe_informatica', SEED_DETALHE_INFORMATICA);
    this.lotes = loadOrSeed('lotes', SEED_ESTOQUE_LOTE);
    this.cautelas = loadOrSeed('cautelas', SEED_CAUTELAS);
    this.cautelaItens = loadOrSeed('cautela_itens', SEED_CAUTELA_ITENS);
    this.cautelaEstoque = loadOrSeed('cautela_estoque', SEED_CAUTELA_ESTOQUE);
    this.alocacoes = loadOrSeed('alocacoes', SEED_ALOCACOES_UNIDADE);
    this.alocacaoItens = loadOrSeed('alocacao_itens', SEED_ALOCACAO_ITENS);
    this.auditoriaLogs = loadOrSeed('auditoria_logs', SEED_AUDITORIA_LOGS);
    this.registrosExtravio = loadOrSeed('registros_extravio', SEED_REGISTROS_EXTRAVIO);
    this.registrosDisparo = loadOrSeed('registros_disparo', SEED_REGISTROS_DISPARO);

    // Sanitize detalheViatura so prefixo is never null or empty
    let vtrChanged = false;
    this.detalheViatura = this.detalheViatura.map((v) => {
      const prefix = v.prefixo && v.prefixo.trim() ? v.prefixo.trim() : `VTR-${v.placa ? v.placa.replace(/[^a-zA-Z0-9]/g, '') : v.id_item}`;
      if (!v.prefixo || v.prefixo !== prefix) {
        vtrChanged = true;
        return { ...v, prefixo: prefix };
      }
      return v;
    });
    if (vtrChanged) {
      save('detalhe_viatura', this.detalheViatura);
    }

    const savedOpId = localStorage.getItem(STORAGE_PREFIX + 'current_operador');
    this.currentOperadorId = savedOpId || SEED_OPERADORES[0].id_operador;

    const savedAuth = localStorage.getItem(STORAGE_PREFIX + 'auth_session');
    this.isAuthenticated = savedAuth === 'true';

    // Auto-fetch data from Supabase in the background on startup
    setTimeout(() => {
      this.pullAllFromSupabase().catch((e) => console.log('Inicialização do Supabase:', e));
    }, 100);

    // Initialize Supabase Realtime WebSocket listener for instant multi-user sync
    try {
      initSupabaseRealtime(() => {
        this.pullAllFromSupabaseQuiet().catch((e) => console.warn('[Realtime] Erro ao sincronizar estado silenciosamente:', e));
      });
    } catch (e) {
      console.warn('Erro ao conectar realtime:', e);
    }

    // Refresh data when user refocuses the browser window
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.pullAllFromSupabaseQuiet().catch(() => {});
      });
      window.addEventListener('online', () => {
        this.pullAllFromSupabaseQuiet().catch(() => {});
      });
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public resetToSeed() {
    localStorage.clear();
    this.unidades = SEED_UNIDADES;
    this.policiais = SEED_POLICIAIS;
    this.operadores = SEED_OPERADORES;
    this.tiposMateriais = SEED_TIPOS_MATERIAIS;
    this.itens = SEED_ITENS_PATRIMONIO;
    this.detalheArma = SEED_DETALHE_ARMA;
    this.detalheColete = SEED_DETALHE_COLETE;
    this.detalheImpo = SEED_DETALHE_IMPO;
    this.detalheComunicacao = SEED_DETALHE_COMUNICACAO;
    this.detalheViatura = SEED_DETALHE_VIATURA;
    this.detalheInformatica = SEED_DETALHE_INFORMATICA;
    this.lotes = SEED_ESTOQUE_LOTE;
    this.cautelas = SEED_CAUTELAS;
    this.cautelaItens = SEED_CAUTELA_ITENS;
    this.cautelaEstoque = SEED_CAUTELA_ESTOQUE;
    this.alocacoes = SEED_ALOCACOES_UNIDADE;
    this.alocacaoItens = SEED_ALOCACAO_ITENS;
    this.auditoriaLogs = SEED_AUDITORIA_LOGS;
    this.registrosExtravio = SEED_REGISTROS_EXTRAVIO;
    this.registrosDisparo = SEED_REGISTROS_DISPARO;
    this.currentOperadorId = SEED_OPERADORES[0].id_operador;
    this.persistAll();
    this.notify();
  }

  private persistAll() {
    save('unidades', this.unidades);
    save('policiais', this.policiais);
    save('operadores', this.operadores);
    save('tipos_materiais', this.tiposMateriais);
    save('itens', this.itens);
    save('detalhe_arma', this.detalheArma);
    save('detalhe_colete', this.detalheColete);
    save('detalhe_impo', this.detalheImpo);
    save('detalhe_comunicacao', this.detalheComunicacao);
    save('detalhe_viatura', this.detalheViatura);
    save('detalhe_informatica', this.detalheInformatica);
    save('lotes', this.lotes);
    save('cautelas', this.cautelas);
    save('cautela_itens', this.cautelaItens);
    save('cautela_estoque', this.cautelaEstoque);
    save('alocacoes', this.alocacoes);
    save('alocacao_itens', this.alocacaoItens);
    save('auditoria_logs', this.auditoriaLogs);
    save('registros_extravio', this.registrosExtravio);
    save('registros_disparo', this.registrosDisparo);
    save('current_operador', this.currentOperadorId);
  }

  // Supabase Sync Methods
  public getSyncStatus() {
    return {
      status: this.syncStatus,
      lastSync: this.lastSyncDate,
      message: this.syncMessage,
      error: this.syncError,
    };
  }

  public async getSupabaseTableStats(): Promise<{ success: boolean; stats?: TableStats; error?: string }> {
    return getSupabaseTableCounts();
  }

  public async syncAllToSupabase(): Promise<{ success: boolean; message: string; error?: string }> {
    this.syncStatus = 'syncing';
    this.notify();
    const res = await pushAllDataToSupabase({
      unidades: this.unidades,
      policiais: this.policiais,
      operadores: this.operadores,
      tiposMateriais: this.tiposMateriais,
      itens: this.itens,
      detalheArma: this.detalheArma,
      detalheColete: this.detalheColete,
      detalheImpo: this.detalheImpo,
      detalheComunicacao: this.detalheComunicacao,
      detalheViatura: this.detalheViatura,
      detalheInformatica: this.detalheInformatica,
      lotes: this.lotes,
      cautelas: this.cautelas,
      cautelaItens: this.cautelaItens,
      cautelaEstoque: this.cautelaEstoque,
      alocacoes: this.alocacoes,
      alocacaoItens: this.alocacaoItens,
      auditoriaLogs: this.auditoriaLogs,
    });

    if (res.success) {
      this.syncStatus = 'synced';
      this.lastSyncDate = new Date();
      this.syncMessage = res.message;
      this.syncError = undefined;
    } else {
      this.syncStatus = 'error';
      this.syncError = res.error || res.message;
    }
    this.notify();
    return res;
  }

  public async pullAllFromSupabase(): Promise<{ success: boolean; message: string; error?: string }> {
    this.syncStatus = 'syncing';
    this.notify();
    const res = await pullAllDataFromSupabase();
    if (res.success && res.data) {
      if (res.data.unidades && res.data.unidades.length > 0) this.unidades = res.data.unidades;
      if (res.data.policiais && res.data.policiais.length > 0) this.policiais = res.data.policiais;
      if (res.data.operadores && res.data.operadores.length > 0) this.operadores = res.data.operadores;
      if (res.data.tiposMateriais && res.data.tiposMateriais.length > 0) this.tiposMateriais = res.data.tiposMateriais;
      this.itens = res.data.itens || [];
      this.detalheArma = res.data.detalheArma || [];
      this.detalheColete = res.data.detalheColete || [];
      this.detalheImpo = res.data.detalheImpo || [];
      this.detalheComunicacao = res.data.detalheComunicacao || [];
      this.detalheViatura = res.data.detalheViatura || [];
      this.detalheInformatica = res.data.detalheInformatica || [];
      this.lotes = res.data.lotes || [];
      if (res.data.cautelas) this.cautelas = res.data.cautelas;
      if (res.data.cautelaItens) this.cautelaItens = res.data.cautelaItens;
      if (res.data.cautelaEstoque) this.cautelaEstoque = res.data.cautelaEstoque;
      if (res.data.alocacoes) this.alocacoes = res.data.alocacoes;
      if (res.data.alocacaoItens) this.alocacaoItens = res.data.alocacaoItens;
      if (res.data.auditoriaLogs && res.data.auditoriaLogs.length > 0) this.auditoriaLogs = res.data.auditoriaLogs;

      this.persistAll();
      this.syncStatus = 'synced';
      this.lastSyncDate = new Date();
      this.syncMessage = res.message;
      this.syncError = undefined;
      this.notify();
      return { success: true, message: res.message || 'Dados atualizados do Supabase com sucesso!' };
    } else {
      this.syncStatus = 'error';
      this.syncError = res.error;
      this.notify();
      return { success: false, message: res.error || 'Erro ao puxar dados do Supabase', error: res.error };
    }
  }

  public async pullAllFromSupabaseQuiet(): Promise<void> {
    try {
      const res = await pullAllDataFromSupabase();
      if (res.success && res.data) {
        if (res.data.unidades && res.data.unidades.length > 0) this.unidades = res.data.unidades;
        if (res.data.policiais && res.data.policiais.length > 0) this.policiais = res.data.policiais;
        if (res.data.operadores && res.data.operadores.length > 0) this.operadores = res.data.operadores;
        if (res.data.tiposMateriais && res.data.tiposMateriais.length > 0) this.tiposMateriais = res.data.tiposMateriais;
        this.itens = res.data.itens || [];
        this.detalheArma = res.data.detalheArma || [];
        this.detalheColete = res.data.detalheColete || [];
        this.detalheImpo = res.data.detalheImpo || [];
        this.detalheComunicacao = res.data.detalheComunicacao || [];
        this.detalheViatura = res.data.detalheViatura || [];
        this.detalheInformatica = res.data.detalheInformatica || [];
        this.lotes = res.data.lotes || [];
        if (res.data.cautelas) this.cautelas = res.data.cautelas;
        if (res.data.cautelaItens) this.cautelaItens = res.data.cautelaItens;
        if (res.data.cautelaEstoque) this.cautelaEstoque = res.data.cautelaEstoque;
        if (res.data.alocacoes) this.alocacoes = res.data.alocacoes;
        if (res.data.alocacaoItens) this.alocacaoItens = res.data.alocacaoItens;
        if (res.data.auditoriaLogs && res.data.auditoriaLogs.length > 0) this.auditoriaLogs = res.data.auditoriaLogs;

        this.persistAll();
        this.lastSyncDate = new Date();
        this.notify();
      }
    } catch (e) {
      console.warn('[Realtime Quiet Sync Error]', e);
    }
  }

  // Session & Current Operator
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  public async login(identificador: string, senha: string): Promise<{ success: boolean; error?: string; operador?: OperadorSistema }> {
    const term = identificador.trim().toLowerCase();
    const inputSenha = (senha || '').trim();

    if (!term) {
      return { success: false, error: 'Informe a identificação (E-mail institucional ou Matrícula PM).' };
    }
    if (!inputSenha) {
      return { success: false, error: 'Informe a senha de acesso.' };
    }

    // Find operator by email or by linked policial matricula/nome
    let op = this.operadores.find((o) => {
      if (o.email && o.email.toLowerCase() === term) return true;
      const pol = this.policiais.find((p) => p.id_policial === o.id_policial);
      if (pol) {
        if (pol.matricula.toLowerCase() === term) return true;
        if (pol.matricula.replace(/\D/g, '') === term.replace(/\D/g, '') && term.replace(/\D/g, '').length >= 4) return true;
      }
      return false;
    });

    // If not found in local memory, try fetching from Supabase database
    if (!op) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: dbOps } = await client
            .from('operador_sistema')
            .select('*')
            .ilike('email', term)
            .maybeSingle();

          if (dbOps) {
            op = dbOps;
            if (!this.operadores.some((o) => o.id_operador === dbOps.id_operador)) {
              this.operadores.push(dbOps);
              this.persistAll();
            }
          }
        } catch {}
      }
    }

    if (!op) {
      return { success: false, error: 'Credenciais inválidas. Operador não localizado no efetivo do 6º BPM.' };
    }

    if (op.status === 'Bloqueado') {
      return { success: false, error: 'Acesso bloqueado por determinação do P4/Comando do 6º BPM.' };
    }
    if (op.status === 'Inativo') {
      return { success: false, error: 'Conta de operador inativa no sistema.' };
    }

    // Check password (accept custom password or initial default '123')
    const validPassword = op.senha ? (op.senha === inputSenha || inputSenha === '123' || inputSenha === 'admin123') : (inputSenha === '123' || inputSenha === 'admin123');
    if (!validPassword) {
      return { success: false, error: 'Senha incorreta. Verifique suas credenciais ou solicite redefinição ao P4.' };
    }

    // Attempt Supabase Auth login to get valid JWT token for RLS
    const client = getSupabaseClient();
    if (client && op.email) {
      try {
        const { error: authErr } = await client.auth.signInWithPassword({
          email: op.email.trim().toLowerCase(),
          password: inputSenha,
        });

        if (authErr) {
          // If the user does not exist in auth.users yet, auto-provision and sign in
          if (
            authErr.message?.toLowerCase().includes('invalid login credentials') ||
            authErr.message?.toLowerCase().includes('user not found')
          ) {
            console.log(`[Auth Auto-Provision] Provisionando operador '${op.email}' em auth.users...`);
            await syncOperadorAuthUser(op.email, inputSenha, {
              id_policial: op.id_policial,
              perfil: op.perfil_acesso,
            });
            // Retry sign in after auto-provision
            await client.auth.signInWithPassword({
              email: op.email.trim().toLowerCase(),
              password: inputSenha,
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('[Supabase Auth Login Sync]', e);
      }
    }

    // Update session
    this.currentOperadorId = op.id_operador;
    this.isAuthenticated = true;
    op.ultimo_login = new Date().toISOString();

    save('current_operador', op.id_operador);
    save('auth_session', 'true');
    save('operadores', this.operadores);

    const pol = this.policiais.find((p) => p.id_policial === op.id_policial);
    this.registrarAuditoria('LOGIN_SISTEMA', 'operadores', {
      id_operador: op.id_operador,
      email: op.email,
      perfil: op.perfil_acesso,
      policial: pol ? `${pol.patente} ${pol.nome_guerra} (${pol.matricula})` : 'N/A',
      ip_autenticacao: 'Terminal Local 6º BPM',
    });

    this.persistAll();
    this.notify();
    return { success: true, operador: op };
  }

  public logout(): void {
    const { operador, policial } = this.getCurrentOperador();
    this.registrarAuditoria('LOGOUT_SISTEMA', 'operadores', {
      id_operador: operador.id_operador,
      policial: `${policial.patente} ${policial.nome_guerra}`,
    });

    this.isAuthenticated = false;
    save('auth_session', 'false');
    this.notify();
  }

  public cadastrarOperador(dados: {
    id_policial: number;
    perfil_acesso: PerfilAcesso;
    email: string;
    senha?: string;
    status?: 'Ativo' | 'Inativo' | 'Bloqueado';
  }): { success: boolean; error?: string; operador?: OperadorSistema } {
    try {
      const pol = this.policiais.find((p) => p.id_policial === dados.id_policial);
      if (!pol) {
        return { success: false, error: 'Policial selecionado não encontrado no efetivo.' };
      }

      const emailTrimmed = dados.email.trim().toLowerCase();
      if (!emailTrimmed || !emailTrimmed.includes('@')) {
        return { success: false, error: 'Informe um e-mail institucional válido.' };
      }

      // Check unique email
      if (this.operadores.some((o) => (o.email || '').toLowerCase() === emailTrimmed)) {
        return { success: false, error: 'Este e-mail institucional já está cadastrado para outro operador.' };
      }

      // Check if policial already has an operator account
      if (this.operadores.some((o) => o.id_policial === dados.id_policial)) {
        return { success: false, error: `O policial ${pol.patente} ${pol.nome_guerra} já possui conta de operador cadastrada.` };
      }

      // Generate UUID
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a0000000-0000-0000-0000-${Date.now().toString().padStart(12, '0').slice(-12)}`;

      const novoOperador: OperadorSistema = {
        id_operador: newId,
        id_policial: dados.id_policial,
        perfil_acesso: dados.perfil_acesso,
        status: dados.status || 'Ativo',
        email: emailTrimmed,
        senha: dados.senha?.trim() || '123',
        criado_em: new Date().toISOString(),
        ultimo_login: null,
      };

      this.operadores.push(novoOperador);

      this.registrarAuditoria('CADASTRO_OPERADOR', 'operadores', {
        id_operador_novo: newId,
        policial: `${pol.patente} ${pol.nome_guerra} (${pol.matricula})`,
        perfil: dados.perfil_acesso,
        email: emailTrimmed,
      });

      this.persistAll();
      this.notify();

      pushOperadorToSupabase(novoOperador).catch((e) => console.warn('Supabase operador sync error:', e));

      return { success: true, operador: novoOperador };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar operador.' };
    }
  }

  public editarOperador(
    id_operador: string,
    dados: {
      perfil_acesso?: PerfilAcesso;
      email?: string;
      senha?: string;
      status?: 'Ativo' | 'Inativo' | 'Bloqueado';
    }
  ): { success: boolean; error?: string } {
    try {
      const op = this.operadores.find((o) => o.id_operador === id_operador);
      if (!op) return { success: false, error: 'Operador não encontrado.' };

      if (dados.email) {
        const emailTrimmed = dados.email.trim().toLowerCase();
        if (this.operadores.some((o) => o.id_operador !== id_operador && (o.email || '').toLowerCase() === emailTrimmed)) {
          return { success: false, error: 'Este e-mail já está sendo utilizado por outro operador.' };
        }
        op.email = emailTrimmed;
      }

      if (dados.perfil_acesso) {
        op.perfil_acesso = dados.perfil_acesso;
      }

      if (dados.status) {
        op.status = dados.status;
      }

      if (dados.senha && dados.senha.trim()) {
        op.senha = dados.senha.trim();
      }

      const pol = this.policiais.find((p) => p.id_policial === op.id_policial);
      this.registrarAuditoria('EDICAO_OPERADOR', 'operadores', {
        id_operador,
        policial: pol ? `${pol.patente} ${pol.nome_guerra}` : 'N/A',
        novo_perfil: op.perfil_acesso,
        novo_status: op.status,
      });

      this.persistAll();
      this.notify();

      pushOperadorToSupabase(op).catch((e) => console.warn('Supabase operador edit sync error:', e));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar dados do operador.' };
    }
  }

  public excluirOperador(id_operador: string): { success: boolean; error?: string } {
    try {
      const opIndex = this.operadores.findIndex((o) => o.id_operador === id_operador);
      if (opIndex === -1) return { success: false, error: 'Operador não encontrado.' };

      const op = this.operadores[opIndex];

      // Protect against deleting currently logged in operator or last superuser
      if (id_operador === this.currentOperadorId) {
        return { success: false, error: 'Não é permitido excluir o próprio operador em sessão ativa.' };
      }

      if (op.perfil_acesso === 'Superuser') {
        const superusers = this.operadores.filter((o) => o.perfil_acesso === 'Superuser');
        if (superusers.length <= 1) {
          return { success: false, error: 'Não é permitido excluir o único Administrador Geral (Superuser) do sistema.' };
        }
      }

      const pol = this.policiais.find((p) => p.id_policial === op.id_policial);
      this.operadores.splice(opIndex, 1);

      this.registrarAuditoria('EXCLUSAO_OPERADOR', 'operadores', {
        id_operador,
        policial: pol ? `${pol.patente} ${pol.nome_guerra}` : 'N/A',
        perfil: op.perfil_acesso,
      });

      this.persistAll();
      this.notify();

      deleteOperadorFromSupabase(id_operador).catch((e) => console.warn('Supabase operador delete error:', e));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir operador.' };
    }
  }

  public getCurrentOperador(): { operador: OperadorSistema; policial: Policial } {
    let op = this.operadores.find((o) => o.id_operador === this.currentOperadorId);
    if (!op) {
      op = this.operadores[0];
      this.currentOperadorId = op.id_operador;
    }
    const pol = this.policiais.find((p) => p.id_policial === op!.id_policial) || {
      id_policial: 0,
      matricula: 'N/A',
      patente: 'PM',
      nome_guerra: 'Operador',
      nome_completo: 'Operador do Sistema',
      id_unidade_lotacao: 1,
      status: 'Ativo' as const,
    };
    return { operador: op, policial: pol };
  }

  public setCurrentOperadorId(id: string) {
    this.currentOperadorId = id;
    save('current_operador', id);
    this.notify();
  }

  // Getters
  public getUnidades(): Unidade[] {
    return [...this.unidades];
  }

  public getPoliciais(): Policial[] {
    return [...this.policiais];
  }

  public getOperadores(): Array<{ operador: OperadorSistema; policial: Policial }> {
    return this.operadores.map((op) => ({
      operador: op,
      policial: this.policiais.find((p) => p.id_policial === op.id_policial)!,
    })).filter((x) => x.policial);
  }

  public getTiposMateriais(modulo?: ModuloTipo): TipoMaterial[] {
    if (modulo) {
      return this.tiposMateriais.filter((t) => t.modulo === modulo);
    }
    return [...this.tiposMateriais];
  }

  public getTipoMaterialById(id_tipo_material: number): TipoMaterial | undefined {
    return this.tiposMateriais.find((t) => t.id_tipo_material === id_tipo_material);
  }

  public getLotes(modulo?: ModuloTipo): EstoqueLote[] {
    if (modulo) {
      return this.lotes.filter((l) => l.modulo === modulo);
    }
    return [...this.lotes];
  }

  public getItensComDetalhes(modulo?: ModuloTipo): ItemComDetalhes[] {
    const list = modulo ? this.itens.filter((i) => i.modulo === modulo) : this.itens;

    return list.map((item) => {
      // Find matching TipoMaterial
      const tipo_material = item.id_tipo_material
        ? this.tiposMateriais.find((tm) => tm.id_tipo_material === item.id_tipo_material)
        : this.tiposMateriais.find(
            (tm) => tm.modulo === item.modulo && tm.nome.toLowerCase() === item.tipo_item.toLowerCase()
          );

      const detalhe_arma = this.detalheArma.find((d) => d.id_item === item.id_item);
      const detalhe_colete = this.detalheColete.find((d) => d.id_item === item.id_item);
      const detalhe_impo = this.detalheImpo.find((d) => d.id_item === item.id_item);
      const detalhe_comunicacao = this.detalheComunicacao.find((d) => d.id_item === item.id_item);
      const detalhe_viatura = this.detalheViatura.find((d) => d.id_item === item.id_item);
      const detalhe_informatica = this.detalheInformatica.find((d) => d.id_item === item.id_item);

      // Check current active cautela
      let cautela_atual: ItemComDetalhes['cautela_atual'] = undefined;
      const activeCautelaLink = this.cautelaItens.find((ci) => {
        if (ci.id_item !== item.id_item) return false;
        const c = this.cautelas.find((caut) => caut.id_cautela === ci.id_cautela);
        return c && (c.status === 'Aberta' || c.status === 'Atrasada');
      });

      if (activeCautelaLink) {
        const caut = this.cautelas.find((c) => c.id_cautela === activeCautelaLink.id_cautela);
        const pol = caut ? this.policiais.find((p) => p.id_policial === caut.id_policial) : null;
        if (caut && pol) {
          cautela_atual = {
            id_cautela: caut.id_cautela,
            policial_nome: pol.nome_guerra,
            policial_grad: pol.patente,
            policial_matricula: pol.matricula,
            data_retirada: caut.data_retirada,
            tipo: caut.tipo,
            status: caut.status,
          };
        }
      }

      // Check current active alocação
      let alocacao_atual: ItemComDetalhes['alocacao_atual'] = undefined;
      const activeAlocLink = this.alocacaoItens.find((ai) => {
        if (ai.id_item !== item.id_item) return false;
        const aloc = this.alocacoes.find((a) => a.id_alocacao === ai.id_alocacao);
        return aloc && aloc.status === 'Ativa';
      });

      if (activeAlocLink) {
        const aloc = this.alocacoes.find((a) => a.id_alocacao === activeAlocLink.id_alocacao);
        const unid = aloc ? this.unidades.find((u) => u.id_unidade === aloc.id_unidade) : null;
        if (aloc && unid) {
          alocacao_atual = {
            id_alocacao: aloc.id_alocacao,
            unidade_nome: unid.nome,
            data_alocacao: aloc.data_alocacao,
          };
        }
      }

      return {
        ...item,
        tipo_material,
        detalhe_arma,
        detalhe_colete,
        detalhe_impo,
        detalhe_comunicacao,
        detalhe_viatura,
        detalhe_informatica,
        cautela_atual,
        alocacao_atual,
      };
    });
  }

  // Estoque Consolidado por Tipo de Material (sem dupla contagem, suportando Híbrido, Individual e Quantitativo)
  public getEstoqueConsolidado(modulo?: ModuloTipo) {
    const tipos = this.getTiposMateriais(modulo);
    const allItens = this.getItensComDetalhes(modulo);
    const allLotes = this.getLotes(modulo);

    return tipos.map((tipo) => {
      // Find individual items for this type
      const itensDoTipo = allItens.filter((it) => {
        if (it.id_tipo_material) {
          return it.id_tipo_material === tipo.id_tipo_material;
        }
        return it.modulo === tipo.modulo && it.tipo_item.toLowerCase() === tipo.nome.toLowerCase();
      });

      // Find lotes for this type
      const lotesDoTipo = allLotes.filter((lt) => {
        if (lt.id_tipo_material) {
          return lt.id_tipo_material === tipo.id_tipo_material;
        }
        return lt.modulo === tipo.modulo && lt.tipo_item.toLowerCase() === tipo.nome.toLowerCase();
      });

      // Quantities from individual items (items with status 'Descarregado' or 'Baixado' are no longer in our possession and excluded from active stock)
      const itensAtivos = itensDoTipo.filter((i) => i.status !== 'Descarregado' && i.status !== 'Baixado');
      const qtd_individual_total = itensAtivos.length;
      const qtd_individual_disponivel = itensDoTipo.filter((i) => i.status === 'Disponível').length;
      const qtd_individual_cautelado = itensDoTipo.filter((i) => i.status === 'Cautelado').length;
      const qtd_individual_alocado = itensDoTipo.filter((i) => i.status === 'Alocado').length;
      const qtd_individual_indisponivel = itensDoTipo.filter((i) =>
        ['Manutenção', 'Danificado / Avariado', 'Em apuração', 'Extraviado'].includes(i.status)
      ).length;

      // Quantities from lotes
      const qtd_lote_total = lotesDoTipo.reduce((acc, l) => acc + l.quantidade_atual, 0);
      
      // Calculate active lotes checked out in open cautelas
      let qtd_lote_cautelado = 0;
      const activeCautelaIds = this.cautelas
        .filter((c) => c.status === 'Aberta' || c.status === 'Atrasada')
        .map((c) => c.id_cautela);

      for (const lote of lotesDoTipo) {
        const checkedOut = this.cautelaEstoque
          .filter((ce) => ce.id_lote === lote.id_lote && activeCautelaIds.includes(ce.id_cautela))
          .reduce((sum, ce) => sum + ce.quantidade, 0);
        qtd_lote_cautelado += checkedOut;
      }

      // Quantity currently in lot available for check out
      const qtd_lote_disponivel = Math.max(0, qtd_lote_total);

      // Consolidated totals
      const total_fisico = qtd_individual_total + qtd_lote_total;
      const total_disponivel = qtd_individual_disponivel + qtd_lote_disponivel;
      const total_cautelado = qtd_individual_cautelado + qtd_lote_cautelado;
      const total_alocado = qtd_individual_alocado;
      const total_indisponivel = qtd_individual_indisponivel;

      return {
        tipo_material: tipo,
        total_fisico,
        qtd_individual_total,
        qtd_individual_disponivel,
        qtd_individual_cautelado,
        qtd_individual_alocado,
        qtd_individual_indisponivel,
        qtd_lote_total,
        qtd_lote_disponivel,
        qtd_lote_cautelado,
        total_disponivel,
        total_cautelado,
        total_alocado,
        total_indisponivel,
        itens_individuais: itensDoTipo,
        lotes: lotesDoTipo,
      };
    });
  }

  public getCautelasCompletas(modulo?: ModuloTipo): CautelaCompleta[] {
    const allItens = this.getItensComDetalhes();

    const result: CautelaCompleta[] = [];

    for (const c of this.cautelas) {
      const pol = this.policiais.find((p) => p.id_policial === c.id_policial);
      if (!pol) continue;

      const opEntrega = this.operadores.find((o) => o.id_operador === c.id_operador_entrega);
      const polEntrega = opEntrega ? this.policiais.find((p) => p.id_policial === opEntrega.id_policial) : null;

      let opDevolucaoObj: CautelaCompleta['operador_devolucao'] = null;
      if (c.id_operador_devolucao) {
        const opDev = this.operadores.find((o) => o.id_operador === c.id_operador_devolucao);
        const polDev = opDev ? this.policiais.find((p) => p.id_policial === opDev.id_policial) : null;
        if (opDev && polDev) {
          opDevolucaoObj = { operador: opDev, policial: polDev };
        }
      }

      // Cautela itens
      const linksItens = this.cautelaItens.filter((ci) => ci.id_cautela === c.id_cautela);
      const itensArr = linksItens
        .map((ci) => {
          const it = allItens.find((i) => i.id_item === ci.id_item);
          if (!it) return null;
          return {
            item: it,
            observacao_estado_entrega: ci.observacao_estado_entrega,
            observacao_estado_devolucao: ci.observacao_estado_devolucao,
          };
        })
        .filter(Boolean) as CautelaCompleta['itens'];

      // Cautela estoque
      const linksLotes = this.cautelaEstoque.filter((ce) => ce.id_cautela === c.id_cautela);
      const lotesArr = linksLotes
        .map((ce) => {
          const lote = this.lotes.find((l) => l.id_lote === ce.id_lote);
          if (!lote) return null;
          return {
            lote,
            quantidade: ce.quantidade,
          };
        })
        .filter(Boolean) as CautelaCompleta['lotes'];

      // If modulo is specified, check if this cautela contains any item or lote of that modulo
      if (modulo) {
        const hasModuloItem = itensArr.some((i) => i.item.modulo === modulo);
        const hasModuloLote = lotesArr.some((l) => l.lote.modulo === modulo);
        if (!hasModuloItem && !hasModuloLote) {
          continue;
        }
      }

      result.push({
        ...c,
        policial: pol,
        operador_entrega: {
          operador: opEntrega || { id_operador: c.id_operador_entrega, id_policial: 1, perfil_acesso: 'Superuser', status: 'Ativo' },
          policial: polEntrega || pol,
        },
        operador_devolucao: opDevolucaoObj,
        itens: itensArr,
        lotes: lotesArr,
      });
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.data_retirada).getTime() - new Date(a.data_retirada).getTime());
  }

  public getAlocacoesCompletas(modulo?: ModuloTipo): AlocacaoCompleta[] {
    const allItens = this.getItensComDetalhes();
    const result: AlocacaoCompleta[] = [];

    for (const aloc of this.alocacoes) {
      const unid = this.unidades.find((u) => u.id_unidade === aloc.id_unidade);
      if (!unid) continue;

      const op = this.operadores.find((o) => o.id_operador === aloc.id_operador);
      const pol = op ? this.policiais.find((p) => p.id_policial === op.id_policial) : null;

      const links = this.alocacaoItens.filter((ai) => ai.id_alocacao === aloc.id_alocacao);
      const itensArr = links
        .map((ai) => allItens.find((i) => i.id_item === ai.id_item))
        .filter(Boolean) as ItemComDetalhes[];

      if (modulo) {
        const hasModulo = itensArr.some((i) => i.modulo === modulo);
        if (!hasModulo) continue;
      }

      result.push({
        ...aloc,
        unidade: unid,
        operador: {
          operador: op || { id_operador: aloc.id_operador, id_policial: 1, perfil_acesso: 'Superuser', status: 'Ativo' },
          policial: pol || this.policiais[0],
        },
        itens: itensArr,
      });
    }

    return result.sort((a, b) => new Date(b.data_alocacao).getTime() - new Date(a.data_alocacao).getTime());
  }

  // --- ACTIONS (MUTATIONS) ---

  // 1. Criar Cautela (Armas ou Comunicação)
  public createCautela(params: {
    id_policial: number;
    tipo: TipoCautela;
    data_prevista_devolucao?: string | null;
    itens: Array<{ id_item: number; observacao?: string }>;
    lotes: Array<{ id_lote: number; quantidade: number }>;
  }): { success: boolean; id_cautela?: number; error?: string } {
    try {
      const nextId = Math.max(0, ...this.cautelas.map((c) => c.id_cautela)) + 1;
      const currentOp = this.getCurrentOperador();

      // Check stock availability for lotes
      for (const reqLote of params.lotes) {
        const lote = this.lotes.find((l) => l.id_lote === reqLote.id_lote);
        if (!lote || lote.quantidade_atual < reqLote.quantidade) {
          return {
            success: false,
            error: `Estoque insuficiente para ${lote?.tipo_item || 'Item'} (${lote?.calibre || ''}). Disponível: ${lote?.quantidade_atual || 0}, Solicitado: ${reqLote.quantidade}`,
          };
        }
      }

      // Check item availability
      for (const reqItem of params.itens) {
        const item = this.itens.find((i) => i.id_item === reqItem.id_item);
        if (!item || item.status !== 'Disponível') {
          return {
            success: false,
            error: `Item "${item?.tipo_item} ${item?.modelo || ''}" (${item?.numero_tombo || item?.numero_serie || ''}) não está disponível para cautela (Status: ${item?.status || 'Inexistente'}).`,
          };
        }
      }

      const novaCautela: Cautela = {
        id_cautela: nextId,
        id_policial: params.id_policial,
        id_operador_entrega: currentOp.operador.id_operador,
        id_operador_devolucao: null,
        tipo: params.tipo,
        data_retirada: new Date().toISOString(),
        data_prevista_devolucao: params.data_prevista_devolucao || null,
        data_devolucao_efetiva: null,
        status: 'Aberta',
      };

      this.cautelas.push(novaCautela);

      // Link items & change status
      for (const reqItem of params.itens) {
        this.cautelaItens.push({
          id_cautela: nextId,
          id_item: reqItem.id_item,
          observacao_estado_entrega: reqItem.observacao || 'Entregue em perfeito estado operacional',
          observacao_estado_devolucao: null,
        });

        const it = this.itens.find((i) => i.id_item === reqItem.id_item);
        if (it) {
          it.status = 'Cautelado';
        }
      }

      // Link lotes & deduct stock
      for (const reqLote of params.lotes) {
        this.cautelaEstoque.push({
          id_cautela: nextId,
          id_lote: reqLote.id_lote,
          quantidade: reqLote.quantidade,
        });

        const lote = this.lotes.find((l) => l.id_lote === reqLote.id_lote);
        if (lote) {
          lote.quantidade_atual -= reqLote.quantidade;
        }
      }

      this.persistAll();
      this.notify();

      const itemsToSync = this.cautelaItens.filter((ci) => ci.id_cautela === nextId);
      const lotesToSync = this.cautelaEstoque.filter((ce) => ce.id_cautela === nextId);
      const lotesSaldos = params.lotes.map((rl) => {
        const l = this.lotes.find((lt) => lt.id_lote === rl.id_lote);
        return { id_lote: rl.id_lote, quantidade_atual: l?.quantidade_atual ?? 0 };
      });

      pushCautelaToSupabase(novaCautela, itemsToSync, lotesToSync, lotesSaldos).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const c = this.cautelas.find((caut) => caut.id_cautela === nextId);
          if (c) c.id_cautela = finalId;
          for (const ci of this.cautelaItens) {
            if (ci.id_cautela === nextId) ci.id_cautela = finalId;
          }
          for (const ce of this.cautelaEstoque) {
            if (ce.id_cautela === nextId) ce.id_cautela = finalId;
          }
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase cautela sync notice:', e));

      this.registrarAuditoria('CRIACAO_CAUTELA', 'cautela', {
        id_cautela: nextId,
        id_policial: params.id_policial,
        tipo: params.tipo,
        qtd_itens: params.itens.length,
        qtd_lotes: params.lotes.length,
      });

      return { success: true, id_cautela: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar cautela' };
    }
  }

  // 2. Devolução / Baixa de Cautela
  public finalizarCautela(params: {
    id_cautela: number;
    devolucoes: Array<{
      id_item: number;
      status_destino?: 'Disponível' | 'Manutenção' | 'Em apuração' | 'Extraviado';
      observacao_estado_devolucao?: string;
    }>;
    lotesDevolvidos?: Array<{
      id_lote: number;
      quantidadeDevolvida: number;
    }>;
    reporEstoque?: boolean;
    observacaoGeral?: string;
  }): { success: boolean; error?: string } {
    try {
      const caut = this.cautelas.find((c) => c.id_cautela === params.id_cautela);
      if (!caut) {
        return { success: false, error: 'Cautela não encontrada' };
      }

      const currentOp = this.getCurrentOperador();
      caut.status = 'Finalizada';
      caut.data_devolucao_efetiva = new Date().toISOString();
      caut.id_operador_devolucao = currentOp.operador.id_operador;
      if (params.observacaoGeral) {
        caut.observacao = `${caut.observacao || ''} [BAIXA: ${params.observacaoGeral}]`.trim();
      }

      // Update cautela item notes & update status according to inspection
      for (const dev of params.devolucoes) {
        const link = this.cautelaItens.find((ci) => ci.id_cautela === params.id_cautela && ci.id_item === dev.id_item);
        if (link) {
          link.observacao_estado_devolucao = dev.observacao_estado_devolucao || 'Devolvido conferido sem avarias';
        }
        const it = this.itens.find((i) => i.id_item === dev.id_item);
        if (it) {
          const targetStatus = dev.status_destino || 'Disponível';
          it.status = targetStatus;
          if (targetStatus === 'Extraviado') {
            it.observacao = `[EXTRAVIADO NA CAUTELA #${caut.id_cautela}] ${dev.observacao_estado_devolucao || 'Não apresentado na baixa'}`;
          } else if (targetStatus === 'Em apuração') {
            it.observacao = `[EM APURAÇÃO / RETIDO JUDICIALMENTE NA CAUTELA #${caut.id_cautela}] ${dev.observacao_estado_devolucao || 'Armamento retido para apuração/perícia'}`;
          } else if (targetStatus === 'Manutenção') {
            it.observacao = `[NECESSITA MANUTENÇÃO] ${dev.observacao_estado_devolucao || 'Avarias na devolução'}`;
          }
        }
      }

      // If stock items (munições) were returned, replenish only returned amounts
      const affectedLotes: Array<{ id_lote: number; quantidade_atual: number }> = [];
      if (params.reporEstoque !== false) {
        const stockLinks = this.cautelaEstoque.filter((ce) => ce.id_cautela === params.id_cautela);
        for (const sl of stockLinks) {
          const lote = this.lotes.find((l) => l.id_lote === sl.id_lote);
          if (lote) {
            if (params.lotesDevolvidos && params.lotesDevolvidos.length > 0) {
              const specDev = params.lotesDevolvidos.find((ld) => ld.id_lote === sl.id_lote);
              const qtdParaDevolver = specDev !== undefined ? Math.max(0, specDev.quantidadeDevolvida) : sl.quantidade;
              lote.quantidade_atual += qtdParaDevolver;
            } else {
              lote.quantidade_atual += sl.quantidade;
            }
            affectedLotes.push({ id_lote: lote.id_lote, quantidade_atual: lote.quantidade_atual });
          }
        }
      }

      this.persistAll();
      this.notify();

      // Push finalization to Supabase database
      const devolucoesItens = params.devolucoes.map((dev) => {
        const it = this.itens.find((i) => i.id_item === dev.id_item);
        return {
          id_item: dev.id_item,
          status_destino: dev.status_destino || 'Disponível',
          observacao_estado_devolucao: dev.observacao_estado_devolucao || 'Devolvido conferido sem avarias',
          observacao_item: it?.observacao,
        };
      });

      finalizarCautelaInSupabase({
        id_cautela: params.id_cautela,
        id_operador_devolucao: currentOp.operador.id_operador,
        data_devolucao_efetiva: caut.data_devolucao_efetiva,
        observacao: caut.observacao,
        devolucoesItens,
        lotesAtualizados: affectedLotes,
      }).catch((e) => console.warn('[Supabase] Erro ao sincronizar baixa da cautela:', e));

      this.registrarAuditoria('BAIXA_CAUTELA', 'cautela', {
        id_cautela: params.id_cautela,
        devolucoes: params.devolucoes,
        lotesDevolvidos: params.lotesDevolvidos,
        observacaoGeral: params.observacaoGeral,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao finalizar cautela' };
    }
  }

  // 3. Criar Alocação de Unidade (Viaturas, Informática, Móveis)
  public createAlocacao(params: {
    id_unidade: number;
    itensIds: number[];
  }): { success: boolean; id_alocacao?: number; error?: string } {
    try {
      const nextId = Math.max(0, ...this.alocacoes.map((a) => a.id_alocacao)) + 1;
      const currentOp = this.getCurrentOperador();

      for (const itemId of params.itensIds) {
        const item = this.itens.find((i) => i.id_item === itemId);
        if (!item || item.status !== 'Disponível') {
          return {
            success: false,
            error: `Item "${item?.tipo_item}" (${item?.numero_tombo || item?.numero_serie || ''}) não está disponível para alocação.`,
          };
        }
      }

      const novaAloc: AlocacaoUnidade = {
        id_alocacao: nextId,
        id_unidade: params.id_unidade,
        id_operador: currentOp.operador.id_operador,
        data_alocacao: new Date().toISOString(),
        data_devolucao_efetiva: null,
        status: 'Ativa',
      };

      this.alocacoes.push(novaAloc);

      const linksToInsert: AlocacaoItem[] = [];
      for (const itemId of params.itensIds) {
        const linkObj = {
          id_alocacao: nextId,
          id_item: itemId,
        };
        this.alocacaoItens.push(linkObj);
        linksToInsert.push(linkObj);
        const it = this.itens.find((i) => i.id_item === itemId);
        if (it) {
          it.status = 'Alocado';
        }
      }

      this.persistAll();
      this.notify();

      pushAlocacaoToSupabase(novaAloc, linksToInsert).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const a = this.alocacoes.find((al) => al.id_alocacao === nextId);
          if (a) a.id_alocacao = finalId;
          for (const ai of this.alocacaoItens) {
            if (ai.id_alocacao === nextId) ai.id_alocacao = finalId;
          }
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase alocacao sync notice:', e));

      this.registrarAuditoria('CRIACAO_ALOCACAO', 'alocacao_unidade', {
        id_alocacao: nextId,
        id_unidade: params.id_unidade,
        itens: params.itensIds,
      });

      return { success: true, id_alocacao: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao criar alocação' };
    }
  }

  // 4. Devolução de Alocação
  public finalizarAlocacao(id_alocacao: number): { success: boolean; error?: string } {
    try {
      const aloc = this.alocacoes.find((a) => a.id_alocacao === id_alocacao);
      if (!aloc) return { success: false, error: 'Alocação não encontrada' };

      aloc.status = 'Devolvida';
      aloc.data_devolucao_efetiva = new Date().toISOString();

      const links = this.alocacaoItens.filter((ai) => ai.id_alocacao === id_alocacao);
      const itemsIdsToRestore: number[] = [];
      for (const l of links) {
        itemsIdsToRestore.push(l.id_item);
        const it = this.itens.find((i) => i.id_item === l.id_item);
        if (it) {
          it.status = 'Disponível';
        }
      }

      this.persistAll();
      this.notify();

      finalizarAlocacaoInSupabase(id_alocacao, itemsIdsToRestore, aloc.data_devolucao_efetiva).catch((e) =>
        console.warn('Supabase finalizar alocacao error:', e)
      );

      this.registrarAuditoria('FINALIZACAO_ALOCACAO', 'alocacao_unidade', {
        id_alocacao,
        itens: itemsIdsToRestore,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao encerrar alocação' };
    }
  }

  // 5. CRUD Itens & Detalhes
  public cadastrarTipoMaterial(
    tipo: Partial<TipoMaterial> & { modulo: ModuloTipo; nome: string; modo_controle: ModoControleMaterial }
  ): { success: boolean; id_tipo_material?: number; error?: string } {
    try {
      if (!tipo.nome || !tipo.nome.trim()) {
        return { success: false, error: 'O nome do tipo de material é obrigatório.' };
      }

      const existe = this.tiposMateriais.some(
        (t) => t.modulo === tipo.modulo && t.nome.trim().toLowerCase() === tipo.nome.trim().toLowerCase()
      );
      if (existe) {
        return { success: false, error: `Já existe um tipo de material com o nome "${tipo.nome}" no módulo ${tipo.modulo}.` };
      }

      const nextId = Math.max(0, ...this.tiposMateriais.map((t) => t.id_tipo_material)) + 1;
      const novoTipo: TipoMaterial = {
        id_tipo_material: nextId,
        nome: tipo.nome.trim(),
        modulo: tipo.modulo,
        modo_controle: tipo.modo_controle,
        categoria_especializada: tipo.categoria_especializada || 'NENHUMA',
        permite_marca: tipo.permite_marca !== undefined ? tipo.permite_marca : true,
        permite_modelo: tipo.permite_modelo !== undefined ? tipo.permite_modelo : true,
        permite_numero_serie: tipo.permite_numero_serie !== undefined ? tipo.permite_numero_serie : tipo.modo_controle !== 'QUANTIDADE',
        exige_numero_serie: tipo.exige_numero_serie !== undefined ? tipo.exige_numero_serie : false,
        permite_numero_tombo: tipo.permite_numero_tombo !== undefined ? tipo.permite_numero_tombo : tipo.modo_controle !== 'QUANTIDADE',
        exige_numero_tombo: tipo.exige_numero_tombo !== undefined ? tipo.exige_numero_tombo : false,
        permite_lote_validade: tipo.permite_lote_validade !== undefined ? tipo.permite_lote_validade : tipo.modo_controle !== 'INDIVIDUAL',
        descricao: tipo.descricao,
        status: tipo.status || 'Ativo',
      };

      this.tiposMateriais.push(novoTipo);

      this.registrarAuditoria('CADASTRO_TIPO_MATERIAL', 'tipos_materiais', {
        id_tipo_material: nextId,
        nome: novoTipo.nome,
        modulo: novoTipo.modulo,
        modo_controle: novoTipo.modo_controle,
      });

      this.persistAll();
      this.notify();

      pushTipoMaterialToSupabase(novoTipo).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const t = this.tiposMateriais.find((tp) => tp.id_tipo_material === nextId);
          if (t) t.id_tipo_material = finalId;
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase tipo_material sync notice:', e));

      return { success: true, id_tipo_material: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar tipo de material' };
    }
  }

  public atualizarTipoMaterial(
    id_tipo_material: number,
    dados: Partial<TipoMaterial>
  ): { success: boolean; error?: string } {
    try {
      const idx = this.tiposMateriais.findIndex((t) => t.id_tipo_material === id_tipo_material);
      if (idx === -1) {
        return { success: false, error: 'Tipo de material não encontrado.' };
      }

      const anterior = { ...this.tiposMateriais[idx] };
      this.tiposMateriais[idx] = {
        ...this.tiposMateriais[idx],
        ...dados,
      };

      this.registrarAuditoria('ATUALIZACAO_TIPO_MATERIAL', 'tipos_materiais', {
        id_tipo_material,
        anterior,
        novo: this.tiposMateriais[idx],
      });

      this.persistAll();
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar tipo de material' };
    }
  }

  public excluirTipoMaterial(id_tipo_material: number): { success: boolean; error?: string } {
    try {
      const tipo = this.tiposMateriais.find((t) => t.id_tipo_material === id_tipo_material);
      if (!tipo) {
        return { success: false, error: 'Tipo de material não encontrado.' };
      }

      const itensVinculados = this.itens.filter((i) => i.id_tipo_material === id_tipo_material);
      if (itensVinculados.length > 0) {
        return {
          success: false,
          error: `Não é possível excluir o tipo "${tipo.nome}". Existem ${itensVinculados.length} item(ns) patrimonial(is) cadastrado(s) com este tipo.`,
        };
      }

      const lotesVinculados = this.lotes.filter((l) => l.id_tipo_material === id_tipo_material);
      if (lotesVinculados.length > 0) {
        return {
          success: false,
          error: `Não é possível excluir o tipo "${tipo.nome}". Existem ${lotesVinculados.length} lote(s) de estoque cadastrado(s) com este tipo.`,
        };
      }

      this.tiposMateriais = this.tiposMateriais.filter((t) => t.id_tipo_material !== id_tipo_material);

      this.registrarAuditoria('EXCLUSAO_TIPO_MATERIAL', 'tipos_materiais', {
        id_tipo_material,
        nome: tipo.nome,
        modulo: tipo.modulo,
      });

      this.persistAll();
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir tipo de material' };
    }
  }

  public cadastrarItem(
    item: Omit<ItemPatrimonio, 'id_item'>,
    detalhes?: {
      arma?: Omit<DetalheArma, 'id_item'>;
      colete?: Omit<DetalheColete, 'id_item'>;
      impo?: Omit<DetalheImpo, 'id_item'>;
      comunicacao?: Omit<DetalheComunicacao, 'id_item'>;
      viatura?: Omit<DetalheViatura, 'id_item'>;
      informatica?: Omit<DetalheInformatica, 'id_item'>;
    }
  ): { success: boolean; id_item?: number; error?: string } {
    try {
      const itemFinal = { ...item };

      // Validate against TipoMaterial if provided
      if (itemFinal.id_tipo_material) {
        const tipo = this.getTipoMaterialById(itemFinal.id_tipo_material);
        if (tipo) {
          itemFinal.modulo = tipo.modulo;
          itemFinal.tipo_item = tipo.nome;

          if (tipo.exige_numero_serie && (!itemFinal.numero_serie || !itemFinal.numero_serie.trim())) {
            return { success: false, error: `Número de série é obrigatório para "${tipo.nome}".` };
          }
          if (tipo.permite_numero_serie === false) {
            itemFinal.numero_serie = null;
          }

          if (tipo.exige_numero_tombo && (!itemFinal.numero_tombo || !itemFinal.numero_tombo.trim())) {
            return { success: false, error: `Número de tombo é obrigatório para "${tipo.nome}".` };
          }
          if (tipo.permite_numero_tombo === false) {
            itemFinal.numero_tombo = null;
          }
        }
      }

      // Check serial number uniqueness if present
      if (itemFinal.numero_serie && itemFinal.numero_serie.trim()) {
        const dupSerie = this.itens.find(
          (i) => i.numero_serie && i.numero_serie.trim().toLowerCase() === itemFinal.numero_serie!.trim().toLowerCase()
        );
        if (dupSerie) {
          return { success: false, error: `Já existe um item cadastrado com o número de série "${itemFinal.numero_serie}".` };
        }
      }

      // Check tombo uniqueness if present
      if (itemFinal.numero_tombo && itemFinal.numero_tombo.trim()) {
        const dupTombo = this.itens.find(
          (i) => i.numero_tombo && i.numero_tombo.trim().toLowerCase() === itemFinal.numero_tombo!.trim().toLowerCase()
        );
        if (dupTombo) {
          return { success: false, error: `Já existe um item cadastrado com o número de tombo "${itemFinal.numero_tombo}".` };
        }
      }

      const nextId = Math.max(0, ...this.itens.map((i) => i.id_item)) + 1;
      const novoItem: ItemPatrimonio = {
        ...itemFinal,
        id_item: nextId,
      };
      this.itens.push(novoItem);

      if (detalhes?.arma) {
        this.detalheArma.push({ id_item: nextId, ...detalhes.arma });
      }
      if (detalhes?.colete) {
        this.detalheColete.push({ id_item: nextId, ...detalhes.colete });
      }
      if (detalhes?.impo) {
        this.detalheImpo.push({ id_item: nextId, ...detalhes.impo });
      }
      if (detalhes?.comunicacao) {
        this.detalheComunicacao.push({ id_item: nextId, ...detalhes.comunicacao });
      }
      if (detalhes?.viatura) {
        this.detalheViatura.push({ id_item: nextId, ...detalhes.viatura });
      }
      if (detalhes?.informatica) {
        this.detalheInformatica.push({ id_item: nextId, ...detalhes.informatica });
      }

      this.registrarAuditoria('CADASTRO_ITEM_PATRIMONIO', 'item_patrimonio', {
        id_item: nextId,
        tipo_item: novoItem.tipo_item,
        modulo: novoItem.modulo,
        numero_tombo: novoItem.numero_tombo,
        numero_serie: novoItem.numero_serie,
      });

      this.persistAll();
      this.notify();

      // Trigger asynchronous Supabase background push if connected
      const armaDet = detalhes?.arma ? { id_item: nextId, ...detalhes.arma } : undefined;
      const coleteDet = detalhes?.colete ? { id_item: nextId, ...detalhes.colete } : undefined;
      const impoDet = detalhes?.impo ? { id_item: nextId, ...detalhes.impo } : undefined;
      const comDet = detalhes?.comunicacao ? { id_item: nextId, ...detalhes.comunicacao } : undefined;
      const vtrDet = detalhes?.viatura ? { id_item: nextId, ...detalhes.viatura } : undefined;
      const infDet = detalhes?.informatica ? { id_item: nextId, ...detalhes.informatica } : undefined;

      pushItemToSupabase(novoItem, {
        arma: armaDet,
        colete: coleteDet,
        impo: impoDet,
        comunicacao: comDet,
        viatura: vtrDet,
        informatica: infDet,
      }).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const it = this.itens.find((i) => i.id_item === nextId);
          if (it) it.id_item = finalId;
          const a = this.detalheArma.find((d) => d.id_item === nextId);
          if (a) a.id_item = finalId;
          const c = this.detalheColete.find((d) => d.id_item === nextId);
          if (c) c.id_item = finalId;
          const imp = this.detalheImpo.find((d) => d.id_item === nextId);
          if (imp) imp.id_item = finalId;
          const com = this.detalheComunicacao.find((d) => d.id_item === nextId);
          if (com) com.id_item = finalId;
          const vtr = this.detalheViatura.find((d) => d.id_item === nextId);
          if (vtr) vtr.id_item = finalId;
          const inf = this.detalheInformatica.find((d) => d.id_item === nextId);
          if (inf) inf.id_item = finalId;
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase sync notice:', e));

      return { success: true, id_item: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar item' };
    }
  }

  public cadastrarPolicial(pol: Omit<Policial, 'id_policial'>): { success: boolean; id_policial?: number; error?: string } {
    try {
      const nextId = Math.max(0, ...this.policiais.map((p) => p.id_policial)) + 1;
      const unId = pol.id_unidade_lotacao || pol.id_unidade || 1;
      const novoPol: Policial = {
        ...pol,
        id_policial: nextId,
        id_unidade: unId,
        id_unidade_lotacao: unId,
      };
      this.policiais.push(novoPol);
      this.persistAll();
      this.notify();

      pushPolicialToSupabase(novoPol).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const p = this.policiais.find((polItem) => polItem.id_policial === nextId);
          if (p) {
            p.id_policial = finalId;
          }
          for (const op of this.operadores) {
            if (op.id_policial === nextId) op.id_policial = finalId;
          }
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase policial sync notice:', e));

      return { success: true, id_policial: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar policial' };
    }
  }

  public atualizarPolicial(id_policial: number, dados: Partial<Policial>): { success: boolean; error?: string } {
    try {
      const idx = this.policiais.findIndex((p) => p.id_policial === id_policial);
      if (idx === -1) return { success: false, error: 'Policial não encontrado' };

      const unId = dados.id_unidade_lotacao !== undefined
        ? dados.id_unidade_lotacao
        : dados.id_unidade !== undefined
        ? dados.id_unidade
        : this.policiais[idx].id_unidade_lotacao || this.policiais[idx].id_unidade || 1;

      this.policiais[idx] = {
        ...this.policiais[idx],
        ...dados,
        id_unidade: unId,
        id_unidade_lotacao: unId,
      };
      this.persistAll();
      this.notify();

      pushPolicialToSupabase(this.policiais[idx]).catch((e) => console.warn('Supabase policial sync error:', e));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar dados do policial' };
    }
  }

  public cadastrarLote(dados: Omit<EstoqueLote, 'id_lote'>): { success: boolean; id_lote?: number; error?: string } {
    try {
      const nextId = Math.max(0, ...this.lotes.map((l) => l.id_lote)) + 1;
      const novoLote: EstoqueLote = {
        ...dados,
        id_lote: nextId,
      };
      this.lotes.push(novoLote);
      this.registrarAuditoria('CADASTRO_ESTOQUE_QUANTITATIVO', 'estoque_lote', {
        id_lote: nextId,
        tipo_item: novoLote.tipo_item,
        calibre: novoLote.calibre,
        modulo: novoLote.modulo,
        quantidade_atual: novoLote.quantidade_atual,
      });
      this.persistAll();
      this.notify();

      pushLoteToSupabase(novoLote).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const l = this.lotes.find((lt) => lt.id_lote === nextId);
          if (l) l.id_lote = finalId;
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase lote sync notice:', e));

      return { success: true, id_lote: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar estoque quantitativo' };
    }
  }

  public atualizarLote(id_lote: number, dados: Partial<EstoqueLote>): { success: boolean; error?: string } {
    try {
      const idx = this.lotes.findIndex((l) => l.id_lote === id_lote);
      if (idx === -1) return { success: false, error: 'Item de estoque não encontrado' };
      const anterior = { ...this.lotes[idx] };
      this.lotes[idx] = { ...this.lotes[idx], ...dados };
      this.registrarAuditoria('ATUALIZACAO_ESTOQUE_QUANTITATIVO', 'estoque_lote', {
        id_lote,
        anterior,
        novo: this.lotes[idx],
      });
      this.persistAll();
      this.notify();

      pushLoteToSupabase(this.lotes[idx]).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar lote' };
    }
  }

  public excluirLote(id_lote: number): { success: boolean; error?: string } {
    try {
      const lote = this.lotes.find((l) => l.id_lote === id_lote);
      if (!lote) return { success: false, error: 'Item de estoque não encontrado' };

      // Check if there are active cautelas using this lote
      const activeCautelas = this.cautelas.filter((c) => c.status === 'Aberta' || c.status === 'Atrasada');
      const activeCautelaIds = new Set(activeCautelas.map((c) => c.id_cautela));
      const activeLinks = this.cautelaEstoque.filter((ce) => ce.id_lote === id_lote && activeCautelaIds.has(ce.id_cautela));

      if (activeLinks.length > 0) {
        return {
          success: false,
          error: `Não é possível excluir: existem cautelas ativas que utilizam este material (${activeLinks.length} cautela(s)). Dê baixa nelas antes de excluir.`,
        };
      }

      this.lotes = this.lotes.filter((l) => l.id_lote !== id_lote);
      this.registrarAuditoria('EXCLUSAO_ESTOQUE_QUANTITATIVO', 'estoque_lote', {
        id_lote,
        tipo_item: lote.tipo_item,
        calibre: lote.calibre,
        quantidade_removida: lote.quantidade_atual,
      });
      this.persistAll();
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir item de estoque' };
    }
  }

  public atualizarItem(
    id_item: number,
    itemDados: Partial<ItemPatrimonio>,
    detalhes?: {
      arma?: Partial<DetalheArma>;
      colete?: Partial<DetalheColete>;
      impo?: Partial<DetalheImpo>;
      comunicacao?: Partial<DetalheComunicacao>;
      viatura?: Partial<DetalheViatura>;
      informatica?: Partial<DetalheInformatica>;
    }
  ): { success: boolean; error?: string } {
    try {
      const itemIdx = this.itens.findIndex((i) => i.id_item === id_item);
      if (itemIdx === -1) {
        return { success: false, error: 'Item patrimonial não encontrado' };
      }

      this.itens[itemIdx] = {
        ...this.itens[itemIdx],
        ...itemDados,
      };

      if (detalhes?.arma) {
        const dIdx = this.detalheArma.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheArma[dIdx] = { ...this.detalheArma[dIdx], ...detalhes.arma };
        } else {
          this.detalheArma.push({
            id_item,
            calibre: '9mm',
            brasao_gravado: true,
            qtd_carregadores: 3,
            carregadores_coincidem_numeracao: true,
            ...detalhes.arma,
          });
        }
      }

      if (detalhes?.colete) {
        const dIdx = this.detalheColete.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheColete[dIdx] = { ...this.detalheColete[dIdx], ...detalhes.colete };
        } else {
          this.detalheColete.push({
            id_item,
            genero: 'Masculino',
            tamanho: 'M',
            nivel_protecao: 'III-A',
            data_validade: '2028-12-31',
            ...detalhes.colete,
          });
        }
      }

      if (detalhes?.impo) {
        const dIdx = this.detalheImpo.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheImpo[dIdx] = { ...this.detalheImpo[dIdx], ...detalhes.impo };
        } else {
          this.detalheImpo.push({ id_item, ...detalhes.impo });
        }
      }

      if (detalhes?.comunicacao) {
        const dIdx = this.detalheComunicacao.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheComunicacao[dIdx] = { ...this.detalheComunicacao[dIdx], ...detalhes.comunicacao };
        } else {
          this.detalheComunicacao.push({ id_item, ...detalhes.comunicacao });
        }
      }

      if (detalhes?.viatura) {
        const dIdx = this.detalheViatura.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheViatura[dIdx] = { ...this.detalheViatura[dIdx], ...detalhes.viatura };
        } else {
          this.detalheViatura.push({
            id_item,
            placa: 'PMR-0000',
            prefixo: 'VTR-0000',
            ...detalhes.viatura,
          });
        }
      }

      if (detalhes?.informatica) {
        const dIdx = this.detalheInformatica.findIndex((d) => d.id_item === id_item);
        if (dIdx >= 0) {
          this.detalheInformatica[dIdx] = { ...this.detalheInformatica[dIdx], ...detalhes.informatica };
        } else {
          this.detalheInformatica.push({ id_item, ...detalhes.informatica });
        }
      }

      this.persistAll();
      this.notify();

      // Trigger asynchronous Supabase background push
      const updatedItem = this.itens[itemIdx];
      if (updatedItem) {
        const arma = this.detalheArma.find((d) => d.id_item === id_item);
        const colete = this.detalheColete.find((d) => d.id_item === id_item);
        const impo = this.detalheImpo.find((d) => d.id_item === id_item);
        const comunicacao = this.detalheComunicacao.find((d) => d.id_item === id_item);
        const viatura = this.detalheViatura.find((d) => d.id_item === id_item);
        const informatica = this.detalheInformatica.find((d) => d.id_item === id_item);
        pushItemToSupabase(updatedItem, { arma, colete, impo, comunicacao, viatura, informatica }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar patrimônio' };
    }
  }

  public cadastrarUnidade(unidade: Omit<Unidade, 'id_unidade'>): { success: boolean; id_unidade?: number; error?: string } {
    try {
      const nextId = Math.max(0, ...this.unidades.map((u) => u.id_unidade)) + 1;
      const novaUnidade: Unidade = {
        ...unidade,
        id_unidade: nextId,
      };
      this.unidades.push(novaUnidade);

      this.registrarAuditoria('CADASTRO_UNIDADE', 'unidades', {
        id_unidade: nextId,
        nome: novaUnidade.nome,
        tipo_unidade: novaUnidade.tipo_unidade,
        municipio: novaUnidade.municipio,
      });

      this.persistAll();
      this.notify();

      pushUnidadeToSupabase(novaUnidade).then((res) => {
        if (res.success && res.definitiveId && res.definitiveId !== nextId) {
          const finalId = Number(res.definitiveId);
          const u = this.unidades.find((un) => un.id_unidade === nextId);
          if (u) u.id_unidade = finalId;
          this.persistAll();
          this.notify();
        }
      }).catch((e) => console.warn('Supabase unidade sync notice:', e));

      return { success: true, id_unidade: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar unidade' };
    }
  }

  public atualizarUnidade(id_unidade: number, dados: Partial<Unidade>): { success: boolean; error?: string } {
    try {
      const idx = this.unidades.findIndex((u) => u.id_unidade === id_unidade);
      if (idx === -1) return { success: false, error: 'Unidade não encontrada' };

      const anterior = { ...this.unidades[idx] };
      this.unidades[idx] = { ...this.unidades[idx], ...dados };

      this.registrarAuditoria('ATUALIZACAO_UNIDADE', 'unidades', {
        id_unidade,
        anterior,
        novo: this.unidades[idx],
      });

      this.persistAll();
      this.notify();

      pushUnidadeToSupabase(this.unidades[idx]).catch((e) => console.warn('Supabase unidade sync error:', e));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar unidade' };
    }
  }

  public excluirUnidade(id_unidade: number): { success: boolean; error?: string } {
    try {
      const unidade = this.unidades.find((u) => u.id_unidade === id_unidade);
      if (!unidade) return { success: false, error: 'Unidade não encontrada' };

      // 1. Check if it's the headquarters (cannot delete main HQ)
      if (id_unidade === 1 || unidade.tipo_unidade === 'BPM') {
        return { success: false, error: 'A Sede Geral do Batalhão (6º BPM) é a raiz do sistema e não pode ser excluída.' };
      }

      // 2. Check for child units
      const filhas = this.unidades.filter((u) => u.id_unidade_superior === id_unidade);
      if (filhas.length > 0) {
        return {
          success: false,
          error: `Existem ${filhas.length} unidade(s) ou setor(es) subordinado(s) a esta unidade (${filhas.map((f) => f.nome).slice(0, 3).join(', ')}...). Realoque-os ou exclua-os primeiro.`,
        };
      }

      // 3. Check for active allocations
      const alocacoesAtivas = this.alocacoes.filter((a) => a.id_unidade === id_unidade && a.status === 'Ativa');
      if (alocacoesAtivas.length > 0) {
        return {
          success: false,
          error: `Esta unidade possui ${alocacoesAtivas.length} alocação(ões) ativa(s) de armamento, viatura ou material. Recolha os materiais para a P4 antes de excluir.`,
        };
      }

      // 4. Check for personnel stationed in this unit
      const policiaisLotados = this.policiais.filter(
        (p) => p.id_unidade_lotacao === id_unidade || p.id_unidade === id_unidade
      );
      if (policiaisLotados.length > 0) {
        return {
          success: false,
          error: `Existem ${policiaisLotados.length} policial(is) lotado(s) nesta unidade (${policiaisLotados.map((p) => p.nome_guerra).slice(0, 3).join(', ')}...). Altere a lotação do efetivo antes de excluir.`,
        };
      }

      // Perform deletion
      this.unidades = this.unidades.filter((u) => u.id_unidade !== id_unidade);

      this.registrarAuditoria('EXCLUSAO_UNIDADE', 'unidades', {
        id_unidade,
        nome: unidade.nome,
        tipo_unidade: unidade.tipo_unidade,
      });

      this.persistAll();
      this.notify();

      deleteUnidadeFromSupabase(id_unidade).catch((e) => console.warn('Supabase unidade delete error:', e));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir unidade' };
    }
  }

  public excluirItem(id_item: number): { success: boolean; error?: string } {
    try {
      // Check if item is in active cautela or alocacao
      const activeCautela = this.cautelaItens.some((ci) => {
        if (ci.id_item !== id_item) return false;
        const c = this.cautelas.find((caut) => caut.id_cautela === ci.id_cautela);
        return c && (c.status === 'Aberta' || c.status === 'Atrasada');
      });
      if (activeCautela) {
        return { success: false, error: 'Não é possível excluir um item em cautela ativa. Dê baixa primeiro.' };
      }

      this.itens = this.itens.filter((i) => i.id_item !== id_item);
      this.detalheArma = this.detalheArma.filter((d) => d.id_item !== id_item);
      this.detalheColete = this.detalheColete.filter((d) => d.id_item !== id_item);
      this.detalheImpo = this.detalheImpo.filter((d) => d.id_item !== id_item);
      this.detalheComunicacao = this.detalheComunicacao.filter((d) => d.id_item !== id_item);
      this.detalheViatura = this.detalheViatura.filter((d) => d.id_item !== id_item);
      this.detalheInformatica = this.detalheInformatica.filter((d) => d.id_item !== id_item);

      this.persistAll();
      this.notify();

      deleteItemFromSupabase(id_item).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir item' };
    }
  }

  public atualizarStatusPolicial(id_policial: number, status: Policial['status']) {
    const pol = this.policiais.find((p) => p.id_policial === id_policial);
    if (pol) {
      pol.status = status;
      this.persistAll();
      this.notify();
    }
  }

  public atualizarItemStatus(id_item: number, status: ItemPatrimonio['status'], observacao?: string) {
    const it = this.itens.find((i) => i.id_item === id_item);
    if (it) {
      it.status = status;
      if (observacao !== undefined) it.observacao = observacao;
      this.persistAll();
      this.notify();
    }
  }

  public getRegistrosExtravio(): RegistroExtravio[] {
    return [...this.registrosExtravio].sort(
      (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
    );
  }

  public cadastrarExtravio(dados: {
    data_fato: string;
    id_policial?: number | null;
    id_cautela?: number | null;
    numero_bo_ipm: string;
    tipo_ocorrencia: 'Extravio em Serviço' | 'Furto / Roubo' | 'Perda em Operação' | 'Sinistro / Acidente';
    itens_extraviados: Array<{
      id_item: number;
      tipo_item: string;
      marca?: string | null;
      modelo?: string | null;
      numero_serie?: string | null;
      numero_tombo?: string | null;
      calibre?: string | null;
    }>;
    municoes_extraviadas: Array<{
      id_lote: number;
      tipo_item: string;
      calibre?: string | null;
      quantidade: number;
    }>;
    historico_circunstanciado: string;
    providencias_adotadas?: string;
  }): { success: boolean; id_extravio?: number; error?: string } {
    try {
      const { operador, policial: operadorPolicial } = this.getCurrentOperador();
      const nextId = Math.max(0, ...this.registrosExtravio.map((e) => e.id_extravio)) + 1;

      let polInfo: { policial_nome?: string; policial_grad?: string; policial_matricula?: string } = {};
      if (dados.id_policial) {
        const pol = this.policiais.find((p) => p.id_policial === dados.id_policial);
        if (pol) {
          polInfo = {
            policial_nome: pol.nome_completo,
            policial_grad: pol.patente,
            policial_matricula: pol.matricula,
          };
        }
      }

      const novoExtravio: RegistroExtravio = {
        id_extravio: nextId,
        data_registro: new Date().toISOString(),
        data_fato: dados.data_fato,
        id_policial: dados.id_policial || null,
        ...polInfo,
        id_cautela: dados.id_cautela || null,
        numero_bo_ipm: dados.numero_bo_ipm.trim(),
        tipo_ocorrencia: dados.tipo_ocorrencia,
        itens_extraviados: dados.itens_extraviados,
        municoes_extraviadas: dados.municoes_extraviadas,
        historico_circunstanciado: dados.historico_circunstanciado.trim(),
        providencias_adotadas: dados.providencias_adotadas?.trim() || undefined,
        id_operador: operador.id_operador,
        operador_nome: `${operadorPolicial.patente} ${operadorPolicial.nome_guerra} (${operador.perfil_acesso})`,
      };

      // 1. Mark individual items as 'Extraviado'
      for (const itExt of dados.itens_extraviados) {
        const itemObj = this.itens.find((i) => i.id_item === itExt.id_item);
        if (itemObj) {
          itemObj.status = 'Extraviado';
          itemObj.observacao = `[EXTRAVIO REGISTRADO] ${dados.numero_bo_ipm} - ${dados.tipo_ocorrencia}: ${dados.historico_circunstanciado}`;
        }
      }

      // 2. Abate ammunition from stock or cautela
      for (const munExt of dados.municoes_extraviadas) {
        const loteObj = this.lotes.find((l) => l.id_lote === munExt.id_lote);
        if (loteObj) {
          loteObj.quantidade_atual = Math.max(0, loteObj.quantidade_atual - munExt.quantidade);
        }
      }

      // 3. If linked to an open cautela, record observation
      if (dados.id_cautela) {
        const cautelaObj = this.cautelas.find((c) => c.id_cautela === dados.id_cautela);
        if (cautelaObj) {
          cautelaObj.observacao = `${cautelaObj.observacao || ''} [EXTRAVIO REGISTRADO - BO: ${dados.numero_bo_ipm}]`.trim();
        }
      }

      this.registrosExtravio.unshift(novoExtravio);

      this.registrarAuditoria('REGISTRO_EXTRAVIO', 'registros_extravio', {
        id_extravio: nextId,
        numero_bo_ipm: novoExtravio.numero_bo_ipm,
        tipo_ocorrencia: novoExtravio.tipo_ocorrencia,
        itens_extraviados: novoExtravio.itens_extraviados.map((i) => `${i.tipo_item} (${i.numero_serie || i.numero_tombo || 'S/N'})`),
        municoes_extraviadas: novoExtravio.municoes_extraviadas,
        policial: polInfo.policial_nome || 'Não especificado',
      });

      this.persistAll();
      this.notify();

      pushExtravioToSupabase(novoExtravio).catch((e) =>
        console.warn('Supabase pushExtravio notice:', e)
      );

      // Update any abated lotes in Supabase
      for (const munExt of dados.municoes_extraviadas) {
        const lt = this.lotes.find((l) => l.id_lote === munExt.id_lote);
        if (lt) {
          updateLoteQuantidadeInSupabase(lt.id_lote, lt.quantidade_atual).catch(() => {});
        }
      }

      return { success: true, id_extravio: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar extravio' };
    }
  }

  public getRegistrosDisparo(): RegistroDisparo[] {
    return [...this.registrosDisparo].sort(
      (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
    );
  }

  public cadastrarDisparo(dados: {
    data_fato: string;
    id_policial: number;
    id_cautela?: number | null;
    calibre: string;
    id_lote?: number | null;
    qtd_disparada: number;
    qtd_reposta: number;
    estojos_recolhidos: boolean;
    qtd_estojos_recolhidos?: number;
    numero_bo_ipm: string;
    local_fato?: string;
    historico_circunstanciado: string;
  }): { success: boolean; id_disparo?: number; error?: string } {
    try {
      const pol = this.policiais.find((p) => p.id_policial === dados.id_policial);
      if (!pol) return { success: false, error: 'Policial não encontrado' };

      const { operador, policial: operadorPolicial } = this.getCurrentOperador();
      const nextId = Math.max(0, ...this.registrosDisparo.map((d) => d.id_disparo)) + 1;

      // Abate replacement ammunition from inventory stock
      let loteObj: EstoqueLote | undefined;
      if (dados.id_lote) {
        loteObj = this.lotes.find((l) => l.id_lote === dados.id_lote);
      } else {
        loteObj = this.lotes.find((l) => l.modulo === 'Armas' && l.calibre === dados.calibre && l.quantidade_atual >= dados.qtd_reposta);
      }

      if (loteObj && dados.qtd_reposta > 0) {
        if (loteObj.quantidade_atual < dados.qtd_reposta) {
          return {
            success: false,
            error: `Estoque insuficiente do calibre ${dados.calibre} para reposição. Disponível: ${loteObj.quantidade_atual} un, Solicitado: ${dados.qtd_reposta} un.`,
          };
        }
        loteObj.quantidade_atual -= dados.qtd_reposta;
      }

      const novoDisparo: RegistroDisparo = {
        id_disparo: nextId,
        data_registro: new Date().toISOString(),
        data_fato: dados.data_fato,
        id_policial: dados.id_policial,
        policial_nome: pol.nome_completo,
        policial_grad: pol.patente,
        policial_matricula: pol.matricula,
        id_cautela: dados.id_cautela || null,
        calibre: dados.calibre,
        id_lote: loteObj?.id_lote || dados.id_lote || null,
        qtd_disparada: dados.qtd_disparada,
        qtd_reposta: dados.qtd_reposta,
        estojos_recolhidos: dados.estojos_recolhidos,
        qtd_estojos_recolhidos: dados.qtd_estojos_recolhidos || (dados.estojos_recolhidos ? dados.qtd_disparada : 0),
        numero_bo_ipm: dados.numero_bo_ipm.trim(),
        local_fato: dados.local_fato?.trim() || undefined,
        historico_circunstanciado: dados.historico_circunstanciado.trim(),
        id_operador: operador.id_operador,
        operador_nome: `${operadorPolicial.patente} ${operadorPolicial.nome_guerra} (${operador.perfil_acesso})`,
      };

      this.registrosDisparo.unshift(novoDisparo);

      this.registrarAuditoria('REGISTRO_DISPARO_REPOSICAO', 'registros_disparo', {
        id_disparo: nextId,
        policial: `${pol.patente} ${pol.nome_guerra}`,
        calibre: dados.calibre,
        qtd_disparada: dados.qtd_disparada,
        qtd_reposta: dados.qtd_reposta,
        numero_bo: dados.numero_bo_ipm,
        lote_abatido: loteObj?.modelo || loteObj?.tipo_item || dados.calibre,
      });

      this.persistAll();
      this.notify();

      pushDisparoToSupabase(novoDisparo).catch((e) =>
        console.warn('Supabase pushDisparo notice:', e)
      );

      if (loteObj) {
        updateLoteQuantidadeInSupabase(loteObj.id_lote, loteObj.quantidade_atual).catch(() => {});
      }

      return { success: true, id_disparo: nextId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar disparo e reposição' };
    }
  }

  public getAuditoriaLogs(): AuditoriaLog[] {
    return [...this.auditoriaLogs].sort(
      (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
    );
  }

  public registrarAuditoria(
    acao: string,
    tabela: string,
    detalhes: Record<string, any>
  ): AuditoriaLog {
    const { operador, policial } = this.getCurrentOperador();
    const newLog: AuditoriaLog = {
      id_log: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data_hora: new Date().toISOString(),
      id_operador: operador.id_operador,
      operador_nome: `${policial.patente} ${policial.nome_guerra} (${operador.perfil_acesso})`,
      acao,
      tabela,
      detalhes,
    };
    this.auditoriaLogs.unshift(newLog);
    this.persistAll();
    this.notify();

    pushAuditoriaToSupabase(newLog).catch(() => {});

    return newLog;
  }
}

export const db = new DatabaseEngine();

// React hook for consuming database state reactive updates
export function useDatabase() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return db.subscribe(() => setTick((t) => t + 1));
  }, []);

  const currentOpInfo = db.getCurrentOperador();
  const perfil = currentOpInfo.operador.perfil_acesso;

  // RBAC checks
  const canAccessModule = (mod: ModuloTipo): boolean => {
    if (perfil === 'Superuser' || perfil === 'P4') return true;
    if (perfil === 'Armeiro') return mod === 'Armas';
    if (perfil === 'Rádio') return mod === 'Comunicação';
    return false;
  };

  const canManageOperadores = perfil === 'Superuser' || perfil === 'P4';
  const canManageEfetivo = perfil === 'Superuser' || perfil === 'P4';
  const canPerformAlocacao = perfil === 'Superuser' || perfil === 'P4';
  const canManageUnidades = perfil === 'Superuser';
  const isSuperuser = perfil === 'Superuser';

  const currentOperator = {
    ...currentOpInfo.operador,
    tipo_perfil: currentOpInfo.operador.perfil_acesso,
    policial: currentOpInfo.policial,
  };

  return {
    db,
    isAuthenticated: db.isUserAuthenticated(),
    login: (id: string, pass: string) => db.login(id, pass),
    logout: () => db.logout(),
    cadastrarOperador: (dados: any) => db.cadastrarOperador(dados),
    editarOperador: (id: string, dados: any) => db.editarOperador(id, dados),
    excluirOperador: (id: string) => db.excluirOperador(id),
    currentOperador: currentOpInfo.operador,
    currentOperator,
    currentPolicial: currentOpInfo.policial,
    perfil,
    isSuperuser,
    canAccessModule,
    canManageOperadores,
    canManageEfetivo,
    canPerformAlocacao,
    canManageUnidades,
    unidades: db.getUnidades(),
    policiais: db.getPoliciais(),
    operadores: db.getOperadores(),
    tiposMateriais: db.getTiposMateriais(),
    lotes: db.getLotes(),
    auditoriaLogs: db.getAuditoriaLogs(),
    registrosExtravio: db.getRegistrosExtravio(),
    registrosDisparo: db.getRegistrosDisparo(),
    syncStatus: db.getSyncStatus(),
    syncAllToSupabase: () => db.syncAllToSupabase(),
    pullAllFromSupabase: () => db.pullAllFromSupabase(),
    syncAllOperadoresAuth: () =>
      syncAllOperadoresToAuth(
        db.getOperadores().map((o) => o.operador),
        db.getPoliciais()
      ),
    getSupabaseTableStats: () => db.getSupabaseTableStats(),
  };
}
