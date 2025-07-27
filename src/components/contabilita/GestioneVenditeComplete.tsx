import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Avatar, IconButton, Menu, Grid, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Tabs, Tab, Alert, List, ListItem, ListItemText,
  Autocomplete, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  MoreVert as MoreIcon, PointOfSale as VenditeIcon,
  Receipt as FatturaIcon, Payment as IncassoIcon,
  Person as ClienteIcon, TrendingUp as TrendingUpIcon,
  CheckCircle as PagataIcon, Schedule as InAttesaIcon,
  Warning as ScadutaIcon, Inventory as ProdottoIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface Cliente {
  id: string;
  ragioneSociale: string;
  partitaIva?: string;
  indirizzo: string;
  citta: string;
  telefono?: string;
  email?: string;
  tipoCliente: 'privato' | 'azienda' | 'rivenditore';
  scontoAbituale?: number;
}

interface ProdottoVendita {
  id: string;
  nome: string;
  categoria: string;
  prezzoUnitario: number;
  giacenza: number;
  unita: string;
}

interface RigaFatturaVendita {
  prodottoId: string;
  nomeProdotto: string;
  quantita: number;
  prezzoUnitario: number;
  sconto?: number;
  totaleRiga: number;
}

interface FatturaVendita {
  id: string;
  numeroFattura: string;
  clienteId: string;
  dataFattura: string;
  dataScadenza: string;
  righe: RigaFatturaVendita[];
  subtotale: number;
  scontoTotale?: number;
  iva: number;
  totale: number;
  stato: 'bozza' | 'inviata' | 'pagata' | 'scaduta' | 'stornata';
  dataPagamento?: string;
  metodoPagamento?: string;
  note?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const statiColori = {
  bozza: { color: 'default', icon: <EditIcon /> },
  inviata: { color: 'info', icon: <FatturaIcon /> },
  pagata: { color: 'success', icon: <PagataIcon /> },
  scaduta: { color: 'error', icon: <ScadutaIcon /> },
  stornata: { color: 'warning', icon: <MoreIcon /> }
};

export default function GestioneVenditeComplete() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prodotti, setProdotti] = useState<ProdottoVendita[]>([]);
  const [fatture, setFatture] = useState<FatturaVendita[]>([]);
  const [openClienteDialog, setOpenClienteDialog] = useState(false);
  const [openFatturaDialog, setOpenFatturaDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedFattura, setSelectedFattura] = useState<FatturaVendita | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dati mock iniziali
  useEffect(() => {
    const clientiMock: Cliente[] = [
      {
        id: '1',
        ragioneSociale: 'Fioreria Bella Vista',
        partitaIva: '12345678901',
        indirizzo: 'Via Roma, 45',
        citta: 'Milano',
        telefono: '+39 02 123456',
        email: 'info@fioreriabellavista.it',
        tipoCliente: 'rivenditore',
        scontoAbituale: 15
      },
      {
        id: '2',
        ragioneSociale: 'Mario Rossi',
        indirizzo: 'Via Garibaldi, 12',
        citta: 'Roma',
        telefono: '+39 06 987654',
        tipoCliente: 'privato'
      },
      {
        id: '3',
        ragioneSociale: 'Hotel Palace',
        partitaIva: '98765432109',
        indirizzo: 'Corso Venezia, 88',
        citta: 'Milano',
        telefono: '+39 02 987654',
        email: 'acquisti@hotelpalace.it',
        tipoCliente: 'azienda',
        scontoAbituale: 8
      }
    ];

    const prodottiMock: ProdottoVendita[] = [
      { id: '1', nome: 'Rose rosse premium', categoria: 'Rose', prezzoUnitario: 2.50, giacenza: 500, unita: 'pz' },
      { id: '2', nome: 'Tulipani olandesi', categoria: 'Tulipani', prezzoUnitario: 1.80, giacenza: 300, unita: 'pz' },
      { id: '3', nome: 'Orchidee bianche', categoria: 'Orchidee', prezzoUnitario: 15.00, giacenza: 50, unita: 'vaso' },
      { id: '4', nome: 'Composizione matrimonio', categoria: 'Composizioni', prezzoUnitario: 85.00, giacenza: 10, unita: 'pz' },
      { id: '5', nome: 'Bouquet misto', categoria: 'Bouquet', prezzoUnitario: 25.00, giacenza: 25, unita: 'pz' }
    ];

    const fattureMock: FatturaVendita[] = [
      {
        id: '1',
        numeroFattura: 'FV-2024-001',
        clienteId: '1',
        dataFattura: '2024-01-15',
        dataScadenza: '2024-02-14',
        righe: [
          {
            prodottoId: '1',
            nomeProdotto: 'Rose rosse premium',
            quantita: 100,
            prezzoUnitario: 2.50,
            sconto: 15,
            totaleRiga: 212.50
          },
          {
            prodottoId: '2',
            nomeProdotto: 'Tulipani olandesi',
            quantita: 50,
            prezzoUnitario: 1.80,
            sconto: 15,
            totaleRiga: 76.50
          }
        ],
        subtotale: 289.00,
        scontoTotale: 15,
        iva: 22,
        totale: 352.58,
        stato: 'pagata',
        dataPagamento: '2024-02-10',
        metodoPagamento: 'bonifico'
      },
      {
        id: '2',
        numeroFattura: 'FV-2024-002',
        clienteId: '3',
        dataFattura: '2024-01-20',
        dataScadenza: '2024-02-19',
        righe: [
          {
            prodottoId: '4',
            nomeProdotto: 'Composizione matrimonio',
            quantita: 3,
            prezzoUnitario: 85.00,
            sconto: 8,
            totaleRiga: 234.60
          }
        ],
        subtotale: 234.60,
        scontoTotale: 8,
        iva: 22,
        totale: 286.21,
        stato: 'inviata'
      }
    ];

    setClienti(clientiMock);
    setProdotti(prodottiMock);
    setFatture(fattureMock);
  }, []);

  // Calcoli statistiche
  const totaleClienti = clienti.length;
  const fattureAttive = fatture.filter(f => f.stato !== 'stornata').length;
  const fatturato = fatture
    .filter(f => f.stato === 'pagata')
    .reduce((sum, f) => sum + f.totale, 0);
  const creditiAperti = fatture
    .filter(f => f.stato === 'inviata')
    .reduce((sum, f) => sum + f.totale, 0);

  // Top clienti per fatturato
  const topClienti = clienti.map(cliente => {
    const fattureCliente = fatture.filter(f => f.clienteId === cliente.id && f.stato === 'pagata');
    const totale = fattureCliente.reduce((sum, f) => sum + f.totale, 0);
    return { ...cliente, fatturato: totale };
  }).sort((a, b) => b.fatturato - a.fatturato).slice(0, 5);

  // Prodotti più venduti
  const prodottiVenduti = prodotti.map(prodotto => {
    const quantitaVenduta = fatture
      .filter(f => f.stato === 'pagata')
      .flatMap(f => f.righe)
      .filter(r => r.prodottoId === prodotto.id)
      .reduce((sum, r) => sum + r.quantita, 0);
    return { ...prodotto, quantitaVenduta };
  }).sort((a, b) => b.quantitaVenduta - a.quantitaVenduta).slice(0, 5);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con statistiche */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          💰 Gestione Vendite e Fatturazione
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      FATTURATO
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      €{fatturato.toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      CLIENTI ATTIVI
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {totaleClienti}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ClienteIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      FATTURE ATTIVE
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="info.main">
                      {fattureAttive}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <FatturaIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      CREDITI APERTI
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="warning.main">
                      €{creditiAperti.toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <IncassoIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab icon={<FatturaIcon />} label="Fatture" iconPosition="start" />
          <Tab icon={<ClienteIcon />} label="Clienti" iconPosition="start" />
          <Tab icon={<ProdottoIcon />} label="Prodotti" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Analisi" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Fatture */}
      <TabPanel value={currentTab} index={0}>
        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenFatturaDialog(true)}
            size="large"
          >
            Nuova Fattura
          </Button>
        </Stack>

        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell><strong>Numero</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Data</strong></TableCell>
                  <TableCell><strong>Scadenza</strong></TableCell>
                  <TableCell><strong>Totale</strong></TableCell>
                  <TableCell><strong>Stato</strong></TableCell>
                  <TableCell><strong>Azioni</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fatture.map((fattura) => {
                  const cliente = clienti.find(c => c.id === fattura.clienteId);
                  const isScaduta = new Date(fattura.dataScadenza) < new Date() && fattura.stato === 'inviata';
                  
                  return (
                    <TableRow key={fattura.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {fattura.numeroFattura}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {cliente?.ragioneSociale || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cliente?.tipoCliente || ''}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(fattura.dataFattura).toLocaleDateString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={isScaduta ? 'error' : 'text.primary'}
                          fontWeight={isScaduta ? 600 : 400}
                        >
                          {new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}
                        </Typography>
                        {isScaduta && (
                          <Typography variant="caption" color="error">
                            SCADUTA
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="success.main">
                          €{fattura.totale.toLocaleString('it-IT')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fattura.righe.length} articoli
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fattura.stato}
                          size="small"
                          color={statiColori[fattura.stato].color as any}
                          icon={statiColori[fattura.stato].icon}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setSelectedId(fattura.id);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* Tab Clienti */}
      <TabPanel value={currentTab} index={1}>
        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenClienteDialog(true)}
            size="large"
          >
            Nuovo Cliente
          </Button>
        </Stack>

        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell><strong>Ragione Sociale</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Contatti</strong></TableCell>
                  <TableCell><strong>Ubicazione</strong></TableCell>
                  <TableCell><strong>Sconto</strong></TableCell>
                  <TableCell><strong>Azioni</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clienti.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      <Stack>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {cliente.ragioneSociale}
                        </Typography>
                        {cliente.partitaIva && (
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            P.IVA: {cliente.partitaIva}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.tipoCliente} 
                        size="small"
                        variant="outlined"
                        color={
                          cliente.tipoCliente === 'rivenditore' ? 'primary' :
                          cliente.tipoCliente === 'azienda' ? 'info' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {cliente.telefono && (
                          <Typography variant="caption">📞 {cliente.telefono}</Typography>
                        )}
                        {cliente.email && (
                          <Typography variant="caption">📧 {cliente.email}</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.citta}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cliente.indirizzo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {cliente.scontoAbituale ? (
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          {cliente.scontoAbituale}%
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nessuno
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedId(cliente.id);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* Tab Prodotti */}
      <TabPanel value={currentTab} index={2}>
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell><strong>Prodotto</strong></TableCell>
                  <TableCell><strong>Categoria</strong></TableCell>
                  <TableCell><strong>Prezzo</strong></TableCell>
                  <TableCell><strong>Giacenza</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prodotti.map((prodotto) => (
                  <TableRow key={prodotto.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {prodotto.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={prodotto.categoria} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        €{prodotto.prezzoUnitario.toFixed(2)}/{prodotto.unita}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prodotto.giacenza} {prodotto.unita}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prodotto.giacenza > 10 ? 'Disponibile' : 'Scorte basse'}
                        size="small"
                        color={prodotto.giacenza > 10 ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* Tab Analisi */}
      <TabPanel value={currentTab} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Top 5 Clienti per Fatturato
                </Typography>
                <List>
                  {topClienti.map((cliente, index) => (
                    <ListItem key={cliente.id}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main', mr: 2 }}>
                        {index + 1}
                      </Avatar>
                      <ListItemText
                        primary={cliente.ragioneSociale}
                        secondary={`€${cliente.fatturato.toLocaleString('it-IT')} - ${cliente.tipoCliente}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Prodotti Più Venduti
                </Typography>
                <List>
                  {prodottiVenduti.map((prodotto, index) => (
                    <ListItem key={prodotto.id}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main', mr: 2 }}>
                        {index + 1}
                      </Avatar>
                      <ListItemText
                        primary={prodotto.nome}
                        secondary={`${prodotto.quantitaVenduta} ${prodotto.unita} vendute - ${prodotto.categoria}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Menu azioni */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          // Logica per modificare basata sul tab corrente
          setMenuAnchor(null);
        }}>
          <EditIcon sx={{ mr: 1 }} /> Modifica
        </MenuItem>
        <MenuItem 
          onClick={() => setMenuAnchor(null)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Elimina
        </MenuItem>
      </Menu>

      {/* Dialogs placeholder */}
      {/* ClienteDialog e FatturaDialog andrebbero implementati qui */}
    </Box>
  );
} 