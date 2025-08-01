import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HeightIcon from '@mui/icons-material/Height';
import StraightenIcon from '@mui/icons-material/Straighten';
import { apiService } from '../../lib/apiService';

interface Altezza {
  id: number;
  altezza_cm: number;
  descrizione?: string;
  created_at: string;
}

export default function GestioneAltezze() {
  const [altezze, setAltezze] = useState<Altezza[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAltezza, setEditingAltezza] = useState<Altezza | null>(null);
  const [formData, setFormData] = useState({ altezza_cm: '', descrizione: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica le altezze
  const loadAltezze = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAltezze();
      setAltezze(data);
    } catch (error) {
      console.error('Errore nel caricamento altezze:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento delle altezze', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAltezze();
  }, []);

  // Apri dialog per nuova altezza
  const handleAddAltezza = () => {
    setEditingAltezza(null);
    setFormData({ altezza_cm: '', descrizione: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare altezza
  const handleEditAltezza = (altezza: Altezza) => {
    setEditingAltezza(altezza);
    setFormData({ 
      altezza_cm: altezza.altezza_cm.toString(), 
      descrizione: altezza.descrizione || '' 
    });
    setOpenDialog(true);
  };

  // Salva altezza (nuova o modifica)
  const handleSaveAltezza = async () => {
    if (!formData.altezza_cm.trim()) {
      setSnackbar({ open: true, message: 'L\'altezza in cm è obbligatoria', severity: 'error' });
      return;
    }

    const altezzaCm = parseInt(formData.altezza_cm);
    if (isNaN(altezzaCm) || altezzaCm <= 0) {
      setSnackbar({ open: true, message: 'Inserisci un valore numerico valido per l\'altezza', severity: 'error' });
      return;
    }

    try {
      const dataToSave = {
        altezza_cm: altezzaCm,
        descrizione: formData.descrizione.trim() || undefined
      };

      if (editingAltezza) {
        // Modifica
        await apiService.updateAltezza(editingAltezza.id, dataToSave);
        setSnackbar({ open: true, message: 'Altezza aggiornata con successo', severity: 'success' });
      } else {
        // Nuova
        await apiService.createAltezza(dataToSave);
        setSnackbar({ open: true, message: 'Altezza creata con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadAltezze();
    } catch (error) {
      console.error('Errore nel salvataggio altezza:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio dell\'altezza', severity: 'error' });
    }
  };

  // Elimina altezza
  const handleDeleteAltezza = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa altezza?')) return;

    try {
      await apiService.deleteAltezza(id);
      setSnackbar({ open: true, message: 'Altezza eliminata con successo', severity: 'success' });
      loadAltezze();
    } catch (error) {
      console.error('Errore nell\'eliminazione altezza:', error);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione dell\'altezza', severity: 'error' });
    }
  };

  // Ottieni colore chip per altezza
  const getHeightColor = (altezzaCm: string) => {
    const height = parseInt(altezzaCm);
    if (height < 30) return 'success';      // Bassa
    if (height <= 60) return 'primary';     // Media
    if (height <= 90) return 'warning';     // Alta
    return 'secondary';                     // Extra alta
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Altezze
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAltezza}
          sx={{ borderRadius: 2 }}
        >
          Nuova Altezza
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Icona</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Altezza</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descrizione</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Creato</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : altezze.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessuna altezza presente. Crea la prima altezza!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                altezze.map((altezza) => (
                  <TableRow key={altezza.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StraightenIcon color="action" />
                        <HeightIcon fontSize="small" color="action" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${altezza.altezza_cm} cm`}
                        color={getHeightColor(altezza.altezza_cm.toString())}
                        icon={<HeightIcon />}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {altezza.descrizione || 'Nessuna descrizione'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(altezza.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAltezza(altezza)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAltezza(altezza.id)}
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

      {/* Dialog per nuova/modifica altezza */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAltezza ? 'Modifica Altezza' : 'Nuova Altezza'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Altezza (cm)"
            value={formData.altezza_cm}
            onChange={(e) => setFormData({ ...formData, altezza_cm: e.target.value })}
            margin="normal"
            required
            type="number"
            placeholder="es. 30, 60, 90"
            helperText="Inserisci l'altezza in centimetri"
          />
          <TextField
            fullWidth
            label="Descrizione (opzionale)"
            value={formData.descrizione}
            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
            margin="normal"
            placeholder="es. Altezza standard per rose, Altezza per steli lunghi"
            helperText="Descrizione aggiuntiva per l'altezza"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveAltezza} variant="contained">
            {editingAltezza ? 'Aggiorna' : 'Crea'}
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
