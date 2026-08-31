/**
 * SGC-6: Sistema de Gestão e Cautela do 6º BPM
 * Esquema de Dados do Supabase PostgreSQL
 */

export type ModuloTipo = 'Armas' | 'Comunicação' | 'Viaturas' | 'Informática' | 'Móveis e Diversos';
export type ModoTipo = ModuloTipo;

export type PerfilAcesso = 'Superuser' | 'P4' | 'Armeiro' | 'Rádio' | 'Comandante';

export type StatusItem =
  | 'Disponível'
  | 'Cautelado'
  | 'Alocado'
  | 'Manutenção'
  | 'Danificado / Avariado'
  | 'Em apuração'
  | 'Extraviado'
  | 'Descarregado'
  | 'Baixado';

export type TipoCautela = 'Temporária' | 'Permanente';

export type StatusCautela = 'Aberta' | 'Finalizada' | 'Atrasada' | 'Cancelada';

export type StatusAlocacao = 'Ativa' | 'Devolvida' | 'Transferida';

export type TipoUnidade = 'BPM' | 'CPM' | 'DPM' | 'Setor';

export type ModoControleMaterial = 'INDIVIDUAL' | 'QUANTIDADE' | 'HIBRIDO';

export type CategoriaEspecializada =
  | 'ARMA'
  | 'COLETE'
  | 'VIATURA'
  | 'COMUNICACAO'
  | 'INFORMATICA'
  | 'IMPO'
  | 'NENHUMA'
  | 'arma'
  | 'colete'
  | 'viatura'
  | 'comunicacao'
  | 'informatica'
  | 'impo'
  | 'nenhuma';

export interface TipoMaterial {
  id_tipo_material: number;
  nome: string;
  modulo: ModuloTipo;
  modo_controle: ModoControleMaterial;
  categoria_especializada: CategoriaEspecializada;
  permite_marca: boolean;
  permite_modelo: boolean;
  permite_numero_serie: boolean;
  exige_numero_serie: boolean;
  permite_numero_tombo: boolean;
  exige_numero_tombo: boolean;
  permite_lote_validade: boolean;
  descricao?: string;
  status: 'Ativo' | 'Inativo';
}

export type PatentePM =
  | 'Soldado'
  | 'Cabo'
  | '3º Sargento'
  | '2º Sargento'
  | '1º Sargento'
  | 'Subtenente'
  | '2º Tenente'
  | '1º Tenente'
  | 'Capitão'
  | 'Major'
  | 'Tenente-Coronel';

export interface Unidade {
  id_unidade: number;
  nome: string;
  sigla?: string;
  municipio?: string;
  tipo_unidade: TipoUnidade | string;
  id_unidade_superior?: number | null;
  responsavel_nome?: string | null;
  telefone?: string | null;
  endereco?: string | null;
}

export interface Policial {
  id_policial: number;
  matricula: string;
  patente: PatentePM | string;
  nome_guerra: string;
  nome_completo: string;
  id_unidade?: number | null;
  id_unidade_lotacao?: number | null;
  status: 'Ativo' | 'Inativo' | 'Férias' | 'Licença';
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface OperadorSistema {
  id_operador: string; // UUID from auth.users
  id_policial: number;
  perfil_acesso: PerfilAcesso;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  email?: string;
  senha?: string; // Senha do operador (gerenciada por Superuser / P4)
  ultimo_login?: string | null;
  criado_em?: string;
}

export interface ItemPatrimonio {
  id_item: number;
  id_tipo_material?: number | null;
  modulo: ModuloTipo;
  tipo_item: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  numero_tombo?: string | null;
  status: StatusItem;
  observacao?: string | null;
  data_inicio_manutencao?: string | null;
  motivo_manutencao?: string | null;
}

export interface EstoqueLote {
  id_lote: number;
  id_tipo_material?: number | null;
  modulo: ModuloTipo;
  tipo_item: string;
  marca?: string | null;
  modelo?: string | null;
  calibre?: string | null;
  lote_fabricacao?: string | null;
  data_validade?: string | null; // ISO Date YYYY-MM-DD
  quantidade_atual: number;
  observacao?: string | null;
}

export interface RegistroExtravio {
  id_extravio: number;
  data_registro: string;
  data_fato: string;
  id_policial?: number | null;
  policial_nome?: string;
  policial_grad?: string;
  policial_matricula?: string;
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
  id_operador: string;
  operador_nome: string;
}

export interface RegistroDisparo {
  id_disparo: number;
  data_registro: string;
  data_fato: string;
  id_policial: number;
  policial_nome: string;
  policial_grad: string;
  policial_matricula: string;
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
  id_operador: string;
  operador_nome: string;
}

export interface DetalheViatura {
  id_item: number;
  placa: string;
  prefixo: string; // e.g. "VTR-0601", "ROCAM-06", "RP-0615"
  renavam?: string | null;
  chassi?: string | null;
}

export interface DetalheArma {
  id_item: number;
  calibre: string;
  numero_sigma?: string | null;
  brasao_gravado: boolean;
  qtd_carregadores: number;
  carregadores_coincidem_numeracao: boolean;
}

export interface DetalheColete {
  id_item: number;
  genero: 'Masculino' | 'Feminino' | 'Unissex';
  tamanho: string;
  nivel_protecao: string; // ex: III-A, II, etc.
  data_validade: string; // ISO Date YYYY-MM-DD
}

export interface DetalheImpo {
  id_item: number;
  data_validade?: string | null;
}

export interface DetalheComunicacao {
  id_item: number;
  imei_mac?: string | null;
  numero_linha?: string | null;
}

export interface DetalheInformatica {
  id_item: number;
  configuracao_resumida?: string | null;
}

export interface AlocacaoUnidade {
  id_alocacao: number;
  id_unidade: number;
  id_operador: string; // UUID
  data_alocacao: string; // ISO DateTime
  data_devolucao_efetiva?: string | null;
  status: StatusAlocacao;
}

export interface AlocacaoItem {
  id_alocacao: number;
  id_item: number;
}

export interface Cautela {
  id_cautela: number;
  id_policial: number;
  id_operador_entrega: string; // UUID
  id_operador_devolucao?: string | null; // UUID
  tipo: TipoCautela;
  data_retirada: string; // ISO DateTime
  data_prevista_devolucao?: string | null;
  data_devolucao_efetiva?: string | null;
  status: StatusCautela;
  observacao?: string | null;
}

export interface CautelaItem {
  id_cautela: number;
  id_item: number;
  observacao_estado_entrega?: string | null;
  observacao_estado_devolucao?: string | null;
}

export interface CautelaEstoque {
  id_cautela: number;
  id_lote: number;
  quantidade: number;
}

// Joined views for frontend rendering
export interface ItemComDetalhes extends ItemPatrimonio {
  tipo_material?: TipoMaterial;
  detalhe_arma?: DetalheArma;
  detalhe_colete?: DetalheColete;
  detalhe_impo?: DetalheImpo;
  detalhe_comunicacao?: DetalheComunicacao;
  detalhe_viatura?: DetalheViatura;
  detalhe_informatica?: DetalheInformatica;
  cautela_atual?: {
    id_cautela: number;
    policial_nome: string;
    policial_grad: string;
    policial_matricula: string;
    data_retirada: string;
    tipo: TipoCautela;
    status: StatusCautela;
  };
  alocacao_atual?: {
    id_alocacao: number;
    id_unidade?: number;
    unidade_nome: string;
    data_alocacao: string;
  };
}

export interface CautelaCompleta extends Cautela {
  policial: Policial;
  operador_entrega: {
    operador: OperadorSistema;
    policial: Policial;
  };
  operador_devolucao?: {
    operador: OperadorSistema;
    policial: Policial;
  } | null;
  itens: Array<{
    item: ItemComDetalhes;
    observacao_estado_entrega?: string | null;
    observacao_estado_devolucao?: string | null;
  }>;
  lotes: Array<{
    lote: EstoqueLote;
    quantidade: number;
  }>;
}

export interface AlocacaoCompleta extends AlocacaoUnidade {
  unidade: Unidade;
  operador: {
    operador: OperadorSistema;
    policial: Policial;
  };
  itens: ItemComDetalhes[];
}

export interface AuditoriaLog {
  id_log: string;
  data_hora: string;
  id_operador: string;
  operador_nome: string;
  acao: string;
  tabela: string;
  detalhes: Record<string, any>;
}
