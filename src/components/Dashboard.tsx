import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, Stack, Button
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AttachMoney, ShoppingCart, 
  Inventory, Business, LocalShipping, Warning
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Dati dashboard
  const [statistiche, setStatistiche] = useState({
    fatture_acquisto: { totale: 0, importo: 0 },
    fatture_vendita: { totale: 0, importo: 0 },
    giacenze: { varietà: 0, valore: 0, scorta_minima: 0 },
    fornitori: { attivi: 0, pagamenti_pendenti: 0 },
    clienti: { attivi: 0, fatture_pendenti: 0 },
    movimenti_recenti: [],
    fatture_recenti: [],
    alert_sistema: []
  });

  const emitter = useMagazzinoEmitter();

  // Ascolta TUTTI gli eventi per aggiornamento real-time
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 Dashboard: Fattura creata - aggiorno statistiche');
    loadDashboardData();
  });

  useMagazzinoEvent('giacenza_aggiornata', () => {
    console.log('🔄 Dashboard: Giacenza aggiornata - aggiorno inventario');
    loadDashboardData();
  });

  useMagazzinoEvent('movimento_creato', () => {
    console.log('🔄 Dashboard: Movimento creato - aggiorno cronologia');
    loadDashboardData();
  });

  useMagazzinoEvent('vendita_completata', () => {
    console.log('🔄 Dashboard: Vendita completata - aggiorno statistiche vendite');
    loadDashboardData();
  });

  useMagazzinoEvent('acquisto_completato', () => {
    console.log('🔄 Dashboard: Acquisto completato - aggiorno statistiche acquisti');
    loadDashboardData();
  });

  useMagazzinoEvent('statistiche_aggiornate', () => {
    console.log('🔄 Dashboard: Statistiche aggiornate globalmente');
    loadDashboardData();
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Caricamento dati dashboard completo...');
      
      const [
        fattureAcquisto,
        fattureVendita, 
        giacenze,
        fornitori,
        clienti,
        movimenti,
        statisticheFattureAcquisto,
        statisticheFornitoriDettagliato,
        statisticheClientiDettagliato
      ] = await Promise.all([
        apiService.getFatture('acquisto'),
        apiService.getFatture('vendita'),
        apiService.getGiacenze(),
        apiService.getFornitori(),
        apiService.getClienti(),
        apiService.getMovimentiMagazzino(),
        apiService.getStatisticheFattureAcquisto(),
        apiService.getStatisticheFornitoriDettagliato(),
        apiService.getStatisticheClientiDettagliato()
      ]);

      // Calcola statistiche aggregate
      const stats_acquisti = {
        totale: fattureAcquisto.length,
        importo: fattureAcquisto.reduce((sum: number, f: any) => sum + (f.totale || 0), 0)
      };

      const stats_vendite = {
        totale: fattureVendita.length,
        importo: fattureVendita.reduce((sum: number, f: any) => sum + (f.totale || 0), 0)
      };

      const stats_giacenze = {
        varietà: giacenze.length,
        valore: giacenze.reduce((sum: number, g: any) => 
          sum + (Math.max(0, g.quantita || 0) * (g.prezzo_acquisto || 0)), 0),
        scorta_minima: giacenze.filter((g: any) => (g.quantita || 0) <= 10).length
      };

      const stats_fornitori = {
        attivi: statisticheFornitoriDettagliato.totali.fornitori_attivi,
        pagamenti_pendenti: statisticheFornitoriDettagliato.fornitori.reduce((sum: number, f: any) => 
          sum + f.statistiche.fatture_da_pagare, 0),
        importo_da_pagare: statisticheFornitoriDettagliato.totali.da_pagare_totale,
        importo_scaduto: statisticheFornitoriDettagliato.totali.scaduto_totale
      };

      const stats_clienti = {
        attivi: statisticheClientiDettagliato.totali.clienti_attivi,
        fatture_pendenti: statisticheClientiDettagliato.clienti.reduce((sum: number, c: any) => 
          sum + c.statistiche.fatture_da_incassare, 0),
        importo_da_incassare: statisticheClientiDettagliato.totali.da_incassare_totale,
        importo_scaduto: statisticheClientiDettagliato.totali.scaduto_totale
      };

      // Movimenti e fatture recenti (ultimi 10)
      const movimenti_recenti = movimenti
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      const fatture_recenti = [...fattureAcquisto, ...fattureVendita]
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      // Alert di sistema
      const alert_sistema = [];
      
      if (stats_giacenze.scorta_minima > 0) {
        alert_sistema.push({
          tipo: 'warning',
          messaggio: `${stats_giacenze.scorta_minima} varietà in scorta minima`,
          azione: 'Verifica magazzino'
        });
      }

      if (stats_fornitori.pagamenti_pendenti > 0) {
        alert_sistema.push({
          tipo: 'info',
          messaggio: `${stats_fornitori.pagamenti_pendenti} fatture fornitori da pagare`,
          azione: 'Verifica pagamenti'
        });
      }

      if (stats_fornitori.importo_scaduto > 0) {
        alert_sistema.push({
          tipo: 'error',
          messaggio: `${formatCurrency(stats_fornitori.importo_scaduto)} pagamenti fornitori scaduti`,
          azione: 'Pagamenti urgenti'
        });
      }

      if (stats_clienti.fatture_pendenti > 0) {
        alert_sistema.push({
          tipo: 'info',
          messaggio: `${stats_clienti.fatture_pendenti} fatture clienti da incassare`,
          azione: 'Verifica incassi'
        });
      }

      if (stats_clienti.importo_scaduto > 0) {
        alert_sistema.push({
          tipo: 'warning',
          messaggio: `${formatCurrency(stats_clienti.importo_scaduto)} incassi clienti scaduti`,
          azione: 'Solleciti urgenti'
        });
      }

      setStatistiche({
        fatture_acquisto: stats_acquisti,
        fatture_vendita: stats_vendite,
        giacenze: stats_giacenze,
        fornitori: stats_fornitori,
        clienti: stats_clienti,
        movimenti_recenti,
        fatture_recenti,
        alert_sistema
      });

      setLastUpdate(new Date());
      console.log('✅ Dashboard aggiornato con successo');
      
    } catch (err: any) {
      console.error('❌ Errore caricamento dashboard:', err);
      setError('Errore nel caricamento dei dati: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading && Object.keys(statistiche).length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 2 }}>
      {/* Header con aggiornamento */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          📊 Dashboard Gestionale
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
          </Typography>
          <Button variant="outlined" onClick={loadDashboardData} disabled={loading} size="small">
            🔄 Aggiorna
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Alert di sistema */}
      {statistiche.alert_sistema.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {statistiche.alert_sistema.map((alert, idx) => (
            <Alert 
              key={idx} 
              severity={alert.tipo as any} 
              sx={{ mb: 1 }}
              action={
                <Button size="small" color="inherit">
                  {alert.azione}
                </Button>
              }
            >
              {alert.messaggio}
            </Alert>
          ))}
        </Box>
      )}

      {/* Metriche principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Acquisti
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {statistiche.fatture_acquisto.totale}
              </Typography>
              <Typography variant="body2" color="primary.main">
                {formatCurrency(statistiche.fatture_acquisto.importo)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Vendite
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {statistiche.fatture_vendita.totale}
              </Typography>
              <Typography variant="body2" color="success.main">
                {formatCurrency(statistiche.fatture_vendita.importo)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Inventory color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Magazzino
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {statistiche.giacenze.varietà}
              </Typography>
              <Typography variant="body2" color="info.main">
                {formatCurrency(statistiche.giacenze.valore)}
              </Typography>
              {statistiche.giacenze.scorta_minima > 0 && (
                <Chip 
                  size="small" 
                  icon={<Warning />} 
                  label={`${statistiche.giacenze.scorta_minima} scorta minima`}
                  color="warning"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Business color="secondary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Fornitori/Clienti
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {statistiche.fornitori.attivi + statistiche.clienti.attivi}
              </Typography>
              <Typography variant="body2" color="secondary.main">
                {statistiche.fornitori.attivi} fornitori, {statistiche.clienti.attivi} clienti
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabelle recenti */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              🧾 Fatture Recenti
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Numero</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Importo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistiche.fatture_recenti.slice(0, 5).map((fattura: any) => (
                    <TableRow key={fattura.id}>
                      <TableCell>{fattura.numero}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={fattura.tipo}
                          color={fattura.tipo === 'vendita' ? 'success' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{new Date(fattura.data).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell align="right">{formatCurrency(fattura.totale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              📦 Movimenti Recenti
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Varietà</TableCell>
                    <TableCell align="right">Quantità</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistiche.movimenti_recenti.slice(0, 5).map((movimento: any) => (
                    <TableRow key={movimento.id}>
                      <TableCell>{new Date(movimento.data).toLocaleDateString('it-IT')}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={movimento.tipo}
                          color={
                            movimento.tipo === 'carico' ? 'success' : 
                            movimento.tipo === 'scarico' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{movimento.varieta_nome}</TableCell>
                      <TableCell align="right">{movimento.quantita}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 