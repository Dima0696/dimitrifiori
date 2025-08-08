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
  tipo: 'carico' | 'scarico' | 'distruzione' | 'inventario' | 'trasferimento' | 'carico_virtuale';
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
  fattura_numero_ref?: string;
  fattura_data?: string;
  ordine_numero?: string;
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

// Colori moderni con accenti strategici
const colors = {
  primary: '#8b5cf6',     // Violet per movimenti
  secondary: '#3b82f6',   // Blue
  accent1: '#10b981',     // Emerald per carichi
  accent2: '#ef4444',     // Red per scarichi  
  accent3: '#f59e0b',     // Amber per distruzioni
  text: '#1e293b',
  textSecondary: '#64748b',
  glass: 'rgba(255, 255, 255, 0.8)',
  border: 'rgba(139, 92, 246, 0.2)',
};

const modernStyles = {
  mainContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
    padding: 2
  },
  glassmorphic: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.08)',
    position: 'relative',
    overflow: 'hidden',

  },
  searchCard: {
    background: colors.glass,
    backdropFilter: 'blur(15px)',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    mb: 2,
    position: 'relative',
    overflow: 'hidden',

  },
  primaryButton: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
    borderRadius: '12px',
    color: 'white',
    fontWeight: 600,
    padding: '10px 20px',
    textTransform: 'none',
    fontSize: '14px',
    boxShadow: `0 4px 16px ${colors.primary}40`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)`,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${colors.primary}50`
    }
  },
  secondaryButton: {
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 16px',
    fontSize: '14px',
    border: `2px solid ${colors.border}`,
    color: colors.text,
    '&:hover': {
      background: `${colors.primary}10`,
      border: `2px solid ${colors.primary}40`,
    }
  },
  // Stili unificati come in Giacenze
  statsCard: {
    p: 2.5,
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      border: `1px solid ${colors.border}`,
    }
  },
  // Cards con sfumature come in Giacenze
  caricoCard: {
    background: `linear-gradient(135deg, ${colors.accent1}15, ${colors.accent1}05)`,
    '&:hover': {
      boxShadow: `0 8px 25px ${colors.accent1}20`,
    }
  },
  scaricoCard: {
    background: `linear-gradient(135deg, ${colors.accent2}15, ${colors.accent2}05)`,
    '&:hover': {
      boxShadow: `0 8px 25px ${colors.accent2}20`,
    }
  },
  distruzioneCard: {
    background: `linear-gradient(135deg, ${colors.accent3}15, ${colors.accent3}05)`,
    '&:hover': {
      boxShadow: `0 8px 25px ${colors.accent3}20`,
    }
  },
  // Card per movimenti totali
  movimentiTotaliCard: {
    background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05)`,
    '&:hover': {
      boxShadow: `0 8px 25px ${colors.primary}20`,
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
        statisticheData,
        giacenzeVirtuali
      ] = await Promise.all([
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getFornitori(),
        apiService.getMovimentiMagazzino(),
        apiService.getStatisticheMovimenti(),
        apiService.getGiacenzeVirtuali()
      ]);
      
      setGruppi(gruppiData);
      setProdotti(prodottiData);
      setColori(coloriData);
      setFornitori(fornitoriData);

      // La vista DB restituisce già i nomi; manteniamo un leggero fallback
      // Mappa prodotto dai carichi virtuali (per ordini) se mancante
      const keyFrom = (o: any) => `${o.ordine_acquisto_id || ''}|${o.gruppo_nome || ''}|${o.colore_nome || ''}|${o.altezza_cm || ''}`;
      const prodottoByVirtualKey: Record<string, string> = Object.create(null);
      (giacenzeVirtuali || []).forEach((gv: any) => {
        const k = keyFrom(gv);
        if (gv.prodotto_nome) prodottoByVirtualKey[k] = gv.prodotto_nome;
      });

      const movimentiEnriched = (movimentiData || []).map((m: any) => {
        let prodotto_nome = m.prodotto_nome;
        if (!prodotto_nome && m.tipo === 'carico_virtuale') {
          const k = `${m.ordine_acquisto_id || ''}|${m.gruppo_nome || ''}|${m.colore_nome || ''}|${(m.altezza_cm || m.altezza_nome || '').toString().replace(' cm','')}`;
          if (prodottoByVirtualKey[k]) prodotto_nome = prodottoByVirtualKey[k];
        }
        const articolo_completo = m.articolo_completo || [m.gruppo_nome, prodotto_nome, m.colore_nome, m.altezza_nome].filter(Boolean).join(' - ');
        return { ...m, prodotto_nome, articolo_completo };
      });

      setMovimenti(movimentiEnriched);
      
      console.log('✅ Movimenti caricati dal database:', movimentiData.length);
      console.log('✅ Statistiche calcolate:', statisticheData);
      
    } catch (err) {
      console.error('❌ Errore caricamento dati movimenti:', err);
      setError('Errore nel caricamento dei dati. Verificare la connessione al database.');
      setMovimenti([]); // Lista vuota invece di mock
    } finally {
      setLoading(false);
    }
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
      case 'carico_virtuale': return 'warning';
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
      case 'carico_virtuale': return <TrendingUpIcon />;
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
      case 'carico_virtuale': return 'Carico Virtuale';
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssessmentIcon sx={{ fontSize: 24, color: colors.primary }} />
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: colors.text,
                    fontSize: '1.2rem',
                    letterSpacing: '-0.01em',
                    mb: 0.5
                  }}
                >
                  Movimenti
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}>
                  Storico completo di tutti i movimenti di magazzino
                </Typography>
              </Box>
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{...modernStyles.statsCard, ...modernStyles.movimentiTotaliCard}}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: colors.primary,
                  letterSpacing: '-0.01em',
                  mb: 0.5
                }}>
                  {stats.totaleMovimenti}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}>
                  Movimenti Totali
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{...modernStyles.statsCard, ...modernStyles.caricoCard}}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: colors.accent1,
                  letterSpacing: '-0.01em',
                  mb: 0.5
                }}>
                  {stats.movimentiCarico}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}>
                  Carichi
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontSize: '0.7rem',
                  display: 'block'
                }}>
                  €{stats.valoreCarico.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{...modernStyles.statsCard, ...modernStyles.scaricoCard}}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: colors.accent2,
                  letterSpacing: '-0.01em',
                  mb: 0.5
                }}>
                  {stats.movimentiScarico + stats.movimentiDistruzione}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}>
                  Scarichi + Distruzioni
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontSize: '0.7rem',
                  display: 'block'
                }}>
                  €{(stats.valoreScarico + stats.valoreDistruzione).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{...modernStyles.statsCard, ...modernStyles.distruzioneCard}}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: colors.accent3,
                  letterSpacing: '-0.01em',
                  mb: 0.5
                }}>
                  €{stats.giacenzaAttuale.toFixed(0)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}>
                  Valore Giacenza
                </Typography>
              </Box>
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
                      startAdornment: <SearchIcon sx={{ color: colors.text, mr: 1, opacity: 0.7 }} />,
                      sx: {
                        color: colors.text,
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.border
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary,
                          boxShadow: `0 0 0 2px ${colors.primary}20`
                        }
                      }
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: colors.text },
                      '& .MuiInputBase-input::placeholder': { color: colors.text, opacity: 0.6 }
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
                        <MenuItem value="carico_virtuale">Carico Virtuale</MenuItem>
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
                  <TableCell sx={{ fontWeight: 700 }}>Articolo / Prodotto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quantità</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prezzo Unit.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Valore Tot.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Documento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fornitore</TableCell>
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
                      sx={{ 
                        fontWeight: 700,
                        ...(movimento.tipo === 'carico_virtuale' && { border: '2px solid #f59e0b', bgcolor: '#fff7ed', color: '#b45309' }),
                        ...(movimento.tipo === 'carico' && { border: '2px solid #10b981', bgcolor: '#ecfdf5', color: '#065f46' }),
                        ...(movimento.tipo === 'distruzione' && { border: '2px solid #ef4444', bgcolor: '#fef2f2', color: '#991b1b' }),
                      }}
                      variant={movimento.tipo === 'carico_virtuale' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {(() => {
                              const top = [movimento.gruppo_nome, movimento.prodotto_nome]
                                .filter(Boolean)
                                .join(' - ');
                              return top ? top.toUpperCase() : 'ARTICOLO N/A';
                            })()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(() => {
                              const parts = [
                                movimento.colore_nome || undefined,
                                movimento.altezza_nome || undefined,
                                movimento.imballo_nome || undefined,
                              ].filter(Boolean);
                              return parts.length ? parts.join(' • ') : 'Dettagli N/A';
                            })()}
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
                          { (movimento.fattura_numero || movimento.fattura_numero_ref) ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Fattura: {movimento.fattura_numero || movimento.fattura_numero_ref}
                              </Typography>
                              {movimento.ordine_numero && (
                                <Typography variant="caption" color="text.secondary">
                                  Da ordine: {movimento.ordine_numero}
                                </Typography>
                              )}
                            </>
                          ) : movimento.ordine_numero ? (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                              Ordine: {movimento.ordine_numero}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.fornitore_nome || '—'}
                        </Typography>
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