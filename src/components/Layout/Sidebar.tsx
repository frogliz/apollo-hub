import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Server, ShieldAlert,
  KeyRound, LogOut, ChevronRight, Cpu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/runbooks', icon: BookOpen, label: 'Runbooks' },
  { path: '/carga', icon: Server, label: 'Módulos do Carga' },
  { path: '/conhecimento', icon: ShieldAlert, label: 'Base de Conhecimento' },
  { path: '/cofre', icon: KeyRound, label: 'Cofre de Senhas' },
];

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Até logo!');
      navigate('/login');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  const initials = currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : 'A';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Cpu size={22} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <div className="logo-title">Apollo Hub</div>
          <div className="logo-subtitle">Sistemas de Gestão</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} className="nav-item-icon" />
            {label}
            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Clique para sair">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuário'}
            </div>
            <div className="user-email">{currentUser?.email}</div>
          </div>
          <LogOut size={15} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
}
