import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import { AuthProvider } from './auth';
import ProtectedRoute from './ProtectedRoute';

import Webshop from './pages/Webshop';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import GestioneFornitori from './components/anagrafica/GestioneFornitori';
import GestioneClienti from './components/anagrafica/GestioneClienti';

import { ErrorBoundary } from './components/ErrorBoundary';
import GestioneMagazzino from './components/GestioneMagazzino';
import GestioneAcquisti from './components/GestioneAcquisti';
import TestApiService from './components/TestApiService';
import Anagrafica from './components/Anagrafica';
import modernTheme from './styles/modernTheme';
import GestioneVendite from './components/GestioneVendite';
import OrdineWizard from './components/vendite/OrdineWizard';
import DDTWizard from './components/vendite/DDTWizard';
import FatturaWizard from './components/vendite/FatturaWizard';
import ResoWizard from './components/vendite/ResoWizard';
import Statistiche from './components/Statistiche';
import Contabilita from './components/Contabilita';





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
                {/* Redirect legacy sotto-percorsi di Anagrafica */}
                <Route path="/anagrafica/clienti" element={<Navigate to="/clienti" replace />} />
                <Route path="/anagrafica/fornitori" element={<Navigate to="/fornitori" replace />} />
                
                {/* Fornitori */}
                <Route path="/fornitori" element={<ProtectedRoute><MainLayout title="Gestione Fornitori"><GestioneFornitori /></MainLayout></ProtectedRoute>} />
                {/* Clienti */}
                <Route path="/clienti" element={<ProtectedRoute><MainLayout title="Gestione Clienti"><GestioneClienti /></MainLayout></ProtectedRoute>} />
                
                {/* Gestione Acquisti */}
                <Route path="/acquisti" element={<ProtectedRoute><MainLayout title="Gestione Acquisti"><GestioneAcquisti /></MainLayout></ProtectedRoute>} />
                
                {/* Gestione Vendite */}
                <Route path="/vendite" element={<ProtectedRoute><MainLayout title="Gestione Vendite"><GestioneVendite /></MainLayout></ProtectedRoute>} />
                <Route path="/vendite/nuovo-ordine" element={<ProtectedRoute><MainLayout title="Nuovo Ordine"><OrdineWizard /></MainLayout></ProtectedRoute>} />
                <Route path="/vendite/nuovo-ddt" element={<ProtectedRoute><MainLayout title="Nuovo DDT"><DDTWizard /></MainLayout></ProtectedRoute>} />
                <Route path="/vendite/nuova-fattura" element={<ProtectedRoute><MainLayout title="Nuova Fattura"><FatturaWizard /></MainLayout></ProtectedRoute>} />
                <Route path="/vendite/nuovo-reso" element={<ProtectedRoute><MainLayout title="Nuovo Reso / Nota di credito"><ResoWizard /></MainLayout></ProtectedRoute>} />

                {/* Test API */}
                <Route path="/test-api" element={<ProtectedRoute><MainLayout title="Test API Service"><TestApiService /></MainLayout></ProtectedRoute>} />
                {/* Statistiche */}
                <Route path="/statistiche" element={<ProtectedRoute><MainLayout title="Statistiche"><Statistiche /></MainLayout></ProtectedRoute>} />
                {/* Contabilità */}
                <Route path="/contabilita" element={<ProtectedRoute><MainLayout title="Contabilità"><Contabilita /></MainLayout></ProtectedRoute>} />
                
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



