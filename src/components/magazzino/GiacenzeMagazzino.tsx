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
  Edit as EditIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';

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
    return giacenzeFiltrate.reduce((total, giacenza) => total + giacenza.valore_giacenza_finale, 0);
  };

  const getTotalQuantity = () => {
    return giacenzeFiltrate.reduce((total, giacenza) => total + giacenza.quantita_giacenza, 0);
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
              <TableCell sx={{ fontWeight: 600 }}>Costo/Stelo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Prezzi Vendita</TableCell>
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
                  <Typography variant="body2">
                    € {giacenza.prezzo_costo_finale_per_stelo.toFixed(3)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption">€ {giacenza.prezzo_vendita_1.toFixed(3)}</Typography>
                    <Typography variant="caption">€ {giacenza.prezzo_vendita_2.toFixed(3)}</Typography>
                    <Typography variant="caption">€ {giacenza.prezzo_vendita_3.toFixed(3)}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    € {giacenza.valore_giacenza_finale.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${giacenza.giorni_giacenza} gg`}
                    color={getGiorniColor(giacenza.giorni_giacenza)}
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
    </Box>
  );
};

export default GiacenzeMagazzino;
