import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/apiService';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Interfaccia Cliente semplificata
interface Cliente {
  id: number;
  nome: string;
  cognome?: string;
  email?: string;
  telefono?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  partita_iva?: string;
  codice_fiscale?: string;
  created_at?: string;
  updated_at?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`clienti-tabpanel-${index}`}
      aria-labelledby={`clienti-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `clienti-tab-${index}`,
    'aria-controls': `clienti-tabpanel-${index}`,
  };
}

// Componente per l'anagrafica clienti
function AnagraficaClienti() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => {
    loadClienti();
  }, []);

  const loadClienti = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientiReali = await apiService.getClienti();
      setClienti(clientiReali);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Errore caricamento clienti:', err);
      setError('Errore nel caricamento dei clienti');
    } finally {
      setLoading(false);
    }
  };

  // Filtraggio robusto
  const filteredClienti = clienti.filter(cliente => {
    if (!cliente) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (cliente.nome || '').toLowerCase().includes(searchLower) ||
      (cliente.cognome || '').toLowerCase().includes(searchLower) ||
      (cliente.citta || '').toLowerCase().includes(searchLower) ||
      (cliente.email || '').toLowerCase().includes(searchLower) ||
      (cliente.telefono || '').toLowerCase().includes(searchLower)
    );
  });

  // Calcoli widget dashboard
  const totaleClienti = clienti.length;
  const clientiAttivi = clienti.length; // Tutti i clienti sono attivi per ora
  const nuoviMese = clienti.filter(c => {
    if (!c?.created_at) return false;
    const dataCreazione = new Date(c.created_at);
    const oggi = new Date();
    return dataCreazione.getMonth() === oggi.getMonth() && dataCreazione.getFullYear() === oggi.getFullYear();
  }).length;

  const handleViewDetails = (cliente: Cliente) => {
    if (!cliente) return;
    setSelectedCliente(cliente);
    setShowDetails(true);
    setSnackbar({ open: true, message: `Dettagli cliente ${cliente.nome}`, severity: 'success' });
  };

  const handleDelete = (id: number) => {
    if (!id) return;
    
    if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
      setClienti(clienti.filter(c => c.id !== id));
      setSnackbar({ open: true, message: 'Cliente eliminato con successo', severity: 'success' });
      console.log('✅ Cliente eliminato:', id);
    }
  };

  const handleRefresh = () => {
    loadClienti();
    setSnackbar({ open: true, message: 'Dati aggiornati', severity: 'success' });
  };

  const handleExport = () => {
    setSnackbar({ open: true, message: 'Esportazione in arrivo', severity: 'success' });
  };

  const handlePrint = () => {
    window.print();
    setSnackbar({ open: true, message: 'Stampa avviata', severity: 'success' });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return '-';
    }
  };

  // Stati di rendering
  if (loading && clienti.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento clienti...
        </Typography>
      </Box>
    );
  }

  if (error && clienti.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadClienti}>
              Riprova
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con statistiche */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 200 }}>
          <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" color="primary">Totale Clienti</Typography>
          <Typography variant="h5" fontWeight={700}>{totaleClienti}</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 200 }}>
          <PersonAddIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" color="success.main">Clienti Attivi</Typography>
          <Typography variant="h5" fontWeight={700}>{clientiAttivi}</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 200 }}>
          <AddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
          <Typography variant="h6" color="info.main">Nuovi Questo Mese</Typography>
          <Typography variant="h5" fontWeight={700}>{nuoviMese}</Typography>
        </Paper>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" gutterBottom>Gestione Clienti</Typography>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Aggiorna la lista clienti">
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Esporta i clienti in Excel">
              <IconButton onClick={handleExport} color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Stampa la lista clienti">
              <IconButton onClick={handlePrint} color="primary">
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Barra di ricerca */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Cerca clienti per nome, cognome, città, email, telefono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mt: 2 }}
        />

        {/* Info ultimo aggiornamento */}
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
          </Typography>
        )}
      </Paper>

      {/* Lista clienti */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Lista Clienti ({filteredClienti.length})
        </Typography>
        
        {filteredClienti.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'Nessun cliente trovato con i criteri di ricerca' : 'Nessun cliente presente'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Cognome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefono</TableCell>
                  <TableCell>Città</TableCell>
                  <TableCell>Data Creazione</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClienti.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {cliente.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>{cliente.cognome || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell>{cliente.citta || '-'}</TableCell>
                    <TableCell>{formatDate(cliente.created_at || '')}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Visualizza dettagli">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(cliente)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina cliente">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(cliente.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog dettagli cliente */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dettagli Cliente
          <IconButton
            aria-label="close"
            onClick={() => setShowDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCliente && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Nome:</strong> {selectedCliente.nome}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Cognome:</strong> {selectedCliente.cognome || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Email:</strong> {selectedCliente.email || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Telefono:</strong> {selectedCliente.telefono || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Città:</strong> {selectedCliente.citta || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>CAP:</strong> {selectedCliente.cap || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Partita IVA:</strong> {selectedCliente.partita_iva || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Codice Fiscale:</strong> {selectedCliente.codice_fiscale || '-'}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Data Creazione:</strong> {formatDate(selectedCliente.created_at || '')}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <Typography><strong>Ultimo Aggiornamento:</strong> {formatDate(selectedCliente.updated_at || '')}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Componente per inserimento nuovo cliente
function InserimentoNuovoCliente() {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    indirizzo: '',
    citta: '',
    cap: '',
    partita_iva: '',
    codice_fiscale: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createCliente(formData);
      // Reset form
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        indirizzo: '',
        citta: '',
        cap: '',
        partita_iva: '',
        codice_fiscale: ''
      });
      alert('Cliente creato con successo!');
    } catch (err) {
      console.error('Errore creazione cliente:', err);
      alert('Errore nella creazione del cliente');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Inserimento Nuovo Cliente</Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          fullWidth
          label="Nome *"
          value={formData.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          required
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Cognome"
          value={formData.cognome}
          onChange={(e) => handleChange('cognome', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Telefono"
          value={formData.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Indirizzo"
          value={formData.indirizzo}
          onChange={(e) => handleChange('indirizzo', e.target.value)}
          sx={{ flex: '1 1 100%' }}
        />
        <TextField
          fullWidth
          label="Città"
          value={formData.citta}
          onChange={(e) => handleChange('citta', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="CAP"
          value={formData.cap}
          onChange={(e) => handleChange('cap', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Partita IVA"
          value={formData.partita_iva}
          onChange={(e) => handleChange('partita_iva', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
        <TextField
          fullWidth
          label="Codice Fiscale"
          value={formData.codice_fiscale}
          onChange={(e) => handleChange('codice_fiscale', e.target.value)}
          sx={{ flex: '1 1 300px' }}
        />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          Salva Cliente
        </Button>
        <Button variant="outlined" onClick={() => setFormData({
          nome: '', cognome: '', email: '', telefono: '', indirizzo: '', 
          citta: '', cap: '', partita_iva: '', codice_fiscale: ''
        })}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}

// Componente principale
export default function ListaClienti() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="clienti tabs">
          <Tab label="Anagrafica Clienti" {...a11yProps(0)} />
          <Tab label="Inserimento Nuovo Cliente" {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <AnagraficaClienti />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <InserimentoNuovoCliente />
      </TabPanel>
    </Box>
  );
} 