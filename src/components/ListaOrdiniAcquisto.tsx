import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, InputAdornment, Button, Alert, CircularProgress, Snackbar, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, InputLabel, Select, MenuItem, FormControl
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { apiService } from '../lib/apiService';

// Tipo per ordini di acquisto
interface OrdineAcquisto {
  id: string;
  numero: string;
  fornitoreId: string;
  fornitoreNome?: string;
  data: string;
  totale: number;
  stato: string;
}

export default function ListaOrdiniAcquisto() {
  const [ordini, setOrdini] = useState<OrdineAcquisto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrdine, setSelectedOrdine] = useState<OrdineAcquisto | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  const loadOrdini = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Caricamento ordini di acquisto...');
      
      // Carica fatture di acquisto dal backend
      const fatture = await apiService.getFatture();
      const fattureAcquisto = fatture.filter((f: any) => f.tipo === 'acquisto');
      
      // Converti fatture in formato ordini
      const ordiniFromFatture: OrdineAcquisto[] = fattureAcquisto.map((f: any) => ({
        id: f.id.toString(),
        numero: f.numero || `OA-${f.id}`,
        fornitoreId: f.fornitore_id?.toString() || 'N/A',
        fornitoreNome: f.fornitore_nome || 'Fornitore non specificato',
        data: f.data,
        totale: f.totale || 0,
        stato: f.stato === 'emessa' ? 'Confermato' : 'In elaborazione'
      }));
      
      setOrdini(ordiniFromFatture);
      console.log(`✅ Caricati ${ordiniFromFatture.length} ordini di acquisto`);
      
    } catch (err) {
      console.error('❌ Errore nel caricamento ordini:', err);
      setError('Errore nel caricamento degli ordini di acquisto');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrdini = ordini.filter(ordine => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ordine.fornitoreId || '').toLowerCase().includes(searchLower) ||
      (ordine.numero || '').toLowerCase().includes(searchLower) ||
      (ordine.data || '').toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (ordine: OrdineAcquisto) => {
    setSelectedOrdine(ordine);
    setShowDetails(true);
    setSnackbar({ open: true, message: `Dettagli ordine ${ordine.numero}`, severity: 'success' });
  };

  const handleDelete = (id: string) => {
    if (!id) return;
    if (window.confirm('Sei sicuro di voler eliminare questo ordine di acquisto?')) {
      setOrdini(ordini.filter(o => o.id !== id));
      setSnackbar({ open: true, message: 'Ordine eliminato con successo', severity: 'success' });
    }
  };

  const handleRefresh = () => {
    loadOrdini();
    setSnackbar({ open: true, message: 'Dati aggiornati', severity: 'success' });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return '-';
    }
  };

  if (loading && ordini.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento ordini di acquisto...
        </Typography>
      </Box>
    );
  }

  if (error && ordini.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadOrdini}>
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
      <Typography variant="h4" gutterBottom>Ordini di Acquisto</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Cerca ordine"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mr: 2 }}
        />
        <Tooltip title="Aggiorna">
          <IconButton onClick={handleRefresh}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Numero</TableCell>
              <TableCell>Fornitore</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Totale</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrdini.map(ordine => (
              <TableRow key={ordine.id}>
                <TableCell>{ordine.numero}</TableCell>
                <TableCell>{ordine.fornitoreNome || ordine.fornitoreId}</TableCell>
                <TableCell>{formatDate(ordine.data)}</TableCell>
                <TableCell>€{ordine.totale?.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{ordine.stato || '-'}</TableCell>
                <TableCell>
                  <Tooltip title="Dettagli">
                    <IconButton onClick={() => handleViewDetails(ordine)}><VisibilityIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton onClick={() => handleDelete(ordine.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
} 