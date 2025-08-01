import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  Alert,
  Divider,
  TablePagination,
  CircularProgress,
  Collapse,
  Badge,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  LocalShipping as LocalShippingIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';

// =========================================================================
// INTERFACES
// =========================================================================

interface MovimentoMagazzino {
  id: number;
  tipo: 'carico' | 'scarico' | 'distruzione' | 'inventario' | 'trasferimento';
  data: string;
  quantita: number;
  prezzo_unitario?: number;
  valore_totale?: number;
  
  // Dati articolo
  gruppo_id?: number;
  gruppo_nome?: string;
  prodotto_id?: number;
  prodotto_nome?: string;
  colore_id?: number;
  colore_nome?: string;
  provenienza_id?: number;
  provenienza_nome?: string;
  foto_id?: number;
  foto_nome?: string;
  imballo_id?: number;
  imballo_nome?: string;
  altezza_id?: number;
  altezza_nome?: string;
  qualita_id?: number;
  qualita_nome?: string;
  
  // Documenti di riferimento
  fattura_id?: number;
  fattura_numero?: string;
  fornitore_id?: number;
  fornitore_nome?: string;
  cliente_id?: number;
  cliente_nome?: string;
  
  // Metadati
  note?: string;
  utente?: string;
  created_at: string;
  updated_at?: string;
}

interface StatisticheMovimenti {
  totaleMovimenti: number;
  movimentiCarico: number;
  movimentiScarico: number;
  movimentiDistruzione: number;
  valoreCarico: number;
  valoreScarico: number;
  valoreDistruzione: number;
  giacenzaAttuale: number;
}

// =========================================================================
// STILI MODERNI
// =========================================================================

const modernStyles = {
  mainContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 3
  },
  glassmorphic: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
  },
  searchCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    mb: 3
  },
  primaryButton: {
    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
    borderRadius: '12px',
    color: 'white',
    fontWeight: 600,
    padding: '12px 24px',
    textTransform: 'none',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
    '&:hover': {
      background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
    }
  },
  secondaryButton: {
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 16px'
  },
  statsCard: {
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)'
    }
  }
};

// =========================================================================
// COMPONENTE PRINCIPALE
// =========================================================================

export const MovimentiMagazzino: React.FC = () => {
  // Stati
  const [movimenti, setMovimenti] = useState<MovimentoMagazzino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [selectedProdotto, setSelectedProdotto] = useState<string>('');
  const [selectedColore, setSelectedColore] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Dati di riferimento
  const [gruppi, setGruppi] = useState<any[]>([]);
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [colori, setColori] = useState<any[]>([]);
  const [fornitori, setFornitori] = useState<any[]>([]);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carica dati di riferimento
      const [
        gruppiData,
        prodottiData, 
        coloriData,
        fornitoriData,
        movimentiData,
        statisticheData
      ] = await Promise.all([
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getFornitori(),
        apiService.getMovimentiMagazzino(),
        apiService.getStatisticheMovimenti()
      ]);
      
      setGruppi(gruppiData);
      setProdotti(prodottiData);
      setColori(coloriData);
      setFornitori(fornitoriData);
      setMovimenti(movimentiData);
      
      console.log('✅ Movimenti caricati dal database:', movimentiData.length);
      console.log('✅ Statistiche calcolate:', statisticheData);
      
    } catch (err) {
      console.error('Errore caricamento dati:', err);
      setError('Errore nel caricamento dei dati');
      
      // In caso di errore (es. tabella non esiste), carica dati mock
      await loadMovimentiMock();
    } finally {
      setLoading(false);
    }
  };

  // Funzione temporanea per caricare dati mock
  const loadMovimentiMock = async () => {
    // Simuliamo dati di movimenti di magazzino
    const mockMovimenti: MovimentoMagazzino[] = [
      {
        id: 1,
        tipo: 'carico',
        data: '2024-01-15',
        quantita: 100,
        prezzo_unitario: 0.85,
        valore_totale: 85.00,
        gruppo_nome: 'Rose',
        prodotto_nome: 'Rosa Standard',
        colore_nome: 'Rosso',
        altezza_nome: 'Media (60cm)',
        fattura_numero: 'FAT001',
        fornitore_nome: 'Fornitore A',
        note: 'Carico da fattura acquisto',
        created_at: '2024-01-15T10:00:00',
        utente: 'Admin'
      },
      {
        id: 2,
        tipo: 'scarico',
        data: '2024-01-16',
        quantita: 50,
        prezzo_unitario: 1.20,
        valore_totale: 60.00,
        gruppo_nome: 'Rose',
        prodotto_nome: 'Rosa Standard',
        colore_nome: 'Rosso',
        altezza_nome: 'Media (60cm)',
        cliente_nome: 'Cliente A',
        note: 'Vendita al dettaglio',
        created_at: '2024-01-16T14:30:00',
        utente: 'Admin'
      },
      {
        id: 3,
        tipo: 'distruzione',
        data: '2024-01-17',
        quantita: 10,
        gruppo_nome: 'Rose',
        prodotto_nome: 'Rosa Standard',
        colore_nome: 'Rosso',
        altezza_nome: 'Media (60cm)',
        note: 'Fiori deteriorati',
        created_at: '2024-01-17T09:15:00',
        utente: 'Admin'
      }
    ];
    
    setMovimenti(mockMovimenti);
  };

  // =========================================================================
  // FILTRI E RICERCA
  // =========================================================================

  const filteredMovimenti = useMemo(() => {
    let filtered = [...movimenti];
    
    // Ricerca testuale
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(mov => 
        (mov.gruppo_nome && mov.gruppo_nome.toLowerCase().includes(term)) ||
        (mov.prodotto_nome && mov.prodotto_nome.toLowerCase().includes(term)) ||
        (mov.colore_nome && mov.colore_nome.toLowerCase().includes(term)) ||
        (mov.altezza_nome && mov.altezza_nome.toLowerCase().includes(term)) ||
        (mov.fornitore_nome && mov.fornitore_nome.toLowerCase().includes(term)) ||
        (mov.cliente_nome && mov.cliente_nome.toLowerCase().includes(term)) ||
        (mov.fattura_numero && mov.fattura_numero.toLowerCase().includes(term)) ||
        (mov.note && mov.note.toLowerCase().includes(term))
      );
    }
    
    // Filtro tipo movimento
    if (selectedTipo) {
      filtered = filtered.filter(mov => mov.tipo === selectedTipo);
    }
    
    // Filtro prodotto
    if (selectedProdotto) {
      filtered = filtered.filter(mov => mov.prodotto_nome === selectedProdotto);
    }
    
    // Filtro colore
    if (selectedColore) {
      filtered = filtered.filter(mov => mov.colore_nome === selectedColore);
    }
    
    // Filtro date
    if (dateFrom) {
      filtered = filtered.filter(mov => mov.data >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(mov => mov.data <= dateTo);
    }
    
    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [movimenti, searchTerm, selectedTipo, selectedProdotto, selectedColore, dateFrom, dateTo]);

  // =========================================================================
  // STATISTICHE
  // =========================================================================

  const stats = useMemo(() => {
    const totaleMovimenti = filteredMovimenti.length;
    const movimentiCarico = filteredMovimenti.filter(m => m.tipo === 'carico').length;
    const movimentiScarico = filteredMovimenti.filter(m => m.tipo === 'scarico').length;
    const movimentiDistruzione = filteredMovimenti.filter(m => m.tipo === 'distruzione').length;
    
    const valoreCarico = filteredMovimenti
      .filter(m => m.tipo === 'carico')
      .reduce((sum, m) => sum + (m.valore_totale || 0), 0);
    
    const valoreScarico = filteredMovimenti
      .filter(m => m.tipo === 'scarico')
      .reduce((sum, m) => sum + (m.valore_totale || 0), 0);
      
    const valoreDistruzione = filteredMovimenti
      .filter(m => m.tipo === 'distruzione')
      .reduce((sum, m) => sum + (m.valore_totale || 0), 0);
    
    const giacenzaAttuale = valoreCarico - valoreScarico - valoreDistruzione;
    
    return {
      totaleMovimenti,
      movimentiCarico,
      movimentiScarico,
      movimentiDistruzione,
      valoreCarico,
      valoreScarico,
      valoreDistruzione,
      giacenzaAttuale
    };
  }, [filteredMovimenti]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleRefresh = () => {
    loadData();
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'carico': return 'success';
      case 'scarico': return 'primary';
      case 'distruzione': return 'error';
      case 'inventario': return 'warning';
      case 'trasferimento': return 'info';
      default: return 'default';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'carico': return <TrendingUpIcon />;
      case 'scarico': return <TrendingDownIcon />;
      case 'distruzione': return <DeleteIcon />;
      case 'inventario': return <InventoryIcon />;
      case 'trasferimento': return <LocalShippingIcon />;
      default: return <InventoryIcon />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'carico': return 'Carico';
      case 'scarico': return 'Scarico';
      case 'distruzione': return 'Distruzione';
      case 'inventario': return 'Inventario';
      case 'trasferimento': return 'Trasferimento';
      default: return tipo;
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <Box sx={modernStyles.mainContainer}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} sx={{ color: 'white' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={modernStyles.mainContainer}>
      {/* Header */}
      <Paper sx={modernStyles.glassmorphic}>
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.8rem', md: '2.5rem' }
                }}
              >
                Movimenti di Magazzino
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={modernStyles.secondaryButton}
              >
                Aggiorna
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={modernStyles.primaryButton}
              >
                Esporta
              </Button>
            </Stack>
          </Box>

          {/* Statistiche */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={modernStyles.statsCard}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                        {stats.totaleMovimenti}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Movimenti Totali
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={modernStyles.statsCard}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#28a745' }}>
                        {stats.movimentiCarico}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Carichi
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        €{stats.valoreCarico.toFixed(2)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#28a745', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={modernStyles.statsCard}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc3545' }}>
                        {stats.movimentiScarico + stats.movimentiDistruzione}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scarichi + Distruzioni
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        €{(stats.valoreScarico + stats.valoreDistruzione).toFixed(2)}
                      </Typography>
                    </Box>
                    <TrendingDownIcon sx={{ fontSize: 40, color: '#dc3545', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={modernStyles.statsCard}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                        €{stats.giacenzaAttuale.toFixed(0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Valore Giacenza
                      </Typography>
                    </Box>
                    <StoreIcon sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Ricerca e Filtri */}
          <Card sx={modernStyles.searchCard}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Cerca per prodotto, colore, fornitore..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'white', mr: 1, opacity: 0.7 }} />,
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedTipo}
                        onChange={(e) => setSelectedTipo(e.target.value)}
                        displayEmpty
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="">Tutti i tipi</MenuItem>
                        <MenuItem value="carico">Carico</MenuItem>
                        <MenuItem value="scarico">Scarico</MenuItem>
                        <MenuItem value="distruzione">Distruzione</MenuItem>
                        <MenuItem value="inventario">Inventario</MenuItem>
                        <MenuItem value="trasferimento">Trasferimento</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedProdotto}
                        onChange={(e) => setSelectedProdotto(e.target.value)}
                        displayEmpty
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="">Tutti i prodotti</MenuItem>
                        {Array.from(new Set(movimenti.map(m => m.prodotto_nome).filter(Boolean))).map((prodotto) => (
                          <MenuItem key={prodotto} value={prodotto}>{prodotto}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                    }}
                  >
                    Filtri
                  </Button>
                </Grid>
              </Grid>

              {/* Filtri avanzati */}
              <Collapse in={showFilters}>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Data Da"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Data A"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiInputBase-input': { color: 'white' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={selectedColore}
                        onChange={(e) => setSelectedColore(e.target.value)}
                        displayEmpty
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiSvgIcon-root': { color: 'white' }
                        }}
                      >
                        <MenuItem value="">Tutti i colori</MenuItem>
                        {Array.from(new Set(movimenti.map(m => m.colore_nome).filter(Boolean))).map((colore) => (
                          <MenuItem key={colore} value={colore}>{colore}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          {/* Errore */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Tabella */}
          <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Articolo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quantità</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prezzo Unit.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Valore Tot.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Riferimento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMovimenti
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((movimento) => (
                    <TableRow
                      key={movimento.id}
                      sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(movimento.data).toLocaleDateString('it-IT')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(movimento.created_at).toLocaleTimeString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTipoIcon(movimento.tipo)}
                          label={getTipoLabel(movimento.tipo)}
                          color={getTipoColor(movimento.tipo) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {movimento.gruppo_nome} - {movimento.prodotto_nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {movimento.colore_nome} {movimento.altezza_nome && `- ${movimento.altezza_nome}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {movimento.quantita.toLocaleString()} steli
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.prezzo_unitario ? `€${movimento.prezzo_unitario.toFixed(3)}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {movimento.valore_totale ? `€${movimento.valore_totale.toFixed(2)}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {movimento.fattura_numero && (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {movimento.fattura_numero}
                            </Typography>
                          )}
                          {movimento.fornitore_nome && (
                            <Typography variant="caption" color="text.secondary">
                              {movimento.fornitore_nome}
                            </Typography>
                          )}
                          {movimento.cliente_nome && (
                            <Typography variant="caption" color="text.secondary">
                              {movimento.cliente_nome}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {movimento.note || '-'}
                        </Typography>
                        {movimento.utente && (
                          <Typography variant="caption" color="text.secondary">
                            da {movimento.utente}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginazione */}
          <TablePagination
            component="div"
            count={filteredMovimenti.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Righe per pagina:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
            sx={{ mt: 2 }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default MovimentiMagazzino;