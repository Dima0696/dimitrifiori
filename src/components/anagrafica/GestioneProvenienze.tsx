import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import { apiService } from '../../lib/apiService';

interface Provenienza {
  id: number;
  nome: string;
  created_at: string;
}

export default function GestioneProvenienze() {
  const [provenienze, setProvenienze] = useState<Provenienza[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProvenienza, setEditingProvenienza] = useState<Provenienza | null>(null);
  const [formData, setFormData] = useState({ nome: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica le provenienze
  const loadProvenienze = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProvenienze();
      setProvenienze(data);
    } catch (error) {
      console.error('Errore nel caricamento provenienze:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento delle provenienze', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvenienze();
  }, []);

  // Apri dialog per nuova provenienza
  const handleAddProvenienza = () => {
    setEditingProvenienza(null);
    setFormData({ nome: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare provenienza
  const handleEditProvenienza = (provenienza: Provenienza) => {
    setEditingProvenienza(provenienza);
    setFormData({ nome: provenienza.nome });
    setOpenDialog(true);
  };

  // Salva provenienza (nuova o modifica)
  const handleSaveProvenienza = async () => {
    if (!formData.nome.trim()) {
      setSnackbar({ open: true, message: 'Il nome della provenienza è obbligatorio', severity: 'error' });
      return;
    }

    try {
      if (editingProvenienza) {
        // Modifica
        await apiService.updateProvenienza(editingProvenienza.id, formData);
        setSnackbar({ open: true, message: 'Provenienza aggiornata con successo', severity: 'success' });
      } else {
        // Nuova
        await apiService.createProvenienza(formData);
        setSnackbar({ open: true, message: 'Provenienza creata con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadProvenienze();
    } catch (error) {
      console.error('Errore nel salvataggio provenienza:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio della provenienza', severity: 'error' });
    }
  };

  // Elimina provenienza
  const handleDeleteProvenienza = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa provenienza?')) return;

    try {
      await apiService.deleteProvenienza(id);
      setSnackbar({ open: true, message: 'Provenienza eliminata con successo', severity: 'success' });
      loadProvenienze();
    } catch (error) {
      console.error('Errore nell\'eliminazione provenienza:', error);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione della provenienza', severity: 'error' });
    }
  };

  // Ottieni icona per paese/regione
  const getCountryFlag = (name: string) => {
    const flags = {
      'olanda': '🇳🇱',
      'italia': '🇮🇹',
      'ecuador': '🇪🇨',
      'colombia': '🇨🇴',
      'kenya': '🇰🇪',
      'francia': '🇫🇷',
      'spagna': '🇪🇸',
      'germania': '🇩🇪',
      'belgio': '🇧🇪',
      'turchia': '🇹🇷'
    };
    return flags[name.toLowerCase() as keyof typeof flags] || '🌍';
  };

  // Ottieni colore chip per regione
  const getRegionColor = (name: string) => {
    if (['italia'].includes(name.toLowerCase())) return 'success';
    if (['olanda', 'francia', 'germania', 'belgio'].includes(name.toLowerCase())) return 'primary';
    if (['ecuador', 'colombia'].includes(name.toLowerCase())) return 'warning';
    if (['kenya'].includes(name.toLowerCase())) return 'secondary';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Provenienze
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProvenienza}
          sx={{ borderRadius: 2 }}
        >
          Nuova Provenienza
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Bandiera</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Creato</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : provenienze.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessuna provenienza presente. Crea la prima provenienza!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                provenienze.map((provenienza) => (
                  <TableRow key={provenienza.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">
                          {getCountryFlag(provenienza.nome)}
                        </Typography>
                        <LocationOnIcon fontSize="small" color="action" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={provenienza.nome}
                          color={getRegionColor(provenienza.nome)}
                          size="small"
                          icon={<PublicIcon />}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(provenienza.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditProvenienza(provenienza)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProvenienza(provenienza.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog per nuova/modifica provenienza */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProvenienza ? 'Modifica Provenienza' : 'Nuova Provenienza'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Provenienza"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            required
            placeholder="es. Olanda, Italia, Ecuador"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveProvenienza} variant="contained">
            {editingProvenienza ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
