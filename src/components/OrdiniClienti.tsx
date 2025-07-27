import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface OrdineCliente {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  data_ordine: string;
  articoli: Array<{
    varieta_id: number;
    varieta_nome: string;
    quantita: number;
    prezzo_unitario: number;
    subtotale: number;
  }>;
  totale: number;
  stato: string;
  created_at: string;
}

interface Cliente {
  id: number;
  nome: string;
  email: string;
  ragione_sociale: string;
}

const OrdiniClienti: React.FC = () => {
  const [ordini, setOrdini] = useState<OrdineCliente[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrdine, setSelectedOrdine] = useState<OrdineCliente | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [newStato, setNewStato] = useState('');
  const [filtri, setFiltri] = useState({
    cliente_id: '',
    stato: '',
    search: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica ordini
  const caricaOrdini = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/webshop/ordini-tutti');
      const data = await res.json();
      
      if (data.success) {
        setOrdini(data.data);
      } else {
        mostraSnackbar('Errore caricamento ordini', 'error');
      }
    } catch (error) {
      console.error('Errore caricamento ordini:', error);
      mostraSnackbar('Errore di connessione', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carica clienti
  const caricaClienti = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/clienti');
      const data = await res.json();
      
      if (data.success) {
        setClienti(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
    }
  };

  // Carica dati al mount
  useEffect(() => {
    caricaOrdini();
    caricaClienti();
  }, []);

  // Filtra ordini
  const ordiniFiltrati = ordini.filter(ordine => {
    if (filtri.cliente_id && ordine.cliente_id !== parseInt(filtri.cliente_id)) return false;
    if (filtri.stato && ordine.stato !== filtri.stato) return false;
    if (filtri.search) {
      const searchLower = filtri.search.toLowerCase();
      return (
        ordine.cliente_nome.toLowerCase().includes(searchLower) ||
        ordine.articoli.some(art => art.varieta_nome.toLowerCase().includes(searchLower)) ||
        ordine.id.toString().includes(searchLower)
      );
    }
    return true;
  });

  // Aggiorna stato ordine
  const aggiornaStato = async () => {
    if (!selectedOrdine || !newStato) return;

    try {
      const res = await fetch(`http://localhost:3001/api/webshop/ordine/${selectedOrdine.id}/stato`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: newStato })
      });

      const data = await res.json();
      
      if (data.success) {
        mostraSnackbar(`Stato ordine aggiornato a: ${newStato}`, 'success');
        setEditDialog(false);
        setNewStato('');
        caricaOrdini(); // Ricarica per aggiornare la lista
      } else {
        mostraSnackbar(data.error, 'error');
      }
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      mostraSnackbar('Errore durante l\'aggiornamento', 'error');
    }
  };

  // Utility
  const mostraSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'In attesa': return 'warning';
      case 'Confermato': return 'info';
      case 'In preparazione': return 'primary';
      case 'Spedito': return 'secondary';
      case 'Consegnato': return 'success';
      case 'Annullato': return 'error';
      default: return 'default';
    }
  };

  const formattaData = (dataString: string) => {
    return new Date(dataString).toLocaleString('it-IT');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🛒 Ordini Clienti Webshop
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestisci gli ordini provenienti dal webshop
      </Typography>

      {/* Filtri */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Cerca ordini..."
              value={filtri.search}
              onChange={(e) => setFiltri(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={filtri.cliente_id}
                onChange={(e) => setFiltri(prev => ({ ...prev, cliente_id: e.target.value }))}
                label="Cliente"
              >
                <MenuItem value="">Tutti i clienti</MenuItem>
                {clienti.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={filtri.stato}
                onChange={(e) => setFiltri(prev => ({ ...prev, stato: e.target.value }))}
                label="Stato"
              >
                <MenuItem value="">Tutti gli stati</MenuItem>
                <MenuItem value="In attesa">In attesa</MenuItem>
                <MenuItem value="Confermato">Confermato</MenuItem>
                <MenuItem value="In preparazione">In preparazione</MenuItem>
                <MenuItem value="Spedito">Spedito</MenuItem>
                <MenuItem value="Consegnato">Consegnato</MenuItem>
                <MenuItem value="Annullato">Annullato</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={caricaOrdini}
                disabled={loading}
              >
                Aggiorna
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFiltri({ cliente_id: '', stato: '', search: '' })}
              >
                Pulisci
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabella ordini */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Data Ordine</TableCell>
              <TableCell>Articoli</TableCell>
              <TableCell>Totale</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordiniFiltrati.map((ordine) => (
              <TableRow key={ordine.id}>
                <TableCell>#{ordine.id}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{ordine.cliente_nome}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {ordine.cliente_id}
                  </Typography>
                </TableCell>
                <TableCell>{formattaData(ordine.data_ordine)}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {ordine.articoli.length} articoli
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ordine.articoli.map(art => art.varieta_nome).join(', ')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight={600}>
                    €{ordine.totale.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={ordine.stato} 
                    color={getStatoColor(ordine.stato) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrdine(ordine);
                        setDetailDialog(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrdine(ordine);
                        setNewStato(ordine.stato);
                        setEditDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {ordiniFiltrati.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Nessun ordine trovato
          </Typography>
        </Paper>
      )}

      {/* Dialog Dettagli Ordine */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Dettagli Ordine #{selectedOrdine?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrdine && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informazioni Cliente
                      </Typography>
                      <Typography><strong>Nome:</strong> {selectedOrdine.cliente_nome}</Typography>
                      <Typography><strong>ID Cliente:</strong> {selectedOrdine.cliente_id}</Typography>
                      <Typography><strong>Data Ordine:</strong> {formattaData(selectedOrdine.data_ordine)}</Typography>
                      <Typography><strong>Stato:</strong> 
                        <Chip 
                          label={selectedOrdine.stato} 
                          color={getStatoColor(selectedOrdine.stato) as any}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Riepilogo
                      </Typography>
                      <Typography><strong>Totale Articoli:</strong> {selectedOrdine.articoli.length}</Typography>
                      <Typography><strong>Quantità Totale:</strong> {selectedOrdine.articoli.reduce((sum, art) => sum + art.quantita, 0)}</Typography>
                      <Typography variant="h5" color="primary" fontWeight={600}>
                        Totale: €{selectedOrdine.totale.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Articoli Ordinati
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Varietà</TableCell>
                          <TableCell align="right">Quantità</TableCell>
                          <TableCell align="right">Prezzo Unit.</TableCell>
                          <TableCell align="right">Subtotale</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrdine.articoli.map((articolo, index) => (
                          <TableRow key={index}>
                            <TableCell>{articolo.varieta_nome}</TableCell>
                            <TableCell align="right">{articolo.quantita}</TableCell>
                            <TableCell align="right">€{articolo.prezzo_unitario.toFixed(2)}</TableCell>
                            <TableCell align="right">€{articolo.subtotale.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Modifica Stato */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Modifica Stato Ordine #{selectedOrdine?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Nuovo Stato</InputLabel>
              <Select
                value={newStato}
                onChange={(e) => setNewStato(e.target.value)}
                label="Nuovo Stato"
              >
                <MenuItem value="In attesa">In attesa</MenuItem>
                <MenuItem value="Confermato">Confermato</MenuItem>
                <MenuItem value="In preparazione">In preparazione</MenuItem>
                <MenuItem value="Spedito">Spedito</MenuItem>
                <MenuItem value="Consegnato">Consegnato</MenuItem>
                <MenuItem value="Annullato">Annullato</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Annulla
          </Button>
          <Button onClick={aggiornaStato} variant="contained" disabled={!newStato}>
            Aggiorna Stato
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdiniClienti; 