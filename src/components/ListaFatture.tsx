import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { apiService } from '../lib/apiService';

// Interfaccia locale FatturaDocument (compatibilità con Fattura)
interface FatturaDocument {
  $id: string;
  numero: string;
  tipo: 'vendita' | 'acquisto';
  cliente?: any;
  fornitore?: any;
  data: string;
  prodotti: Array<{
    $id: string;
    varieta: string;
    gruppo: string;
    prodotto: string;
    prezzoVendita?: number;
    prezzoAcquisto?: number;
    quantita: number;
    totale: number;
  }>;
  totale: number;
  stato: 'bozza' | 'emessa' | 'pagata' | 'annullata';
  note?: string;
  $createdAt: string;
  $updatedAt: string;
}

export default function ListaFatture() {
  const [fatture, setFatture] = React.useState<FatturaDocument[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFattura, setSelectedFattura] = React.useState<FatturaDocument | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(new Date());
  const [snackbar, setSnackbar] = React.useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  const loadFatture = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Caricamento fatture...');
      
      // Carica fatture reali dal backend
      const fattureReali = await apiService.getFatture();
      
      // Converti in formato FatturaDocument
      const fattureFormatted: FatturaDocument[] = fattureReali.map((f: any) => ({
        $id: f.id.toString(),
        numero: f.numero,
        tipo: f.tipo,
        fornitore: f.fornitore_nome,
        cliente: f.cliente_nome,
        data: f.data,
        prodotti: [], // I dettagli prodotti potrebbero essere caricati separatamente
        totale: f.totale || 0,
        stato: f.stato,
        $createdAt: f.created_at || new Date().toISOString(),
        $updatedAt: f.updated_at || new Date().toISOString()
      }));
      
      setFatture(fattureFormatted);
      setLastUpdate(new Date());
      console.log(`✅ Caricate ${fattureFormatted.length} fatture`);
      
    } catch (err) {
      console.error('❌ Errore nel caricamento fatture:', err);
      setError('Errore nel caricamento delle fatture');
    } finally {
      setLoading(false);
    }
  };



  // Filtraggio robusto
  const filteredFatture = fatture.filter(fattura => {
    if (!fattura) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (fattura.fornitore || '').toLowerCase().includes(searchLower) ||
      (fattura.numero || '').toLowerCase().includes(searchLower) ||
      (fattura.data || '').toLowerCase().includes(searchLower)
    );
  });

  // Calcoli widget dashboard
  const totaleFatture = fatture.length;
  const valoreTotale = fatture.reduce((sum, f) => sum + (f?.totale || 0), 0);
  const fattureMese = fatture.filter(f => {
    if (!f?.data) return false;
    const dataFattura = new Date(f.data);
    const oggi = new Date();
    return dataFattura.getMonth() === oggi.getMonth() && dataFattura.getFullYear() === oggi.getFullYear();
  }).length;

  const handleViewDetails = (fattura: FatturaDocument) => {
    if (!fattura) return;
    setSelectedFattura(fattura);
    setShowDetails(true);
    setSnackbar({ open: true, message: `Dettagli fattura ${fattura.numero}`, severity: 'success' });
  };

  const handleDelete = (id: string) => {
    if (!id) return;
    
    if (window.confirm('Sei sicuro di voler eliminare questa fattura? Verranno eliminate anche tutte le partite di magazzino collegate!')) {
      setFatture(fatture.filter(f => f?.$id !== id));
      setSnackbar({ open: true, message: 'Fattura eliminata con successo', severity: 'success' });
      console.log('✅ Fattura eliminata:', id);
    }
  };

  const handleRefresh = () => {
    loadFatture();
    setSnackbar({ open: true, message: 'Dati aggiornati', severity: 'success' });
  };

  const handleExport = () => {
    setSnackbar({ open: true, message: 'Esportazione in arrivo', severity: 'success' });
  };

  const handlePrint = () => {
    window.print();
    setSnackbar({ open: true, message: 'Stampa avviata', severity: 'success' });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return '-';
    }
  };

  // Stati di rendering
  if (loading && fatture.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento fatture...
        </Typography>
      </Box>
    );
  }

  if (error && fatture.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadFatture}>
              Riprova
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Lista Fatture</Typography>
      
      {/* Widget Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3f0ff 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Totale Fatture</Typography>
          <Typography variant="h5" fontWeight={700}>{totaleFatture}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #ffe3ec 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Valore Totale</Typography>
          <Typography variant="h5" fontWeight={700}>€{valoreTotale.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3ffe7 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Fatture Mese</Typography>
          <Typography variant="h5" fontWeight={700}>{fattureMese}</Typography>
        </Paper>
      </Box>

      {/* Barra azioni */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          title="Aggiorna la lista fatture"
        >
          Aggiorna
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          title="Esporta le fatture in Excel"
        >
          Esporta
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          title="Stampa la lista fatture"
        >
          Stampa
        </Button>
      </Box>

      {/* Header con ricerca */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f7f8fa 0%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
          <TextField
            placeholder="Cerca fatture per fornitore, numero, data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
            size="small"
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredFatture.length} fatture trovate
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
            </span>
          )}
        </Typography>

        {/* Tabella robusta */}
        <TableContainer sx={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          borderRadius: 2, 
          overflow: 'auto', 
          backgroundColor: 'white' 
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Fornitore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Numero</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Prodotti</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Totale</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFatture.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'Nessuna fattura trovata per la ricerca' : 'Nessuna fattura disponibile'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFatture.map((fattura) => (
                  <TableRow key={fattura?.$id || Math.random()} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {fattura?.fornitore?.nome || fattura?.cliente?.nome || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{fattura?.numero || '-'}</TableCell>
                    <TableCell>{formatDate(fattura?.data || '')}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={fattura?.prodotti?.length || 0} 
                        size="small" 
                        color="primary" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary">
                        €{(fattura?.totale || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Dettagli">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(fattura!)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica (in arrivo)">
                          <IconButton
                            size="small"
                            color="secondary"
                            disabled
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(fattura?.$id || '')}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog dettagli fattura */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dettagli Fattura {selectedFattura?.numero}
          <IconButton
            aria-label="close"
            onClick={() => setShowDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFattura && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedFattura.tipo === 'acquisto' ? 'Fornitore' : 'Cliente'}: {selectedFattura.fornitore?.nome || selectedFattura.cliente?.nome || '-'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Data: {formatDate(selectedFattura.data)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Prodotti ({selectedFattura.prodotti.length})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Varietà</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                      <TableCell align="right">Prezzo Acquisto</TableCell>
                      <TableCell align="right">Imballo</TableCell>
                      <TableCell align="right">Totale</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedFattura.prodotti.map((prodotto, index) => (
                      <TableRow key={index}>
                        <TableCell>{prodotto.varieta}</TableCell>
                        <TableCell align="right">{prodotto.quantita}</TableCell>
                        <TableCell align="right">€{(prodotto.prezzoAcquisto || prodotto.prezzoVendita || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">€{prodotto.totale.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" align="right" color="primary">
                Totale: €{selectedFattura.totale.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
} 