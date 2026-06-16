import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { ClienteDetalhe } from './pages/ClienteDetalhe';
import { Runbooks } from './pages/Runbooks';
import { ModulosCarga } from './pages/ModulosCarga';
import { Conhecimento } from './pages/Conhecimento';
import { Cofre } from './pages/Cofre';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
      <Route path="/clientes/:id" element={<PrivateRoute><ClienteDetalhe /></PrivateRoute>} />
      <Route path="/runbooks" element={<PrivateRoute><Runbooks /></PrivateRoute>} />
      <Route path="/runbooks/novo" element={<PrivateRoute><Runbooks /></PrivateRoute>} />
      <Route path="/carga" element={<PrivateRoute><ModulosCarga /></PrivateRoute>} />
      <Route path="/conhecimento" element={<PrivateRoute><Conhecimento /></PrivateRoute>} />
      <Route path="/cofre" element={<PrivateRoute><Cofre /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1C2333',
              color: '#F0F4FF',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#1C2333' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#1C2333' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
