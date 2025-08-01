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
  Business as BusinessIcon,
  LocalShipping as TruckIcon,
  Build as ServiceIcon,
  Category as MixIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';
import type { Fornitore } from '../../lib/apiService';

const GestioneFornitori: React.FC = () => {
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingFornitore, setEditingFornitore] = useState<Fornitore | null>(null);
  
  // Filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string[]>([]);
  const [statoFilter, setStatoFilter] = useState('all');
  
  const [fornitoreForm, setFornitoreForm] = useState({
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
    tipo_fornitore: 'fiori' as 'fiori' | 'trasportatore' | 'servizi' | 'misto',
    attivo: true
  });

  const tipoFornitoreOptions = [
    { value: 'fiori', label: 'Fornitore Fiori', icon: <BusinessIcon />, color: 'success' },
    { value: 'trasportatore', label: 'Trasportatore', icon: <TruckIcon />, color: 'info' },
    { value: 'servizi', label: 'Servizi', icon: <ServiceIcon />, color: 'warning' },
    { value: 'misto', label: 'Misto', icon: <MixIcon />, color: 'default' }
  ];

  const getTipoInfo = (tipo: string) => {
    return tipoFornitoreOptions.find(t => t.value === tipo) || tipoFornitoreOptions[0];
  };

  // Filtri e ricerca - memoizzati per performance
  const fornitoriFiltered = useMemo(() => {
    return fornitori.filter(fornitore => {
      // Filtro per testo di ricerca
      const searchMatch = !searchTerm || 
        fornitore.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fornitore.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fornitore.citta?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fornitore.email?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro per tipo
      const tipoMatch = tipoFilter.length === 0 || tipoFilter.includes(fornitore.tipo_fornitore);

      // Filtro per stato
      const statoMatch = statoFilter === 'all' || 
        (statoFilter === 'attivo' && fornitore.attivo) ||
        (statoFilter === 'inattivo' && !fornitore.attivo);

      return searchMatch && tipoMatch && statoMatch;
    });
  }, [fornitori, searchTerm, tipoFilter, statoFilter]);

  const handleTipoFilterChange = (event: React.MouseEvent<HTMLElement>, newTipoFilter: string[]) => {
    setTipoFilter(newTipoFilter);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTipoFilter([]);
    setStatoFilter('all');
  };

  useEffect(() => {
    loadFornitori();
  }, []);

  const loadFornitori = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFornitori();
      setFornitori(data);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento fornitori: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fornitore?: Fornitore) => {
    if (fornitore) {
      setEditingFornitore(fornitore);
      setFornitoreForm({
        nome: fornitore.nome,
        ragione_sociale: fornitore.ragione_sociale || '',
        indirizzo: fornitore.indirizzo || '',
        citta: fornitore.citta || '',
        cap: fornitore.cap || '',
        provincia: fornitore.provincia || '',
        telefono: fornitore.telefono || '',
        email: fornitore.email || '',
        partita_iva: fornitore.partita_iva || '',
        codice_fiscale: fornitore.codice_fiscale || '',
        tipo_fornitore: fornitore.tipo_fornitore,
        attivo: fornitore.attivo
      });
    } else {
      setEditingFornitore(null);
      setFornitoreForm({
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
        tipo_fornitore: 'fiori',
        attivo: true
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingFornitore(null);
  };

  const handleSaveFornitore = async () => {
    try {
      if (!fornitoreForm.nome.trim()) {
        setError('Il nome è obbligatorio');
        return;
      }

      if (editingFornitore) {
        await apiService.updateFornitore(editingFornitore.id, fornitoreForm);
      } else {
        await apiService.createFornitore(fornitoreForm);
      }

      handleCloseDialog();
      loadFornitori();
      setError(null);
    } catch (err) {
      setError('Errore nel salvare fornitore: ' + (err as Error).message);
    }
  };

  const handleDeleteFornitore = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo fornitore?')) {
      try {
        await apiService.deleteFornitore(id);
        loadFornitori();
        setError(null);
      } catch (err) {
        setError('Errore nell\'eliminazione fornitore: ' + (err as Error).message);
      }
    }
  };

  // Raggruppa fornitori per tipo (usando i fornitori filtrati)
  const fornitoriByTipo = fornitoriFiltered.reduce((acc, fornitore) => {
    if (!acc[fornitore.tipo_fornitore]) {
      acc[fornitore.tipo_fornitore] = [];
    }
    acc[fornitore.tipo_fornitore].push(fornitore);
    return acc;
  }, {} as Record<string, Fornitore[]>);

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Caricamento fornitori...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 500,
            color: 'grey.800',
            mb: 1,
            background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Gestione Fornitori
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'grey.600',
            mb: 2
          }}
        >
          {fornitoriFiltered.length} fornitori {fornitoriFiltered.length !== fornitori.length ? `(su ${fornitori.length} totali)` : 'totali'}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 0,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
            }
          }}
        >
          Nuovo Fornitore
        </Button>
      </Box>

      {/* Barra di ricerca e filtri */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)'
        }}
      >
        <Stack spacing={3}>
          {/* Ricerca principale */}
          <TextField
            fullWidth
            placeholder="Cerca fornitori per nome, ragione sociale, città o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'grey.400' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchTerm('')}
                    size="small"
                    sx={{ color: 'grey.400' }}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'grey.300',
                },
              }
            }}
          />
          
          {/* Filtri */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <FilterIcon sx={{ color: 'grey.600', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: 500 }}>
                  Filtri:
                </Typography>
              </Box>
              
              {/* Filtro per tipo */}
              <ToggleButtonGroup
                value={tipoFilter}
                onChange={handleTipoFilterChange}
                aria-label="tipo fornitore"
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    py: 0.5,
                    px: 2,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }
                  }
                }}
              >
                {tipoFornitoreOptions.map((tipo) => (
                  <ToggleButton key={tipo.value} value={tipo.value}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {React.cloneElement(tipo.icon, { sx: { fontSize: 16 } })}
                      <span>{tipo.label}</span>
                    </Stack>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {/* Filtro per stato */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Stato</InputLabel>
                <Select
                  value={statoFilter}
                  onChange={(e) => setStatoFilter(e.target.value)}
                  label="Stato"
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="all">Tutti</MenuItem>
                  <MenuItem value="attivo">Attivi</MenuItem>
                  <MenuItem value="inattivo">Inattivi</MenuItem>
                </Select>
              </FormControl>

              {/* Reset filtri */}
              {(searchTerm || tipoFilter.length > 0 || statoFilter !== 'all') && (
                <Button
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                  sx={{
                    color: 'grey.600',
                    textTransform: 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  Reset
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
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

      {/* Cards per tipologia */}
      <Grid container spacing={3} mb={4}>
        {tipoFornitoreOptions.map((tipo) => {
          const count = fornitoriByTipo[tipo.value]?.length || 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={tipo.value}>
              <Card 
                elevation={0}
                sx={{ 
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
                        sx={{ 
                          fontWeight: 600,
                          color: 'grey.800'
                        }}
                      >
                        {count}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'grey.600',
                          fontSize: '0.85rem'
                        }}
                      >
                        {tipo.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabella fornitori */}
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
            {fornitoriFiltered.map((fornitore) => {
              const tipoInfo = getTipoInfo(fornitore.tipo_fornitore);
              return (
                <TableRow key={fornitore.id}>
                  <TableCell>{fornitore.nome}</TableCell>
                  <TableCell>{fornitore.ragione_sociale || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={tipoInfo.icon}
                      label={tipoInfo.label}
                      color={tipoInfo.color as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{fornitore.citta || '-'}</TableCell>
                  <TableCell>{fornitore.telefono || '-'}</TableCell>
                  <TableCell>{fornitore.email || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={fornitore.attivo ? 'Attivo' : 'Inattivo'}
                      color={fornitore.attivo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(fornitore)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteFornitore(fornitore.id)}
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

      {/* Dialog per aggiungere/modificare fornitore */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFornitore ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome *"
                fullWidth
                value={fornitoreForm.nome}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ragione Sociale"
                fullWidth
                value={fornitoreForm.ragione_sociale}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, ragione_sociale: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Fornitore</InputLabel>
                <Select
                  value={fornitoreForm.tipo_fornitore}
                  onChange={(e) => setFornitoreForm({ ...fornitoreForm, tipo_fornitore: e.target.value as any })}
                  label="Tipo Fornitore"
                >
                  {tipoFornitoreOptions.map((tipo) => (
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
                value={fornitoreForm.indirizzo}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, indirizzo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Città"
                fullWidth
                value={fornitoreForm.citta}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, citta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="CAP"
                fullWidth
                value={fornitoreForm.cap}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, cap: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Provincia"
                fullWidth
                value={fornitoreForm.provincia}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, provincia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefono"
                fullWidth
                value={fornitoreForm.telefono}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={fornitoreForm.email}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Partita IVA"
                fullWidth
                value={fornitoreForm.partita_iva}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, partita_iva: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Codice Fiscale"
                fullWidth
                value={fornitoreForm.codice_fiscale}
                onChange={(e) => setFornitoreForm({ ...fornitoreForm, codice_fiscale: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button onClick={handleSaveFornitore} variant="contained">
            {editingFornitore ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestioneFornitori;
