import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';

interface MovimentoMagazzino {
  id: number;
  varieta_id: number;
  varieta_nome?: string;
  gruppo_nome?: string;
  prodotto_nome?: string;
  tipo: 'carico' | 'scarico' | 'distruzione';
  quantita: number;
  prezzo_unitario?: number;
  fattura_id?: number;
  fattura_numero?: string;
  fornitore_nome?: string;
  cliente_nome?: string;
  data: string;
  note?: string;
  created_at?: string;
}

export default function MovimentiMagazzino() {
  const [movimenti, setMovimenti] = useState<MovimentoMagazzino[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'tutti' | 'carico' | 'scarico' | 'distruzione'>('tutti');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Sistema di eventi per sincronizzazione
  const emitter = useMagazzinoEmitter();

  // Listener per eventi del magazzino
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 Fattura creata - ricarico movimenti');
    loadMovimenti();
  });

  useMagazzinoEvent('movimento_creato', () => {
    console.log('🔄 Movimento creato - ricarico movimenti');
    loadMovimenti();
  });

  useMagazzinoEvent('distruzione_eseguita', () => {
    console.log('🔄 Distruzione eseguita - ricarico movimenti');
    loadMovimenti();
  });

  useMagazzinoEvent('ricalcolo_giacenze', () => {
    console.log('🔄 Ricalcolo giacenze - ricarico movimenti');
    loadMovimenti();
  });

  const loadMovimenti = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento movimenti magazzino...');
      
      // Usa l'API reale dal backend
      const movimentiReali = await apiService.getMovimentiMagazzino();
      console.log(`📦 Ricevuti ${movimentiReali.length} movimenti dal backend`);
      
      setMovimenti(movimentiReali);
      emitter.emitDatiAggiornati('MovimentiMagazzino');
    } catch (err) {
      console.error('❌ Errore nel caricamento movimenti:', err);
      setError('Errore nel caricamento dei movimenti: ' + (err as Error).message);
      setMovimenti([]); // Reset in caso di errore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovimenti();
  }, []);

  const filteredMovimenti = movimenti.filter(movimento => {
      const searchLower = search.toLowerCase();
  const matchesSearch = (movimento.varieta_nome || '').toLowerCase().includes(searchLower) ||
    (movimento.note && movimento.note.toLowerCase().includes(searchLower));
    
    const matchesTipo = filterTipo === 'tutti' || movimento.tipo === filterTipo;
    
        const matchesDate = (!dataInizio || movimento.data >= dataInizio) &&
      (!dataFine || movimento.data <= dataFine);
    
    return matchesSearch && matchesTipo && matchesDate;
  });

  const handleRefresh = () => {
    loadMovimenti();
    setSnackbar({ open: true, message: 'Dati aggiornati', severity: 'success' });
  };

  const handleExport = () => {
    setSnackbar({ open: true, message: 'Esportazione in arrivo', severity: 'success' });
  };

  const handlePrint = () => {
    window.print();
    setSnackbar({ open: true, message: 'Stampa avviata', severity: 'success' });
  };

  const getTipoColor = (tipo: 'carico' | 'scarico' | 'distruzione') => {
    if (tipo === 'carico') return 'success';
    if (tipo === 'distruzione') return 'warning';
    return 'error'; // scarico
  };

  const getTipoLabel = (tipo: 'carico' | 'scarico' | 'distruzione') => {
    if (tipo === 'carico') return 'Carico';
    if (tipo === 'distruzione') return 'Distruzione';
    return 'Scarico';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totaleCarichi = filteredMovimenti
    .filter(m => m.tipo === 'carico')
    .reduce((sum, m) => sum + m.quantita, 0);

  const totaleScarichi = filteredMovimenti
    .filter(m => m.tipo === 'scarico')
    .reduce((sum, m) => sum + m.quantita, 0);

  const valoreCarichi = filteredMovimenti
    .filter(m => m.tipo === 'carico' && m.prezzo_unitario)
    .reduce((sum, m) => sum + (m.quantita * (m.prezzo_unitario || 0)), 0);

  const valoreScarichi = filteredMovimenti
    .filter(m => m.tipo === 'scarico' && m.prezzo_unitario)
    .reduce((sum, m) => sum + (m.quantita * (m.prezzo_unitario || 0)), 0);

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Movimenti Magazzino
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Aggiorna
            </Button>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={() => {
                emitter.emitRicalcoloGiacenze();
                setSnackbar({ open: true, message: 'Sincronizzazione magazzino avviata', severity: 'success' });
              }}
              disabled={loading}
              color="warning"
            >
              Sincronizza
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Esporta
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Stampa
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filtri */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Cerca varietà o note"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Tipo Movimento</InputLabel>
            <Select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              label="Tipo Movimento"
            >
              <MenuItem value="tutti">Tutti</MenuItem>
                              <MenuItem value="carico">Carico</MenuItem>
                <MenuItem value="scarico">Scarico</MenuItem>
                <MenuItem value="distruzione">Distruzione</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Data Inizio"
            type="date"
            value={dataInizio}
            onChange={(e) => setDataInizio(e.target.value)}
            size="small"
          />
          <TextField
            fullWidth
            label="Data Fine"
            type="date"
            value={dataFine}
            onChange={(e) => setDataFine(e.target.value)}
            size="small"
          />
        </Box>

        {/* Statistiche */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {totaleCarichi}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totale Carichi
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {totaleScarichi}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totale Scarichi
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              €{valoreCarichi.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valore Carichi
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              €{valoreScarichi.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valore Scarichi
            </Typography>
          </Paper>
        </Box>

        {/* Tabella Movimenti */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Varietà</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Quantità</TableCell>
                <TableCell align="right">Prezzo Unit.</TableCell>
                <TableCell align="right">Valore</TableCell>
                <TableCell>Fattura</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredMovimenti.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nessun movimento trovato
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovimenti.map((movimento) => (
                  <TableRow key={movimento.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(movimento.data)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {movimento.varieta_nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTipoLabel(movimento.tipo)}
                        color={getTipoColor(movimento.tipo)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {movimento.quantita}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {movimento.prezzo_unitario ? (
                        <Typography variant="body2">
                          €{movimento.prezzo_unitario.toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {movimento.prezzo_unitario ? (
                        <Typography variant="body2" fontWeight={600}>
                          €{(movimento.quantita * movimento.prezzo_unitario).toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {movimento.fattura_id ? (
                        <Chip
                          label={`FA-${movimento.fattura_id.toString().padStart(3, '0')}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {movimento.note || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredMovimenti.length} di {movimenti.length} movimenti
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 