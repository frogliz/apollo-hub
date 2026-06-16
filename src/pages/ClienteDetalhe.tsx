import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { getCliente } from '../firebase/services/clientes';
import { Cliente } from '../types';
import {
  ArrowLeft, Copy, Eye, EyeOff, Edit, Monitor,
  Wifi, Database, Server, Package, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ClienteModal } from '../components/Clientes/ClienteModal';

function CopyField({ value, label }: { value?: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  };
  if (!value) return <span className="text-muted">—</span>;
  return (
    <div className="password-field">
      <span className="password-value">
        {visible ? value : '•'.repeat(Math.min(value.length, 12))}
      </span>
      <button className="copy-btn" onClick={() => setVisible(!visible)} title={visible ? 'Ocultar' : 'Mostrar'}>
        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button className="copy-btn" onClick={handleCopy} title="Copiar">
        <Copy size={12} />
      </button>
    </div>
  );
}

function PlainField({ value }: { value?: string }) {
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success('Copiado!');
  };
  if (!value) return <span className="text-muted">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="detail-item-value">{value}</span>
      <button className="copy-btn" onClick={handleCopy} title="Copiar">
        <Copy size={12} />
      </button>
    </div>
  );
}

export function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('acesso');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const c = await getCliente(id);
    setCliente(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <Layout title="Carregando..." >
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%' }} />
      </div>
    </Layout>
  );

  if (!cliente) return (
    <Layout title="Cliente não encontrado">
      <div className="empty-state">
        <h3>Cliente não encontrado</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/clientes')}>Voltar</button>
      </div>
    </Layout>
  );

  const tabs = [
    { id: 'acesso', label: '🖥️ Acesso Remoto', icon: Monitor },
    { id: 'rede', label: '🌐 Rede', icon: Wifi },
    { id: 'banco', label: '🗄️ Banco de Dados', icon: Database },
    { id: 'servidor', label: '🖧 Servidor', icon: Server },
    { id: 'sistemas', label: '📦 Sistemas', icon: Package },
    { id: 'obs', label: '📝 Observações', icon: FileText },
  ];

  return (
    <Layout title={cliente.razaoSocial} subtitle={cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : undefined}>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clientes')}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            <h1 className="page-title">{cliente.razaoSocial}</h1>
            {cliente.nomeFantasia && <p className="page-subtitle">{cliente.nomeFantasia}</p>}
          </div>
          {cliente.status === 'ativo' || !cliente.status ? (
            <span className="badge badge-green">Ativo</span>
          ) : (
            <span className="badge badge-gray">{cliente.status}</span>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowEdit(true)}>
          <Edit size={15} /> Editar
        </button>
      </div>

      {/* Info rápida */}
      <div className="grid-4 mb-6">
        {[
          { label: 'CNPJ', value: cliente.cnpj },
          { label: 'Telefone', value: cliente.telefone },
          { label: 'Responsável', value: cliente.responsavel },
          { label: 'E-mail', value: cliente.email },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: item.value ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ACESSO REMOTO */}
      {activeTab === 'acesso' && (
        <div className="grid-2">
          <div className="detail-section">
            <div className="detail-section-header">
              <span className="detail-section-title">🖥️ AnyDesk</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">ID AnyDesk</div>
                <PlainField value={cliente.anydesk?.id} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Senha</div>
                <CopyField value={cliente.anydesk?.senha} label="Senha AnyDesk" />
              </div>
              {cliente.anydesk?.obs && (
                <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                  <div className="detail-item-label">Observações</div>
                  <div className="detail-item-value" style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{cliente.anydesk.obs}</div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-header">
              <span className="detail-section-title">🔵 RustDesk</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">ID RustDesk</div>
                <PlainField value={cliente.rustdesk?.id} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Senha</div>
                <CopyField value={cliente.rustdesk?.senha} label="Senha RustDesk" />
              </div>
              {cliente.rustdesk?.obs && (
                <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                  <div className="detail-item-label">Observações</div>
                  <div className="detail-item-value" style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{cliente.rustdesk.obs}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REDE */}
      {activeTab === 'rede' && (
        <div className="detail-section">
          <div className="detail-section-header">
            <span className="detail-section-title">🌐 Configurações de Rede</span>
          </div>
          <div className="detail-grid">
            {[
              { label: 'IP / Host', value: cliente.rede?.ip },
              { label: 'DNS', value: cliente.rede?.dns },
              { label: 'Gateway', value: cliente.rede?.gateway },
              { label: 'Máscara Sub-rede', value: cliente.rede?.mascaraSubrede },
              { label: 'VPN', value: cliente.rede?.vpn },
              { label: 'Portas Abertas', value: cliente.rede?.portas },
            ].map(item => (
              <div key={item.label} className="detail-item">
                <div className="detail-item-label">{item.label}</div>
                <PlainField value={item.value} />
              </div>
            ))}
            {cliente.rede?.observacoes && (
              <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                <div className="detail-item-label">Observações</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cliente.rede.observacoes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANCO */}
      {activeTab === 'banco' && (
        <div className="grid-2">
          <div className="detail-section">
            <div className="detail-section-header">
              <span className="detail-section-title">🔶 Oracle Database</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">Host / IP</div>
                <PlainField value={cliente.oracle?.host} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Porta</div>
                <PlainField value={cliente.oracle?.porta || '1521'} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Service Name</div>
                <PlainField value={cliente.oracle?.serviceName} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Usuário / Schema</div>
                <PlainField value={cliente.oracle?.usuario} />
              </div>
              <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                <div className="detail-item-label">Senha</div>
                <CopyField value={cliente.oracle?.senha} label="Senha Oracle" />
              </div>
              {cliente.oracle?.obs && (
                <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                  <div className="detail-item-label">Observações</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cliente.oracle.obs}</div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-header">
              <span className="detail-section-title">🔴 FireBird</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-item-label">Host</div>
                <PlainField value={cliente.firebird?.host} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Porta</div>
                <PlainField value={cliente.firebird?.porta || '3050'} />
              </div>
              <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                <div className="detail-item-label">Arquivo do Banco</div>
                <PlainField value={cliente.firebird?.banco} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Usuário</div>
                <PlainField value={cliente.firebird?.usuario} />
              </div>
              <div className="detail-item">
                <div className="detail-item-label">Senha</div>
                <CopyField value={cliente.firebird?.senha} label="Senha FireBird" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVIDOR */}
      {activeTab === 'servidor' && (
        <div className="detail-section">
          <div className="detail-section-header">
            <span className="detail-section-title">🖧 Informações do Servidor</span>
          </div>
          <div className="detail-grid">
            {[
              { label: 'Sistema Operacional', value: cliente.servidor?.os },
              { label: 'Processador', value: cliente.servidor?.cpu },
              { label: 'Memória RAM', value: cliente.servidor?.ram },
              { label: 'Armazenamento', value: cliente.servidor?.hd },
            ].map(item => (
              <div key={item.label} className="detail-item">
                <div className="detail-item-label">{item.label}</div>
                <div className="detail-item-value" style={{ fontFamily: 'inherit', color: item.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.value || '—'}</div>
              </div>
            ))}
            {cliente.servidor?.obs && (
              <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                <div className="detail-item-label">Observações</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cliente.servidor.obs}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SISTEMAS */}
      {activeTab === 'sistemas' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 Sistemas Instalados</span>
          </div>
          <div className="card-body">
            {!cliente.sistemasInstalados?.length ? (
              <p className="text-muted">Nenhum sistema registrado.</p>
            ) : (
              <div className="tags-row">
                {cliente.sistemasInstalados.map(s => (
                  <span key={s} className="badge badge-blue" style={{ fontSize: 13, padding: '6px 14px' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OBSERVAÇÕES */}
      {activeTab === 'obs' && (
        <div className="card">
          <div className="card-header"><span className="card-title">📝 Observações Gerais</span></div>
          <div className="card-body">
            {cliente.observacoes ? (
              <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{cliente.observacoes}</p>
            ) : (
              <p className="text-muted">Nenhuma observação registrada.</p>
            )}
          </div>
        </div>
      )}

      {showEdit && (
        <ClienteModal
          cliente={cliente}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
    </Layout>
  );
}
