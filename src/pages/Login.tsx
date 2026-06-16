import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bem-vindo ao Apollo Hub! 🚀');
      navigate('/');
    } catch (error: any) {
      const msg = error.code === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos'
        : 'Erro ao fazer login. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Cpu size={32} color="white" />
          </div>
          <h1>Apollo Hub</h1>
          <p>Sistema de Gestão Interna</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="topbar-search" style={{ width: '100%' }}>
              <Mail size={15} className="topbar-search-icon" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="topbar-search" style={{ width: '100%' }}>
              <Lock size={15} className="topbar-search-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: '100%' }}
              />
              <button
                type="button"
                className="btn-icon"
                style={{ border: 'none', background: 'none', width: 'auto', height: 'auto' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 8, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                Entrando...
              </>
            ) : 'Entrar no Sistema'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Acesso restrito à equipe Apollo Sistemas de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}
