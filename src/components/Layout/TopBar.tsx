import React from 'react';
import { Search, Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">
          {title}
          {subtitle && <span className="topbar-subtitle" style={{ marginLeft: 10, fontSize: 13, fontWeight: 400 }}>— {subtitle}</span>}
        </div>
      </div>

      <div className="topbar-search">
        <Search className="topbar-search-icon" />
        <input placeholder="Busca rápida..." />
      </div>

      <div className="topbar-actions">
        <button className="btn-icon" title="Notificações">
          <Bell size={16} />
        </button>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
          position: 'relative', top: -12, right: 14,
          boxShadow: '0 0 8px var(--green)',
          marginRight: -8
        }} />
      </div>
    </header>
  );
}
