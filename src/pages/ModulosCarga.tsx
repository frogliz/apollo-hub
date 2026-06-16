import React, { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { MODULOS_CARGA } from '../data/modulos-carga';
import { Server, Network, Settings, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const MODULE_COLORS: Record<string, string> = {
  'vendas-api': 'var(--apollo-blue)',
  'monitor-nfe': 'var(--green)',
  'apollo-automacao': 'var(--purple)',
  'config-ini': 'var(--text-muted)',
  'ws-mobile': 'var(--orange)',
  'gerenciador-execucao': 'var(--yellow)',
  'importacao-xml': 'var(--red)',
  'manifestacao': 'var(--green)',
};

export function ModulosCarga() {
  const [selected, setSelected] = useState(MODULOS_CARGA[0]);
  const [expandedConfig, setExpandedConfig] = useState(false);

  return (
    <Layout title="Módulos do Carga" subtitle="Documentação Técnica">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Módulos do Carga</h1>
          <p className="page-subtitle">Documentação técnica de cada serviço</p>
        </div>
      </div>

      <div className="alert alert-info mb-6" style={{ marginBottom: 24 }}>
        <Server size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Sequência de inicialização:</strong> PuTTY → lsnrctl start → sqlplus / as sysdba → startup; → exit → ServerApp → Serviços na ordem abaixo
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left: Module List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODULOS_CARGA.map((mod, idx) => {
            const color = MODULE_COLORS[mod.id] || 'var(--apollo-blue)';
            const isSelected = selected.id === mod.id;
            return (
              <div
                key={mod.id}
                className="module-card"
                style={{
                  '--module-color': color,
                  background: isSelected ? 'var(--bg-active)' : undefined,
                  borderColor: isSelected ? 'var(--border-blue)' : undefined,
                  cursor: 'pointer',
                } as React.CSSProperties}
                onClick={() => setSelected(mod)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: color, opacity: 0.2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {String(idx + 1).padStart(2, '0')}. {mod.nome}
                    </div>
                    {mod.porta && (
                      <div style={{ fontSize: 11, color: color, fontFamily: 'monospace' }}>
                        :{mod.porta}
                      </div>
                    )}
                  </div>
                  {isSelected ? <ChevronRight size={14} color={color} /> : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Module Detail */}
        <div className="animate-fade" key={selected.id}>
          <div className="card mb-4">
            <div className="card-header">
              <div>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: MODULE_COLORS[selected.id] || 'var(--apollo-blue)',
                    boxShadow: `0 0 8px ${MODULE_COLORS[selected.id] || 'var(--apollo-blue)'}`,
                  }} />
                  <span className="card-title" style={{ fontSize: 18 }}>{selected.nome}</span>
                  {selected.porta && (
                    <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                      Porta {selected.porta}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                {selected.descricao}
              </p>

              {/* Details */}
              <div className="section-header" style={{ marginBottom: 12 }}>
                <span className="section-title">Características</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {selected.detalhes?.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '8px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 8,
                    borderLeft: `3px solid ${MODULE_COLORS[selected.id] || 'var(--apollo-blue)'}`,
                  }}>
                    <span style={{ color: MODULE_COLORS[selected.id] || 'var(--apollo-blue)', fontSize: 14, flexShrink: 0 }}>›</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Config */}
              {selected.config && Object.keys(selected.config).length > 0 && (
                <>
                  <div
                    className="section-header"
                    style={{ cursor: 'pointer', marginBottom: 12 }}
                    onClick={() => setExpandedConfig(!expandedConfig)}
                  >
                    <span className="section-title">Configurações Padrão</span>
                    {expandedConfig ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                  </div>
                  {expandedConfig && (
                    <div className="detail-section animate-fade">
                      <div className="detail-grid">
                        {Object.entries(selected.config).map(([k, v]) => (
                          <div key={k} className="detail-item">
                            <div className="detail-item-label">{k}</div>
                            <div className="flex items-center gap-2">
                              <span className="detail-item-value">{v}</span>
                              <button
                                className="copy-btn"
                                onClick={() => { navigator.clipboard.writeText(v); toast.success('Copiado!'); }}
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Tip */}
          {selected.id === 'vendas-api' && (
            <div className="alert alert-warning">
              <Network size={16} style={{ flexShrink: 0 }} />
              <span>Certifique-se que a porta <strong>9001</strong> está liberada no firewall do servidor para todos os PDVs da rede.</span>
            </div>
          )}
          {selected.id === 'manifestacao' && (
            <div className="alert alert-warning">
              <Settings size={16} style={{ flexShrink: 0 }} />
              <span>O certificado digital A1 precisa estar instalado e válido. Manifestações atrasadas geram multa fiscal.</span>
            </div>
          )}
          {selected.id === 'ws-mobile' && (
            <div className="alert alert-info">
              <Network size={16} style={{ flexShrink: 0 }} />
              <span>Verifique se a porta <strong>228</strong> está liberada para acesso externo se o app for usado fora da rede local (4G/WiFi externo).</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
