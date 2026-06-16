import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { getConhecimentos, addConhecimento, deleteConhecimento } from '../firebase/services/conhecimento';
import { Conhecimento as ConhecimentoItem } from '../types';
import { Plus, Search, ShieldAlert, X, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MODULOS = [
  'Carga', 'Vendas API', 'Monitor NF-e', 'Apollo Automação',
  'UFrmConfigIniImportXml', 'Ws Apollo Gestão Mobile', 'Gerenciador de Execução',
  'NF-e Importação XML', 'Manifestação Destinatário', 'PDV', 'Retaguarda',
  'Oracle', 'FireBird', 'Rede / Infraestrutura', 'Windows Server', 'Outro',
];

const CRITICIDADES = [
  { value: 'baixa', label: '🟢 Baixa', badge: 'badge-green' },
  { value: 'media', label: '🟡 Média', badge: 'badge-yellow' },
  { value: 'alta', label: '🟠 Alta', badge: 'badge-orange' },
  { value: 'critica', label: '🔴 Crítica', badge: 'badge-red' },
];

function CriticidadeBadge({ c }: { c?: string }) {
  const map: Record<string, string> = { critica: 'badge-red', alta: 'badge-orange', media: 'badge-yellow', baixa: 'badge-green' };
  return <span className={`badge ${map[c || 'baixa']}`}>{c || 'baixa'}</span>;
}

export function Conhecimento() {
  const [items, setItems] = useState<ConhecimentoItem[]>([]);
  const [filtered, setFiltered] = useState<ConhecimentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMod, setFilterMod] = useState('');
  const [filterCrit, setFilterCrit] = useState('');
  const [selected, setSelected] = useState<ConhecimentoItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getConhecimentos();
    setItems(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let r = items;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(i => i.titulo.toLowerCase().includes(s) || i.sintoma.toLowerCase().includes(s) || i.tags?.some(t => t.toLowerCase().includes(s)));
    }
    if (filterMod) r = r.filter(i => i.modulo === filterMod);
    if (filterCrit) r = r.filter(i => i.criticidade === filterCrit);
    setFiltered(r);
  }, [search, filterMod, filterCrit, items]);

  const handleDelete = async (item: ConhecimentoItem) => {
    if (!confirm(`Excluir "${item.titulo}"?`)) return;
    await deleteConhecimento(item.id!);
    toast.success('Excluído!');
    if (selected?.id === item.id) setSelected(null);
    load();
  };

  return (
    <Layout title="Base de Conhecimento" subtitle="Erros e Soluções">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Base de Conhecimento</h1>
          <p className="page-subtitle">{items.length} solução{items.length !== 1 ? 'ões' : ''} catalogada{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova Solução
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 280 }}>
          <Search size={16} color="var(--text-muted)" />
          <input placeholder="Buscar por título, sintoma ou tag..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 200 }} value={filterMod} onChange={e => setFilterMod(e.target.value)}>
          <option value="">Todos os módulos</option>
          {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="form-control" style={{ width: 160 }} value={filterCrit} onChange={e => setFilterCrit(e.target.value)}>
          <option value="">Criticidade</option>
          {CRITICIDADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 460px' : '1fr', gap: 20 }}>
        {/* Cards Grid */}
        <div>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 28, height: 28, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ShieldAlert size={28} /></div>
              <h3>{items.length === 0 ? 'Nenhuma solução ainda' : 'Sem resultados'}</h3>
              <p>Documente erros e soluções para agilizar o suporte.</p>
              <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}><Plus size={15} /> Adicionar Solução</button>
            </div>
          ) : (
            <div className="grid-auto">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="knowledge-card"
                  style={{ borderColor: selected?.id === item.id ? 'var(--apollo-blue)' : undefined }}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                >
                  <div className="knowledge-card-header">
                    <div
                      className={`knowledge-card-criticidade crit-${item.criticidade || 'baixa'}`}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="knowledge-card-title">{item.titulo}</div>
                      <div className="knowledge-card-sintoma">{item.sintoma}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{item.modulo}</span>
                    <CriticidadeBadge c={item.criticidade} />
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: 'auto', padding: '3px 8px' }}
                      onClick={e => { e.stopPropagation(); handleDelete(item); }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {item.tags?.length > 0 && (
                    <div className="knowledge-tags">
                      {item.tags.map(t => <span key={t} className="badge badge-gray" style={{ fontSize: 10 }}>{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card animate-fade" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 15 }}>{selected.titulo}</span>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={15} /></button>
            </div>
            <div className="card-body">
              <div className="flex gap-2 mb-4">
                <span className="badge badge-blue">{selected.modulo}</span>
                <CriticidadeBadge c={selected.criticidade} />
              </div>

              {selected.sintoma && (
                <div className="mb-4">
                  <div className="section-title mb-2">🔍 Sintoma</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.sintoma}</p>
                </div>
              )}

              {selected.causa && (
                <div className="mb-4">
                  <div className="section-title mb-2">⚡ Causa Raiz</div>
                  <div className="alert alert-warning" style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 13 }}>{selected.causa}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="section-title mb-2">✅ Solução</div>
                <div style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selected.solucao}
                </div>
              </div>

              {selected.tags?.length > 0 && (
                <div className="knowledge-tags mt-4">
                  {selected.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <ConhecimentoModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </Layout>
  );
}

function ConhecimentoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<ConhecimentoItem, 'id'>>({
    titulo: '',
    sintoma: '',
    modulo: 'Carga',
    tags: [],
    causa: '',
    solucao: '',
    criticidade: 'media',
  });
  const [tagsInput, setTagsInput] = useState('');

  const handleSave = async () => {
    if (!form.titulo || !form.solucao) { toast.error('Título e Solução são obrigatórios'); return; }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await addConhecimento({ ...form, tags });
      toast.success('Solução adicionada!');
      onSaved();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nova Solução</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid form-grid-2">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Título *</label>
              <input className="form-control" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Resumo claro do problema..." />
            </div>
            <div className="form-group">
              <label className="form-label">Módulo</label>
              <select className="form-control" value={form.modulo} onChange={e => setForm(f => ({ ...f, modulo: e.target.value }))}>
                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Criticidade</label>
              <select className="form-control" value={form.criticidade} onChange={e => setForm(f => ({ ...f, criticidade: e.target.value as any }))}>
                {CRITICIDADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Sintoma</label>
              <textarea className="form-control" value={form.sintoma} onChange={e => setForm(f => ({ ...f, sintoma: e.target.value }))} placeholder="O que o usuário vê / relata..." rows={2} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Causa Raiz</label>
              <textarea className="form-control" value={form.causa || ''} onChange={e => setForm(f => ({ ...f, causa: e.target.value }))} placeholder="Por que acontece..." rows={2} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Solução *</label>
              <textarea className="form-control" value={form.solucao} onChange={e => setForm(f => ({ ...f, solucao: e.target.value }))} placeholder="Passo a passo de como resolver..." rows={5} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Tags (separadas por vírgula)</label>
              <input className="form-control" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="oracle, startup, nfe, conexao" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : <><Save size={15} /> Salvar Solução</>}
          </button>
        </div>
      </div>
    </div>
  );
}
