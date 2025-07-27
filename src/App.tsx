import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemText, CssBaseline, Dialog, DialogTitle, DialogContent, Snackbar, Alert } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import Login from './pages/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AuthProvider, useAuth } from './auth';
import ProtectedRoute from './ProtectedRoute';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';
import ListaClienti from './components/ListaClienti';
import GestioneVendite from './components/GestioneVendite';
import GestioneAcquisti from './components/GestioneAcquisti';
import ListaFatture from './components/ListaFatture';
import Webshop from './pages/Webshop';
import ActionToolbar from './components/ActionToolbar';
import Dashboard from './components/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MainLayout from './components/MainLayout';
import ListaOrdiniAcquisto from './components/ListaOrdiniAcquisto';
import GestioneVarieta from './components/GestioneVarieta';
import StatisticheVendite from './components/StatisticheVendite';
import GestioneProdotti from './components/GestioneProdotti';
import GestioneGruppi from './components/GestioneGruppi';
import GestioneFornitori from './components/GestioneFornitori';
import Statistiche from './components/Statistiche';
import ImageUploader from './components/ImageDownloader';
import OrdiniClienti from './components/OrdiniClienti';
import Contabilita from './components/ContabilitaReale';
import { ErrorBoundary } from './components/ErrorBoundary';
import GestioneMagazzino from './components/GestioneMagazzino';
import { SceltaInserimentoFattura as InserimentoFattura } from './components/InserimentoFattura';
import NuovaFatturaVendita from './components/NuovaFatturaVendita';
import StatisticheFattureAcquisto from './components/StatisticheFattureAcquisto';

const iosTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007aff',
    },
    background: {
      default: '#f4f6fb',
      paper: 'rgba(255,255,255,0.85)',
    },
    text: {
      primary: '#222',
      secondary: '#555',
    },
  },
  shape: {
    borderRadius: 24,
  },
  typography: {
    fontFamily: 'SF Pro Display, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 800,
      fontSize: '2.4rem',
      color: '#222',
      letterSpacing: '-0.5px',
    },
    body1: {
      color: '#333',
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.08)',
          borderRadius: 24,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '1.08rem',
          letterSpacing: '0.2px',
          padding: '10px 22px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
          color: '#222',
          fontSize: '1.05rem',
        },
        head: {
          background: 'rgba(230,240,255,0.9)',
          fontWeight: 800,
          color: '#007aff',
          fontSize: '1.1rem',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#222',
          fontWeight: 600,
        },
        secondary: {
          color: '#555',
        },
      },
    },
  },
});

function Inventario() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inventario</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Quantità</TableCell>
              <TableCell>Prezzo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Rosa</TableCell>
              <TableCell>Fiore</TableCell>
              <TableCell>120</TableCell>
              <TableCell>€1.50</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Vaso Ceramica</TableCell>
              <TableCell>Vaso</TableCell>
              <TableCell>30</TableCell>
              <TableCell>€8.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
function Ordini() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Ordini</Typography>
      <List>
        <ListItem>
          <ListItemText primary="Ordine #001" secondary="Cliente: Rossi - Stato: In preparazione" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Ordine #002" secondary="Cliente: Bianchi - Stato: Spedito" />
        </ListItem>
      </List>
    </Box>
  );
}
function Clienti() {
  return <MainLayout title="Clienti"><ListaClienti /></MainLayout>;
}
function Report() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Report</Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">[Grafico vendite qui]</Typography>
      </Paper>
    </Box>
  );
}

function Giacenza() {
  return <MainLayout title="Giacenza"><div>Giacenza - Funzionalità in sviluppo</div></MainLayout>;
}

function Vendite() {
  return <MainLayout title="Vendite"><GestioneVendite /></MainLayout>;
}

function Acquisti() {
  return <MainLayout title="Acquisti"><GestioneAcquisti /></MainLayout>;
}

function Magazzino() {
  return <MainLayout title="Magazzino"><GestioneMagazzino /></MainLayout>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><MainLayout title="Dashboard"><Dashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><MainLayout title="Dashboard"><Dashboard /></MainLayout></ProtectedRoute>} />
              <Route path="/magazzino" element={<ProtectedRoute><Magazzino /></ProtectedRoute>} />
              <Route path="/giacenza" element={<ProtectedRoute><Giacenza /></ProtectedRoute>} />
              <Route path="/vendite" element={<ProtectedRoute><Vendite /></ProtectedRoute>} />
              <Route path="/acquisti" element={<ProtectedRoute><Acquisti /></ProtectedRoute>} />
              <Route path="/clienti" element={<ProtectedRoute><Clienti /></ProtectedRoute>} />
              <Route path="/ordini-acquisto" element={<ProtectedRoute><MainLayout title="Ordini Acquisto"><ListaOrdiniAcquisto /></MainLayout></ProtectedRoute>} />
              <Route path="/varieta" element={<ProtectedRoute><MainLayout title="Gestione Varietà"><GestioneVarieta /></MainLayout></ProtectedRoute>} />
              <Route path="/prodotti" element={<ProtectedRoute><MainLayout title="Gestione Prodotti"><GestioneProdotti /></MainLayout></ProtectedRoute>} />
              <Route path="/gruppi" element={<ProtectedRoute><MainLayout title="Gestione Gruppi"><GestioneGruppi /></MainLayout></ProtectedRoute>} />
                            <Route path="/fornitori" element={<ProtectedRoute><MainLayout title="Gestione Fornitori"><GestioneFornitori /></MainLayout></ProtectedRoute>} />
              <Route path="/statistiche" element={<ProtectedRoute><MainLayout title="Statistiche"><Statistiche /></MainLayout></ProtectedRoute>} />
              <Route path="/contabilita" element={<ProtectedRoute><MainLayout title="Contabilità Aziendale"><Contabilita /></MainLayout></ProtectedRoute>} />
              <Route path="/download-immagini" element={<ProtectedRoute><MainLayout title="Gestione Immagini"><ImageUploader /></MainLayout></ProtectedRoute>} />
              <Route path="/ordini-clienti" element={<ProtectedRoute><MainLayout title="Ordini Clienti"><OrdiniClienti /></MainLayout></ProtectedRoute>} />
              <Route path="/inserimento-fattura" element={<ProtectedRoute><MainLayout title="Inserimento Fattura"><InserimentoFattura /></MainLayout></ProtectedRoute>} />
              <Route path="/nuova-fattura-vendita" element={<ProtectedRoute><MainLayout title="Nuova Fattura Vendita"><NuovaFatturaVendita /></MainLayout></ProtectedRoute>} />
              <Route path="/fatture-vendita" element={<ProtectedRoute><MainLayout title="Fatture Vendita"><ListaFatture /></MainLayout></ProtectedRoute>} />
              <Route path="/statistiche-fatture-acquisto" element={<ProtectedRoute><MainLayout title="Statistiche Fatture Acquisto"><StatisticheFattureAcquisto /></MainLayout></ProtectedRoute>} />
              <Route path="/webshop" element={<Webshop />} />
            </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
