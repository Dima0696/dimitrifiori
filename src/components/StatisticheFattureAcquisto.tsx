import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Stack, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';

interface StatisticheFattureAcquisto {
  totale_fatture: number;
  totale_importo: number;
  media_importo: number;
  fatture_mese: number;
  importo_mese: number;
  top_fornitori: Array<{
    fornitore: string;
    totale_importo: number;
    numero_fatture: number;
  }>;
  top_varieta: Array<{
    varieta: string;
    quantita_totale: number;
    importo_totale: number;
  }>;
  trend_mensile: Array<{
    mese: string;
    numero_fatture: number;
    importo_totale: number;
  }>;
}

export default function StatisticheFattureAcquisto() {
  const [statistiche, setStatistiche] = useState<StatisticheFattureAcquisto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInizio, setDataInizio] = useState<string>('');
  const [dataFine, setDataFine] = useState<string>('');
  const [fornitori, setFornitori] = useState<any[]>([]);
  const [fornitoreSelezionato, setFornitoreSelezionato] = useState<number | ''>('');

  const emitter = useMagazzinoEmitter();

  // Event listeners per aggiornamento real-time
  useMagazzinoEvent('fattura_creata', (event) => {
    console.log('🔄 StatisticheFattureAcquisto: Fattura creata - ricarico statistiche');
    loadStatistiche();
  });

  useMagazzinoEvent('acquisto_completato', (event) => {
    console.log('🔄 StatisticheFattureAcquisto: Acquisto completato - aggiorno dati');
    loadStatistiche();
  });

  useMagazzinoEvent('fornitore_aggiornato', (event) => {
    console.log('🔄 StatisticheFattureAcquisto: Fornitore aggiornato - ricarico fornitori');
    loadFornitori();
    loadStatistiche();
  });

  useMagazzinoEvent('statistiche_aggiornate', (event) => {
    if (event.data?.tipo === 'acquisto' || !event.data?.tipo) {
      console.log('🔄 StatisticheFattureAcquisto: Statistiche globali aggiornate');
      loadStatistiche();
    }
  });

  useEffect(() => {
    loadFornitori();
    loadStatistiche();
  }, []);

  const loadFornitori = async () => {
    try {
      const data = await apiService.getFornitori();
      setFornitori(data);
    } catch (err) {
      console.error('Errore caricamento fornitori:', err);
    }
  };

  const loadStatistiche = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (dataInizio) params.dataInizio = dataInizio;
      if (dataFine) params.dataFine = dataFine;
      if (fornitoreSelezionato) params.fornitoreId = fornitoreSelezionato;

      const data = await apiService.getStatisticheFattureAcquisto(
        params.dataInizio,
        params.dataFine,
        params.fornitoreId
      );
      setStatistiche(data);
    } catch (err: any) {
      setError('Errore nel caricamento delle statistiche: ' + (err.message || err));
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num);
  };

  if (loading && !statistiche) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !statistiche) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Statistiche Fatture Acquisto</Typography>
          <Button variant="contained" onClick={loadStatistiche} disabled={loading}>
            Aggiorna Statistiche
          </Button>
        </Box>

        {/* Filtri */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Data Inizio"
                type="date"
                value={dataInizio}
                onChange={(e) => setDataInizio(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Data Fine"
                type="date"
                value={dataFine}
                onChange={(e) => setDataFine(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={fornitoreSelezionato}
                  onChange={(e) => setFornitoreSelezionato(e.target.value)}
                  label="Fornitore"
                >
                  <MenuItem value="">Tutti i fornitori</MenuItem>
                  {fornitori.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" onClick={loadStatistiche} fullWidth>
                Filtra
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {statistiche && (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Totale Fatture
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {formatNumber(statistiche.totale_fatture)}
                        </Typography>
                      </Box>
                      <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Importo Totale
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {formatCurrency(statistiche.totale_importo)}
                        </Typography>
                      </Box>
                      <AttachMoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Media per Fattura
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {formatCurrency(statistiche.media_importo)}
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Fatture Mese
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {formatNumber(statistiche.fatture_mese)}
                        </Typography>
                      </Box>
                      <TrendingDownIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabelle dettagliate */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Top Fornitori
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fornitore</TableCell>
                        <TableCell align="right">Fatture</TableCell>
                        <TableCell align="right">Importo Totale</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistiche.top_fornitori.map((fornitore, index) => (
                        <TableRow key={index}>
                          <TableCell>{fornitore.fornitore}</TableCell>
                          <TableCell align="right">{fornitore.numero_fatture}</TableCell>
                          <TableCell align="right">{formatCurrency(fornitore.totale_importo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Top Varietà
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Varietà</TableCell>
                        <TableCell align="right">Quantità</TableCell>
                        <TableCell align="right">Importo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistiche.top_varieta.map((varieta, index) => (
                        <TableRow key={index}>
                          <TableCell>{varieta.varieta}</TableCell>
                          <TableCell align="right">{formatNumber(varieta.quantita_totale)}</TableCell>
                          <TableCell align="right">{formatCurrency(varieta.importo_totale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>

            {/* Trend mensile */}
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Trend Mensile
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mese</TableCell>
                    <TableCell align="right">Numero Fatture</TableCell>
                    <TableCell align="right">Importo Totale</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statistiche.trend_mensile.map((trend, index) => (
                    <TableRow key={index}>
                      <TableCell>{trend.mese}</TableCell>
                      <TableCell align="right">{trend.numero_fatture}</TableCell>
                      <TableCell align="right">{formatCurrency(trend.importo_totale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Paper>
    </Box>
  );
} 