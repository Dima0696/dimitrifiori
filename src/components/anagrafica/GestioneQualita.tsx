import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Alert, Snackbar, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { apiService } from '../../lib/apiService';

interface Qualita {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
}

export default function GestioneQualita() {
  const [qualita, setQualita] = useState<Qualita[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQualita, setEditingQualita] = useState<Qualita | null>(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica le qualità
  const loadQualita = async () => {
    try {
      setLoading(true);
      const data = await apiService.getQualita();
      setQualita(data);
    } catch (error) {
      console.error('Errore nel caricamento qualità:', error);
      setSnackbar({ open: true, message: 'Errore nel caricamento delle qualità', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQualita();
  }, []);

  // Apri dialog per nuova qualità
  const handleAddQualita = () => {
    setEditingQualita(null);
    setFormData({ nome: '', descrizione: '' });
    setOpenDialog(true);
  };

  // Apri dialog per modifica qualità
  const handleEditQualita = (qualitaItem: Qualita) => {
    setEditingQualita(qualitaItem);
    setFormData({ nome: qualitaItem.nome, descrizione: qualitaItem.descrizione || '' });
    setOpenDialog(true);
  };

  // Salva qualità (crea o modifica)
  const handleSaveQualita = async () => {
    try {
      if (editingQualita) {
        // Modifica
        await apiService.updateQualita(editingQualita.id, formData);
        setSnackbar({ open: true, message: 'Qualità modificata con successo!', severity: 'success' });
      } else {
        // Crea nuovo
        await apiService.createQualita(formData);
        setSnackbar({ open: true, message: 'Qualità creata con successo!', severity: 'success' });
      }
      setOpenDialog(false);
      loadQualita();
    } catch (error) {
      console.error('Errore nel salvataggio qualità:', error);
      setSnackbar({ open: true, message: 'Errore nel salvataggio della qualità', severity: 'error' });
    }
  };

  // Elimina qualità
  const handleDeleteQualita = async (qualitaItem: Qualita) => {
    if (window.confirm(`Sei sicuro di voler eliminare la qualità "${qualitaItem.nome}"?`)) {
      try {
        await apiService.deleteQualita(qualitaItem.id);
        setSnackbar({ open: true, message: 'Qualità eliminata con successo!', severity: 'success' });
        loadQualita();
      } catch (error) {
        console.error('Errore nell\'eliminazione qualità:', error);
        setSnackbar({ open: true, message: 'Errore nell\'eliminazione della qualità', severity: 'error' });
      }
    }
  };

  // Chiudi dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQualita(null);
    setFormData({ nome: '', descrizione: '' });
  };

  // Ottieni icona per qualità
  const getQualitaIcon = (nome: string) => {
    switch (nome.toLowerCase()) {
      case 'extra': return '⭐⭐⭐';
      case 'prima': return '⭐⭐';
      case 'seconda': return '⭐';
      case 'terza': return '🔹';
      case 'scarto': return '♻️';
      case 'mista': return '🔄';
      default: return '📋';
    }
  };

  // Ottieni colore per qualità
  const getQualitaColor = (nome: string) => {
    switch (nome.toLowerCase()) {
      case 'extra': return '#FFD700'; // Oro
      case 'prima': return '#C0C0C0'; // Argento
      case 'seconda': return '#CD7F32'; // Bronzo
      case 'terza': return '#4CAF50'; // Verde
      case 'scarto': return '#FF9800'; // Arancione
      case 'mista': return '#9C27B0'; // Viola
      default: return '#757575'; // Grigio
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
          <StarIcon sx={{ mr: 1, fontSize: 32 }} />
          Gestione Qualità
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddQualita}
          sx={{
            bgcolor: '#27ae60',
            '&:hover': { bgcolor: '#229954' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Nuova Qualità
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Le qualità definiscono i gradi di qualità dei prodotti. Ogni articolo deve avere una qualità associata.
      </Alert>

      {loading ? (
        <Typography>Caricamento qualità...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Qualità</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrizione</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Creata il</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualita.map((qualitaItem) => (
                <TableRow key={qualitaItem.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5em', marginRight: '8px' }}>
                        {getQualitaIcon(qualitaItem.nome)}
                      </span>
                      <Chip 
                        label={qualitaItem.nome}
                        sx={{ 
                          bgcolor: getQualitaColor(qualitaItem.nome),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{qualitaItem.nome}</TableCell>
                  <TableCell>{qualitaItem.descrizione || '-'}</TableCell>
                  <TableCell>{new Date(qualitaItem.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditQualita(qualitaItem)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteQualita(qualitaItem)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog per aggiungere/modificare qualità */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2c3e50', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ mr: 1 }} />
            {editingQualita ? 'Modifica Qualità' : 'Nuova Qualità'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nome Qualità"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            margin="normal"
            placeholder="es. Extra, Prima, Seconda..."
          />
          <TextField
            fullWidth
            label="Descrizione"
            value={formData.descrizione}
            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Descrizione della qualità..."
          />
          
          {formData.nome && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">Anteprima:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <span style={{ fontSize: '1.5em', marginRight: '8px' }}>
                  {getQualitaIcon(formData.nome)}
                </span>
                <Chip 
                  label={formData.nome}
                  sx={{ 
                    bgcolor: getQualitaColor(formData.nome),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleSaveQualita}
            variant="contained"
            disabled={!formData.nome.trim()}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
          >
            {editingQualita ? 'Modifica' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
