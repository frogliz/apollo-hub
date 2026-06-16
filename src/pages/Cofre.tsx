import React, { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { KeyRound, Eye, EyeOff, Copy, AlertTriangle, Shield, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface SenhaItem {
  id: string;
  categoria: string;
  titulo: string;
  usuario?: string;
  senha: string;
  obs?: string;
  isDefault?: boolean;
}

const SENHAS_PADRAO: SenhaItem[] = [
  // Oracle
  { id: 'o1', categoria: 'Oracle', titulo: 'Usuário Oracle (SO)', usuario: 'oracle', senha: 'ap0ll0', obs: 'Login PuTTY no servidor Oracle', isDefault: true },
  { id: 'o2', categoria: 'Oracle', titulo: 'SQLPlus SYSDBA', usuario: '/ as sysdba', senha: '(sem senha - auth SO)', obs: 'Acesso admin do Oracle via OS', isDefault: true },
  { id: 'o3', categoria: 'Oracle', titulo: 'Schema Padrão Apollo', usuario: 'APOLLO', senha: 'apollo', obs: 'Senha padrão do schema Apollo no Oracle', isDefault: true },
  // FireBird
  { id: 'f1', categoria: 'FireBird', titulo: 'FireBird SYSDBA', usuario: 'SYSDBA', senha: 'masterkey', obs: 'Senha padrão do FireBird', isDefault: true },
  // Sistemas
  { id: 's1', categoria: 'Sistemas Apollo', titulo: 'Ws Apollo Gestão Mobile', usuario: 'admin', senha: 'admin', obs: 'Login padrão do servidor REST', isDefault: true },
  { id: 's2', categoria: 'Sistemas Apollo', titulo: 'Retaguarda Admin', usuario: 'admin', senha: 'apollosg', obs: 'Acesso padrão ao sistema Retaguarda', isDefault: true },
  // Windows
  { id: 'w1', categoria: 'Windows Server', titulo: 'Administrador Windows', usuario: 'Administrador', senha: 'ap0ll0@2024', obs: 'Senha padrão Windows Server (verificar por cliente)', isDefault: true },
  { id: 'w2', categoria: 'Windows Server', titulo: 'RDP Padrão', usuario: 'Administrator', senha: 'Apollo@123', obs: 'Acesso RDP padrão (alterar por segurança)', isDefault: true },
  // AnyDesk
  { id: 'a1', categoria: 'Acesso Remoto', titulo: 'AnyDesk — Senha Padrão Unattended', usuario: '', senha: 'apollo123', obs: 'Senha padrão para acesso não supervisionado', isDefault: true },
  // PDV
  { id: 'p1', categoria: 'PDV', titulo: 'Operador Padrão PDV', usuario: '001', senha: '1234', obs: 'Operador padrão criado na instalação', isDefault: true },
  { id: 'p2', categoria: 'PDV', titulo: 'Supervisor PDV', usuario: 'SUP', senha: 'sup123', obs: 'Acesso supervisor para cancelamentos', isDefault: true },
];

function SenhaRow({ item }: { item: SenhaItem }) {
  const [visible, setVisible] = useState(false);
  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="cofre-item">
      <div style={{ minWidth: 220 }}>
        <div className="cofre-item-label">{item.titulo}</div>
        {item.obs && <div className="cofre-item-obs">{item.obs}</div>}
      </div>
      {item.usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
          <span className="font-mono text-sm text-secondary">{item.usuario}</span>
          <button className="copy-btn" onClick={() => copy(item.usuario!, 'Usuário')} title="Copiar usuário">
            <Copy size={11} />
          </button>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
          {visible ? item.senha : '•'.repeat(Math.min(item.senha.length, 14))}
        </span>
        <button className="copy-btn" onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
        <button className="copy-btn" onClick={() => copy(item.senha, 'Senha')}>
          <Copy size={11} />
        </button>
      </div>
      {item.isDefault && (
        <span className="badge badge-yellow" style={{ fontSize: 10 }}>⚠️ Padrão</span>
      )}
    </div>
  );
}

export function Cofre() {
  const [customSenhas, setCustomSenhas] = useState<SenhaItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSenha, setNewSenha] = useState({ titulo: '', usuario: '', senha: '', categoria: 'Outros', obs: '' });

  const categorias = [...new Set(SENHAS_PADRAO.map(s => s.categoria)), 'Outros'];
  const allSenhas = [...SENHAS_PADRAO, ...customSenhas];
  const cats = [...new Set(allSenhas.map(s => s.categoria))];

  const addCustom = () => {
    if (!newSenha.titulo || !newSenha.senha) { toast.error('Título e senha são obrigatórios'); return; }
    setCustomSenhas(prev => [...prev, { ...newSenha, id: Date.now().toString(), isDefault: false }]);
    setNewSenha({ titulo: '', usuario: '', senha: '', categoria: 'Outros', obs: '' });
    setShowAdd(false);
    toast.success('Credencial adicionada!');
  };

  return (
    <Layout title="Cofre de Senhas" subtitle="Credenciais Padrão Apollo">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Cofre de Senhas</h1>
          <p className="page-subtitle">Credenciais e senhas padrão da Apollo Sistemas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Adicionar Credencial
        </button>
      </div>



      {cats.map(cat => {
        const items = allSenhas.filter(s => s.categoria === cat);
        return (
          <div key={cat} className="mb-6" style={{ marginBottom: 24 }}>
            <div className="section-header mb-3" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-2">
                <Shield size={15} color="var(--apollo-blue-light)" />
                <span className="section-title" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{items.length}</span>
              </div>
            </div>
            <div className="cofre-section">
              {items.map(item => <SenhaRow key={item.id} item={item} />)}
            </div>
          </div>
        );
      })}

      {/* Quick Reference */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title">🔑 Referência Rápida — Comandos Oracle</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Conectar via PuTTY (usuário SO)', cmd: 'oracle / ap0ll0' },
              { label: 'Iniciar Listener', cmd: 'lsnrctl start' },
              { label: 'Verificar Listener', cmd: 'lsnrctl status' },
              { label: 'Conectar SQLPlus SYSDBA', cmd: 'sqlplus / as sysdba' },
              { label: 'Iniciar banco Oracle', cmd: 'startup;' },
              { label: 'Parar banco Oracle', cmd: 'shutdown immediate;' },
              { label: 'Verificar status', cmd: 'select status from v$instance;' },
              { label: 'Listar schemas', cmd: "select username from dba_users where account_status = 'OPEN';" },
            ].map(({ label, cmd }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 240 }}>{label}</span>
                <div
                  className="step-cmd"
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => { navigator.clipboard.writeText(cmd); toast.success('Copiado!'); }}
                  title="Clique para copiar"
                >
                  {cmd}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Adicionar Credencial</span>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Título *</label>
                  <input className="form-control" value={newSenha.titulo} onChange={e => setNewSenha(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Acesso FTP Cliente ABC" />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-control" value={newSenha.categoria} onChange={e => setNewSenha(p => ({ ...p, categoria: e.target.value }))}>
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Usuário</label>
                  <input className="form-control mono" value={newSenha.usuario} onChange={e => setNewSenha(p => ({ ...p, usuario: e.target.value }))} placeholder="admin" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Senha *</label>
                  <input className="form-control mono" value={newSenha.senha} onChange={e => setNewSenha(p => ({ ...p, senha: e.target.value }))} placeholder="••••••" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Observação</label>
                  <input className="form-control" value={newSenha.obs} onChange={e => setNewSenha(p => ({ ...p, obs: e.target.value }))} placeholder="Para que serve esta credencial?" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={addCustom}><Save size={14} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
