import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Favorite as WeddingIcon,
  Hotel as HotelIcon,
  Business as BusinessIcon,
  Category as OtherIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';
import type { Cliente } from '../../lib/apiService';

const GestioneClienti: React.FC = () => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [statoFilter, setStatoFilter] = useState<string>('all');
  
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    ragione_sociale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    partita_iva: '',
    codice_fiscale: '',
    tipo_cliente: 'privato' as 'privato' | 'fiorista' | 'wedding' | 'hotel' | 'azienda' | 'altro',
    note: '',
    attivo: true
  });

  const tipoClienteOptions = [
    { value: 'privato', label: 'Privato', icon: <PersonIcon />, color: 'primary' },
    { value: 'fiorista', label: 'Fiorista', icon: <StoreIcon />, color: 'success' },
    { value: 'wedding', label: 'Wedding Planner', icon: <WeddingIcon />, color: 'secondary' },
    { value: 'hotel', label: 'Hotel/Ristorante', icon: <HotelIcon />, color: 'info' },
    { value: 'azienda', label: 'Azienda', icon: <BusinessIcon />, color: 'warning' },
    { value: 'altro', label: 'Altro', icon: <OtherIcon />, color: 'default' }
  ];

  const getTipoInfo = (tipo: string) => {
    return tipoClienteOptions.find(t => t.value === tipo) || tipoClienteOptions[0];
  };

  // Filtered clienti using useMemo for performance
  const clientiFiltered = useMemo(() => {
    return clienti.filter(cliente => {
      const matchesSearch = searchTerm === '' || 
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.ragione_sociale || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.citta || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = tipoFilter === 'all' || cliente.tipo_cliente === tipoFilter;
      const matchesStato = statoFilter === 'all' || 
        (statoFilter === 'attivo' && cliente.attivo) ||
        (statoFilter === 'inattivo' && !cliente.attivo);
      
      return matchesSearch && matchesTipo && matchesStato;
    });
  }, [clienti, searchTerm, tipoFilter, statoFilter]);

  const kpi = {
    totale: clienti.length,
    attivi: clienti.filter(c => c.attivo).length,
    inattivi: clienti.filter(c => !c.attivo).length,
  };

  useEffect(() => {
    loadClienti();
  }, []);

  const loadClienti = async () => {
    try {
      setLoading(true);
      const data = await apiService.getClienti();
      setClienti(data);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento clienti: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setClienteForm({
        nome: cliente.nome,
        ragione_sociale: cliente.ragione_sociale || '',
        indirizzo: cliente.indirizzo || '',
        citta: cliente.citta || '',
        cap: cliente.cap || '',
        provincia: cliente.provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        partita_iva: cliente.partita_iva || '',
        codice_fiscale: cliente.codice_fiscale || '',
        tipo_cliente: cliente.tipo_cliente,
        note: cliente.note || '',
        attivo: cliente.attivo
      });
    } else {
      setEditingCliente(null);
      setClienteForm({
        nome: '',
        ragione_sociale: '',
        indirizzo: '',
        citta: '',
        cap: '',
        provincia: '',
        telefono: '',
        email: '',
        partita_iva: '',
        codice_fiscale: '',
        tipo_cliente: 'privato',
        note: '',
        attivo: true
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCliente(null);
  };

  const handleSaveCliente = async () => {
    try {
      if (!clienteForm.nome.trim()) {
        setError('Il nome è obbligatorio');
        return;
      }

      if (editingCliente) {
        await apiService.updateCliente(editingCliente.id, clienteForm);
      } else {
        await apiService.createCliente(clienteForm);
      }

      handleCloseDialog();
      loadClienti();
      setError(null);
    } catch (err) {
      setError('Errore nel salvare cliente: ' + (err as Error).message);
    }
  };

  const handleDeleteCliente = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
      try {
        await apiService.deleteCliente(id);
        loadClienti();
        setError(null);
      } catch (err) {
        setError('Errore nell\'eliminazione cliente: ' + (err as Error).message);
      }
    }
  };

  // Raggruppa clienti filtrati per tipo
  const clientiByTipo = clientiFiltered.reduce((acc, cliente) => {
    if (!acc[cliente.tipo_cliente]) {
      acc[cliente.tipo_cliente] = [];
    }
    acc[cliente.tipo_cliente].push(cliente);
    return acc;
  }, {} as Record<string, Cliente[]>);

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Caricamento clienti...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* KPI e azioni in alto */}
      <Grid container spacing={2} mb={2}>
        {[{
          label: 'Totale Clienti',
          value: kpi.totale,
          color: '#7c3aed',
          bg: '#ede9fe'
        }, {
          label: 'Clienti Attivi',
          value: kpi.attivi,
          color: '#22c55e',
          bg: '#ecfdf5'
        }, {
          label: 'Clienti Inattivi',
          value: kpi.inattivi,
          color: '#ef4444',
          bg: '#fef2f2'
        }].map((card, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Box sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200',
              background: card.bg,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: card.color }}>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.700', fontWeight: 500 }}>
                {card.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            boxShadow: '0 6px 16px rgba(124, 58, 237, 0.3)',
            '&:hover': {
              background: 'linear-gradient(90deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
            }
          }}
        >
          Nuovo Cliente
        </Button>
      </Box>

      {/* Search and Filter Section */}
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #e0e7ff'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Cerca per nome, ragione sociale, città, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'grey.500' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setSearchTerm('')}
                  size="small"
                  sx={{ '&:hover': { color: 'error.main' } }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e7ff'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#9c27b0'
              }
            }
          }}
        />

        {/* Filters Row */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tipo Cliente Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon sx={{ color: 'grey.600', fontSize: '1.2rem' }} />
            <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 500 }}>
              Tipo:
            </Typography>
            <ToggleButtonGroup
              value={tipoFilter}
              exclusive
              onChange={(e, newValue) => newValue && setTipoFilter(newValue)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#6d28d9'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="all">Tutti</ToggleButton>
              <ToggleButton value="privato">Privati</ToggleButton>
              <ToggleButton value="fiorista">Fioristi</ToggleButton>
              <ToggleButton value="wedding">Wedding</ToggleButton>
              <ToggleButton value="hotel">Hotel</ToggleButton>
              <ToggleButton value="azienda">Aziende</ToggleButton>
              <ToggleButton value="altro">Altri</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Stato Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 500 }}>
              Stato:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={statoFilter}
                onChange={(e) => setStatoFilter(e.target.value)}
                sx={{
                  borderRadius: 1.5,
                  backgroundColor: 'white',
                  '& .MuiSelect-select': {
                    py: 0.75
                  }
                }}
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="attivo">Attivi</MenuItem>
                <MenuItem value="inattivo">Inattivi</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* KPI duplicati rimossi */}
    </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '0.9rem'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Tipologie Clienti: 6 colonne su una sola riga */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 2, mb: 4 }}>
        {tipoClienteOptions.map((tipo) => {
          const count = clientiByTipo[tipo.value]?.length || 0;
          return (
            <Card 
              key={tipo.value}
              elevation={0}
              onClick={() => setTipoFilter(tipo.value)}
              sx={{ 
                cursor: 'pointer',
                width: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${tipo.color}.50`,
                      color: `${tipo.color}.main`,
                      display: 'flex'
                    }}
                  >
                    {tipo.icon}
                  </Box>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ fontWeight: 600, color: 'grey.800' }}
                    >
                      {count}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: 'grey.600', fontSize: '0.85rem' }}
                    >
                      {tipo.label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Tabella clienti */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Ragione Sociale</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Città</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Telefono</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Stato</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientiFiltered.map((cliente) => {
              const tipoInfo = getTipoInfo(cliente.tipo_cliente);
              return (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.nome}</TableCell>
                  <TableCell>{cliente.ragione_sociale || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={tipoInfo.icon}
                      label={tipoInfo.label}
                      color={tipoInfo.color as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{cliente.citta || '-'}</TableCell>
                  <TableCell>{cliente.telefono || '-'}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.attivo ? 'Attivo' : 'Inattivo'}
                      color={cliente.attivo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(cliente)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteCliente(cliente.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog per aggiungere/modificare cliente */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome *"
                fullWidth
                value={clienteForm.nome}
                onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ragione Sociale"
                fullWidth
                value={clienteForm.ragione_sociale}
                onChange={(e) => setClienteForm({ ...clienteForm, ragione_sociale: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Cliente</InputLabel>
                <Select
                  value={clienteForm.tipo_cliente}
                  onChange={(e) => setClienteForm({ ...clienteForm, tipo_cliente: e.target.value as any })}
                  label="Tipo Cliente"
                >
                  {tipoClienteOptions.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {tipo.icon}
                        <span>{tipo.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Indirizzo"
                fullWidth
                value={clienteForm.indirizzo}
                onChange={(e) => setClienteForm({ ...clienteForm, indirizzo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Città"
                fullWidth
                value={clienteForm.citta}
                onChange={(e) => setClienteForm({ ...clienteForm, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="CAP"
                fullWidth
                value={clienteForm.cap}
                onChange={(e) => setClienteForm({ ...clienteForm, cap: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Provincia"
                fullWidth
                value={clienteForm.provincia}
                onChange={(e) => setClienteForm({ ...clienteForm, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefono"
                fullWidth
                value={clienteForm.telefono}
                onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={clienteForm.email}
                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Partita IVA"
                fullWidth
                value={clienteForm.partita_iva}
                onChange={(e) => setClienteForm({ ...clienteForm, partita_iva: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Codice Fiscale"
                fullWidth
                value={clienteForm.codice_fiscale}
                onChange={(e) => setClienteForm({ ...clienteForm, codice_fiscale: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={3}
                value={clienteForm.note}
                onChange={(e) => setClienteForm({ ...clienteForm, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveCliente} variant="contained">
            {editingCliente ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestioneClienti;
