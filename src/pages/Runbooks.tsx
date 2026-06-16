import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { getRunbooks, addRunbook, deleteRunbook } from '../firebase/services/runbooks';
import { Runbook } from '../types';
import { RUNBOOKS_SEED } from '../data/runbooks-seed';
import {
  Plus, Search, BookOpen, Trash2,
  Terminal, Download, Pin, CheckCircle, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Runbooks() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [filtered, setFiltered] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModulo, setFilterModulo] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selected, setSelected] = useState<Runbook | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newModulo, setNewModulo] = useState('Carga');
  const [savingNew, setSavingNew] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getRunbooks();
    setRunbooks(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = runbooks;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        r.titulo.toLowerCase().includes(s) ||
        r.descricao.toLowerCase().includes(s) ||
        r.tags?.some(t => t.toLowerCase().includes(s))
      );
    }
    if (filterModulo) result = result.filter(r => r.modulo === filterModulo);
    setFiltered(result);
  }, [search, filterModulo, runbooks]);

  const modulos = [...new Set(runbooks.map(r => r.modulo))];

  const handleSeed = async () => {
    if (!confirm('Isso vai importar os runbooks padrão Apollo. Continuar?')) return;
    setSeeding(true);
    try {
      for (const rb of RUNBOOKS_SEED) {
        await addRunbook(rb);
      }
      toast.success(`${RUNBOOKS_SEED.length} runbooks importados!`);
      load();
    } catch {
      toast.error('Erro ao importar runbooks');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (rb: Runbook) => {
    if (!confirm(`Excluir "${rb.titulo}"?`)) return;
    await deleteRunbook(rb.id!);
    toast.success('Runbook excluído');
    if (selected?.id === rb.id) setSelected(null);
    load();
  };

  const stepTypeColor = (tipo?: string) => {
    if (tipo === 'comando') return 'var(--apollo-blue)';
    if (tipo === 'aviso') return 'var(--yellow)';
    if (tipo === 'verificacao') return 'var(--green)';
    return 'var(--text-muted)';
  };

  return (
    <Layout title="Runbooks" subtitle="Procedimentos Técnicos">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Runbooks</h1>
          <p className="page-subtitle">Procedimentos técnicos passo a passo</p>
        </div>
        <div className="flex gap-2">
          {runbooks.length === 0 && (
            <button className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
              <Download size={15} /> {seeding ? 'Importando...' : 'Importar Padrões Apollo'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Novo Runbook
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={16} color="var(--text-muted)" />
          <input placeholder="Buscar runbooks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="form-control"
          style={{ width: 200 }}
          value={filterModulo}
          onChange={e => setFilterModulo(e.target.value)}
        >
          <option value="">Todos os módulos</option>
          {modulos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20 }}>
        {/* List */}
        <div>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 28, height: 28, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BookOpen size={28} /></div>
              <h3>{runbooks.length === 0 ? 'Nenhum runbook ainda' : 'Sem resultados'}</h3>
              <p>{runbooks.length === 0 ? 'Importe os procedimentos padrão Apollo ou crie um novo.' : 'Tente outros filtros.'}</p>
              {runbooks.length === 0 && (
                <button className="btn btn-primary mt-3" onClick={handleSeed} disabled={seeding}>
                  <Download size={15} /> Importar Padrões Apollo
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(rb => (
                <div
                  key={rb.id}
                  className={`card ${selected?.id === rb.id ? 'card-active' : ''}`}
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    borderColor: selected?.id === rb.id ? 'var(--apollo-blue)' : undefined,
                    background: selected?.id === rb.id ? 'var(--bg-active)' : undefined,
                  }}
                  onClick={() => setSelected(rb)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {rb.isPinned && <Pin size={12} color="var(--yellow)" />}
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{rb.modulo}</span>
                    <span className="badge badge-gray" style={{ fontSize: 10 }}>{rb.categoria}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{rb.passos.length} passos</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{rb.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {rb.descricao}
                  </div>
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rb)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card animate-fade" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
            <div className="card-header">
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="badge badge-blue">{selected.modulo}</span>
                  <span className="badge badge-gray">{selected.categoria}</span>
                </div>
                <div className="card-title">{selected.titulo}</div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{selected.descricao}</p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                {selected.passos.map((passo, i) => (
                  <div key={i} className="step-item">
                    <div className="step-number">{passo.ordem}</div>
                    <div className="step-content" style={{ flex: 1 }}>
                      <div className="step-title" style={{ color: stepTypeColor(passo.tipo) }}>
                        {passo.tipo === 'comando' && <Terminal size={12} style={{ display: 'inline', marginRight: 4 }} />}
                        {passo.tipo === 'verificacao' && <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />}
                        {passo.titulo}
                      </div>
                      <div className="step-description">{passo.instrucao}</div>
                      {passo.comando && (
                        <div
                          className="step-cmd"
                          style={{ cursor: 'pointer' }}
                          onClick={() => { navigator.clipboard.writeText(passo.comando!); toast.success('Comando copiado!'); }}
                          title="Clique para copiar"
                        >
                          {passo.comando}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="mt-4">
                  <div className="tags-row">
                    {selected.tags.map(t => (
                      <span key={t} className="badge badge-gray" style={{ fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Novo Runbook</span>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="form-control" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Reiniciar serviço de NF-e" />
              </div>
              <div className="form-group">
                <label className="form-label">Módulo</label>
                <select className="form-control" value={newModulo} onChange={e => setNewModulo(e.target.value)}>
                  {['Carga','Vendas API','Monitor NF-e','Apollo Automação','Ws Apollo Gestão Mobile','UFrmConfigIniImportXml','Gerenciador de Execução','NF-e Importação XML','Manifestação Destinatário','PDV','Retaguarda','Oracle','Outro'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-control" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Descreva o propósito deste runbook..." />
              </div>
              <div className="alert alert-info" style={{ fontSize: 12 }}>
                💡 Após criar, você pode adicionar os passos editando o runbook.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={savingNew}
                onClick={async () => {
                  if (!newTitle.trim()) { toast.error('Título é obrigatório'); return; }
                  setSavingNew(true);
                  try {
                    await addRunbook({ titulo: newTitle, descricao: newDesc, modulo: newModulo, categoria: 'Geral', passos: [], tags: [] });
                    toast.success('Runbook criado!');
                    setShowCreate(false); setNewTitle(''); setNewDesc('');
                    load();
                  } catch { toast.error('Erro ao criar'); } finally { setSavingNew(false); }
                }}
              >
                {savingNew ? 'Criando...' : <><Save size={14} /> Criar Runbook</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
