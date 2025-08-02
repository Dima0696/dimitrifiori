import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import { AuthProvider } from './auth';
import ProtectedRoute from './ProtectedRoute';

import Webshop from './pages/Webshop';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import GestioneFornitori from './components/anagrafica/GestioneFornitori';

import { ErrorBoundary } from './components/ErrorBoundary';
import GestioneMagazzino from './components/GestioneMagazzino';
import TestApiService from './components/TestApiService';
import Anagrafica from './components/Anagrafica';
import modernTheme from './styles/modernTheme';





function App() {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
                {/* Autenticazione */}
                <Route path="/login" element={<Login />} />
                
                {/* Dashboard principale */}
                <Route path="/" element={<ProtectedRoute><MainLayout title="Dashboard"><Dashboard /></MainLayout></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><MainLayout title="Dashboard"><Dashboard /></MainLayout></ProtectedRoute>} />
                
                {/* Magazzino - Sistema nuovo */}
                <Route path="/magazzino" element={<ProtectedRoute><MainLayout title="Gestione Magazzino"><GestioneMagazzino /></MainLayout></ProtectedRoute>} />
                
                {/* Anagrafica - Sistema nuovo */}
                <Route path="/anagrafica" element={<ProtectedRoute><MainLayout title="Anagrafica"><Anagrafica /></MainLayout></ProtectedRoute>} />
                
                {/* Fornitori */}
                <Route path="/fornitori" element={<ProtectedRoute><MainLayout title="Gestione Fornitori"><GestioneFornitori /></MainLayout></ProtectedRoute>} />
                
                
                
                {/* Test API */}
                <Route path="/test-api" element={<ProtectedRoute><MainLayout title="Test API Service"><TestApiService /></MainLayout></ProtectedRoute>} />
                
                {/* Webshop (esterno) */}
                <Route path="/webshop" element={<Webshop />} />
              </Routes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;



