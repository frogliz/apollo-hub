import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { getClientes } from '../firebase/services/clientes';
import { getConhecimentos } from '../firebase/services/conhecimento';
import { getRunbooks } from '../firebase/services/runbooks';
import { Cliente, Conhecimento, Runbook } from '../types';
import {
  Users, BookOpen, ShieldAlert, Server, ArrowRight,
  Activity, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

export function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conhecimentos, setConhecimentos] = useState<Conhecimento[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getClientes(),
      getConhecimentos(),
      getRunbooks(),
    ]).then(([c, k, r]) => {
      setClientes(c);
      setConhecimentos(k);
      setRunbooks(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const clientesAtivos = clientes.filter(c => c.status === 'ativo' || !c.status).length;
  const errosCriticos = conhecimentos.filter(k => k.criticidade === 'critica' || k.criticidade === 'alta').length;

  const stats = [
    {
      label: 'Clientes Ativos',
      value: clientesAtivos,
      icon: Users,
      color: 'var(--apollo-blue)',
      bg: 'rgba(30,111,217,0.15)',
      path: '/clientes',
    },
    {
      label: 'Runbooks',
      value: runbooks.length,
      icon: BookOpen,
      color: 'var(--green)',
      bg: 'var(--green-bg)',
      path: '/runbooks',
    },
    {
      label: 'Soluções Catalogadas',
      value: conhecimentos.length,
      icon: ShieldAlert,
      color: 'var(--purple)',
      bg: 'var(--purple-bg)',
      path: '/conhecimento',
    },
    {
      label: 'Erros Críticos/Altos',
      value: errosCriticos,
      icon: AlertTriangle,
      color: 'var(--red)',
      bg: 'var(--red-bg)',
      path: '/conhecimento',
    },
  ];

  const pinnedRunbooks = runbooks.filter(r => r.isPinned).slice(0, 3);
  const recentConhecimentos = conhecimentos.slice(0, 5);

  const moduloCargaColors: Record<string, string> = {
    'Vendas API': 'var(--apollo-blue)',
    'Monitor NF-e': 'var(--green)',
    'Apollo Automação': 'var(--purple)',
    'Ws Apollo Gestão Mobile': 'var(--orange)',
    'Gerenciador de Execução': 'var(--yellow)',
    'UFrmConfigIniImportXml': 'var(--text-muted)',
    'NF-e Importação XML': 'var(--red)',
    'Manifestação Destinatário': 'var(--green)',
  };

  return (
    <Layout title="Dashboard" subtitle="Visão Geral">
      {/* Stats */}
      <div className="grid-4 mb-6">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="stat-card"
            style={{ '--stat-color': stat.color, '--stat-bg': stat.bg, cursor: 'pointer' } as React.CSSProperties}
            onClick={() => navigate(stat.path)}
          >
            <div className="stat-icon">
              <stat.icon size={22} color={stat.color} />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {loading ? '—' : stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Runbooks Fixados */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⭐ Procedimentos Rápidos</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/runbooks')}>
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%', margin: '0 auto' }} />
              </div>
            ) : pinnedRunbooks.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <p>Nenhum runbook fixado ainda.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate('/runbooks')}>
                  Ver Runbooks
                </button>
              </div>
            ) : (
              pinnedRunbooks.map(rb => (
                <div
                  key={rb.id}
                  className="cofre-item"
                  onClick={() => navigate(`/runbooks/${rb.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: moduloCargaColors[rb.modulo] || 'var(--apollo-blue)',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div className="cofre-item-label">{rb.titulo}</div>
                    <div className="cofre-item-obs">{rb.modulo} • {rb.passos.length} passos</div>
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conhecimentos Recentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Soluções Recentes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/conhecimento')}>
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%', margin: '0 auto' }} />
              </div>
            ) : recentConhecimentos.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <p>Nenhuma solução catalogada ainda.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate('/conhecimento')}>
                  Adicionar Solução
                </button>
              </div>
            ) : (
              recentConhecimentos.map(k => (
                <div
                  key={k.id}
                  className="cofre-item"
                  onClick={() => navigate(`/conhecimento/${k.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: k.criticidade === 'critica' ? 'var(--red)'
                      : k.criticidade === 'alta' ? 'var(--orange)'
                      : k.criticidade === 'media' ? 'var(--yellow)'
                      : 'var(--green)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div className="cofre-item-label">{k.titulo}</div>
                    <div className="cofre-item-obs">{k.modulo}</div>
                  </div>
                  <span className={`badge badge-${k.criticidade === 'critica' ? 'red' : k.criticidade === 'alta' ? 'orange' : k.criticidade === 'media' ? 'yellow' : 'green'}`} style={{ fontSize: 10 }}>
                    {k.criticidade || 'baixa'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sistema Info */}
      <div className="card mt-6">
        <div className="card-header">
          <span className="card-title">🖥️ Módulos do Carga — Visão Rápida</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/carga')}>
            Ver documentação <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { nome: 'Vendas API', porta: ':9001', status: 'TCP', color: 'var(--apollo-blue)' },
              { nome: 'Monitor NF-e', porta: '', status: 'SEFAZ', color: 'var(--green)' },
              { nome: 'Apollo Automação', porta: '', status: 'TCP', color: 'var(--purple)' },
              { nome: 'Config Ini XML', porta: '', status: 'CONFIG', color: 'var(--text-muted)' },
              { nome: 'Ws Mobile', porta: ':228', status: 'REST', color: 'var(--orange)' },
              { nome: 'Gerenciador', porta: '', status: 'SVC', color: 'var(--yellow)' },
              { nome: 'Import XML', porta: '', status: 'BATCH', color: 'var(--red)' },
              { nome: 'Manifestação', porta: '', status: 'SEFAZ', color: 'var(--green)' },
            ].map(m => (
              <div key={m.nome} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${m.color}`,
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => navigate('/carga')}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-blue)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {m.nome}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge badge-gray" style={{ fontSize: 10 }}>{m.status}</span>
                  {m.porta && <span style={{ fontSize: 11, fontFamily: 'monospace', color: m.color }}>{m.porta}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Startup sequence reminder */}
      <div className="alert alert-info mt-6" style={{ marginTop: 24 }}>
        <Activity size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Sequência de Start do Servidor:</strong>{' '}
          PuTTY (oracle/ap0ll0) → <code>lsnrctl start</code> → <code>sqlplus / as sysdba</code> → <code>startup;</code> → <code>exit</code> → ServerApp → Serviços
        </div>
      </div>
    </Layout>
  );
}
