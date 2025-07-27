import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Alert, CircularProgress, TextField, InputAdornment, FormControl, 
  InputLabel, Select, MenuItem, Chip, Tooltip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent } from '../lib/magazzinoEvents';

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
  fattura_numero?: string;
  fornitore_nome?: string;
  image_path?: string;
}

export default function CaricoMagazzinoSemplice() {
  const [giacenze, setGiacenze] = useState<Giacenza[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterGruppo, setFilterGruppo] = useState<string>('tutti');
  
  // Stati per la modifica
  const [editingGiacenza, setEditingGiacenza] = useState<Giacenza | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    quantita: 0,
    prezzo_acquisto: 0,
    prezzo_vendita: 0,
    imballo: 1
  });

  // Ascolta eventi di magazzino per aggiornamento automatico
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 Fattura creata - Ricarico giacenze...');
    loadGiacenze();
  });

  useMagazzinoEvent('giacenza_aggiornata', () => {
    console.log('🔄 Giacenza aggiornata - Ricarico giacenze...');
    loadGiacenze();
  });

  useMagazzinoEvent('movimento_creato', () => {
    console.log('🔄 Movimento creato - Ricarico giacenze...');
    loadGiacenze();
  });

  useEffect(() => {
    loadGiacenze();
  }, []);

  const loadGiacenze = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGiacenze();
      setGiacenze(data);
    } catch (err) {
      console.error('Errore caricamento giacenze:', err);
      setError('Errore nel caricamento delle giacenze');
    } finally {
      setLoading(false);
    }
  };

  // Filtri
  const filteredGiacenze = giacenze.filter(giacenza => {
    // Nasconde le giacenze a 0
    if (giacenza.quantita <= 0) return false;
    
    const searchMatch = !search || 
      giacenza.varieta_nome?.toLowerCase().includes(search.toLowerCase()) ||
      giacenza.gruppo_nome?.toLowerCase().includes(search.toLowerCase()) ||
      giacenza.prodotto_nome?.toLowerCase().includes(search.toLowerCase()) ||
      giacenza.fornitore_nome?.toLowerCase().includes(search.toLowerCase());
    
    const gruppoMatch = filterGruppo === 'tutti' || giacenza.gruppo_nome === filterGruppo;
    
    return searchMatch && gruppoMatch;
  });

  // Statistiche (solo giacenze attive con quantità > 0)
  const giacenzeAttive = giacenze.filter(g => g.quantita > 0);
  const totaleLotti = giacenzeAttive.length;
  const totaleQuantita = giacenzeAttive.reduce((sum, g) => sum + g.quantita, 0);
  const valoreMagazzino = giacenzeAttive.reduce((sum, g) => sum + (g.quantita * (g.prezzo_acquisto || 0)), 0);
  const valoreVendita = giacenzeAttive.reduce((sum, g) => sum + (g.quantita * (g.prezzo_vendita || 0)), 0);
  const margineAssoluto = valoreVendita - valoreMagazzino;
  const marginePercentuale = valoreMagazzino > 0 ? (margineAssoluto / valoreMagazzino * 100) : 0;
  const prodottiEsauriti = giacenze.filter(g => g.quantita === 0).length;
  const prodottiScortaMinima = giacenzeAttive.filter(g => g.quantita <= 10).length;
  const gruppiUnici = [...new Set(giacenzeAttive.map(g => g.gruppo_nome).filter(Boolean))];
  
  // Raggruppa giacenze per varietà per mostrare totali
  const giacenzePerVarieta = giacenzeAttive.reduce((acc, g) => {
    const key = g.varieta_nome;
    if (!acc[key]) {
      acc[key] = {
        varieta_nome: g.varieta_nome,
        gruppo_nome: g.gruppo_nome,
        prodotto_nome: g.prodotto_nome,
        quantita_totale: 0,
        lotti: []
      };
    }
    acc[key].quantita_totale += g.quantita;
    acc[key].lotti.push(g);
    return acc;
  }, {} as any);
  
  const totaleVarieta = Object.keys(giacenzePerVarieta).length;

  const getScortaColor = (quantita: number) => {
    if (quantita < 0) return 'error';
    if (quantita === 0) return 'error';
    if (quantita <= 10) return 'warning';
    return 'success';
  };

  const getScortaLabel = (quantita: number) => {
    if (quantita < 0) return 'Negativa';
    if (quantita === 0) return 'Esaurito';
    if (quantita <= 10) return 'Scorta Minima';
    return 'Disponibile';
  };

  const handleDocumentoCarico = () => {
    // Genera documento di carico
    const oggi = new Date().toLocaleDateString('it-IT');
    const documento = `DOCUMENTO DI CARICO MAGAZZINO - ${oggi}\n\n`;
    
    let contenuto = documento;
    contenuto += `RIEPILOGO GENERALE:\n`;
    contenuto += `- Varietà attive: ${totaleVarieta}\n`;
    contenuto += `- Varietà esaurite: ${prodottiEsauriti}\n`;
    contenuto += `- Quantità totale: ${totaleQuantita}\n`;
    contenuto += `- Valore acquisto: €${valoreMagazzino.toFixed(2)}\n`;
    contenuto += `- Valore vendita: €${valoreVendita.toFixed(2)}\n`;
    contenuto += `- Margine: €${margineAssoluto.toFixed(2)} (+${marginePercentuale.toFixed(1)}%)\n\n`;
    
    contenuto += `DETTAGLIO GIACENZE ATTIVE:\n`;
    contenuto += `${'='.repeat(80)}\n`;
    
    filteredGiacenze.forEach(g => {
      contenuto += `${g.varieta_nome} (${g.gruppo_nome})\n`;
      contenuto += `  Quantità: ${g.quantita} (${Math.floor(g.quantita / g.imballo)} imballi da ${g.imballo})\n`;
              contenuto += `  Prezzo acquisto: €${(g.prezzo_acquisto || 0).toFixed(2)}\n`;
      contenuto += `  Prezzo vendita: €${(g.prezzo_vendita || 0).toFixed(2)}\n`;
              contenuto += `  Valore totale: €${(Math.max(0, g.quantita) * (g.prezzo_acquisto || 0)).toFixed(2)}\n`;
      contenuto += `  Fornitore: ${g.fornitore_nome || 'N/A'}\n`;
      contenuto += `  ${'-'.repeat(40)}\n`;
    });
    
    // Download del file
    const blob = new Blob([contenuto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento-carico-${oggi.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Funzioni per la modifica
  const handleEditClick = (giacenza: Giacenza) => {
    setEditingGiacenza(giacenza);
    setEditForm({
      quantita: giacenza.quantita,
      prezzo_acquisto: giacenza.prezzo_acquisto,
      prezzo_vendita: giacenza.prezzo_vendita || giacenza.prezzo_acquisto * 1.6,
      imballo: giacenza.imballo
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingGiacenza) return;

    try {
      setEditLoading(true);
      
      // Aggiorna la giacenza nel database
      await apiService.updateGiacenzaById(editingGiacenza.id, {
        quantita: editForm.quantita,
        prezzo_acquisto: editForm.prezzo_acquisto,
        prezzo_vendita: editForm.prezzo_vendita,
        imballo: editForm.imballo
      });

      // Ricarica le giacenze
      await loadGiacenze();
      
      // Chiudi il dialog
      setEditDialogOpen(false);
      setEditingGiacenza(null);
      
      console.log('✅ Giacenza aggiornata con successo');
    } catch (err) {
      console.error('❌ Errore aggiornamento giacenza:', err);
      setError('Errore nell\'aggiornamento della giacenza');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingGiacenza(null);
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Giacenze Magazzino
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={handleDocumentoCarico}
              color="primary"
            >
              Documento di Carico
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadGiacenze}
            >
              Aggiorna
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Info Calcolo Prezzi */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            💡 Giacenze Attive - Calcolo Automatico Prezzi
          </Typography>
          <Typography variant="body2">
            <strong>Visualizzazione:</strong> Mostra solo varietà con giacenze &gt; 0 (varietà esaurite nascoste)<br/>
            <strong>Prezzo di Vendita:</strong> Calcolato automaticamente con markup del 60% sul prezzo di acquisto<br/>
            <strong>Formula:</strong> Prezzo Vendita = Prezzo Acquisto × 1.6<br/>
            <strong>Esempio:</strong> Acquisto €10,00 → Vendita €16,00 (+60% = €6,00 di margine)
          </Typography>
        </Paper>

        {/* Filtri */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Cerca varietà, gruppo, prodotto o fornitore"
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
            <InputLabel>Gruppo</InputLabel>
            <Select
              value={filterGruppo}
              onChange={(e) => setFilterGruppo(e.target.value)}
              label="Gruppo"
            >
              <MenuItem value="tutti">Tutti i gruppi</MenuItem>
              {gruppiUnici.map((gruppo) => (
                <MenuItem key={gruppo} value={gruppo}>
                  {gruppo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Statistiche */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              {totaleVarieta}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Varietà Attive
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {totaleLotti}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lotti in Magazzino
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color={totaleQuantita >= 0 ? "success.main" : "error.main"}>
              {totaleQuantita}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quantità Totale
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              €{valoreMagazzino.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valore Acquisto
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              €{valoreVendita.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valore Vendita
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              €{margineAssoluto.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Margine (+{marginePercentuale.toFixed(1)}%)
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {prodottiEsauriti}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prodotti Esauriti
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {prodottiScortaMinima}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scorta Minima
            </Typography>
          </Paper>
        </Box>

        {/* Tabella Giacenze */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Foto</strong></TableCell>
                <TableCell><strong>Varietà</strong></TableCell>
                <TableCell><strong>Gruppo</strong></TableCell>
                <TableCell align="right"><strong>Quantità (Imballo)</strong></TableCell>
                <TableCell align="right"><strong>Prezzo Acquisto</strong></TableCell>
                <TableCell align="right">
                  <Tooltip title="Prezzo di vendita calcolato automaticamente con markup del 60%">
                    <span><strong>Prezzo Vendita (+60%)</strong></span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right"><strong>Valore (Acquisto/Vendita)</strong></TableCell>
                <TableCell><strong>Fornitore</strong></TableCell>
                <TableCell><strong>Fattura</strong></TableCell>
                <TableCell><strong>Stato</strong></TableCell>
                <TableCell><strong>Azioni</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredGiacenze.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nessuna giacenza trovata
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGiacenze.map((giacenza) => (
                  <TableRow key={giacenza.id}>
                    <TableCell>
                      {giacenza.image_path ? (
                        <Avatar
                          src={giacenza.image_path}
                          alt={giacenza.varieta_nome}
                          sx={{ width: 40, height: 40 }}
                          variant="rounded"
                        />
                      ) : (
                        <Avatar
                          sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
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
                      <Typography variant="body2" color="text.secondary">
                        {giacenza.gruppo_nome}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {giacenza.quantita}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.floor(giacenza.quantita / giacenza.imballo)} imballi (/{giacenza.imballo})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        €{(giacenza.prezzo_acquisto || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          €{giacenza.prezzo_vendita?.toFixed(2) || '-'}
                        </Typography>
                        {giacenza.prezzo_vendita && (giacenza.prezzo_acquisto || 0) > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +{Math.round(((giacenza.prezzo_vendita / (giacenza.prezzo_acquisto || 1) - 1) * 100))}%
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          €{(Math.max(0, giacenza.quantita) * (giacenza.prezzo_acquisto || 0)).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          Vendita: €{(Math.max(0, giacenza.quantita) * (giacenza.prezzo_vendita || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {giacenza.fornitore_nome || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {giacenza.fattura_numero || 'Manuale'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getScortaLabel(giacenza.quantita)}
                        color={getScortaColor(giacenza.quantita)}
                        size="small"
                        icon={giacenza.quantita <= 10 ? <WarningIcon /> : <InventoryIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(giacenza)}
                        title="Modifica giacenza"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog di Modifica Giacenza */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">
              Modifica Giacenza: {editingGiacenza?.varieta_nome}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
            <TextField
              label="Quantità"
              type="number"
              value={editForm.quantita}
              onChange={(e) => setEditForm(prev => ({ ...prev, quantita: parseInt(e.target.value) || 0 }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Imballo"
              type="number"
              value={editForm.imballo}
              onChange={(e) => setEditForm(prev => ({ ...prev, imballo: parseInt(e.target.value) || 1 }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Prezzo Acquisto (€)"
              type="number"
              value={editForm.prezzo_acquisto}
              onChange={(e) => setEditForm(prev => ({ ...prev, prezzo_acquisto: parseFloat(e.target.value) || 0 }))}
              fullWidth
              size="small"
              inputProps={{ step: 0.01 }}
            />
            <TextField
              label="Prezzo Vendita (€)"
              type="number"
              value={editForm.prezzo_vendita}
              onChange={(e) => setEditForm(prev => ({ ...prev, prezzo_vendita: parseFloat(e.target.value) || 0 }))}
              fullWidth
              size="small"
              inputProps={{ step: 0.01 }}
            />
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              <strong>Info:</strong> La modifica della giacenza aggiornerà direttamente il database. 
              Assicurati che i valori siano corretti prima di salvare.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} startIcon={<CancelIcon />}>
            Annulla
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={editLoading}
          >
            {editLoading ? 'Salvando...' : 'Salva Modifiche'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 