import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiService } from '../../lib/apiService';

interface Gruppo {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
  updated_at: string;
}

export default function GestioneGruppi() {
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGruppo, setEditingGruppo] = useState<Gruppo | null>(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica i gruppi
  const loadGruppi = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGruppi();
      setGruppi(data);
    } catch (error) {
      console.error('Errore nel caricamento gruppi:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento dei gruppi', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGruppi();
  }, []);

  // Apri dialog per nuovo gruppo
  const handleAddGruppo = () => {
    setEditingGruppo(null);
    setFormData({ nome: '', descrizione: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare gruppo
  const handleEditGruppo = (gruppo: Gruppo) => {
    setEditingGruppo(gruppo);
    setFormData({ nome: gruppo.nome, descrizione: gruppo.descrizione || '' });
    setOpenDialog(true);
  };

  // Salva gruppo (nuovo o modifica)
  const handleSaveGruppo = async () => {
    if (!formData.nome.trim()) {
      setSnackbar({ open: true, message: 'Il nome del gruppo è obbligatorio', severity: 'error' });
      return;
    }

    try {
      if (editingGruppo) {
        // Modifica
        await apiService.updateGruppo(editingGruppo.id, formData);
        setSnackbar({ open: true, message: 'Gruppo aggiornato con successo', severity: 'success' });
      } else {
        // Nuovo
        await apiService.createGruppo(formData);
        setSnackbar({ open: true, message: 'Gruppo creato con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadGruppi();
    } catch (error) {
      console.error('Errore nel salvataggio gruppo:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio del gruppo', severity: 'error' });
    }
  };

  // Elimina gruppo
  const handleDeleteGruppo = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo gruppo?')) return;

    try {
      await apiService.deleteGruppo(id);
      setSnackbar({ open: true, message: 'Gruppo eliminato con successo', severity: 'success' });
      loadGruppi();
    } catch (error: any) {
      console.error('Errore nell\'eliminazione gruppo:', error);
      let errorMessage = 'Errore nell\'eliminazione del gruppo';
      
      // Gestione errori specifici
      if (error.message?.includes('foreign key')) {
        errorMessage = 'Impossibile eliminare: il gruppo è utilizzato in altri record (articoli, ecc.)';
      } else if (error.message?.includes('violates')) {
        errorMessage = 'Impossibile eliminare: il gruppo è ancora in uso nel sistema';
      } else if (error.message) {
        errorMessage = `Errore: ${error.message}`;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Gruppi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGruppo}
          sx={{ borderRadius: 2 }}
        >
          Nuovo Gruppo
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descrizione</TableCell>
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
              ) : gruppi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessun gruppo presente. Crea il primo gruppo!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                gruppi.map((gruppo) => (
                  <TableRow key={gruppo.id} hover>
                    <TableCell>
                      <Chip label={gruppo.nome} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {gruppo.descrizione || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(gruppo.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditGruppo(gruppo)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGruppo(gruppo.id)}
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

      {/* Dialog per nuovo/modifica gruppo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGruppo ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Gruppo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            required
            placeholder="es. Rose, Tulipani, Garofani"
          />
          <TextField
            fullWidth
            label="Descrizione"
            value={formData.descrizione}
            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Descrizione opzionale del gruppo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveGruppo} variant="contained">
            {editingGruppo ? 'Aggiorna' : 'Crea'}
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
