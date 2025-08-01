import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import { apiService } from '../../lib/apiService';

interface Colore {
  id: number;
  nome: string;
  codice_colore: string;
  created_at: string;
}

export default function GestioneColori() {
  const [colori, setColori] = useState<Colore[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingColore, setEditingColore] = useState<Colore | null>(null);
  const [formData, setFormData] = useState({ nome: '', codice_colore: '#9e9e9e' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica i colori
  const loadColori = async () => {
    try {
      setLoading(true);
      const data = await apiService.getColori();
      setColori(data);
    } catch (error) {
      console.error('Errore nel caricamento colori:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento dei colori', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColori();
  }, []);

  // Apri dialog per nuovo colore
  const handleAddColore = () => {
    setEditingColore(null);
    setFormData({ nome: '', codice_colore: '#9e9e9e' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare colore
  const handleEditColore = (colore: Colore) => {
    setEditingColore(colore);
    setFormData({ nome: colore.nome, codice_colore: colore.codice_colore });
    setOpenDialog(true);
  };

  // Salva colore (nuovo o modifica)
  const handleSaveColore = async () => {
    if (!formData.nome.trim()) {
      setSnackbar({ open: true, message: 'Il nome del colore è obbligatorio', severity: 'error' });
      return;
    }

    try {
      if (editingColore) {
        // Modifica
        await apiService.updateColore(editingColore.id, formData);
        setSnackbar({ open: true, message: 'Colore aggiornato con successo', severity: 'success' });
      } else {
        // Nuovo
        await apiService.createColore(formData);
        setSnackbar({ open: true, message: 'Colore creato con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadColori();
    } catch (error) {
      console.error('Errore nel salvataggio colore:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio del colore', severity: 'error' });
    }
  };

  // Elimina colore
  const handleDeleteColore = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo colore?')) return;

    try {
      await apiService.deleteColore(id);
      setSnackbar({ open: true, message: 'Colore eliminato con successo', severity: 'success' });
      loadColori();
    } catch (error) {
      console.error('Errore nell\'eliminazione colore:', error);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione del colore', severity: 'error' });
    }
  };

  // Genera un colore casuale per la visualizzazione se non disponibile
  const getColorForColore = (colore: Colore) => {
    return colore.codice_colore || '#9e9e9e';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Colori
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddColore}
          sx={{ borderRadius: 2 }}
        >
          Nuovo Colore
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Colore</TableCell>
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
              ) : colori.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessun colore presente. Crea il primo colore!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                colori.map((colore) => (
                  <TableRow key={colore.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: getColorForColore(colore),
                            border: '1px solid #ddd'
                          }}
                        />
                        <PaletteIcon fontSize="small" color="action" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={colore.nome} 
                        sx={{ 
                          backgroundColor: getColorForColore(colore),
                          color: ['#ffffff', '#ffeb3b'].includes(colore.codice_colore.toLowerCase()) ? '#000' : '#fff'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(colore.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditColore(colore)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteColore(colore.id)}
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

      {/* Dialog per nuovo/modifica colore */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingColore ? 'Modifica Colore' : 'Nuovo Colore'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Colore"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            required
            placeholder="es. Rosso, Bianco, Rosa"
          />
          
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Seleziona il colore:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="color"
                value={formData.codice_colore}
                onChange={(e) => setFormData({ ...formData, codice_colore: e.target.value })}
                style={{
                  width: 60,
                  height: 40,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <TextField
                label="Codice Colore"
                value={formData.codice_colore}
                onChange={(e) => setFormData({ ...formData, codice_colore: e.target.value })}
                size="small"
                placeholder="#ffffff"
                helperText="Codice esadecimale del colore"
                sx={{ minWidth: 150 }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: formData.codice_colore,
                  border: '2px solid #ddd',
                  boxShadow: 1
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveColore} variant="contained">
            {editingColore ? 'Aggiorna' : 'Crea'}
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
