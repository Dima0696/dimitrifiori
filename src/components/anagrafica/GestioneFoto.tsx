import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Avatar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoIcon from '@mui/icons-material/Photo';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import { apiService } from '../../lib/apiService';

interface Foto {
  id: number;
  nome: string;
  url: string;
  descrizione?: string;
  created_at: string;
}

export default function GestioneFoto() {
  const [foto, setFoto] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFoto, setEditingFoto] = useState<Foto | null>(null);
  const [formData, setFormData] = useState({ nome: '', url: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica le foto
  const loadFoto = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFoto();
      setFoto(data);
    } catch (error) {
      console.error('Errore nel caricamento foto:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento delle foto', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoto();
  }, []);

  // Apri dialog per nuova foto
  const handleAddFoto = () => {
    setEditingFoto(null);
    setFormData({ nome: '', url: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modificare foto
  const handleEditFoto = (foto: Foto) => {
    setEditingFoto(foto);
    setFormData({ 
      nome: foto.nome, 
      url: foto.url || '' 
    });
    setOpenDialog(true);
  };

  // Salva foto (nuova o modifica)
  const handleSaveFoto = async () => {
    if (!formData.nome.trim()) {
      setSnackbar({ open: true, message: 'Il nome della foto è obbligatorio', severity: 'error' });
      return;
    }

    try {
      const dataToSave = {
        nome: formData.nome,
        url: formData.url.trim() || ''
      };

      if (editingFoto) {
        // Modifica
        await apiService.updateFoto(editingFoto.id, dataToSave);
        setSnackbar({ open: true, message: 'Foto aggiornata con successo', severity: 'success' });
      } else {
        // Nuova
        await apiService.createFoto(dataToSave);
        setSnackbar({ open: true, message: 'Foto creata con successo', severity: 'success' });
      }
      setOpenDialog(false);
      loadFoto();
    } catch (error) {
      console.error('Errore nel salvataggio foto:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio della foto', severity: 'error' });
    }
  };

  // Elimina foto
  const handleDeleteFoto = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa foto?')) return;

    try {
      await apiService.deleteFoto(id);
      setSnackbar({ open: true, message: 'Foto eliminata con successo', severity: 'success' });
      loadFoto();
    } catch (error) {
      console.error('Errore nell\'eliminazione foto:', error);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione della foto', severity: 'error' });
    }
  };

  // Controlla se l'URL è valido
  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestione Foto
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddFoto}
          sx={{ borderRadius: 2 }}
        >
          Nuova Foto
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Anteprima</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
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
              ) : foto.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nessuna foto presente. Crea la prima foto!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                foto.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isValidImageUrl(item.url) ? (
                          <Avatar
                            src={item.url}
                            sx={{ width: 40, height: 40 }}
                          >
                            <ImageIcon />
                          </Avatar>
                        ) : (
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
                            <PhotoIcon />
                          </Avatar>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {item.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.url ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label="URL presente"
                            color="success"
                            size="small"
                            icon={<LinkIcon />}
                          />
                        </Box>
                      ) : (
                        <Chip
                          label="Nessun URL"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.created_at).toLocaleDateString('it-IT')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditFoto(item)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFoto(item.id)}
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

      {/* Dialog per nuova/modifica foto */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFoto ? 'Modifica Foto' : 'Nuova Foto'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Foto"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            required
            placeholder="es. foto1, foto2, foto_principale"
          />
          <TextField
            fullWidth
            label="URL Immagine"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            margin="normal"
            placeholder="https://esempio.com/immagine.jpg"
            helperText="Inserisci l'URL completo dell'immagine"
          />
          {formData.url && isValidImageUrl(formData.url) && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Anteprima:
              </Typography>
              <Avatar
                src={formData.url}
                sx={{ width: 80, height: 80, mx: 'auto' }}
              >
                <ImageIcon />
              </Avatar>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveFoto} variant="contained">
            {editingFoto ? 'Aggiorna' : 'Crea'}
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
