import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { getClientes, deleteCliente } from '../firebase/services/clientes';
import { Cliente } from '../types';
import { Plus, Search, Building2, Wifi, Eye, Trash2, Edit, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { ClienteModal } from '../components/Clientes/ClienteModal';

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtered, setFiltered] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const data = await getClientes();
    setClientes(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(clientes); return; }
    const s = search.toLowerCase();
    setFiltered(clientes.filter(c =>
      c.razaoSocial.toLowerCase().includes(s) ||
      c.nomeFantasia?.toLowerCase().includes(s) ||
      c.cnpj?.includes(s) ||
      c.cidade?.toLowerCase().includes(s)
    ));
  }, [search, clientes]);

  const handleDelete = async (c: Cliente) => {
    if (!confirm(`Excluir ${c.razaoSocial}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteCliente(c.id!);
      toast.success('Cliente excluído');
      load();
    } catch {
      toast.error('Erro ao excluir cliente');
    }
  };

  const statusBadge = (status?: string) => {
    if (!status || status === 'ativo') return <span className="badge badge-green">Ativo</span>;
    if (status === 'inativo') return <span className="badge badge-gray">Inativo</span>;
    return <span className="badge badge-yellow">Suspenso</span>;
  };

  return (
    <Layout title="Clientes" subtitle="Empresas Cadastradas">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} empresa{clientes.length !== 1 ? 's' : ''} cadastrada{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => { setEditCliente(null); setShowModal(true); }}>
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-4" style={{ maxWidth: 480 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder="Buscar por nome, fantasia, CNPJ ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: 'var(--apollo-blue)', borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building2 size={28} /></div>
          <h3>{search ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p>{search ? `Nenhum cliente corresponde a "${search}"` : 'Comece adicionando o primeiro cliente.'}</p>
          {!search && (
            <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Adicionar Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CNPJ</th>
                <th>Localização</th>
                <th>Acesso Remoto</th>
                <th>Oracle</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.razaoSocial}</div>
                    {c.nomeFantasia && <div className="td-secondary">{c.nomeFantasia}</div>}
                  </td>
                  <td>
                    <span className="font-mono text-sm">{c.cnpj || '—'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={12} color="var(--text-muted)" />
                      <span className="td-secondary">{c.cidade ? `${c.cidade}/${c.uf}` : '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.anydesk?.id && <span className="badge badge-blue">AnyDesk</span>}
                      {c.rustdesk?.id && <span className="badge badge-purple">RustDesk</span>}
                      {!c.anydesk?.id && !c.rustdesk?.id && <span className="text-muted text-sm">—</span>}
                    </div>
                  </td>
                  <td>
                    {c.oracle?.host ? (
                      <span className="font-mono text-sm text-blue">{c.oracle.host}:{c.oracle.porta || '1521'}</span>
                    ) : <span className="text-muted text-sm">—</span>}
                  </td>
                  <td>{statusBadge(c.status)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Ver detalhes"
                        onClick={() => navigate(`/clientes/${c.id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Editar"
                        onClick={() => { setEditCliente(c); setShowModal(true); }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Excluir"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClienteModal
          cliente={editCliente}
          onClose={() => { setShowModal(false); setEditCliente(null); }}
          onSaved={() => { setShowModal(false); setEditCliente(null); load(); }}
        />
      )}
    </Layout>
  );
}
