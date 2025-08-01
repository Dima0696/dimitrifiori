import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import apiService from '../../lib/apiService';

interface ArticoloDistruggere {
  id: number;
  gruppo_nome: string;
  prodotto_nome: string;
  colore_nome: string;
  provenienza_nome: string;
  foto_nome: string;
  imballo_nome: string;
  altezza_nome: string;
  giacenza_attuale: number;
  costo_unitario: number;
  selezionato: boolean;
  quantita_da_distruggere: number;
}

export default function DistruzioneMagazzino() {
  const [articoli, setArticoli] = useState<ArticoloDistruggere[]>([]);
  const [articoliFiltrati, setArticoliFiltrati] = useState<ArticoloDistruggere[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTesto, setFiltroTesto] = useState('');
  const [filtroGruppo, setFiltroGruppo] = useState('');
  const [gruppi, setGruppi] = useState<any[]>([]);
  
  // Stati per la distruzione
  const [dialogConferma, setDialogConferma] = useState(false);
  const [motivoDistruzione, setMotivoDistruzione] = useState('');
  const [noteDistruzione, setNoteDistruzione] = useState('');
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Caricamento dati iniziali
  useEffect(() => {
    caricaArticoli();
    caricaGruppi();
  }, []);

  const caricaArticoli = async () => {
    try {
      setLoading(true);
      // Carica solo articoli con giacenza > 0
      const giacenze = await apiService.getGiacenzeMagazzino();
      const articoliConGiacenza = (giacenze || [])
        .filter((articolo: any) => articolo.giacenza_attuale > 0)
        .map((articolo: any) => ({
          ...articolo,
          selezionato: false,
          quantita_da_distruggere: 0
        }));
      
      setArticoli(articoliConGiacenza);
      setArticoliFiltrati(articoliConGiacenza);
    } catch (error) {
      console.error('Errore nel caricamento articoli:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento articoli', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const caricaGruppi = async () => {
    try {
      const gruppiData = await apiService.getGruppi();
      setGruppi(gruppiData || []);
    } catch (error) {
      console.error('Errore nel caricamento gruppi:', error);
    }
  };

  // Filtri
  useEffect(() => {
    let risultato = articoli;

    if (filtroTesto) {
      risultato = risultato.filter(articolo =>
        articolo.gruppo_nome.toLowerCase().includes(filtroTesto.toLowerCase()) ||
        articolo.prodotto_nome.toLowerCase().includes(filtroTesto.toLowerCase()) ||
        articolo.colore_nome.toLowerCase().includes(filtroTesto.toLowerCase()) ||
        articolo.provenienza_nome.toLowerCase().includes(filtroTesto.toLowerCase())
      );
    }

    if (filtroGruppo) {
      risultato = risultato.filter(articolo => articolo.gruppo_nome === filtroGruppo);
    }

    setArticoliFiltrati(risultato);
  }, [filtroTesto, filtroGruppo, articoli]);

  // Gestione selezione articoli
  const toggleSelezione = (index: number) => {
    const nuoviArticoli = [...articoliFiltrati];
    nuoviArticoli[index].selezionato = !nuoviArticoli[index].selezionato;
    
    // Se deseleziono, resetto la quantità
    if (!nuoviArticoli[index].selezionato) {
      nuoviArticoli[index].quantita_da_distruggere = 0;
    }
    
    setArticoliFiltrati(nuoviArticoli);
    
    // Aggiorna anche l'array principale
    const articoloId = nuoviArticoli[index].id;
    setArticoli(prev => prev.map(art => 
      art.id === articoloId ? nuoviArticoli[index] : art
    ));
  };

  const aggiornaQuantita = (index: number, quantita: number) => {
    const nuoviArticoli = [...articoliFiltrati];
    const maxQuantita = nuoviArticoli[index].giacenza_attuale;
    
    // Limita la quantità alla giacenza disponibile
    const quantitaValida = Math.min(Math.max(0, quantita), maxQuantita);
    nuoviArticoli[index].quantita_da_distruggere = quantitaValida;
    
    setArticoliFiltrati(nuoviArticoli);
    
    // Aggiorna anche l'array principale
    const articoloId = nuoviArticoli[index].id;
    setArticoli(prev => prev.map(art => 
      art.id === articoloId ? nuoviArticoli[index] : art
    ));
  };

  const selezionaTutti = () => {
    const nuoviArticoli = articoliFiltrati.map(articolo => ({
      ...articolo,
      selezionato: true,
      quantita_da_distruggere: articolo.giacenza_attuale // Seleziona tutta la giacenza
    }));
    setArticoliFiltrati(nuoviArticoli);
    
    // Aggiorna anche l'array principale
    setArticoli(prev => prev.map(art => {
      const articoloFiltrato = nuoviArticoli.find(af => af.id === art.id);
      return articoloFiltrato || art;
    }));
  };

  const deselezionaTutti = () => {
    const nuoviArticoli = articoliFiltrati.map(articolo => ({
      ...articolo,
      selezionato: false,
      quantita_da_distruggere: 0
    }));
    setArticoliFiltrati(nuoviArticoli);
    
    // Aggiorna anche l'array principale
    setArticoli(prev => prev.map(art => {
      const articoloFiltrato = nuoviArticoli.find(af => af.id === art.id);
      return articoloFiltrato || art;
    }));
  };

  // Preparazione distruzione
  const apriDialogConferma = () => {
    const articoliSelezionati = articoli.filter(art => art.selezionato && art.quantita_da_distruggere > 0);
    if (articoliSelezionati.length === 0) {
      setSnackbar({ open: true, message: 'Seleziona almeno un articolo con quantità > 0', severity: 'error' });
      return;
    }
    setDialogConferma(true);
  };

  // Esecuzione distruzione
  const eseguiDistruzione = async () => {
    try {
      const articoliDaDistruzione = articoli.filter(art => art.selezionato && art.quantita_da_distruggere > 0);
      
      if (articoliDaDistruzione.length === 0) {
        setSnackbar({ open: true, message: 'Nessun articolo selezionato per la distruzione', severity: 'error' });
        return;
      }

      // Prepara i dati per la distruzione
      const datiDistruzione = {
        motivo: motivoDistruzione,
        note: noteDistruzione,
        data_distruzione: new Date().toISOString(),
        articoli: articoliDaDistruzione.map(art => ({
          articolo_id: art.id,
          quantita: art.quantita_da_distruggere,
          costo_unitario: art.costo_unitario
        }))
      };

      // Chiama la funzione del database per spostare in magazzino Moria
      await apiService.distruggiArticoli(datiDistruzione);
      
      setSnackbar({ open: true, message: `${articoliDaDistruzione.length} articoli spostati nel magazzino Moria`, severity: 'success' });
      setDialogConferma(false);
      
      // Reset form
      setMotivoDistruzione('');
      setNoteDistruzione('');
      
      // Ricarica i dati
      caricaArticoli();
      
    } catch (error) {
      console.error('Errore nella distruzione:', error);
      setSnackbar({ open: true, message: 'Errore nella distruzione', severity: 'error' });
    }
  };

  const articoliSelezionati = articoli.filter(art => art.selezionato && art.quantita_da_distruggere > 0);
  const valoreDistruzione = articoliSelezionati.reduce((acc, art) => 
    acc + (art.quantita_da_distruggere * art.costo_unitario), 0
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
        🗑️ Distruzione Magazzino
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Attenzione:</strong> Gli articoli selezionati verranno spostati nel magazzino "Moria" e non saranno più disponibili per la vendita.
      </Alert>

      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filtri e Ricerca</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ricerca testo"
                value={filtroTesto}
                onChange={(e) => setFiltroTesto(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'gray' }} />
                }}
                placeholder="Cerca gruppo, prodotto, colore..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtra per Gruppo</InputLabel>
                <Select
                  value={filtroGruppo}
                  onChange={(e) => setFiltroGruppo(e.target.value)}
                >
                  <MenuItem value="">Tutti i gruppi</MenuItem>
                  {gruppi.map((gruppo) => (
                    <MenuItem key={gruppo.id} value={gruppo.nome}>
                      {gruppo.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" size="small" onClick={selezionaTutti}>
                  Seleziona Tutti
                </Button>
                <Button variant="outlined" size="small" onClick={deselezionaTutti}>
                  Deseleziona Tutti
                </Button>
                <Chip 
                  label={`Selezionati: ${articoliSelezionati.length}`} 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label={`Valore: €${valoreDistruzione.toFixed(2)}`} 
                  color="error" 
                  size="small" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabella Articoli */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Articoli Disponibili ({articoliFiltrati.length} articoli)
          </Typography>
          
          {loading ? (
            <Alert severity="info">Caricamento articoli in corso...</Alert>
          ) : articoliFiltrati.length === 0 ? (
            <Alert severity="warning">Nessun articolo disponibile per la distruzione</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Sel.</TableCell>
                    <TableCell>Gruppo</TableCell>
                    <TableCell>Prodotto</TableCell>
                    <TableCell>Colore</TableCell>
                    <TableCell>Provenienza</TableCell>
                    <TableCell>Foto</TableCell>
                    <TableCell>Imballo</TableCell>
                    <TableCell>Altezza</TableCell>
                    <TableCell align="center">Giacenza</TableCell>
                    <TableCell align="center">Costo Unit.</TableCell>
                    <TableCell align="center">Quantità da Distruggere</TableCell>
                    <TableCell align="center">Valore Distruzione</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {articoliFiltrati.map((articolo, index) => (
                    <TableRow key={articolo.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={articolo.selezionato}
                          onChange={() => toggleSelezione(index)}
                        />
                      </TableCell>
                      <TableCell>{articolo.gruppo_nome}</TableCell>
                      <TableCell>{articolo.prodotto_nome}</TableCell>
                      <TableCell>{articolo.colore_nome}</TableCell>
                      <TableCell>{articolo.provenienza_nome}</TableCell>
                      <TableCell>{articolo.foto_nome}</TableCell>
                      <TableCell>{articolo.imballo_nome}</TableCell>
                      <TableCell>{articolo.altezza_nome}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={articolo.giacenza_attuale} 
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        €{articolo.costo_unitario.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={articolo.quantita_da_distruggere}
                          onChange={(e) => aggiornaQuantita(index, Number(e.target.value))}
                          disabled={!articolo.selezionato}
                          size="small"
                          sx={{ width: 100 }}
                          inputProps={{ 
                            min: 0, 
                            max: articolo.giacenza_attuale 
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <strong>
                          €{(articolo.quantita_da_distruggere * articolo.costo_unitario).toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Azioni */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Procedi con la Distruzione</Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Motivo Distruzione"
                value={motivoDistruzione}
                onChange={(e) => setMotivoDistruzione(e.target.value)}
                required
                placeholder="Es: Merce danneggiata, scaduta, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
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

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<DeleteForeverIcon />}
              onClick={apriDialogConferma}
              disabled={articoliSelezionati.length === 0 || !motivoDistruzione.trim()}
              sx={{ minWidth: 250 }}
            >
              Distruggi Articoli Selezionati
            </Button>
          </Box>

          {articoliSelezionati.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Stai per distruggere {articoliSelezionati.length} articoli</strong><br/>
              Valore totale: €{valoreDistruzione.toFixed(2)}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog Conferma */}
      <Dialog open={dialogConferma} onClose={() => setDialogConferma(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1 }} />
          Conferma Distruzione
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>ATTENZIONE: Questa azione non può essere annullata!</strong>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Stai per spostare nel magazzino "Moria" i seguenti articoli:
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Articolo</TableCell>
                  <TableCell align="center">Quantità</TableCell>
                  <TableCell align="center">Costo Unit.</TableCell>
                  <TableCell align="center">Valore</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {articoliSelezionati.map((articolo) => (
                  <TableRow key={articolo.id}>
                    <TableCell>
                      {articolo.gruppo_nome} - {articolo.prodotto_nome} - {articolo.colore_nome}
                    </TableCell>
                    <TableCell align="center">{articolo.quantita_da_distruggere}</TableCell>
                    <TableCell align="center">€{articolo.costo_unitario.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <strong>€{(articolo.quantita_da_distruggere * articolo.costo_unitario).toFixed(2)}</strong>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              <strong>Valore Totale Distruzione: €{valoreDistruzione.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Motivo: {motivoDistruzione}
            </Typography>
            {noteDistruzione && (
              <Typography variant="body2" sx={{ color: 'white' }}>
                Note: {noteDistruzione}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogConferma(false)}>Annulla</Button>
          <Button 
            onClick={eseguiDistruzione} 
            color="error" 
            variant="contained"
            startIcon={<DeleteForeverIcon />}
          >
            Conferma Distruzione
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
