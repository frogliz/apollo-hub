// =============================================
// APOLLO HUB — TYPE DEFINITIONS
// =============================================

export interface Cliente {
  id?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  // Acesso Remoto
  anydesk?: { id: string; senha: string; obs?: string };
  rustdesk?: { id: string; senha: string; obs?: string };
  // Rede
  rede?: {
    ip?: string;
    dns?: string;
    gateway?: string;
    mascaraSubrede?: string;
    vpn?: string;
    portas?: string;
    observacoes?: string;
  };
  // Oracle
  oracle?: {
    host?: string;
    porta?: string;
    serviceName?: string;
    usuario?: string;
    senha?: string;
    obs?: string;
  };
  // FireBird
  firebird?: {
    host?: string;
    porta?: string;
    banco?: string;
    usuario?: string;
    senha?: string;
    obs?: string;
  };
  // Sistemas
  sistemasInstalados?: string[];
  versoes?: Record<string, string>;
  // Servidor
  servidor?: {
    os?: string;
    ram?: string;
    cpu?: string;
    hd?: string;
    obs?: string;
  };
  // Credenciais extras
  senhasExtras?: SenhaExtra[];
  observacoes?: string;
  status?: 'ativo' | 'inativo' | 'suspenso';
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface SenhaExtra {
  id?: string;
  titulo: string;
  usuario?: string;
  senha?: string;
  url?: string;
  obs?: string;
}

export interface Conhecimento {
  id?: string;
  titulo: string;
  sintoma: string;
  descricao?: string;
  modulo: string;
  tags: string[];
  causa?: string;
  solucao: string;
  criticidade?: 'baixa' | 'media' | 'alta' | 'critica';
  criadoPor?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  visualizacoes?: number;
}

export interface Runbook {
  id?: string;
  titulo: string;
  descricao: string;
  modulo: string;
  categoria: string;
  passos: RunbookPasso[];
  tags?: string[];
  criadoEm?: string;
  atualizadoEm?: string;
  isPinned?: boolean;
}

export interface RunbookPasso {
  ordem: number;
  titulo: string;
  instrucao: string;
  tipo?: 'info' | 'comando' | 'aviso' | 'verificacao';
  comando?: string;
}

export interface ModuloCarga {
  id: string;
  nome: string;
  descricao: string;
  porta?: string;
  icone?: string;
  status?: string;
  detalhes?: string[];
  config?: Record<string, string>;
}

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  cargo?: string;
  avatar?: string;
}
