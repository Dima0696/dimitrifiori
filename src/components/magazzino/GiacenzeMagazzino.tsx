import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  Edit as EditIcon,
  ListAlt as ListAltIcon,
  Timeline as TimelineIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { apiService, MovimentoMagazzino } from '../../lib/apiService';

interface Giacenza {
  carico_id: number;
  fattura_numero: string;
  fattura_data: string;
  fornitore_nome: string;
  articolo_nome: string;
  articolo_id: number; // Aggiungo questo campo necessario
  gruppo_nome: string;
  prodotto_nome: string;
  colore_nome: string;
  provenienza_nome: string;
  imballo_nome: string;
  imballo_id: number; // Aggiungo questo campo necessario
  imballo_quantita: number; // IMPORTANTE: Quantità steli per imballo
  altezza_cm: number;
  qualita_nome?: string; // Nuova caratteristica qualità (opzionale)
  quantita_giacenza: number;
  prezzo_acquisto_per_stelo: number;
  prezzo_costo_finale_per_stelo: number;
  prezzo_vendita_1: number;
  prezzo_vendita_2: number;
  prezzo_vendita_3: number;
  valore_giacenza_finale: number;
  giorni_giacenza: number;
  foto_url?: string;
  note?: string;
}

// Funzioni per icone e colori qualità
const getQualitaIcon = (nome: string | undefined | null) => {
  if (!nome) return '📋';
  switch (nome.toLowerCase()) {
    case 'extra': return '⭐⭐⭐';
    case 'prima': return '⭐⭐';
    case 'seconda': return '⭐';
    case 'terza': return '🔹';
    case 'scarto': return '♻️';
    case 'da classificare': return '🔄';
    default: return '📋';
  }
};

const getQualitaColor = (nome: string | undefined | null) => {
  if (!nome) return '#757575'; // Grigio default
  switch (nome.toLowerCase()) {
    case 'extra': return '#FFD700'; // Oro
    case 'prima': return '#C0C0C0'; // Argento
    case 'seconda': return '#CD7F32'; // Bronzo
    case 'terza': return '#4CAF50'; // Verde
    case 'scarto': return '#FF9800'; // Arancione
    case 'da classificare': return '#9C27B0'; // Viola
    default: return '#757575'; // Grigio
  }
};

const GiacenzeMagazzino: React.FC = () => {
  const [giacenze, setGiacenze] = useState<Giacenza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gruppoFilter, setGruppoFilter] = useState<string>('all');
  const [gruppi, setGruppi] = useState<any[]>([]);
  
  // Stati per modifica imballo
  const [dialogImballoOpen, setDialogImballoOpen] = useState(false);
  const [articoloSelezionato, setArticoloSelezionato] = useState<Giacenza | null>(null);
  const [imballaggi, setImballaggi] = useState<any[]>([]);
  const [nuovoImballoId, setNuovoImballoId] = useState<number>(0);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // Stati per dialog dettaglio movimenti
  const [dialogMovimentiOpen, setDialogMovimentiOpen] = useState(false);
  const [articoloPerMovimenti, setArticoloPerMovimenti] = useState<Giacenza | null>(null);
  const [movimenti, setMovimenti] = useState<MovimentoMagazzino[]>([]);
  const [loadingMovimenti, setLoadingMovimenti] = useState(false);

  // Stati per dialog distruzione
  const [dialogDistruzioneOpen, setDialogDistruzioneOpen] = useState(false);
  const [articoloPerDistruzione, setArticoloPerDistruzione] = useState<Giacenza | null>(null);
  const [quantitaDistruzione, setQuantitaDistruzione] = useState<number>(0);
  const [motivoDistruzione, setMotivoDistruzione] = useState<string>('');
  const [noteDistruzione, setNoteDistruzione] = useState<string>('');
  const [loadingDistruzione, setLoadingDistruzione] = useState(false);

  // Stati per distruzioni annullabili
  const [distruzioniAnnullabili, setDistruzioniAnnullabili] = useState<any[]>([]);
  const [loadingAnnullamento, setLoadingAnnullamento] = useState(false);

  useEffect(() => {
    loadData();
    loadImballaggi();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [giacenzeData, gruppiData] = await Promise.all([
        apiService.getGiacenzeMagazzino(),
        apiService.getGruppi()
      ]);
      setGiacenze(giacenzeData);
      setGruppi(gruppiData);
      setError('');
    } catch (err) {
      setError('Errore nel caricamento giacenze: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadImballaggi = async () => {
    try {
      const data = await apiService.getImballaggi();
      setImballaggi(data);
    } catch (err) {
      console.error('Errore caricamento imballaggi:', err);
    }
  };

  const apriDialogModificaImballo = (giacenza: Giacenza) => {
    setArticoloSelezionato(giacenza);
    setNuovoImballoId(giacenza.imballo_id);
    setDialogImballoOpen(true);
  };

  const chiudiDialogImballo = () => {
    setDialogImballoOpen(false);
    setArticoloSelezionato(null);
    setNuovoImballoId(0);
  };

  const salvaModificaImballo = async () => {
    if (!articoloSelezionato || !nuovoImballoId) return;

    try {
      setLoadingUpdate(true);
      await apiService.aggiornaImballoArticolo({
        articolo_id: articoloSelezionato.articolo_id,
        nuovo_imballo_id: nuovoImballoId
      });

      // Ricarica i dati per vedere le modifiche
      await loadData();
      chiudiDialogImballo();
      
      alert('✅ Imballo aggiornato! La modifica è stata applicata all\'articolo e a tutti i documenti di carico.');
    } catch (err: any) {
      alert('❌ Errore nella modifica: ' + err.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Funzioni per dialog dettaglio movimenti
  const apriDialogMovimenti = async (giacenza: Giacenza) => {
    setArticoloPerMovimenti(giacenza);
    setDialogMovimentiOpen(true);
    setLoadingMovimenti(true);
    
    try {
      console.log('🔍 Caricamento movimenti per articolo:', giacenza.articolo_id);
      
      // Carica sia i movimenti che le distruzioni annullabili
      const [movimentiData, distruzioniData] = await Promise.all([
        apiService.getMovimentiPerArticolo(giacenza.articolo_id),
        apiService.getDistruzioniAnnullabili()
      ]);
      
      setMovimenti(movimentiData);
      
      // Filtra le distruzioni per questo carico specifico
      const distruzioniArticolo = distruzioniData.filter(d => d.carico_id === giacenza.carico_id);
      setDistruzioniAnnullabili(distruzioniArticolo);
      
    } catch (err: any) {
      console.error('Errore nel caricamento movimenti:', err);
      alert('❌ Errore nel caricamento movimenti: ' + err.message);
      setMovimenti([]);
      setDistruzioniAnnullabili([]);
    } finally {
      setLoadingMovimenti(false);
    }
  };

  const chiudiDialogMovimenti = () => {
    setDialogMovimentiOpen(false);
    setArticoloPerMovimenti(null);
    setMovimenti([]);
    setDistruzioniAnnullabili([]);
    setLoadingMovimenti(false);
  };

  // Funzione per annullare una distruzione
  const annullaDistruzione = async (distruzioneId: number) => {
    if (!confirm('⚠️ Sei sicuro di voler annullare questa distruzione?\n\nLa quantità verrà ripristinata in magazzino.')) {
      return;
    }

    try {
      setLoadingAnnullamento(true);
      
      await apiService.annullaDistruzione({
        distruzione_id: distruzioneId,
        motivo_annullamento: 'Annullamento da giacenze - errore operatore',
        utente_annullamento: 'Utente'
      });
      
      alert('✅ Distruzione annullata con successo!\nLa quantità è stata ripristinata in magazzino.');
      
      // Ricarica i dati
      await loadData();
      
      // Ricarica anche i movimenti se il dialog è aperto
      if (articoloPerMovimenti) {
        apriDialogMovimenti(articoloPerMovimenti);
      }
      
    } catch (err: any) {
      console.error('Errore nell\'annullamento:', err);
      alert('❌ Errore nell\'annullamento: ' + err.message);
    } finally {
      setLoadingAnnullamento(false);
    }
  };

  // Funzioni di utilità per i movimenti
  const getTipoMovimentoIcon = (tipo: string) => {
    switch (tipo) {
      case 'carico': return '📦';
      case 'scarico': return '📤';
      case 'distruzione': return '🗑️';
      case 'inventario': return '📊';
      case 'trasferimento': return '🔄';
      default: return '📋';
    }
  };

  const getTipoMovimentoColor = (tipo: string) => {
    switch (tipo) {
      case 'carico': return 'success';
      case 'scarico': return 'warning';
      case 'distruzione': return 'error';
      case 'inventario': return 'info';
      case 'trasferimento': return 'primary';
      default: return 'default';
    }
  };

  // Funzioni per dialog distruzione
  const apriDialogDistruzione = (giacenza: Giacenza) => {
    setArticoloPerDistruzione(giacenza);
    
    // IMPORTANTE: Default alla quantità dell'imballo, non 1 stelo
    const imballoQuantita = giacenza.imballo_quantita || 1;
    setQuantitaDistruzione(imballoQuantita);
    
    setMotivoDistruzione('');
    setNoteDistruzione('');
    setDialogDistruzioneOpen(true);
  };

  const chiudiDialogDistruzione = () => {
    setDialogDistruzioneOpen(false);
    setArticoloPerDistruzione(null);
    setQuantitaDistruzione(0);
    setMotivoDistruzione('');
    setNoteDistruzione('');
    setLoadingDistruzione(false);
  };

  const eseguiDistruzione = async () => {
    if (!articoloPerDistruzione || quantitaDistruzione <= 0 || !motivoDistruzione.trim()) {
      alert('❌ Compila tutti i campi obbligatori');
      return;
    }

    if (quantitaDistruzione > (articoloPerDistruzione.quantita_giacenza || 0)) {
      alert('❌ Quantità superiore alla giacenza disponibile');
      return;
    }

    // VALIDAZIONE IMBALLO - Fondamentale per il settore floricolo
    const imballoQuantita = articoloPerDistruzione.imballo_quantita || 1;
    if (quantitaDistruzione % imballoQuantita !== 0) {
      alert(`❌ ERRORE IMBALLO!\n\nQuesto articolo ha imballo da ${imballoQuantita} steli.\nPuoi distruggere solo multipli di ${imballoQuantita}.\n\nEsempi validi: ${imballoQuantita}, ${imballoQuantita * 2}, ${imballoQuantita * 3}...`);
      return;
    }

    try {
      setLoadingDistruzione(true);

      // Usa il nuovo metodo per distruzione singola
      await apiService.distruggiSingoloCarico({
        documento_carico_id: articoloPerDistruzione.carico_id,
        quantita: quantitaDistruzione,
        motivo: motivoDistruzione,
        note: noteDistruzione,
        utente: 'Utente' // TODO: gestire utente autenticato
      });
      
      alert(`✅ ${quantitaDistruzione} steli distrutti con successo!`);
      
      // Ricarica i dati per vedere le modifiche
      await loadData();
      chiudiDialogDistruzione();
      
    } catch (err: any) {
      console.error('Errore nella distruzione:', err);
      alert('❌ Errore nella distruzione: ' + err.message);
    } finally {
      setLoadingDistruzione(false);
    }
  };

  // Filtra giacenze
  const giacenzeFiltrate = giacenze.filter(giacenza => {
    const matchesSearch = searchTerm === '' || 
      giacenza.articolo_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      giacenza.gruppo_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      giacenza.prodotto_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      giacenza.colore_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      giacenza.fornitore_nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGruppo = gruppoFilter === 'all' || giacenza.gruppo_nome === gruppoFilter;
    
    return matchesSearch && matchesGruppo;
  });

  const getTotalValue = () => {
    return giacenzeFiltrate.reduce((total, giacenza) => total + (giacenza.valore_giacenza_finale || 0), 0);
  };

  const getTotalQuantity = () => {
    return giacenzeFiltrate.reduce((total, giacenza) => total + (giacenza.quantita_giacenza || 0), 0);
  };

  const getGiorniColor = (giorni: number) => {
    if (giorni <= 3) return 'success';
    if (giorni <= 7) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'grey.800', mb: 1 }}>
            📦 Giacenze Magazzino
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.600' }}>
            Visualizza e gestisci tutte le giacenze presenti in magazzino
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiche */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {giacenzeFiltrate.length}
              </Typography>
              <Typography variant="body2" color="grey.600">
                Carichi in giacenza
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {getTotalQuantity().toLocaleString()}
              </Typography>
              <Typography variant="body2" color="grey.600">
                Steli totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                € {getTotalValue().toFixed(2)}
              </Typography>
              <Typography variant="body2" color="grey.600">
                Valore totale
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {new Set(giacenzeFiltrate.map(g => g.articolo_nome)).size}
              </Typography>
              <Typography variant="body2" color="grey.600">
                Articoli diversi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'grey.300' }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <TextField
            placeholder="Cerca per articolo, gruppo, prodotto, colore, fornitore..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
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
            }}
          />

          {/* Filtro Gruppo */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Gruppo</InputLabel>
            <Select
              value={gruppoFilter}
              onChange={(e) => setGruppoFilter(e.target.value)}
              label="Gruppo"
            >
              <MenuItem value="all">Tutti i gruppi</MenuItem>
              {gruppi.map((gruppo) => (
                <MenuItem key={gruppo.id} value={gruppo.nome}>
                  {gruppo.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tabella Giacenze */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Articolo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fornitore</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Quantità</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box>
                  Costo/Stelo
                  <Typography variant="caption" color="grey.600" sx={{ display: 'block' }}>
                    (con costi spalmati)
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prezzi Vendita</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box>
                  Margine
                  <Typography variant="caption" color="grey.600" sx={{ display: 'block' }}>
                    (prezzo 1)
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valore Tot.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Giorni</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fattura</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {giacenzeFiltrate.map((giacenza) => (
              <TableRow key={giacenza.carico_id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {giacenza.gruppo_nome} - {giacenza.prodotto_nome}
                    </Typography>
                    <Typography variant="caption" color="grey.600">
                      {giacenza.colore_nome} • {giacenza.provenienza_nome} • {giacenza.altezza_cm}cm • {giacenza.imballo_nome}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <span style={{ fontSize: '0.9em', marginRight: '4px' }}>
                        {getQualitaIcon(giacenza.qualita_nome)}
                      </span>
                      <Chip 
                        label={giacenza.qualita_nome}
                        size="small"
                        sx={{ 
                          bgcolor: getQualitaColor(giacenza.qualita_nome),
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          height: '20px'
                        }}
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {giacenza.fornitore_nome}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {giacenza.quantita_giacenza} steli
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    € {(giacenza.prezzo_costo_finale_per_stelo || 0).toFixed(3)}
                  </Typography>
                  <Typography variant="caption" color="grey.600">
                    Finale (spalm.)
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption">€ {(giacenza.prezzo_vendita_1 || 0).toFixed(3)}</Typography>
                    <Typography variant="caption">€ {(giacenza.prezzo_vendita_2 || 0).toFixed(3)}</Typography>
                    <Typography variant="caption">€ {(giacenza.prezzo_vendita_3 || 0).toFixed(3)}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {(() => {
                    const costoFinale = giacenza.prezzo_costo_finale_per_stelo || 0;
                    const prezzoVendita = giacenza.prezzo_vendita_1 || 0;
                    const margineEuro = prezzoVendita - costoFinale;
                    const marginePerc = costoFinale > 0 ? (margineEuro / costoFinale) * 100 : 0;
                    const colore = marginePerc >= 50 ? 'success.main' : marginePerc >= 25 ? 'warning.main' : 'error.main';
                    
                    return (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colore }}>
                          +€ {margineEuro.toFixed(3)}
                        </Typography>
                        <Typography variant="caption" color="grey.600">
                          (+{marginePerc.toFixed(1)}%)
                        </Typography>
                      </Box>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    € {(giacenza.valore_giacenza_finale || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${giacenza.giorni_giacenza || 0} gg`}
                    color={getGiorniColor(giacenza.giorni_giacenza || 0)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {giacenza.fattura_numero}
                  </Typography>
                  <Typography variant="caption" color="grey.600">
                    {new Date(giacenza.fattura_data).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => apriDialogModificaImballo(giacenza)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Imballo
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      startIcon={<ListAltIcon />}
                      onClick={() => apriDialogMovimenti(giacenza)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Dettagli
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => apriDialogDistruzione(giacenza)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Distruggi
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog Modifica Imballo */}
      <Dialog open={dialogImballoOpen} onClose={chiudiDialogImballo} maxWidth="sm" fullWidth>
        <DialogTitle>
          🗃️ Modifica Imballo Articolo
          {articoloSelezionato && (
            <Typography variant="body2" color="grey.600" sx={{ mt: 1 }}>
              {articoloSelezionato.gruppo_nome} → {articoloSelezionato.prodotto_nome} 
              ({articoloSelezionato.colore_nome})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ <strong>ATTENZIONE:</strong> Modificando l'imballo dell'articolo, la modifica 
            sarà applicata a <strong>TUTTI</strong> i documenti di carico che contengono questo articolo!
          </Alert>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuovo Imballo</InputLabel>
            <Select
              value={nuovoImballoId}
              onChange={(e) => setNuovoImballoId(Number(e.target.value))}
              label="Nuovo Imballo"
            >
              {imballaggi.map((imballo) => (
                <MenuItem key={imballo.id} value={imballo.id}>
                  {imballo.nome} {imballo.id === articoloSelezionato?.imballo_id && '(ATTUALE)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={chiudiDialogImballo} color="inherit">
            Annulla
          </Button>
          <Button 
            onClick={salvaModificaImballo} 
            variant="contained" 
            color="primary"
            disabled={loadingUpdate || nuovoImballoId === articoloSelezionato?.imballo_id}
          >
            {loadingUpdate ? 'Aggiornamento...' : 'Aggiorna Imballo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Dettaglio Movimenti */}
      <Dialog open={dialogMovimentiOpen} onClose={chiudiDialogMovimenti} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="info" />
            📋 Dettaglio Movimenti Articolo
          </Box>
          {articoloPerMovimenti && (
            <Typography variant="body2" color="grey.600" sx={{ mt: 1 }}>
              <strong>{articoloPerMovimenti.gruppo_nome} → {articoloPerMovimenti.prodotto_nome}</strong>
              <br />
              {articoloPerMovimenti.colore_nome} • {articoloPerMovimenti.provenienza_nome} • 
              {articoloPerMovimenti.altezza_cm}cm • {articoloPerMovimenti.imballo_nome}
              {articoloPerMovimenti.qualita_nome && ` • ${articoloPerMovimenti.qualita_nome}`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingMovimenti ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <Typography variant="body2" color="grey.600">
                  🔄 Caricamento movimenti...
                </Typography>
              </div>
            </Box>
          ) : !movimenti || movimenti.length === 0 ? (
            <Alert severity="info">
              ℹ️ Non sono stati trovati movimenti per questo articolo.
            </Alert>
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Quantità</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Prezzo Unit.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Valore Tot.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fattura/Doc.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fornitore</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimenti && movimenti.map((movimento, index) => (
                    <TableRow key={`${movimento.id}-${index}`}>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.data ? new Date(movimento.data).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getTipoMovimentoIcon(movimento.tipo)}</span>
                          <Chip
                            label={movimento.tipo.toUpperCase()}
                            color={getTipoMovimentoColor(movimento.tipo) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {movimento.quantita} steli
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.prezzo_unitario ? `€ ${movimento.prezzo_unitario.toFixed(3)}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {movimento.valore_totale ? `€ ${movimento.valore_totale.toFixed(2)}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.fattura_numero || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.fornitore_nome || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="grey.600">
                          {movimento.note || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Sezione Distruzioni Annullabili */}
          {!loadingMovimenti && distruzioniAnnullabili && distruzioniAnnullabili.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'error.300', mt: 3 }}>
              <Box sx={{ bgcolor: 'error.50', p: 2, borderBottom: '1px solid', borderColor: 'error.300' }}>
                <Typography variant="h6" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🗑️ Distruzioni Recenti
                  <Chip size="small" label={`${distruzioniAnnullabili.length} trovate`} color="error" />
                </Typography>
                <Typography variant="body2" color="grey.600">
                  Le distruzioni possono essere annullate entro 24 ore
                </Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Quantità</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Valore Perdita</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ore Trascorse</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distruzioniAnnullabili.map((distruzione) => (
                    <TableRow key={distruzione.distruzione_id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(distruzione.data_distruzione).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="grey.600">
                          {new Date(distruzione.data_distruzione).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                          -{distruzione.quantita_distrutta} steli
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                          € {distruzione.valore_perdita?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {Math.floor(distruzione.ore_trascorse || 0)}h
                          </Typography>
                          <Chip
                            size="small"
                            label={distruzione.annullabile ? 'Annullabile' : 'Scaduta'}
                            color={distruzione.annullabile ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="grey.600">
                          {distruzione.note || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {distruzione.annullabile ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => annullaDistruzione(distruzione.distruzione_id)}
                            disabled={loadingAnnullamento}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            {loadingAnnullamento ? '...' : '↩️ Annulla'}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="grey.500">
                            Non più annullabile
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Statistiche movimenti */}
          {!loadingMovimenti && movimenti && movimenti.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', bgcolor: 'success.50' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {movimenti.reduce((sum, m) => sum + (m.quantita || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="grey.600">
                      Steli totali movimentati
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', bgcolor: 'warning.50' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {movimenti.length}
                    </Typography>
                    <Typography variant="body2" color="grey.600">
                      Movimenti totali
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', bgcolor: 'info.50' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                      € {movimenti.reduce((sum, m) => sum + (m.valore_totale || 0), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="grey.600">
                      Valore totale
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={chiudiDialogMovimenti} color="inherit">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Distruzione */}
      <Dialog open={dialogDistruzioneOpen} onClose={chiudiDialogDistruzione} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <DeleteIcon />
            🗑️ Distruzione Articolo
          </Box>
          {articoloPerDistruzione && (
            <Typography variant="body2" color="grey.600" sx={{ mt: 1 }}>
              <strong>{articoloPerDistruzione.gruppo_nome} → {articoloPerDistruzione.prodotto_nome}</strong>
              <br />
              {articoloPerDistruzione.colore_nome} • {articoloPerDistruzione.provenienza_nome} • 
              {articoloPerDistruzione.altezza_cm}cm • {articoloPerDistruzione.imballo_nome}
              {articoloPerDistruzione.qualita_nome && ` • ${articoloPerDistruzione.qualita_nome}`}
              <br />
              <strong>Giacenza disponibile: {articoloPerDistruzione.quantita_giacenza} steli</strong>
              <br />
              <Chip 
                size="small" 
                icon={<Box sx={{fontSize: '14px'}}>📦</Box>} 
                label={`Imballo: ${articoloPerDistruzione.imballo_quantita || 1} steli`} 
                color="primary" 
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ <strong>ATTENZIONE:</strong> L'articolo verrà distrutto e rimosso dalle giacenze.
            <br />Questa operazione ridurrà la quantità in magazzino.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantità da Distruggere"
                type="number"
                value={quantitaDistruzione}
                onChange={(e) => setQuantitaDistruzione(Number(e.target.value))}
                inputProps={{ 
                  min: articoloPerDistruzione?.imballo_quantita || 1,
                  max: articoloPerDistruzione?.quantita_giacenza || 1,
                  step: articoloPerDistruzione?.imballo_quantita || 1
                }}
                helperText={(() => {
                  const imballo = articoloPerDistruzione?.imballo_quantita || 1;
                  const max = articoloPerDistruzione?.quantita_giacenza || 0;
                  const maxMultiple = Math.floor(max / imballo) * imballo;
                  return `Multipli di ${imballo} steli - Max: ${maxMultiple} steli`;
                })()}
                required
                error={articoloPerDistruzione && quantitaDistruzione % (articoloPerDistruzione.imballo_quantita || 1) !== 0}
              />
              
              {/* Bottoni rapidi per multipli dell'imballo */}
              {articoloPerDistruzione && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="grey.600" sx={{ width: '100%', mb: 1 }}>
                    📦 Quantità rapide:
                  </Typography>
                  {[1, 2, 3, 4, 5].map(multiplo => {
                    const quantita = multiplo * (articoloPerDistruzione.imballo_quantita || 1);
                    const disponibile = quantita <= (articoloPerDistruzione.quantita_giacenza || 0);
                    
                    return disponibile ? (
                      <Button
                        key={multiplo}
                        size="small"
                        variant={quantitaDistruzione === quantita ? "contained" : "outlined"}
                        color="primary"
                        onClick={() => setQuantitaDistruzione(quantita)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        {quantita}
                      </Button>
                    ) : null;
                  })}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Motivo Distruzione"
                value={motivoDistruzione}
                onChange={(e) => setMotivoDistruzione(e.target.value)}
                required
                placeholder="Es: Merce danneggiata, scaduta..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note Aggiuntive"
                value={noteDistruzione}
                onChange={(e) => setNoteDistruzione(e.target.value)}
                multiline
                rows={2}
                placeholder="Note opzionali..."
              />
            </Grid>
          </Grid>

          {/* Riepilogo costi */}
          {articoloPerDistruzione && quantitaDistruzione > 0 && (
            <Card sx={{ mt: 3, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h6" color="error.main" gutterBottom>
                  💰 Valore Perdita
                </Typography>
                
                {/* Informazioni imballo */}
                {(() => {
                  const imballoQuantita = articoloPerDistruzione.imballo_quantita || 1;
                  const numeroImballaggi = quantitaDistruzione / imballoQuantita;
                  const isMultiplo = quantitaDistruzione % imballoQuantita === 0;
                  
                  return (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="body2" color="grey.700" sx={{ fontWeight: 600 }}>
                        📦 Analisi Imballo
                      </Typography>
                      <Typography variant="body2" color="grey.600">
                        Steli per imballo: <strong>{imballoQuantita}</strong>
                      </Typography>
                      <Typography variant="body2" color="grey.600">
                        Imballaggi da distruggere: <strong style={{color: isMultiplo ? '#2e7d32' : '#d32f2f'}}>
                          {isMultiplo ? numeroImballaggi : 'NON VALIDO'}
                        </strong>
                      </Typography>
                      {!isMultiplo && (
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                          ⚠️ La quantità deve essere un multiplo di {imballoQuantita}
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="grey.600">
                      Costo per stelo:
                    </Typography>
                    <Typography variant="h6">
                      € {(articoloPerDistruzione.prezzo_costo_finale_per_stelo || 0).toFixed(3)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="grey.600">
                      Steli da distruggere:
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {quantitaDistruzione}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="grey.600">
                      Valore totale perdita:
                    </Typography>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                      € {(quantitaDistruzione * (articoloPerDistruzione.prezzo_costo_finale_per_stelo || 0)).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={chiudiDialogDistruzione} color="inherit">
            Annulla
          </Button>
          <Button 
            onClick={eseguiDistruzione} 
            variant="contained" 
            color="error"
            disabled={
              loadingDistruzione || 
              quantitaDistruzione <= 0 || 
              !motivoDistruzione.trim() ||
              (articoloPerDistruzione && quantitaDistruzione % (articoloPerDistruzione.imballo_quantita || 1) !== 0)
            }
            startIcon={<DeleteIcon />}
          >
            {loadingDistruzione ? 'Distruzione...' : 'Conferma Distruzione'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GiacenzeMagazzino;
