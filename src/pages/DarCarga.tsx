import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/Layout/Layout';
import { getClientes } from '../firebase/services/clientes';
import {
  enviarComandoCarga,
  ouvirComandosRecentes,
  ouvirStatusAgentes,
  ComandoCarga,
  AgenteStatus,
} from '../firebase/services/carga';
import { Cliente } from '../types';
import {
  Power, Wifi, WifiOff, RefreshCw, CheckCircle,
  AlertCircle, Clock, Download, Terminal, Activity, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: ComandoCarga['status'] }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:    { label: 'Aguardando', cls: 'badge-yellow',  icon: <Clock size={10} /> },
    executando: { label: 'Executando', cls: 'badge-orange',  icon: <RefreshCw size={10} className="spin" /> },
    concluido:  { label: 'Concluído',  cls: 'badge-green',   icon: <CheckCircle size={10} /> },
    erro:       { label: 'Erro',       cls: 'badge-red',     icon: <AlertCircle size={10} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`badge ${s.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {s.icon} {s.label}
    </span>
  );
}

function AgenteIndicador({ agente }: { agente?: AgenteStatus }) {
  if (!agente) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <WifiOff size={13} /> Agent não instalado
      </div>
    );
  }
  const minutosAgo = agente.ultimaAtividade?.seconds
    ? Math.round((Date.now() / 1000 - agente.ultimaAtividade.seconds) / 60)
    : null;
  const ativo = minutosAgo !== null && minutosAgo < 3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: ativo ? 'var(--green)' : 'var(--red)',
        boxShadow: ativo ? '0 0 6px var(--green)' : 'none',
        animation: ativo ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color: ativo ? 'var(--green)' : 'var(--red)' }}>
        {ativo ? 'Agent online' : 'Agent offline'}
      </span>
      {ativo && (
        <span className={`badge ${agente.cargaOnline ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
          {agente.cargaOnline ? '⚡ Carga UP' : '💤 Carga DOWN'}
        </span>
      )}
      {minutosAgo !== null && !ativo && (
        <span style={{ color: 'var(--text-muted)' }}>• {minutosAgo}min atrás</span>
      )}
    </div>
  );
}

export function DarCarga() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agentes, setAgentes] = useState<AgenteStatus[]>([]);
  const [comandos, setComandos] = useState<ComandoCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState<Record<string, boolean>>({});
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    getClientes().then((c) => { setClientes(c); setLoading(false); });

    const unsubCmds = ouvirComandosRecentes(setComandos);
    const unsubAgentes = ouvirStatusAgentes(setAgentes);
    return () => { unsubCmds(); unsubAgentes(); };
  }, []);

  const getAgente = useCallback((clienteId: string) =>
    agentes.find((a) => a.clienteId === clienteId), [agentes]);

  const getUltimoComando = useCallback((clienteId: string) =>
    comandos.find((c) => c.clienteId === clienteId), [comandos]);

  const handleDarCarga = async (cliente: Cliente) => {
    const id = cliente.id!;
    setEnviando((e) => ({ ...e, [id]: true }));
    try {
      await enviarComandoCarga(id, cliente.razaoSocial, 'dar_carga');
      toast.success(`Comando enviado para ${cliente.nomeFantasia || cliente.razaoSocial}!`);
    } catch {
      toast.error('Erro ao enviar comando');
    } finally {
      setEnviando((e) => ({ ...e, [id]: false }));
    }
  };

  const handleVerificar = async (cliente: Cliente) => {
    const id = cliente.id!;
    setEnviando((e) => ({ ...e, [`v_${id}`]: true }));
    try {
      await enviarComandoCarga(id, cliente.razaoSocial, 'verificar_status');
      toast.success('Verificando status...');
    } catch {
      toast.error('Erro ao verificar');
    } finally {
      setEnviando((e) => ({ ...e, [`v_${id}`]: false }));
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    !filtro || c.razaoSocial.toLowerCase().includes(filtro.toLowerCase()) ||
    c.nomeFantasia?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout title="Dar Carga" subtitle="Inicialização remota Oracle + Serviços">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚡ Dar Carga</h1>
          <p className="page-subtitle">Inicialização remota dos servidores por cliente</p>
        </div>
        <a
          href="/apollo-agent.zip"
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={15} /> Baixar Apollo Agent
        </a>
      </div>

      {/* Info Banner */}
      <div className="alert alert-info mb-4" style={{ marginBottom: 20 }}>
        <Activity size={18} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13 }}>
          <strong>Como funciona:</strong> Instale o <strong>Apollo Agent</strong> em cada servidor de cliente.
          O Agent detecta o comando em ~2s e executa: verificação de status → Oracle startup (se necessário) → logoff → shell:startup sobe tudo.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Lista de Clientes */}
        <div>
          <div className="search-bar mb-4" style={{ marginBottom: 16 }}>
            <Activity size={15} color="var(--text-muted)" />
            <input
              placeholder="Buscar cliente..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 28, height: 28, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientesFiltrados.map((cliente) => {
                const agente = getAgente(cliente.id!);
                const ultimoCmd = getUltimoComando(cliente.id!);
                const isEnviando = enviando[cliente.id!];
                const isVerificando = enviando[`v_${cliente.id!}`];
                const agenteOnline = agente && agente.ultimaAtividade?.seconds &&
                  Math.round((Date.now() / 1000 - agente.ultimaAtividade.seconds) / 60) < 3;

                return (
                  <div key={cliente.id} className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                      {/* Info Cliente */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {cliente.nomeFantasia || cliente.razaoSocial}
                        </div>
                        <AgenteIndicador agente={agente} />
                      </div>

                      {/* Último Comando */}
                      {ultimoCmd && (
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                          <div style={{ marginBottom: 4 }}><StatusBadge status={ultimoCmd.status} /></div>
                          <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ultimoCmd.log}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleVerificar(cliente)}
                          disabled={isVerificando || !agenteOnline}
                          title={!agenteOnline ? 'Agent offline — instale o Apollo Agent no servidor' : 'Verificar status'}
                        >
                          {isVerificando ? <RefreshCw size={13} className="spin" /> : <Wifi size={13} />}
                          Verificar
                        </button>
                        <button
                          className={`btn btn-sm ${agenteOnline ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleDarCarga(cliente)}
                          disabled={isEnviando || !agenteOnline}
                          title={!agenteOnline ? 'Agent offline — instale o Apollo Agent no servidor' : 'Dar carga'}
                          style={{
                            background: agenteOnline ? 'linear-gradient(135deg, var(--apollo-blue), var(--purple))' : undefined,
                          }}
                        >
                          {isEnviando
                            ? <RefreshCw size={13} className="spin" />
                            : <Power size={13} />}
                          {isEnviando ? 'Enviando...' : 'Dar Carga'}
                        </button>
                      </div>
                    </div>

                    {/* Log bar quando executando */}
                    {ultimoCmd && (ultimoCmd.status === 'executando' || ultimoCmd.status === 'pending') && (
                      <div style={{
                        borderTop: '1px solid var(--border-default)',
                        padding: '10px 20px',
                        background: 'var(--bg-base)',
                        borderRadius: '0 0 12px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: 'var(--yellow)',
                        fontFamily: 'monospace',
                      }}>
                        <Terminal size={12} />
                        {ultimoCmd.log}
                        <span style={{ animation: 'blink 1s infinite', marginLeft: 2 }}>█</span>
                      </div>
                    )}

                    {/* Log de erro ou sucesso */}
                    {ultimoCmd && (ultimoCmd.status === 'concluido' || ultimoCmd.status === 'erro') && (
                      <div style={{
                        borderTop: '1px solid var(--border-default)',
                        padding: '8px 20px',
                        background: 'var(--bg-base)',
                        borderRadius: '0 0 12px 12px',
                        fontSize: 12,
                        color: ultimoCmd.status === 'concluido' ? 'var(--green)' : 'var(--red)',
                        fontFamily: 'monospace',
                      }}>
                        {ultimoCmd.status === 'concluido' ? '✅' : '❌'} {ultimoCmd.log}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel lateral — Log em tempo real */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 13 }}>
              <Zap size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Log em Tempo Real
            </span>
          </div>
          <div style={{ padding: '8px 0', maxHeight: 500, overflowY: 'auto' }}>
            {comandos.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <p style={{ fontSize: 12 }}>Nenhum comando ainda</p>
              </div>
            ) : (
              comandos.slice(0, 15).map((cmd) => (
                <div key={cmd.id} className="cofre-item" style={{ padding: '10px 16px', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                    background: cmd.status === 'concluido' ? 'var(--green)'
                      : cmd.status === 'erro' ? 'var(--red)'
                      : cmd.status === 'executando' ? 'var(--orange)'
                      : 'var(--yellow)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cmd.clienteNome}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cmd.log}
                    </div>
                  </div>
                  <StatusBadge status={cmd.status} />
                </div>
              ))
            )}
          </div>

          {/* Instruções de Instalação */}
          <div style={{ borderTop: '1px solid var(--border-default)', padding: '16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
              📦 Instalar Apollo Agent
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, fontFamily: 'monospace' }}>
              1. Baixe o <strong>apollo-agent.zip</strong><br />
              2. Extraia no servidor do cliente<br />
              3. Edite <strong>config.json</strong> (ID do cliente)<br />
              4. Rode <strong>install.bat</strong> como Admin<br />
              5. ✅ Agent inicia automático!
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}
