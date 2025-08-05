import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as DeliveryIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../lib/apiService';
import InserimentoFattureMultiRiga from './magazzino/InserimentoFattureMultiRiga';

interface OrdineAcquisto {
  id: number;
  numero_ordine: string;
  data_ordine: string;
  data_consegna_prevista: string;
  id_fornitore: number;
  ragione_sociale: string;
  stato: 'Ordinato' | 'Consegnato';
  totale_ordine: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

// Rimosso il sistema di tab - ora è una singola pagina

const modernColors = {
  primary: '#f59e0b',
  secondary: '#f97316', 
  accent: '#fb923c',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#1f2937',
  textSecondary: '#6b7280',
  background: '#fafafa',
  surface: '#ffffff'
};

export default function GestioneAcquisti() {
  const [ordini, setOrdini] = useState<OrdineAcquisto[]>([]);
  const [filtroStato, setFiltroStato] = useState<string>('');
  const [filtroFornitore, setFiltroFornitore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogNuovoOrdine, setDialogNuovoOrdine] = useState(false);
  const [dialogModificaOrdine, setDialogModificaOrdine] = useState(false);
  const [dialogVisualizzaOrdine, setDialogVisualizzaOrdine] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState<OrdineAcquisto | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Statistiche derivate
  const stats = {
    totaleOrdini: ordini.length,
    ordiniOrdinati: ordini.filter(o => o.stato === 'Ordinato').length,
    ordiniConsegnati: ordini.filter(o => o.stato === 'Consegnato').length,
    valoreOrdinato: ordini.filter(o => o.stato === 'Ordinato').reduce((acc, o) => acc + o.totale_ordine, 0)
  };

  // Ordini filtrati
  const ordiniFiltrati = ordini.filter(ordine => {
    const matchStato = !filtroStato || ordine.stato === filtroStato;
    const matchFornitore = !filtroFornitore || ordine.ragione_sociale.toLowerCase().includes(filtroFornitore.toLowerCase());
    return matchStato && matchFornitore;
  });

  const loadOrdiniAcquisto = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrdiniAcquisto();
      setOrdini(response || []);
    } catch (error) {
      console.error('Errore nel caricamento ordini:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento degli ordini acquisto',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== CRUD FUNCTIONS =====
  
  const handleVisualizzaOrdine = async (ordine: OrdineAcquisto) => {
    try {
      setLoading(true);
      const ordineCompleto = await apiService.getOrdineAcquisto(ordine.id);
      setOrdineSelezionato(ordineCompleto);
      setDialogVisualizzaOrdine(true);
    } catch (error) {
      console.error('Errore nel caricamento dettagli ordine:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento dettagli ordine',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModificaOrdine = async (ordine: OrdineAcquisto) => {
    try {
      setLoading(true);
      const ordineCompleto = await apiService.getOrdineAcquisto(ordine.id);
      setOrdineSelezionato(ordineCompleto);
      setDialogModificaOrdine(true);
    } catch (error) {
      console.error('Errore nel caricamento ordine per modifica:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento ordine per modifica',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminaOrdine = async (ordine: OrdineAcquisto) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'ordine ${ordine.numero_ordine}?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteOrdineAcquisto(ordine.id);
      
      setSnackbar({
        open: true,
        message: `Ordine ${ordine.numero_ordine} eliminato con successo`,
        severity: 'success'
      });
      
      // Ricarica la lista
      await loadOrdiniAcquisto();
    } catch (error) {
      console.error('Errore nell\'eliminazione ordine:', error);
      setSnackbar({
        open: true,
        message: 'Errore nell\'eliminazione ordine',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdiniAcquisto();
  }, []);

  const handleConsegnaOrdine = async (ordineId: number) => {
    try {
      // Implementeremo dopo - trasforma ordine in fattura
      await apiService.trasformaOrdineInFattura(ordineId);
      
      setSnackbar({
        open: true,
        message: 'Ordine trasformato in fattura con successo!',
        severity: 'success'
      });
      
      await loadOrdiniAcquisto(); // Ricarica la lista
    } catch (error) {
      console.error('Errore nella trasformazione:', error);
      setSnackbar({
        open: true,
        message: 'Errore nella trasformazione dell\'ordine',
        severity: 'error'
      });
    }
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'Ordinato': return modernColors.warning;
      case 'Consegnato': return modernColors.success;
      default: return modernColors.textSecondary;
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'Ordinato': return <ShoppingCartIcon />;
      case 'Consegnato': return <CheckCircleIcon />;
      default: return <ShoppingCartIcon />;
    }
  };

  const modernStyles = {
    mainContainer: {
      p: 3,
      background: `linear-gradient(135deg, ${alpha(modernColors.primary, 0.04)} 0%, ${alpha(modernColors.secondary, 0.02)} 100%)`,
      minHeight: '100vh'
    },
    statsCard: {
      borderRadius: 1, // Meno arrotondato
      background: modernColors.surface,
      border: `2px solid ${alpha(modernColors.primary, 0.15)}`,
      transition: 'all 0.3s ease',
      boxShadow: `0 2px 8px ${alpha(modernColors.primary, 0.08)}`,
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 8px 25px ${alpha(modernColors.primary, 0.2)}`,
        borderColor: modernColors.primary
      }
    },
    header: {
      background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
      color: 'white',
      p: 4,
      borderRadius: 0, // Completamente squadrato
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      boxShadow: `0 4px 12px ${alpha(modernColors.primary, 0.3)}`
    },
    filterCard: {
      borderRadius: 1,
      background: modernColors.surface,
      border: `1px solid ${alpha(modernColors.primary, 0.15)}`,
      boxShadow: `0 2px 8px ${alpha(modernColors.primary, 0.06)}`
    },
    tableContainer: {
      borderRadius: 1,
      background: modernColors.surface,
      border: `1px solid ${alpha(modernColors.primary, 0.15)}`,
      boxShadow: `0 4px 12px ${alpha(modernColors.primary, 0.08)}`
    },
    primaryButton: {
      borderRadius: 1,
      background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
      color: 'white',
      px: 4,
      py: 1.5,
      fontWeight: 600,
      border: 'none',
      boxShadow: `0 3px 10px ${alpha(modernColors.primary, 0.3)}`,
      '&:hover': {
        background: `linear-gradient(135deg, ${modernColors.secondary} 0%, ${modernColors.primary} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 6px 20px ${alpha(modernColors.primary, 0.4)}`
      }
    }
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card sx={modernStyles.statsCard}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ShoppingCartIcon sx={{ fontSize: 40, color: modernColors.primary, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: modernColors.text }}>
                {stats.totaleOrdini}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordini Totali
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card sx={modernStyles.statsCard}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <DeliveryIcon sx={{ fontSize: 40, color: modernColors.warning, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: modernColors.text }}>
                {stats.ordiniOrdinati}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Attesa
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card sx={modernStyles.statsCard}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: modernColors.success, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: modernColors.text }}>
                {stats.ordiniConsegnati}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consegnati
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card sx={modernStyles.statsCard}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h6" sx={{ fontSize: 16, color: modernColors.textSecondary, mb: 1 }}>
                VALORE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: modernColors.primary }}>
                €{stats.valoreOrdinato.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordinato
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  const renderFiltri = () => (
    <Paper sx={modernStyles.filterCard}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, color: modernColors.text, fontWeight: 600 }}>
          🔍 Filtri e Azioni
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: modernColors.textSecondary }}>Filtra per Stato</InputLabel>
              <Select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                label="Filtra per Stato"
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(modernColors.primary, 0.2)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: modernColors.primary
                  }
                }}
              >
                <MenuItem value="">🗂️ Tutti gli stati</MenuItem>
                <MenuItem value="Ordinato">🛒 Ordinato</MenuItem>
                <MenuItem value="Consegnato">✅ Consegnato</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cerca Fornitore"
              value={filtroFornitore}
              onChange={(e) => setFiltroFornitore(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: modernColors.primary, mr: 1 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: alpha(modernColors.primary, 0.2)
                  },
                  '&:hover fieldset': {
                    borderColor: modernColors.primary
                  }
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={loadOrdiniAcquisto}
                startIcon={<RefreshIcon />}
                disabled={loading}
                sx={{
                  borderRadius: 1,
                  borderColor: modernColors.primary,
                  color: modernColors.primary,
                  '&:hover': {
                    borderColor: modernColors.secondary,
                    backgroundColor: alpha(modernColors.primary, 0.05)
                  }
                }}
              >
                Aggiorna
              </Button>
              <Button
                variant="contained"
                onClick={() => setDialogNuovoOrdine(true)}
                startIcon={<AddIcon />}
                sx={modernStyles.primaryButton}
              >
                🛒 Nuovo Ordine
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );

  const renderTabellaOrdini = () => (
    <Paper sx={modernStyles.tableContainer}>
      <Box sx={{ p: 3, borderBottom: `2px solid ${alpha(modernColors.primary, 0.1)}` }}>
        <Typography variant="h6" sx={{ color: modernColors.text, fontWeight: 600 }}>
          📋 Lista Ordini ({ordiniFiltrati.length})
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: `linear-gradient(135deg, ${alpha(modernColors.primary, 0.08)} 0%, ${alpha(modernColors.secondary, 0.05)} 100%)`,
              borderBottom: `2px solid ${modernColors.primary}`
            }}>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>📄 Numero Ordine</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>🏢 Fornitore</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>📅 Data Ordine</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>🚚 Consegna Prevista</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>📊 Stato</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2 }}>💰 Totale</TableCell>
              <TableCell sx={{ fontWeight: 700, color: modernColors.text, py: 2, textAlign: 'center' }}>⚙️ Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {ordiniFiltrati.map((ordine, index) => (
                <motion.tr
                  key={ordine.id}
                  component={TableRow}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(modernColors.primary, 0.02)
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: modernColors.primary }}>
                      {ordine.numero_ordine}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {ordine.ragione_sociale}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(ordine.data_consegna_prevista).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatoIcon(ordine.stato)}
                      label={ordine.stato}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getStatoColor(ordine.stato), 0.1),
                        color: getStatoColor(ordine.stato),
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      €{ordine.totale_ordine.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleVisualizzaOrdine(ordine)}
                        sx={{ 
                          color: modernColors.primary,
                          borderRadius: 1,
                          '&:hover': { 
                            backgroundColor: alpha(modernColors.primary, 0.1),
                            transform: 'scale(1.1)'
                          }
                        }}
                        title="Visualizza dettagli"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleModificaOrdine(ordine)}
                        disabled={ordine.stato === 'Consegnato'}
                        sx={{ 
                          color: modernColors.secondary,
                          borderRadius: 1,
                          '&:hover': { 
                            backgroundColor: alpha(modernColors.secondary, 0.1),
                            transform: 'scale(1.1)'
                          },
                          '&.Mui-disabled': { color: modernColors.textSecondary }
                        }}
                        title="Modifica ordine"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleEliminaOrdine(ordine)}
                        disabled={ordine.stato === 'Consegnato'}
                        sx={{ 
                          color: modernColors.error,
                          borderRadius: 1,
                          '&:hover': { 
                            backgroundColor: alpha(modernColors.error, 0.1),
                            transform: 'scale(1.1)'
                          },
                          '&.Mui-disabled': { color: modernColors.textSecondary }
                        }}
                        title="Elimina ordine"
                      >
                        <DeleteIcon />
                      </IconButton>
                      {ordine.stato === 'Ordinato' && (
                        <IconButton 
                          size="small" 
                          onClick={() => handleConsegnaOrdine(ordine.id)}
                          sx={{ 
                            color: modernColors.success,
                            borderRadius: 1,
                            '&:hover': { 
                              backgroundColor: alpha(modernColors.success, 0.1),
                              transform: 'scale(1.1)'
                            }
                          }}
                          title="Segna come consegnato"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>
      
      {ordiniFiltrati.length === 0 && (
        <Box sx={{ 
          p: 6, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(modernColors.primary, 0.02)} 0%, ${alpha(modernColors.secondary, 0.01)} 100%)`,
          border: `2px dashed ${alpha(modernColors.primary, 0.2)}`,
          borderRadius: 1
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingCartIcon sx={{ 
              fontSize: 64, 
              color: alpha(modernColors.primary, 0.4), 
              mb: 3 
            }} />
            <Typography variant="h5" sx={{ 
              color: modernColors.text, 
              fontWeight: 600, 
              mb: 2 
            }}>
              {ordini.length === 0 ? '🚀 Inizia il tuo primo ordine!' : '🔍 Nessun ordine trovato'}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: modernColors.textSecondary,
              mb: 3,
              maxWidth: 400,
              mx: 'auto'
            }}>
              {ordini.length === 0 
                ? 'Benvenuto nel sistema di gestione acquisti! Crea il primo ordine per iniziare a gestire i tuoi fornitori.' 
                : 'Non ci sono ordini che corrispondono ai filtri selezionati. Prova a modificare i criteri di ricerca.'
              }
            </Typography>
            {ordini.length === 0 && (
              <Button
                variant="contained"
                size="large"
                onClick={() => setDialogNuovoOrdine(true)}
                startIcon={<AddIcon />}
                sx={modernStyles.primaryButton}
              >
                🛒 Crea il primo ordine
              </Button>
            )}
          </motion.div>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={modernStyles.mainContainer}>
      {/* Header principale senza tab */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ overflow: 'hidden', mb: 4 }}>
          <Box sx={modernStyles.header}>
            <ShoppingCartIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                🛒 Gestione Acquisti
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400 }}>
                Ordini virtuali che diventano fatture reali alla consegna
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Contenuto principale senza tab */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {renderStatsCards()}
        {renderFiltri()}
        {renderTabellaOrdini()}
      </motion.div>

      {/* Dialog Nuovo Ordine */}
      <InserimentoFattureMultiRiga 
        open={dialogNuovoOrdine}
        onClose={() => {
          setDialogNuovoOrdine(false);
          loadOrdiniAcquisto(); // Ricarica dopo creazione ordine
        }}
        modalitaIniziale="ordini"
        soloOrdini={true}
      />

      {/* Dialog Visualizza Ordine - Semplice */}
      <Dialog
        open={dialogVisualizzaOrdine}
        onClose={() => {
          setDialogVisualizzaOrdine(false);
          setOrdineSelezionato(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {ordineSelezionato && (
          <Box sx={{ p: 0 }}>
            {/* Header */}
            <Box sx={{
              background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
              color: 'white',
              p: 3,
              borderRadius: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShoppingCartIcon sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    📋 Dettagli Ordine {ordineSelezionato.numero_ordine}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Visualizzazione completa dell'ordine
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Contenuto */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Informazioni base */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(modernColors.primary, 0.2)}` }}>
                    <Typography variant="h6" sx={{ mb: 2, color: modernColors.text, fontWeight: 600 }}>
                      📋 Informazioni Ordine
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: modernColors.textSecondary }}>Fornitore:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{ordineSelezionato.ragione_sociale}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: modernColors.textSecondary }}>Data Ordine:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(ordineSelezionato.data_ordine).toLocaleDateString('it-IT')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: modernColors.textSecondary }}>Consegna Prevista:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(ordineSelezionato.data_consegna_prevista).toLocaleDateString('it-IT')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: modernColors.textSecondary }}>Stato:</Typography>
                        <Chip
                          icon={getStatoIcon(ordineSelezionato.stato)}
                          label={ordineSelezionato.stato}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getStatoColor(ordineSelezionato.stato), 0.1),
                            color: getStatoColor(ordineSelezionato.stato),
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Totali */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(modernColors.primary, 0.2)}` }}>
                    <Typography variant="h6" sx={{ mb: 2, color: modernColors.text, fontWeight: 600 }}>
                      💰 Totali
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: modernColors.textSecondary }}>Totale Ordine:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: modernColors.primary }}>
                          €{ordineSelezionato.totale_ordine.toFixed(2)}
                        </Typography>
                      </Box>
                      {ordineSelezionato.note && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(modernColors.primary, 0.05), borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: modernColors.textSecondary, mb: 1 }}>
                            📝 Note:
                          </Typography>
                          <Typography variant="body2">
                            {ordineSelezionato.note}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Articoli */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(modernColors.primary, 0.2)}` }}>
                    <Typography variant="h6" sx={{ mb: 2, color: modernColors.text, fontWeight: 600 }}>
                      📦 Articoli Ordinati
                    </Typography>
                    <Typography variant="body2" sx={{ color: modernColors.textSecondary, fontStyle: 'italic' }}>
                      Per visualizzare i dettagli completi degli articoli, utilizza il pulsante "Modifica" ordine.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Pulsante Chiudi */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setDialogVisualizzaOrdine(false);
                    setOrdineSelezionato(null);
                  }}
                  sx={{
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${modernColors.secondary} 0%, ${modernColors.primary} 100%)`,
                    }
                  }}
                >
                  ✅ Chiudi
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Dialog Modifica Ordine */}
      <InserimentoFattureMultiRiga 
        open={dialogModificaOrdine}
        onClose={() => {
          setDialogModificaOrdine(false);
          setOrdineSelezionato(null);
          loadOrdiniAcquisto(); // Ricarica dopo modifica
        }}
        modalitaIniziale="ordini"
        soloOrdini={true}
        ordineEsistente={ordineSelezionato}
        modalitaModificaOrdine={true}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}