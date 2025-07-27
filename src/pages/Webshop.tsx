import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Avatar,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon,
  Language as LanguageIcon,
  Euro as EuroIcon,
  LocalShipping as LocalShippingIcon,
  Star as StarIcon,
  Inventory as InventoryIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

interface Cliente {
  id: number;
  nome: string;
  email: string;
  ragione_sociale: string;
}

interface Prodotto {
  id: number;
  nome: string;
  prodotto_nome: string;
  gruppo_nome: string;
  colore_nome: string;
  colore_id: number;
  quantita_disponibile: number;
  prezzo_vendita: number;
  image_path: string | null;
  has_image: boolean;
  altezza?: string;
  qualita?: string;
  provenienza?: string;
  steli_per_unita?: number;
  unita_misura?: string;
  imballo?: number;
  peso?: string;
}

interface Filtri {
  colori: Array<{ id: number; nome: string; hex: string; count: number }>;
  gruppi: Array<{ id: string; nome: string }>;
  range_prezzi: { min: number; max: number };
  altezze: Array<{ id: number; nome: string }>;
  qualita: Array<{ id: number; nome: string }>;
  provenienza: Array<{ id: number; nome: string }>;
}

interface CarrelloItem {
  prodotto: Prodotto;
  quantita: number;
}

const Webshop: React.FC = () => {
  // Stati autenticazione
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loginDialog, setLoginDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Stati catalogo
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtri, setFiltri] = useState<Filtri | null>(null);
  const [filtriAplicati, setFiltriAplicati] = useState({
    colore_id: '',
    gruppo_id: '',
    prezzo_min: 0,
    prezzo_max: 1000,
    search: '',
    altezza_id: '',
    qualita_id: '',
    provenienza_id: ''
  });

  // Stati carrello
  const [carrello, setCarrello] = useState<CarrelloItem[]>([]);
  const [carrelloOpen, setCarrelloOpen] = useState(false);

  // Stati filtri
  const [filtriOpen, setFiltriOpen] = useState(false);

  // Stati visualizzazione
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [favorites, setFavorites] = useState<number[]>([]);

  // Stati feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Carica catalogo prodotti
  const caricaCatalogo = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtriAplicati.colore_id) params.append('colore_id', filtriAplicati.colore_id);
      if (filtriAplicati.gruppo_id) params.append('gruppo_id', filtriAplicati.gruppo_id);
          if (filtriAplicati.prezzo_min > 0) params.append('prezzo_min', (filtriAplicati.prezzo_min || 0).toString());
    if (filtriAplicati.prezzo_max < 1000) params.append('prezzo_max', (filtriAplicati.prezzo_max || 1000).toString());
      if (filtriAplicati.search) params.append('search', filtriAplicati.search);
      if (filtriAplicati.altezza_id) params.append('altezza_id', filtriAplicati.altezza_id);
      if (filtriAplicati.qualita_id) params.append('qualita_id', filtriAplicati.qualita_id);
      if (filtriAplicati.provenienza_id) params.append('provenienza_id', filtriAplicati.provenienza_id);

      const res = await fetch(`http://localhost:3001/api/webshop/catalogo?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setProdotti(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento catalogo:', error);
      mostraSnackbar('Errore caricamento catalogo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carica filtri disponibili
  const caricaFiltri = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/webshop/filtri');
      const data = await res.json();
      
      if (data.success) {
        setFiltri(data);
        setFiltriAplicati(prev => ({
          ...prev,
          prezzo_max: data.range_prezzi.max
        }));
      }
    } catch (error) {
      console.error('Errore caricamento filtri:', error);
    }
  };

  // Login cliente
  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/webshop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (data.success) {
        setCliente(data.cliente);
        setLoginDialog(false);
        setEmail('');
        setPassword('');
        setLoginError('');
        mostraSnackbar(`Benvenuto ${data.cliente.nome}!`, 'success');
      } else {
        setLoginError(data.error);
      }
    } catch (error) {
      console.error('Errore login:', error);
      setLoginError('Errore di connessione');
    }
  };

  // Logout
  const handleLogout = () => {
    setCliente(null);
    setCarrello([]);
    mostraSnackbar('Logout effettuato', 'success');
  };

  // Gestione preferiti
  const toggleFavorite = (prodottoId: number) => {
    setFavorites(prev => 
      prev.includes(prodottoId) 
        ? prev.filter(id => id !== prodottoId)
        : [...prev, prodottoId]
    );
  };

  // Gestione carrello
  const aggiungiAlCarrello = (prodotto: Prodotto) => {
    setCarrello(prev => {
      const existing = prev.find(item => item.prodotto.id === prodotto.id);
      if (existing) {
        return prev.map(item =>
          item.prodotto.id === prodotto.id
            ? { ...item, quantita: Math.min(item.quantita + 1, prodotto.quantita_disponibile) }
            : item
        );
      } else {
        return [...prev, { prodotto, quantita: 1 }];
      }
    });
    mostraSnackbar(`${prodotto.nome} aggiunto al carrello`, 'success');
  };

  const rimuoviDalCarrello = (prodottoId: number) => {
    setCarrello(prev => prev.filter(item => item.prodotto.id !== prodottoId));
  };

  const aggiornaQuantita = (prodottoId: number, quantita: number) => {
    setCarrello(prev => prev.map(item =>
      item.prodotto.id === prodottoId
        ? { ...item, quantita: Math.max(0, Math.min(quantita, item.prodotto.quantita_disponibile)) }
        : item
    ));
  };

  const totaleCarrello = carrello.reduce((tot, item) => tot + (item.prodotto.prezzo_vendita * item.quantita), 0);

  // Conferma ordine
  const confermaOrdine = async () => {
    if (!cliente || carrello.length === 0) return;

    try {
      const articoli = carrello.map(item => ({
        varieta_id: item.prodotto.id,
        quantita: item.quantita
      }));

      const res = await fetch('http://localhost:3001/api/webshop/ordine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente.id,
          articoli
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setCarrello([]);
        setCarrelloOpen(false);
        mostraSnackbar(`Ordine confermato! Totale: €${(data.ordine.totale || 0).toFixed(2)}`, 'success');
        caricaCatalogo(); // Ricarica per aggiornare disponibilità
      } else {
        mostraSnackbar(data.error, 'error');
      }
    } catch (error) {
      console.error('Errore conferma ordine:', error);
      mostraSnackbar('Errore durante la conferma dell\'ordine', 'error');
    }
  };

  // Utility
  const mostraSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Effetti
  useEffect(() => {
    caricaCatalogo();
    caricaFiltri();
  }, [filtriAplicati]);

  // Render
  if (!cliente) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="primary">
              🌸 DimitriFlor Webshop
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Accedi per visualizzare il nostro catalogo di fiori
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonIcon />}
              onClick={() => setLoginDialog(true)}
            >
              Accedi
            </Button>
          </Paper>
        </Container>

        {/* Dialog Login */}
        <Dialog open={loginDialog} onClose={() => setLoginDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Accedi al Webshop</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              {loginError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {loginError}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoginDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleLogin} variant="contained">
              Accedi
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header Principale */}
      <AppBar position="static" sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            🌸 DIMITRIFLOR
          </Typography>
          <Typography variant="caption" sx={{ mr: 2, color: 'text.secondary' }}>
            TO FLOWER THE WORLD
          </Typography>
          
          <TextField
            size="small"
            placeholder="Sto cercando..."
            sx={{ 
              width: 300, 
              mr: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'grey.100',
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            value={filtriAplicati.search}
            onChange={(e) => setFiltriAplicati(prev => ({ ...prev, search: e.target.value }))}
          />
          
          <IconButton color="inherit">
            <FavoriteBorderIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={() => setCarrelloOpen(true)}>
            <Badge badgeContent={carrello.length} color="primary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit">
            <LanguageIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        
        {/* Barra secondaria */}
        <Box sx={{ bgcolor: 'orange.main', color: 'white', py: 1, px: 2 }}>
          <Typography variant="body2">
            Acquisto per: <strong>{cliente.ragione_sociale}</strong> | 
            Data partenza: <strong>{new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</strong> | 
            Ordina prima: <strong>{new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} 12:00 PM</strong>
          </Typography>
        </Box>
      </AppBar>

      {/* Layout principale */}
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar Filtri */}
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              bgcolor: 'white',
              borderRight: '1px solid #e0e0e0'
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Categoria
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, overflow: 'auto', height: 'calc(100vh - 120px)' }}>
            {filtri && (
              <>
                {/* Colori */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Colore principale
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {filtri.colori.map((colore) => (
                        <FormControlLabel
                          key={colore.id}
                          control={
                            <Checkbox
                              checked={filtriAplicati.colore_id === (colore.id?.toString() || '')}
                              onChange={(e) => setFiltriAplicati(prev => ({ 
                                ...prev, 
                                colore_id: e.target.checked ? (colore.id?.toString() || '') : '' 
                              }))}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: colore.hex,
                                  border: '1px solid #ccc'
                                }}
                              />
                              <Typography variant="body2">
                                {colore.nome} ({colore.count})
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Gruppi */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Categoria
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {filtri.gruppi.map((gruppo) => (
                        <FormControlLabel
                          key={gruppo.id}
                          control={
                            <Checkbox
                              checked={filtriAplicati.gruppo_id === gruppo.id}
                              onChange={(e) => setFiltriAplicati(prev => ({ 
                                ...prev, 
                                gruppo_id: e.target.checked ? gruppo.id : '' 
                              }))}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {gruppo.nome}
                            </Typography>
                          }
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Prezzo */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Prezzo
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Slider
                      value={[filtriAplicati.prezzo_min, filtriAplicati.prezzo_max]}
                      onChange={(_, value) => setFiltriAplicati(prev => ({ 
                        ...prev, 
                        prezzo_min: value[0], 
                        prezzo_max: value[1] 
                      }))}
                      valueLabelDisplay="auto"
                      min={filtri.range_prezzi.min}
                      max={filtri.range_prezzi.max}
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      €{(filtriAplicati.prezzo_min || 0).toFixed(2)} - €{(filtriAplicati.prezzo_max || 1000).toFixed(2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                {/* Altezze */}
                {filtri.altezze && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Lunghezza dello stelo
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {filtri.altezze.map((altezza) => (
                          <FormControlLabel
                            key={altezza.id}
                                                      control={
                            <Checkbox
                              checked={filtriAplicati.altezza_id === (altezza.id?.toString() || '')}
                              onChange={(e) => setFiltriAplicati(prev => ({ 
                                ...prev, 
                                altezza_id: e.target.checked ? (altezza.id?.toString() || '') : '' 
                              }))}
                              size="small"
                            />
                          }
                            label={
                              <Typography variant="body2">
                                {altezza.nome}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Qualità */}
                {filtri.qualita && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Qualità
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {filtri.qualita.map((qualita) => (
                          <FormControlLabel
                            key={qualita.id}
                                                      control={
                            <Checkbox
                              checked={filtriAplicati.qualita_id === (qualita.id?.toString() || '')}
                              onChange={(e) => setFiltriAplicati(prev => ({ 
                                ...prev, 
                                qualita_id: e.target.checked ? (qualita.id?.toString() || '') : '' 
                              }))}
                              size="small"
                            />
                          }
                            label={
                              <Typography variant="body2">
                                {qualita.nome}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Provenienza */}
                {filtri.provenienza && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Paese d'origine
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {filtri.provenienza.map((provenienza) => (
                          <FormControlLabel
                            key={provenienza.id}
                                                      control={
                            <Checkbox
                              checked={filtriAplicati.provenienza_id === (provenienza.id?.toString() || '')}
                              onChange={(e) => setFiltriAplicati(prev => ({ 
                                ...prev, 
                                provenienza_id: e.target.checked ? (provenienza.id?.toString() || '') : '' 
                              }))}
                              size="small"
                            />
                          }
                            label={
                              <Typography variant="body2">
                                {provenienza.nome}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </>
            )}
          </Box>
        </Drawer>

        {/* Contenuto principale */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Barra superiore */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                All Flowers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prodotti.length} prodotti trovati
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="relevance">Rilevanza</MenuItem>
                  <MenuItem value="price_asc">Prezzo crescente</MenuItem>
                  <MenuItem value="price_desc">Prezzo decrescente</MenuItem>
                  <MenuItem value="name_asc">Nome A-Z</MenuItem>
                  <MenuItem value="name_desc">Nome Z-A</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Catalogo prodotti */}
          <Grid container spacing={2}>
            {prodotti.map((prodotto) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prodotto.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}>
                  {/* Tag offerte */}
                  {Math.random() > 0.7 && (
                    <Chip
                      label="Offerte"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'orange.main',
                        color: 'white',
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  {/* Icona preferiti */}
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      zIndex: 1
                    }}
                    onClick={() => toggleFavorite(prodotto.id)}
                  >
                    {favorites.includes(prodotto.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                  
                  {/* Immagine prodotto */}
                  {prodotto.has_image && prodotto.image_path ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={`http://localhost:3001${prodotto.image_path}`}
                      alt={prodotto.nome}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">Nessuna immagine</Typography>
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                      {prodotto.nome}
                    </Typography>
                    
                    {/* Specifiche prodotto */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {prodotto.altezza && (
                        <Chip
                          icon={<InventoryIcon />}
                          label={prodotto.altezza}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {prodotto.qualita && (
                        <Chip
                          icon={<StarIcon />}
                          label={prodotto.qualita}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {prodotto.imballo && prodotto.imballo > 1 && (
                        <Chip
                          label={`Imballo: ${prodotto.imballo}${prodotto.steli_per_unita ? ` (${prodotto.steli_per_unita} steli)` : ''}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>
                    
                    {/* Dettagli */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Colore principale:</strong> {prodotto.colore_nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Disponibile:</strong> {prodotto.quantita_disponibile > 0 ? 'Magazzino' : 'Non disponibile'}
                      </Typography>
                      {prodotto.imballo && prodotto.imballo > 1 && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Imballo:</strong> {prodotto.imballo} unità{prodotto.steli_per_unita ? ` (${prodotto.steli_per_unita} steli per unità)` : ''}
                        </Typography>
                      )}
                      {prodotto.provenienza && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Origine:</strong> {prodotto.provenienza}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Prezzo e azioni */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        €{(prodotto.prezzo_vendita || 0).toFixed(2)}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => aggiungiAlCarrello(prodotto)}
                        disabled={prodotto.quantita_disponibile === 0}
                        sx={{ minWidth: 80 }}
                      >
                        {prodotto.quantita_disponibile === 0 ? 'Non disponibile' : 'Aggiungi'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {prodotti.length === 0 && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Nessun prodotto trovato con i filtri applicati
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Drawer Carrello */}
      <Drawer anchor="right" open={carrelloOpen} onClose={() => setCarrelloOpen(false)}>
        <Box sx={{ width: 400, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Carrello ({carrello.length} articoli)
          </Typography>
          
          {carrello.length === 0 ? (
            <Typography color="text.secondary">
              Il carrello è vuoto
            </Typography>
          ) : (
            <>
              <List>
                {carrello.map((item) => (
                  <ListItem key={item.prodotto.id} divider>
                    <ListItemText
                      primary={item.prodotto.nome}
                      secondary={`€${(item.prodotto.prezzo_vendita || 0).toFixed(2)} x ${item.quantita}${item.prodotto.imballo && item.prodotto.imballo > 1 ? ` (imballo da ${item.prodotto.imballo}${item.prodotto.steli_per_unita ? `, ${item.prodotto.steli_per_unita} steli` : ''})` : ''}`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => aggiornaQuantita(item.prodotto.id, item.quantita - 1)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography>{item.quantita}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => aggiornaQuantita(item.prodotto.id, item.quantita + 1)}
                        disabled={item.quantita >= item.prodotto.quantita_disponibile}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => rimuoviDalCarrello(item.prodotto.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Totale: €{(totaleCarrello || 0).toFixed(2)}
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                onClick={confermaOrdine}
                disabled={carrello.length === 0}
              >
                Conferma Ordine
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Webshop; 