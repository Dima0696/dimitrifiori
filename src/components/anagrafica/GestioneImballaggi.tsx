import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import { apiService } from '../../lib/apiService';

interface Imballo {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
}

export default function GestioneImballaggi() {
  const [imballaggi, setImballaggi] = useState<Imballo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingImballo, setEditingImballo] = useState<Imballo | null>(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica gli imballaggi
  const loadImballaggi = async () => {
    try {
      setLoading(true);
      const data = await apiService.getImballaggi();
      setImballaggi(data);
    } catch (error) {
      console.error('Errore nel caricamento imballaggi:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento degli imballaggi', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImballaggi();
  }, []);

  // Apri dialog per nuovo imballo
  const handleAddImballo = () => {
    setEditingImballo(null);
    setFormData({ nome: '', descrizione: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare imballo
  const handleEditImballo = (imballo: Imballo) => {
    setEditingImballo(imballo);
    setFormData({ 
      nome: imballo.nome, 
      descrizione: imballo.descrizione || '' 
    });
    setOpenDialog(true);
  };

  // Salva imballo (nuovo o modifica)
  const handleSaveImballo = async () => {
    if (!formData.nome.trim()) {
      setSnackbar({ open: true, message: 'Il nome dell\'imballo è obbligatorio', severity: 'error' });
      return;
    }

    try {
      const dataToSave = {
        nome: formData.nome,
        descrizione: formData.descrizione.trim() || undefined
      };

      if (editingImballo) {
        // Modifica
        await apiService.updateImballo(editingImballo.id, dataToSave);
        setSnackbar({ open: true, message: 'Imballo aggiornato con successo', severity: 'success' });
      } else {
        // Nuovo
        await apiService.createImballo(dataToSave);
        setSnackbar({ open: true, message: 'Imballo creato con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadImballaggi();
    } catch (error) {
      console.error('Errore nel salvataggio imballo:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio dell\'imballo', severity: 'error' });
    }
  };

  // Elimina imballo
  const handleDeleteImballo = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo imballo?')) return;

    try {
      await apiService.deleteImballo(id);
      setSnackbar({ open: true, message: 'Imballo eliminato con successo', severity: 'success' });
      loadImballaggi();
    } catch (error) {
      console.error('Errore nell\'eliminazione imballo:', error);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione dell\'imballo', severity: 'error' });
    }
  };

  // Ottieni colore chip per tipo di imballo
  const getPackageColor = (name: string) => {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('MAZZO') || nameUpper.includes('BOUQUET')) return 'success';
    if (nameUpper.includes('CASSA') || nameUpper.includes('BOX')) return 'primary';
    if (nameUpper.includes('SECCHIO') || nameUpper.includes('BUCKET')) return 'warning';
    if (nameUpper.includes('VASO') || nameUpper.includes('POT')) return 'secondary';
    if (nameUpper.includes('SCATOLA') || nameUpper.includes('CONFEZIONE')) return 'info';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Imballaggi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddImballo}
          sx={{ borderRadius: 2 }}
        >
          Nuovo Imballo
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Icona</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
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
              ) : imballaggi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessun imballo presente. Crea il primo imballo!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                imballaggi.map((imballo) => (
                  <TableRow key={imballo.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AllInboxIcon color="action" />
                        <InventoryIcon fontSize="small" color="action" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={imballo.nome}
                        color={getPackageColor(imballo.nome)}
                        icon={<InventoryIcon />}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {imballo.descrizione || 'Nessuna descrizione'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(imballo.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditImballo(imballo)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImballo(imballo.id)}
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

      {/* Dialog per nuovo/modifica imballo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingImballo ? 'Modifica Imballo' : 'Nuovo Imballo'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Imballo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            required
            placeholder="es. Mazzo, Cassa, Secchio"
          />
          <TextField
            fullWidth
            label="Descrizione (opzionale)"
            value={formData.descrizione}
            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
            margin="normal"
            placeholder="es. Mazzo da 10 steli, Cassa di cartone, Secchio di plastica"
            helperText="Descrizione aggiuntiva per l'imballo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveImballo} variant="contained">
            {editingImballo ? 'Aggiorna' : 'Crea'}
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
