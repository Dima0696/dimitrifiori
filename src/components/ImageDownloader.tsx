import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  Chip,
  Alert,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface Varieta {
  id: number;
  nome: string;
  prodotto_nome: string;
  gruppo_nome: string;
  quantita_totale: number;
  image_path: string | null;
  has_image: boolean;
}

interface UploadResult {
  varieta_id: number;
  nome: string;
  success: boolean;
  image_path?: string;
  error?: string;
}

const ImageUploader: React.FC = () => {
  const [varieta, setVarieta] = useState<Varieta[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [selectedVarieta, setSelectedVarieta] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVarietaId, setSelectedVarietaId] = useState<number | ''>('');

  // Carica varietà disponibili
  const loadVarieta = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/varieta/con-immagini');
      const data = await res.json();
      
      if (data.success) {
        setVarieta(data.data);
      } else {
        console.error('Errore caricamento varietà:', data.error);
      }
    } catch (error) {
      console.error('Errore caricamento varietà:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carica varietà al mount
  useEffect(() => {
    loadVarieta();
  }, []);

  // Gestisce selezione varietà
  const handleVarietaSelection = (varietaId: number) => {
    setSelectedVarieta(prev => 
      prev.includes(varietaId) 
        ? prev.filter(id => id !== varietaId)
        : [...prev, varietaId]
    );
  };

  // Gestisce selezione file
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      alert('Seleziona un file immagine valido (JPG, PNG, etc.)');
    }
  };

  // Upload immagine per una varietà
  const uploadImage = async () => {
    if (!selectedFile || !selectedVarietaId) {
      alert('Seleziona un file e una varietà');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('varietaId', selectedVarietaId.toString());

      const res = await fetch('http://localhost:3001/api/varieta/upload-immagine', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (data.success) {
        setResults(prev => [...prev, {
          varieta_id: selectedVarietaId as number,
          nome: varieta.find(v => v.id === selectedVarietaId)?.nome || '',
          success: true,
          image_path: data.image_path
        }]);
        
        // Aggiorna la lista varietà
        await loadVarieta();
        
        // Reset form
        setSelectedFile(null);
        setSelectedVarietaId('');
        setUploadDialogOpen(false);
      } else {
        setResults(prev => [...prev, {
          varieta_id: selectedVarietaId as number,
          nome: varieta.find(v => v.id === selectedVarietaId)?.nome || '',
          success: false,
          error: data.error
        }]);
      }
    } catch (error) {
      console.error('Errore upload:', error);
      setResults(prev => [...prev, {
        varieta_id: selectedVarietaId as number,
        nome: varieta.find(v => v.id === selectedVarietaId)?.nome || '',
        success: false,
        error: 'Errore di connessione'
      }]);
    } finally {
      setUploading(false);
    }
  };

  // Visualizza immagine
  const viewImage = (imagePath: string) => {
    const fullUrl = `http://localhost:3001${imagePath}`;
    window.open(fullUrl, '_blank');
  };

  // Rimuovi immagine
  const removeImage = async (varietaId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/varieta/rimuovi-immagine/${varietaId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        await loadVarieta();
        setResults(prev => [...prev, {
          varieta_id: varietaId,
          nome: varieta.find(v => v.id === varietaId)?.nome || '',
          success: true,
          image_path: undefined
        }]);
      }
    } catch (error) {
      console.error('Errore rimozione immagine:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📸 Gestione Immagini Varietà
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Carica le immagini delle tue varietà di fiori per il webshop
      </Typography>

      {/* Pulsante Upload */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Carica Nuova Immagine
        </Button>
        
        <Button
          variant="outlined"
          onClick={loadVarieta}
          disabled={loading}
        >
          {loading ? 'Caricamento...' : 'Aggiorna Lista'}
        </Button>
      </Box>

      {/* Lista Varietà */}
      <Grid container spacing={2}>
        {varieta.map((v) => (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {v.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {v.gruppo_nome} - {v.prodotto_nome}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Giacenza: {v.quantita_totale}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {v.has_image ? (
                      <>
                        <Chip 
                          label="Immagine" 
                          color="success" 
                          icon={<CheckCircleIcon />}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => viewImage(v.image_path!)}
                          color="primary"
                        >
                          <ImageIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => removeImage(v.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <Chip 
                        label="Nessuna immagine" 
                        color="default" 
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                
                {v.has_image && v.image_path && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={`http://localhost:3001${v.image_path}`}
                      alt={v.nome}
                      style={{ 
                        width: '100%', 
                        height: 150, 
                        objectFit: 'cover', 
                        borderRadius: 4 
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Risultati Upload */}
      {results.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risultati Upload ({results.length})
          </Typography>
          
          <Stack spacing={2}>
            {results.map((result, index) => (
              <Alert 
                key={index}
                severity={result.success ? 'success' : 'error'}
                action={
                  result.success && result.image_path ? (
                    <Button
                      size="small"
                      onClick={() => viewImage(result.image_path!)}
                    >
                      Visualizza
                    </Button>
                  ) : null
                }
              >
                {result.nome}: {result.success ? 'Upload completato' : result.error}
              </Alert>
            ))}
          </Stack>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setResults([])}
            >
              Pulisci Risultati
            </Button>
          </Box>
        </Paper>
      )}

      {/* Dialog Upload */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Carica Immagine Varietà</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Seleziona Varietà</InputLabel>
              <Select
                value={selectedVarietaId}
                onChange={(e) => setSelectedVarietaId(e.target.value)}
                label="Seleziona Varietà"
              >
                {varieta.filter(v => !v.has_image).map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.nome} ({v.gruppo_nome} - {v.prodotto_nome})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  {selectedFile ? selectedFile.name : 'Seleziona Immagine'}
                </Button>
              </label>
            </Box>
            
            {selectedFile && (
              <Box>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  style={{ 
                    width: '100%', 
                    maxHeight: 200, 
                    objectFit: 'cover', 
                    borderRadius: 4 
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={uploadImage}
            disabled={!selectedFile || !selectedVarietaId || uploading}
            variant="contained"
          >
            {uploading ? 'Caricamento...' : 'Carica'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUploader; 