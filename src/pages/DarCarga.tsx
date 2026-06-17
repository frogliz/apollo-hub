import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/Layout/Layout';
import {
  enviarComandoCarga,
  ouvirComandosRecentes,
  ouvirStatusAgentes,
  deletarAgente,
  ComandoCarga,
  AgenteStatus,
} from '../firebase/services/carga';
import {
  Power, Wifi, WifiOff, RefreshCw, CheckCircle,
  AlertCircle, Clock, Download, Terminal, Activity,
  Zap, Monitor, Trash2, Globe, Server, Cpu, MemoryStick,
  Network, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────
function minutosAtras(ts: any): number | null {
  if (!ts) return null;
  const iso = typeof ts === 'string' ? ts : ts.seconds ? new Date(ts.seconds * 1000).toISOString() : null;
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

function isOnline(agente: AgenteStatus): boolean {
  const min = minutosAtras(agente.ultimaAtividade);
  return min !== null && min < 3;
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ComandoCarga['status'] }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending:    { label: 'Aguardando', color: 'var(--yellow)', icon: <Clock size={10} /> },
    executando: { label: 'Executando', color: 'var(--orange)', icon: <RefreshCw size={10} className="spin" /> },
    concluido:  { label: 'Concluído',  color: 'var(--green)',  icon: <CheckCircle size={10} /> },
    erro:       { label: 'Erro',       color: 'var(--red)',    icon: <AlertCircle size={10} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
      padding: '2px 8px', borderRadius: 20, fontWeight: 600,
      background: s.color + '22', color: s.color, border: `1px solid ${s.color}44`
    }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Card de Máquina ───────────────────────────────────────────────────────────
function MaquinaCard({
  agente, ultimoCmd, onDarCarga, onVerificar, onDeletar, loading
}: {
  agente: AgenteStatus;
  ultimoCmd?: ComandoCarga;
  onDarCarga: () => void;
  onVerificar: () => void;
  onDeletar: () => void;
  loading: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const online = isOnline(agente);
  const min = minutosAtras(agente.ultimaAtividade);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Header da máquina */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: online ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
        borderBottom: expandido ? '1px solid var(--border-default)' : 'none',
      }}>
        {/* Indicador online */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: online ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,120,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Monitor size={18} color={online ? 'var(--green)' : 'var(--text-muted)'} />
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              {agente.hostname || 'Máquina sem nome'}
            </span>
            {/* Dot pulsante */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: online ? 'var(--green)' : 'var(--text-muted)',
              boxShadow: online ? '0 0 6px var(--green)' : 'none',
            }} />
            <span style={{ fontSize: 11, color: online ? 'var(--green)' : 'var(--text-muted)' }}>
              {online ? 'Online' : min !== null ? `Offline (${min}min atrás)` : 'Nunca visto'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Cliente */}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              👤 {agente.clienteNome || <span style={{ color: 'var(--yellow)' }}>Sem cliente</span>}
            </span>
            {/* Carga status */}
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 600,
              background: agente.cargaOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
              color: agente.cargaOnline ? 'var(--green)' : 'var(--red)',
            }}>
              ⚡ {agente.cargaOnline ? 'Carga UP' : 'Carga DOWN'}
            </span>
            {/* IP */}
            {agente.ip_local && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                🌐 {agente.ip_local}
              </span>
            )}
            {/* RDP */}
            {agente.rdp_porta && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                RDP :{agente.rdp_porta}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setExpandido(!expandido)}
            className="btn btn-secondary btn-sm"
            title="Ver detalhes"
            style={{ padding: '5px 8px' }}
          >
            {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={onVerificar}
            disabled={loading || !online}
            className="btn btn-secondary btn-sm"
            title={!online ? 'Agent offline' : 'Verificar status'}
          >
            <Wifi size={13} /> Verificar
          </button>
          <button
            onClick={onDarCarga}
            disabled={loading || !online}
            className="btn btn-sm"
            style={{
              background: online
                ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                : 'var(--bg-elevated)',
              color: online ? 'white' : 'var(--text-muted)',
              border: 'none',
            }}
            title={!online ? 'Agent offline' : 'Dar carga'}
          >
            {loading ? <RefreshCw size={13} className="spin" /> : <Power size={13} />}
            {loading ? 'Enviando...' : 'Dar Carga'}
          </button>
          <button
            onClick={onDeletar}
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 8px', color: 'var(--red)' }}
            title="Remover perfil"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Detalhes expandido */}
      {expandido && (
        <div style={{ padding: '14px 18px', background: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { icon: <Monitor size={13} />, label: 'Sistema Operacional', value: agente.so },
              { icon: <Cpu size={13} />, label: 'Processador', value: agente.processador },
              { icon: <MemoryStick size={13} />, label: 'RAM', value: agente.ram_gb ? `${agente.ram_gb} GB` : null },
              { icon: <Network size={13} />, label: 'IP Local', value: agente.ip_local },
              { icon: <Globe size={13} />, label: 'IP Público', value: agente.ip_publico },
              { icon: <Server size={13} />, label: 'Porta RDP', value: agente.rdp_porta ? String(agente.rdp_porta) : null },
              { icon: <Zap size={13} />, label: 'Versão Agent', value: agente.versao },
              { icon: <Activity size={13} />, label: 'ID Máquina', value: agente.maquinaId },
            ].filter(i => i.value).map(({ icon, label, value }) => (
              <div key={label} style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Interfaces de rede */}
          {agente.interfaces && agente.interfaces.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                <Network size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Interfaces de Rede
              </div>
              {agente.interfaces.map((iface: string, i: number) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {iface}
                </div>
              ))}
            </div>
          )}

          {/* Último comando */}
          {ultimoCmd && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{ultimoCmd.log}</span>
              <StatusBadge status={ultimoCmd.status} />
            </div>
          )}
        </div>
      )}

      {/* Log bar quando executando */}
      {ultimoCmd && (ultimoCmd.status === 'executando' || ultimoCmd.status === 'pending') && !expandido && (
        <div style={{
          padding: '8px 18px', background: 'var(--bg-base)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--yellow)', fontFamily: 'monospace',
        }}>
          <Terminal size={12} />
          {ultimoCmd.log}
          <span style={{ animation: 'blink 1s infinite' }}>█</span>
        </div>
      )}
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────
export function DarCarga() {
  const [agentes, setAgentes] = useState<AgenteStatus[]>([]);
  const [comandos, setComandos] = useState<ComandoCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState<Record<string, boolean>>({});
  const [filtro, setFiltro] = useState('');
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAgentes = ouvirStatusAgentes((a) => { setAgentes(a); setLoading(false); });
    const unsubCmds = ouvirComandosRecentes(setComandos);
    return () => { unsubAgentes(); unsubCmds(); };
  }, []);

  const getUltimoComando = useCallback((clienteId: string) =>
    comandos.find((c) => c.clienteId === clienteId), [comandos]);

  const handleDarCarga = async (agente: AgenteStatus) => {
    const key = agente.id!;
    setEnviando(e => ({ ...e, [key]: true }));
    try {
      await enviarComandoCarga(agente.clienteId || key, agente.clienteNome, 'dar_carga');
      toast.success(`Comando enviado para ${agente.hostname}!`);
    } catch { toast.error('Erro ao enviar comando'); }
    finally { setEnviando(e => ({ ...e, [key]: false })); }
  };

  const handleVerificar = async (agente: AgenteStatus) => {
    const key = `v_${agente.id}`;
    setEnviando(e => ({ ...e, [key]: true }));
    try {
      await enviarComandoCarga(agente.clienteId || agente.id!, agente.clienteNome, 'verificar_status');
      toast.success('Verificando...');
    } catch { toast.error('Erro'); }
    finally { setEnviando(e => ({ ...e, [key]: false })); }
  };

  const handleDeletar = async (agente: AgenteStatus) => {
    if (!confirm(`Remover perfil de "${agente.hostname}"?`)) return;
    setDeletandoId(agente.id!);
    try {
      await deletarAgente(agente.id!);
      toast.success('Perfil removido!');
    } catch { toast.error('Erro ao remover'); }
    finally { setDeletandoId(null); }
  };

  const agentesFiltrados = agentes.filter(a =>
    !filtro ||
    a.hostname?.toLowerCase().includes(filtro.toLowerCase()) ||
    a.clienteNome?.toLowerCase().includes(filtro.toLowerCase()) ||
    a.ip_local?.includes(filtro)
  );

  const onlineCount = agentes.filter(isOnline).length;
  const cargaOnlineCount = agentes.filter(a => a.cargaOnline).length;

  return (
    <Layout title="Dar Carga" subtitle="Gerenciamento remoto de servidores">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚡ Dar Carga</h1>
          <p className="page-subtitle">Inicialização remota dos servidores</p>
        </div>
        <a
          href="https://github.com/frogliz/apollo-hub/tree/main/apollo-agent"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={15} /> Baixar Apollo Agent
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Máquinas Registradas', value: agentes.length, color: 'var(--apollo-blue)', icon: <Monitor size={16} /> },
          { label: 'Agents Online', value: onlineCount, color: 'var(--green)', icon: <Wifi size={16} /> },
          { label: 'Carga Online', value: cargaOnlineCount, color: 'var(--purple)', icon: <Zap size={16} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Instruções se não há agents */}
      {!loading && agentes.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <Monitor size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>Nenhuma máquina registrada</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
            Instale o Apollo Agent nos servidores dos clientes para gerenciá-los aqui.
          </p>
          <div style={{
            textAlign: 'left', background: 'var(--bg-base)', borderRadius: 10,
            padding: 16, maxWidth: 400, margin: '0 auto',
            fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2,
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'inherit' }}>📦 Como instalar:</div>
            1. Baixe a pasta <strong>apollo-agent/</strong> do GitHub<br />
            2. Edite <strong>config.json</strong> (clienteId + clienteNome)<br />
            3. Rode <strong>install.bat</strong> como Administrador<br />
            4. A máquina aparece aqui em ~5 segundos ✅
          </div>
          <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: 'var(--red)' }}>
            ⚠️ <strong>IMPORTANTE:</strong> Antes de instalar, atualize as regras do Firestore no console Firebase para permitir o agent escrever.
          </div>
        </div>
      )}

      {/* Lista de máquinas */}
      {agentes.length > 0 && (
        <>
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <Activity size={15} color="var(--text-muted)" />
            <input
              placeholder="Buscar por hostname, cliente ou IP..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <div className="empty-state"><RefreshCw size={24} className="spin" /></div>
            ) : agentesFiltrados.length === 0 ? (
              <div className="empty-state">Nenhuma máquina encontrada</div>
            ) : (
              agentesFiltrados
                .sort((a, b) => (isOnline(b) ? 1 : 0) - (isOnline(a) ? 1 : 0))
                .map(agente => (
                  <MaquinaCard
                    key={agente.id}
                    agente={agente}
                    ultimoCmd={getUltimoComando(agente.clienteId || agente.id!)}
                    onDarCarga={() => handleDarCarga(agente)}
                    onVerificar={() => handleVerificar(agente)}
                    onDeletar={() => handleDeletar(agente)}
                    loading={enviando[agente.id!] || deletandoId === agente.id}
                  />
                ))
            )}
          </div>
        </>
      )}

      {/* Log em tempo real (lateral) */}
      {comandos.length > 0 && (
        <div className="card" style={{ marginTop: 20, padding: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 13 }}>
              <Terminal size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Log de Comandos Recentes
            </span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {comandos.slice(0, 10).map(cmd => (
              <div key={cmd.id} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{cmd.clienteNome}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{cmd.log}</span>
                </div>
                <StatusBadge status={cmd.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}
