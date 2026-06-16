import React, { useState } from 'react';
import { addCliente, updateCliente } from '../../firebase/services/clientes';
import { Cliente } from '../../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

const SISTEMAS = [
  'PDV', 'Retaguarda', 'Carga', 'Vendas API', 'Monitor NF-e',
  'Apollo Automação', 'Ws Apollo Gestão Mobile', 'UFrmConfigIniImportXml',
  'Gerenciador de Execução', 'NF-e Importação XML', 'Manifestação Destinatário',
  'Apollo Gestão Mobile (App)', 'Servidor Oracle', 'Servidor FireBird',
];

export function ClienteModal({ cliente, onClose, onSaved }: Props) {
  const isEdit = !!cliente;
  const [tab, setTab] = useState('geral');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Cliente>(cliente || {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cidade: '',
    uf: '',
    telefone: '',
    email: '',
    responsavel: '',
    anydesk: { id: '', senha: '', obs: '' },
    rustdesk: { id: '', senha: '', obs: '' },
    rede: { ip: '', dns: '', gateway: '', mascaraSubrede: '', vpn: '', portas: '', observacoes: '' },
    oracle: { host: '', porta: '1521', serviceName: 'APOLLO', usuario: '', senha: '', obs: '' },
    firebird: { host: '', porta: '3050', banco: '', usuario: 'SYSDBA', senha: 'masterkey', obs: '' },
    servidor: { os: '', ram: '', cpu: '', hd: '', obs: '' },
    sistemasInstalados: [],
    observacoes: '',
    status: 'ativo',
  });

  const set = (path: string, value: any) => {
    setForm(prev => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      const top = parts[0] as keyof Cliente;
      return {
        ...prev,
        [top]: { ...(prev[top] as any), [parts[1]]: value },
      };
    });
  };

  const toggleSistema = (s: string) => {
    const curr = form.sistemasInstalados || [];
    set('sistemasInstalados', curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s]);
  };

  const handleSubmit = async () => {
    if (!form.razaoSocial.trim()) { toast.error('Razão social é obrigatória'); return; }
    setSaving(true);
    try {
      if (isEdit && cliente?.id) {
        await updateCliente(cliente.id, form);
        toast.success('Cliente atualizado!');
      } else {
        await addCliente(form);
        toast.success('Cliente adicionado!');
      }
      onSaved();
    } catch (e) {
      toast.error('Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'acesso', label: 'Acesso Remoto' },
    { id: 'rede', label: 'Rede' },
    { id: 'banco', label: 'Banco de Dados' },
    { id: 'servidor', label: 'Servidor' },
    { id: 'sistemas', label: 'Sistemas' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? `Editar: ${cliente?.razaoSocial}` : 'Novo Cliente'}
          </span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 26px 0' }}>
          <div className="tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-body" style={{ paddingTop: 20 }}>
          {/* GERAL */}
          {tab === 'geral' && (
            <>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Razão Social *</label>
                  <input className="form-control" value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Nome completo da empresa" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome Fantasia</label>
                  <input className="form-control" value={form.nomeFantasia || ''} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Nome comercial" />
                </div>
              </div>
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input className="form-control mono" value={form.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-control" value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} placeholder="São Paulo" />
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input className="form-control" value={form.uf || ''} onChange={e => set('uf', e.target.value)} placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" value={form.telefone || ''} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-control" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com" />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input className="form-control" value={form.responsavel || ''} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do contato" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status || 'ativo'} onChange={e => set('status', e.target.value)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observações Gerais</label>
                <textarea className="form-control" value={form.observacoes || ''} onChange={e => set('observacoes', e.target.value)} placeholder="Informações adicionais sobre o cliente..." rows={3} />
              </div>
            </>
          )}

          {/* ACESSO REMOTO */}
          {tab === 'acesso' && (
            <>
              <div className="detail-section">
                <div className="detail-section-header">
                  <span className="detail-section-title">🖥️ AnyDesk</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ID AnyDesk</label>
                      <input className="form-control mono" value={form.anydesk?.id || ''} onChange={e => set('anydesk.id', e.target.value)} placeholder="123 456 789" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Senha AnyDesk</label>
                      <input className="form-control mono" value={form.anydesk?.senha || ''} onChange={e => set('anydesk.senha', e.target.value)} placeholder="senha123" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Obs. AnyDesk</label>
                      <input className="form-control" value={form.anydesk?.obs || ''} onChange={e => set('anydesk.obs', e.target.value)} placeholder="Servidor principal" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section mt-3">
                <div className="detail-section-header">
                  <span className="detail-section-title">🔵 RustDesk</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ID RustDesk</label>
                      <input className="form-control mono" value={form.rustdesk?.id || ''} onChange={e => set('rustdesk.id', e.target.value)} placeholder="abc123def456" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Senha RustDesk</label>
                      <input className="form-control mono" value={form.rustdesk?.senha || ''} onChange={e => set('rustdesk.senha', e.target.value)} placeholder="senha123" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Obs. RustDesk</label>
                      <input className="form-control" value={form.rustdesk?.obs || ''} onChange={e => set('rustdesk.obs', e.target.value)} placeholder="Backup de acesso" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* REDE */}
          {tab === 'rede' && (
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">IP / Host do Servidor</label>
                <input className="form-control mono" value={form.rede?.ip || ''} onChange={e => set('rede.ip', e.target.value)} placeholder="10.0.0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">DNS</label>
                <input className="form-control mono" value={form.rede?.dns || ''} onChange={e => set('rede.dns', e.target.value)} placeholder="192.168.1.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Gateway</label>
                <input className="form-control mono" value={form.rede?.gateway || ''} onChange={e => set('rede.gateway', e.target.value)} placeholder="192.168.1.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Máscara de Sub-rede</label>
                <input className="form-control mono" value={form.rede?.mascaraSubrede || ''} onChange={e => set('rede.mascaraSubrede', e.target.value)} placeholder="255.255.255.0" />
              </div>
              <div className="form-group">
                <label className="form-label">VPN</label>
                <input className="form-control" value={form.rede?.vpn || ''} onChange={e => set('rede.vpn', e.target.value)} placeholder="OpenVPN / WireGuard / sem VPN" />
              </div>
              <div className="form-group">
                <label className="form-label">Portas Abertas (Firewall)</label>
                <input className="form-control mono" value={form.rede?.portas || ''} onChange={e => set('rede.portas', e.target.value)} placeholder="9001, 1521, 228, 8080" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Observações de Rede</label>
                <textarea className="form-control" value={form.rede?.observacoes || ''} onChange={e => set('rede.observacoes', e.target.value)} placeholder="Detalhes sobre a configuração de rede..." rows={3} />
              </div>
            </div>
          )}

          {/* BANCO DE DADOS */}
          {tab === 'banco' && (
            <>
              <div className="detail-section">
                <div className="detail-section-header">
                  <span className="detail-section-title">🔶 Oracle Database</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Host / IP</label>
                      <input className="form-control mono" value={form.oracle?.host || ''} onChange={e => set('oracle.host', e.target.value)} placeholder="10.0.0.1" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Porta</label>
                      <input className="form-control mono" value={form.oracle?.porta || '1521'} onChange={e => set('oracle.porta', e.target.value)} placeholder="1521" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Service Name</label>
                      <input className="form-control mono" value={form.oracle?.serviceName || ''} onChange={e => set('oracle.serviceName', e.target.value)} placeholder="APOLLO" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Usuário / Schema</label>
                      <input className="form-control mono" value={form.oracle?.usuario || ''} onChange={e => set('oracle.usuario', e.target.value)} placeholder="TREVAO" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Senha</label>
                      <input className="form-control mono" value={form.oracle?.senha || ''} onChange={e => set('oracle.senha', e.target.value)} placeholder="••••••" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Observações</label>
                      <input className="form-control" value={form.oracle?.obs || ''} onChange={e => set('oracle.obs', e.target.value)} placeholder="Observações Oracle" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section mt-3">
                <div className="detail-section-header">
                  <span className="detail-section-title">🔴 FireBird</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="form-grid form-grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Host / IP</label>
                      <input className="form-control mono" value={form.firebird?.host || ''} onChange={e => set('firebird.host', e.target.value)} placeholder="localhost" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Porta</label>
                      <input className="form-control mono" value={form.firebird?.porta || '3050'} onChange={e => set('firebird.porta', e.target.value)} placeholder="3050" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Arquivo do Banco (.FDB)</label>
                      <input className="form-control mono" value={form.firebird?.banco || ''} onChange={e => set('firebird.banco', e.target.value)} placeholder="C:\dados\banco.fdb" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Usuário</label>
                      <input className="form-control mono" value={form.firebird?.usuario || 'SYSDBA'} onChange={e => set('firebird.usuario', e.target.value)} placeholder="SYSDBA" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Senha</label>
                      <input className="form-control mono" value={form.firebird?.senha || ''} onChange={e => set('firebird.senha', e.target.value)} placeholder="masterkey" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Observações</label>
                      <input className="form-control" value={form.firebird?.obs || ''} onChange={e => set('firebird.obs', e.target.value)} placeholder="Observações FireBird" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SERVIDOR */}
          {tab === 'servidor' && (
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Sistema Operacional</label>
                <input className="form-control" value={form.servidor?.os || ''} onChange={e => set('servidor.os', e.target.value)} placeholder="Windows Server 2019" />
              </div>
              <div className="form-group">
                <label className="form-label">RAM</label>
                <input className="form-control" value={form.servidor?.ram || ''} onChange={e => set('servidor.ram', e.target.value)} placeholder="16 GB" />
              </div>
              <div className="form-group">
                <label className="form-label">Processador</label>
                <input className="form-control" value={form.servidor?.cpu || ''} onChange={e => set('servidor.cpu', e.target.value)} placeholder="Intel Xeon E5-2680" />
              </div>
              <div className="form-group">
                <label className="form-label">Armazenamento</label>
                <input className="form-control" value={form.servidor?.hd || ''} onChange={e => set('servidor.hd', e.target.value)} placeholder="500 GB SSD" />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Observações do Servidor</label>
                <textarea className="form-control" value={form.servidor?.obs || ''} onChange={e => set('servidor.obs', e.target.value)} rows={3} placeholder="Detalhes sobre o servidor..." />
              </div>
            </div>
          )}

          {/* SISTEMAS */}
          {tab === 'sistemas' && (
            <>
              <p className="text-secondary mb-4" style={{ fontSize: 13 }}>Selecione os sistemas instalados neste cliente:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SISTEMAS.map(s => {
                  const selected = form.sistemasInstalados?.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSistema(s)}
                      className={`badge ${selected ? 'badge-blue' : 'badge-gray'}`}
                      style={{
                        cursor: 'pointer',
                        padding: '7px 14px',
                        fontSize: 13,
                        border: selected ? '1px solid rgba(30,111,217,0.4)' : '1px solid var(--border-default)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected ? '✓ ' : ''}{s}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                Salvando...
              </>
            ) : (
              <><Save size={15} /> {isEdit ? 'Salvar Alterações' : 'Adicionar Cliente'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
