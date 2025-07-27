import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as IncassoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../../lib/magazzinoEvents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pagamenti-tabpanel-${index}`}
      aria-labelledby={`pagamenti-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function GestionePagamenti() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dati fornitori e pagamenti
  const [statisticheFornitori, setStatisticheFornitori] = useState<any>(null);
  const [statisticheClienti, setStatisticheClienti] = useState<any>(null);
  
  // Dialog gestione pagamento
  const [dialogPagamento, setDialogPagamento] = useState({
    open: false,
    fattura: null as any,
    tipo: 'pagamento' as 'pagamento' | 'incasso'
  });
  
  // Form pagamento
  const [formPagamento, setFormPagamento] = useState({
    stato: 'pagata',
    data: new Date().toISOString().split('T')[0],
    metodo: 'bonifico',
    note: ''
  });

  const emitter = useMagazzinoEmitter();

  // Event listeners per aggiornamento real-time
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 GestionePagamenti: Fattura creata - ricarico dati');
    loadDati();
  });

  useMagazzinoEvent('acquisto_completato', () => {
    console.log('🔄 GestionePagamenti: Acquisto completato - ricarico fornitori');
    loadDati();
  });

  useMagazzinoEvent('vendita_completata', () => {
    console.log('🔄 GestionePagamenti: Vendita completata - ricarico clienti');
    loadDati();
  });

  useEffect(() => {
    loadDati();
  }, []);

  const loadDati = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [fornitoriData, clientiData] = await Promise.all([
        apiService.getStatisticheFornitoriDettagliato(),
        apiService.getStatisticheClientiDettagliato()
      ]);
      
      setStatisticheFornitori(fornitoriData);
      setStatisticheClienti(clientiData);
      
      console.log('✅ Dati pagamenti caricati:', {
        fornitori: fornitoriData.fornitori.length,
        clienti: clientiData.clienti.length
      });
      
    } catch (err: any) {
      console.error('❌ Errore caricamento pagamenti:', err);
      setError('Errore nel caricamento: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGestisciPagamento = (fattura: any, tipo: 'pagamento' | 'incasso') => {
    setDialogPagamento({
      open: true,
      fattura,
      tipo
    });
    setFormPagamento({
      stato: 'pagata',
      data: new Date().toISOString().split('T')[0],
      metodo: tipo === 'pagamento' ? 'bonifico' : 'contanti',
      note: ''
    });
  };

  const handleSalvaPagamento = async () => {
    try {
      const { fattura, tipo } = dialogPagamento;
      
      if (tipo === 'pagamento') {
        await apiService.aggiornaStatoPagamento(fattura.id, {
          stato: formPagamento.stato as any,
          data_pagamento: formPagamento.data,
          metodo_pagamento: formPagamento.metodo,
          note: formPagamento.note
        });
      } else {
        await apiService.aggiornaStatoIncasso(fattura.id, {
          stato: formPagamento.stato as any,
          data_incasso: formPagamento.data,
          metodo_incasso: formPagamento.metodo,
          note: formPagamento.note
        });
      }
      
      // Emetti eventi di aggiornamento completa
      if (tipo === 'pagamento') {
        emitter.emitFornitoreAggiornato(fattura.fornitore_id);
        emitter.emitAcquistoCompletato(fattura.id, fattura.importo);
      } else {
        emitter.emitClienteAggiornato(fattura.cliente_id);
        emitter.emitVenditaCompletata(fattura.id, fattura.importo);
      }
      
      emitter.emitStatisticheAggiornate('contabilita');
      emitter.emitSyncRichiesta('GestionePagamenti');
      
      setDialogPagamento({ open: false, fattura: null, tipo: 'pagamento' });
      loadDati();
      
    } catch (err: any) {
      setError('Errore nel salvataggio: ' + (err.message || err));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'pagata': return 'success';
      case 'emessa': return 'warning';
      case 'scaduta': return 'error';
      default: return 'default';
    }
  };

  if (loading && !statisticheFornitori) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        💰 Gestione Pagamenti e Incassi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, v) => setCurrentTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PaymentIcon />} 
            label="Pagamenti Fornitori" 
            iconPosition="start"
          />
          <Tab 
            icon={<IncassoIcon />} 
            label="Incassi Clienti" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* FORNITORI - Pagamenti */}
      <TabPanel value={currentTab} index={0}>
        {statisticheFornitori && (
          <>
            {/* Riassunto fornitori */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PaymentIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Da Pagare
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {formatCurrency(statisticheFornitori.totali.da_pagare_totale)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statisticheFornitori.fornitori.reduce((sum: number, f: any) => 
                        sum + f.statistiche.fatture_da_pagare, 0)} fatture
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WarningIcon color="error" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Scaduto
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {formatCurrency(statisticheFornitori.totali.scaduto_totale)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pagamenti in ritardo
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckIcon color="success" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Totale Pagato
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {formatCurrency(statisticheFornitori.fornitori.reduce((sum: number, f: any) => 
                        sum + f.statistiche.importo_pagato, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Anno corrente
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MoneyIcon color="info" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Fornitori Attivi
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {statisticheFornitori.totali.fornitori_attivi}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Con fatture emesse
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabella fornitori */}
            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  📋 Dettaglio Fornitori
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fornitore</TableCell>
                      <TableCell align="right">Da Pagare</TableCell>
                      <TableCell align="right">Scaduto</TableCell>
                      <TableCell align="right">Totale Speso</TableCell>
                      <TableCell>Prossima Scadenza</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statisticheFornitori.fornitori
                      .filter((f: any) => f.statistiche.fatture_da_pagare > 0)
                      .map((fornitore: any) => (
                      <TableRow key={fornitore.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {fornitore.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fornitore.statistiche.totale_fatture} fatture totali
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="warning.main">
                            {formatCurrency(fornitore.statistiche.importo_da_pagare)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fornitore.statistiche.fatture_da_pagare} fatture
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {fornitore.statistiche.importo_scaduto > 0 && (
                            <Typography variant="body2" fontWeight={600} color="error.main">
                              {formatCurrency(fornitore.statistiche.importo_scaduto)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(fornitore.statistiche.totale_speso)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {fornitore.statistiche.prossima_scadenza && (
                            <Stack>
                              <Typography variant="body2" fontWeight={600}>
                                {fornitore.statistiche.prossima_scadenza.numero}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(fornitore.statistiche.prossima_scadenza.scadenza).toLocaleDateString('it-IT')}
                              </Typography>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleGestisciPagamento(
                              fornitore.statistiche.prossima_scadenza, 
                              'pagamento'
                            )}
                            disabled={!fornitore.statistiche.prossima_scadenza}
                          >
                            Gestisci Pagamento
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* CLIENTI - Incassi */}
      <TabPanel value={currentTab} index={1}>
        {statisticheClienti && (
          <>
            {/* Riassunto clienti */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IncassoIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Da Incassare
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {formatCurrency(statisticheClienti.totali.da_incassare_totale)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statisticheClienti.clienti.reduce((sum: number, c: any) => 
                        sum + c.statistiche.fatture_da_incassare, 0)} fatture
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WarningIcon color="error" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Scaduto
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {formatCurrency(statisticheClienti.totali.scaduto_totale)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Incassi in ritardo
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckIcon color="success" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Totale Incassato
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {formatCurrency(statisticheClienti.clienti.reduce((sum: number, c: any) => 
                        sum + c.statistiche.importo_incassato, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Anno corrente
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MoneyIcon color="info" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Clienti Attivi
                      </Typography>
                    </Stack>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {statisticheClienti.totali.clienti_attivi}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Con fatture emesse
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabella clienti */}
            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  📋 Dettaglio Clienti
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Da Incassare</TableCell>
                      <TableCell align="right">Scaduto</TableCell>
                      <TableCell align="right">Totale Venduto</TableCell>
                      <TableCell>Prossima Scadenza</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statisticheClienti.clienti
                      .filter((c: any) => c.statistiche.fatture_da_incassare > 0)
                      .map((cliente: any) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {cliente.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cliente.statistiche.totale_fatture} fatture totali
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="info.main">
                            {formatCurrency(cliente.statistiche.importo_da_incassare)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cliente.statistiche.fatture_da_incassare} fatture
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {cliente.statistiche.importo_scaduto > 0 && (
                            <Typography variant="body2" fontWeight={600} color="error.main">
                              {formatCurrency(cliente.statistiche.importo_scaduto)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(cliente.statistiche.totale_venduto)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {cliente.statistiche.prossima_scadenza && (
                            <Stack>
                              <Typography variant="body2" fontWeight={600}>
                                {cliente.statistiche.prossima_scadenza.numero}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(cliente.statistiche.prossima_scadenza.scadenza).toLocaleDateString('it-IT')}
                              </Typography>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleGestisciPagamento(
                              cliente.statistiche.prossima_scadenza, 
                              'incasso'
                            )}
                            disabled={!cliente.statistiche.prossima_scadenza}
                          >
                            Gestisci Incasso
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* Dialog Gestione Pagamento/Incasso */}
      <Dialog 
        open={dialogPagamento.open} 
        onClose={() => setDialogPagamento({ open: false, fattura: null, tipo: 'pagamento' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogPagamento.tipo === 'pagamento' ? '💰 Gestisci Pagamento' : '💶 Gestisci Incasso'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Fattura: <strong>{dialogPagamento.fattura?.numero}</strong><br/>
              Importo: <strong>{formatCurrency(dialogPagamento.fattura?.importo || 0)}</strong>
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={formPagamento.stato}
                onChange={(e) => setFormPagamento(prev => ({ ...prev, stato: e.target.value }))}
                label="Stato"
              >
                <MenuItem value="pagata">
                  {dialogPagamento.tipo === 'pagamento' ? 'Pagata' : 'Incassata'}
                </MenuItem>
                <MenuItem value="emessa">In Sospeso</MenuItem>
                <MenuItem value="scaduta">Scaduta</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="date"
              label={dialogPagamento.tipo === 'pagamento' ? 'Data Pagamento' : 'Data Incasso'}
              value={formPagamento.data}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, data: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Metodo</InputLabel>
              <Select
                value={formPagamento.metodo}
                onChange={(e) => setFormPagamento(prev => ({ ...prev, metodo: e.target.value }))}
                label="Metodo"
              >
                <MenuItem value="bonifico">Bonifico</MenuItem>
                <MenuItem value="contanti">Contanti</MenuItem>
                <MenuItem value="carta">Carta</MenuItem>
                <MenuItem value="assegno">Assegno</MenuItem>
                <MenuItem value="altro">Altro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Note"
              value={formPagamento.note}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, note: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogPagamento({ open: false, fattura: null, tipo: 'pagamento' })}
          >
            Annulla
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSalvaPagamento}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 