import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Stack, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  InputAdornment, LinearProgress, Divider, Card, CardContent, Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import InventoryIcon from '@mui/icons-material/Inventory';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';

interface Giacenza {
  id: number;
  varieta_id: number;
  varieta_nome: string;
  gruppo_nome?: string;
  prodotto_nome?: string;
  quantita: number;
  prezzo_acquisto: number;
  prezzo_vendita?: number;
  data_acquisto: string;
  imballo: number;
  fattura_id?: number;
  fattura_numero?: string;
  fornitore_id?: number;
  fornitore_nome?: string;
  note?: string;
  giorni_giacenza?: number;
  valore_totale?: number;
  image_path?: string;
}

interface Distruzione {
  id?: number;
  giacenza_id: number;
  quantita: number;
  motivo: string;
  data_distruzione: string;
  giacenza_nome?: string;
  giacenza_varieta?: string;
  valore_distrutto?: number;
}

interface FormDistruzione {
  quantita: number;
  motivo: string;
  note?: string;
}

export default function MagazzinoDistruzione() {
  const [giacenze, setGiacenze] = useState<Giacenza[]>([]);
  const [distruzioni, setDistruzioni] = useState<Distruzione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterGruppo, setFilterGruppo] = useState<string>('tutti');
  const [filterGiacenza, setFilterGiacenza] = useState<string>('tutti'); // tutti, vecchia, recente
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'warning'}>({
    open: false, message: '', severity: 'success'
  });
  
  // Dialog per distruzione
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGiacenza, setSelectedGiacenza] = useState<Giacenza | null>(null);
  const [formData, setFormData] = useState<FormDistruzione>({
    quantita: 0,
    motivo: '',
    note: ''
  });
  const [quantitaValida, setQuantitaValida] = useState(true);
  const [quantitaSuggerita, setQuantitaSuggerita] = useState<number | null>(null);

  // Sistema di eventi per sincronizzazione
  const emitter = useMagazzinoEmitter();

  // Listener per eventi del magazzino
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 Fattura creata - ricarico giacenze per distruzione');
    caricaDati();
  });

  useMagazzinoEvent('movimento_creato', () => {
    console.log('🔄 Movimento creato - ricarico giacenze per distruzione');
    caricaDati();
  });

  useMagazzinoEvent('giacenza_aggiornata', () => {
    console.log('🔄 Giacenza aggiornata - ricarico dati distruzione');
    caricaDati();
  });

  useMagazzinoEvent('ricalcolo_giacenze', () => {
    console.log('🔄 Ricalcolo giacenze - ricarico dati distruzione');
    caricaDati();
  });

  useMagazzinoEvent('dati_aggiornati', (event) => {
    if (event.data?.component !== 'MagazzinoDistruzione') {
      console.log(`🔄 Dati aggiornati da ${event.data?.component} - ricarico distruzione`);
      caricaDati();
    }
  });

  useEffect(() => {
    caricaDati();
  }, []);

  const caricaDati = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Caricamento dati per distruzione magazzino...');
      
      // Carica giacenze e distruzioni reali dal backend
      const [giacenzeReali, distruzioniReali] = await Promise.all([
        apiService.getGiacenze(),
        apiService.getDistruzioni()
      ]);

      // Calcola giorni di giacenza e valore totale
      const giacenzeConDati = giacenzeReali.map((g: Giacenza) => {
        const dataAcquisto = new Date(g.data_acquisto);
        const oggi = new Date();
        const giorniGiacenza = Math.ceil((oggi.getTime() - dataAcquisto.getTime()) / (1000 * 3600 * 24));
        
        return {
          ...g,
          giorni_giacenza: giorniGiacenza,
          valore_totale: g.quantita * g.prezzo_acquisto
        };
      });
      
      setGiacenze(giacenzeConDati);
      setDistruzioni(distruzioniReali);
      
      // Emetti evento di aggiornamento dati
      emitter.emitDatiAggiornati('MagazzinoDistruzione');
      
      console.log(`✅ Caricate ${giacenzeConDati.length} giacenze e ${distruzioniReali.length} distruzioni`);
    } catch (err) {
      console.error('❌ Errore nel caricamento dati distruzione:', err);
      setError('Errore nel caricamento dei dati: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Validazione quantità con imballo
  const validaQuantita = (quantita: number, imballo: number) => {
    if (quantita <= 0 || imballo <= 0) return false;
    return quantita % imballo === 0;
  };

  const handleQuantitaChange = (value: string) => {
    const quantita = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, quantita }));
    
    if (selectedGiacenza) {
      const valida = validaQuantita(quantita, selectedGiacenza.imballo);
      setQuantitaValida(valida);
      
      if (!valida && quantita > 0) {
        // Suggerisci la quantità corretta più vicina
        const suggerita = Math.round(quantita / selectedGiacenza.imballo) * selectedGiacenza.imballo;
        setQuantitaSuggerita(suggerita);
      } else {
        setQuantitaSuggerita(null);
      }
    }
  };

  const handleDistruzioneSubmit = async () => {
    if (!selectedGiacenza) return;
    
    if (!quantitaValida) {
      setError(`La quantità deve essere un multiplo di ${selectedGiacenza.imballo}`);
      return;
    }
    
    if (formData.quantita > selectedGiacenza.quantita) {
      setError(`La quantità da distruggere (${formData.quantita}) non può essere maggiore della giacenza disponibile (${selectedGiacenza.quantita})`);
      return;
    }
    
    if (!formData.motivo.trim()) {
      setError('Il motivo della distruzione è obbligatorio');
      return;
    }

    try {
      setLoading(true);
      
      // Crea movimento di distruzione
      const movimentoData = {
        varieta_id: selectedGiacenza.varieta_id,
        tipo: 'distruzione' as const,
        quantita: formData.quantita,
        prezzo_unitario: selectedGiacenza.prezzo_acquisto,
        note: `Distruzione: ${formData.motivo}${formData.note ? ` - ${formData.note}` : ''}`,
        imballo: selectedGiacenza.imballo
      };

      await apiService.createMovimento(movimentoData);
      
             // Aggiorna giacenza - riduci la quantità
       await apiService.updateGiacenza(
         selectedGiacenza.varieta_id, 
         selectedGiacenza.quantita - formData.quantita
       );

      console.log(`✅ Distruzione eseguita: ${formData.quantita} x ${selectedGiacenza.varieta_nome}`);
      
      // Emetti evento di distruzione eseguita
      emitter.emitDistruzioneEseguita({
        giacenza: selectedGiacenza,
        quantita: formData.quantita,
        motivo: formData.motivo
      });
      
      setSnackbar({
        open: true,
        message: `Distruzione di ${formData.quantita} x ${selectedGiacenza.varieta_nome} completata`,
        severity: 'success'
      });
      
      // Reset e chiudi dialog
      setOpenDialog(false);
      setSelectedGiacenza(null);
      setFormData({ quantita: 0, motivo: '', note: '' });
      setQuantitaValida(true);
      setQuantitaSuggerita(null);
      
      // Ricarica dati
      await caricaDati();
      
    } catch (err) {
      console.error('❌ Errore nella distruzione:', err);
      setError('Errore nella distruzione: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openDistruzioneDialog = (giacenza: Giacenza) => {
    setSelectedGiacenza(giacenza);
    setFormData({ quantita: 0, motivo: '', note: '' });
    setQuantitaValida(true);
    setQuantitaSuggerita(null);
    setOpenDialog(true);
  };

  // Filtri
  const filteredGiacenze = giacenze.filter(giacenza => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (giacenza.varieta_nome || '').toLowerCase().includes(searchLower) ||
      (giacenza.gruppo_nome || '').toLowerCase().includes(searchLower) ||
      (giacenza.prodotto_nome || '').toLowerCase().includes(searchLower) ||
      (giacenza.fornitore_nome || '').toLowerCase().includes(searchLower);
    
    const matchesGruppo = filterGruppo === 'tutti' || giacenza.gruppo_nome === filterGruppo;
    
    let matchesGiacenza = true;
    if (filterGiacenza === 'vecchia') {
      matchesGiacenza = (giacenza.giorni_giacenza || 0) > 30;
    } else if (filterGiacenza === 'recente') {
      matchesGiacenza = (giacenza.giorni_giacenza || 0) <= 30;
    }
    
    return matchesSearch && matchesGruppo && matchesGiacenza && giacenza.quantita > 0;
  });

  const gruppiDisponibili = Array.from(new Set(giacenze.map(g => g.gruppo_nome).filter(Boolean)));

  const getGiacenzaColor = (giorni: number) => {
    if (giorni <= 7) return 'success';
    if (giorni <= 30) return 'warning';
    return 'error';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          🗑️ Distruzione Magazzino
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={caricaDati}
          disabled={loading}
        >
          Aggiorna
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistiche */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" fontWeight={600}>
              {giacenze.filter(g => g.quantita > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giacenze Disponibili
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" color="warning.main" fontWeight={600}>
              {giacenze.filter(g => (g.giorni_giacenza || 0) > 30 && g.quantita > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giacenze Vecchie (&gt;30gg)
            </Typography>
          </CardContent>
        </Card>
        
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" color="success.main" fontWeight={600}>
              {distruzioni.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Distruzioni Totali
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Cerca per varietà, gruppo, prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Gruppo</InputLabel>
            <Select
              value={filterGruppo}
              label="Gruppo"
              onChange={(e) => setFilterGruppo(e.target.value)}
            >
              <MenuItem value="tutti">Tutti i Gruppi</MenuItem>
              {gruppiDisponibili.map(gruppo => (
                <MenuItem key={gruppo} value={gruppo}>{gruppo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Giacenza</InputLabel>
            <Select
              value={filterGiacenza}
              label="Giacenza"
              onChange={(e) => setFilterGiacenza(e.target.value)}
            >
              <MenuItem value="tutti">Tutte</MenuItem>
              <MenuItem value="recente">Recenti (≤30gg)</MenuItem>
              <MenuItem value="vecchia">Vecchie (&gt;30gg)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tabella giacenze */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Foto</TableCell>
              <TableCell>Varietà</TableCell>
              <TableCell>Gruppo</TableCell>
              <TableCell>Prodotto</TableCell>
              <TableCell align="right">Quantità</TableCell>
              <TableCell align="right">Imballo</TableCell>
              <TableCell align="right">Prezzo Acquisto</TableCell>
              <TableCell align="right">Valore Totale</TableCell>
              <TableCell>Fornitore</TableCell>
              <TableCell>Data Acquisto</TableCell>
              <TableCell>Giorni Giacenza</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGiacenze.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    {loading ? 'Caricamento...' : 'Nessuna giacenza trovata con i filtri applicati'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredGiacenze.map((giacenza) => (
                <TableRow key={giacenza.id} hover>
                  <TableCell>
                    {giacenza.image_path ? (
                      <Avatar
                        src={giacenza.image_path}
                        alt={giacenza.varieta_nome}
                        sx={{ width: 32, height: 32 }}
                        variant="rounded"
                      />
                    ) : (
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}
                        variant="rounded"
                      >
                        <InventoryIcon />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {giacenza.varieta_nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {giacenza.gruppo_nome || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {giacenza.prodotto_nome || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {giacenza.quantita}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={giacenza.imballo} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(giacenza.prezzo_acquisto)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(giacenza.valore_totale || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {giacenza.fornitore_nome || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(giacenza.data_acquisto)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${giacenza.giorni_giacenza || 0} gg`}
                      size="small"
                      color={getGiacenzaColor(giacenza.giorni_giacenza || 0)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Distruggi giacenza">
                      <IconButton
                        color="error"
                        onClick={() => openDistruzioneDialog(giacenza)}
                        disabled={giacenza.quantita === 0}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Distruzione */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          🗑️ Distruzione Giacenza
        </DialogTitle>
        <DialogContent>
          {selectedGiacenza && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Attenzione:</strong> La distruzione è irreversibile e ridurrà permanentemente la giacenza.
                </Typography>
              </Alert>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Dettagli Giacenza:
                </Typography>
                <Typography variant="body2"><strong>Varietà:</strong> {selectedGiacenza.varieta_nome}</Typography>
                <Typography variant="body2"><strong>Quantità disponibile:</strong> {selectedGiacenza.quantita}</Typography>
                <Typography variant="body2"><strong>Imballo:</strong> {selectedGiacenza.imballo}</Typography>
                <Typography variant="body2"><strong>Valore unitario:</strong> {formatCurrency(selectedGiacenza.prezzo_acquisto)}</Typography>
              </Box>

              <Stack spacing={2}>
                <TextField
                  label="Quantità da distruggere"
                  type="number"
                  value={formData.quantita || ''}
                  onChange={(e) => handleQuantitaChange(e.target.value)}
                  error={!quantitaValida}
                  helperText={
                    !quantitaValida 
                      ? `Deve essere multiplo di ${selectedGiacenza.imballo}${quantitaSuggerita ? `. Suggeriamo: ${quantitaSuggerita}` : ''}`
                      : `Multipli di ${selectedGiacenza.imballo} (max: ${selectedGiacenza.quantita})`
                  }
                  inputProps={{ 
                    min: 0, 
                    max: selectedGiacenza.quantita,
                    step: selectedGiacenza.imballo 
                  }}
                  fullWidth
                />
                
                {quantitaSuggerita && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuantitaChange(quantitaSuggerita.toString())}
                  >
                    Usa quantità suggerita: {quantitaSuggerita}
                  </Button>
                )}

                <FormControl fullWidth>
                  <InputLabel>Motivo Distruzione</InputLabel>
                  <Select
                    value={formData.motivo}
                    label="Motivo Distruzione"
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  >
                    <MenuItem value="Scaduto">Prodotto scaduto</MenuItem>
                    <MenuItem value="Danneggiato">Prodotto danneggiato</MenuItem>
                    <MenuItem value="Qualità insufficiente">Qualità insufficiente</MenuItem>
                    <MenuItem value="Deterioramento">Deterioramento naturale</MenuItem>
                    <MenuItem value="Inventario">Correzione inventario</MenuItem>
                    <MenuItem value="Altro">Altro motivo</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Note aggiuntive (opzionale)"
                  value={formData.note || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  multiline
                  rows={2}
                  fullWidth
                />

                {formData.quantita > 0 && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Valore distrutto:</strong> {formatCurrency(formData.quantita * selectedGiacenza.prezzo_acquisto)}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDistruzioneSubmit}
            disabled={!quantitaValida || !formData.motivo || formData.quantita <= 0 || loading}
            startIcon={<DeleteIcon />}
          >
            Conferma Distruzione
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 