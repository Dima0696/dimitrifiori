import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Paper, Stack, Chip, CircularProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  LocalAtm as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../../lib/magazzinoEvents';

interface FatturaSpesa {
  id: number;
  numero: string;
  data: string;
  scadenza?: string;
  totale: number;
  stato: string;
  fornitore_nome: string;
  note?: string;
}

export default function GestioneSpeseGenerali() {
  const [fatture, setFatture] = useState<FatturaSpesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistiche, setStatistiche] = useState({
    totale_spese: 0,
    spese_pagate: 0,
    spese_da_pagare: 0,
    spese_scadute: 0
  });

  const emitter = useMagazzinoEmitter();

  // Event listeners per aggiornamento real-time
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 GestioneSpeseGenerali: Fattura creata - ricarico spese');
    loadSpese();
  });

  useMagazzinoEvent('acquisto_completato', () => {
    console.log('🔄 GestioneSpeseGenerali: Acquisto completato - ricarico spese');
    loadSpese();
  });

  useMagazzinoEvent('statistiche_aggiornate', (data) => {
    if (data.tipo === 'contabilita' || data.tipo === 'acquisti') {
      console.log('🔄 GestioneSpeseGenerali: Statistiche aggiornate - ricarico');
      loadSpese();
    }
  });

  useEffect(() => {
    loadSpese();
  }, []);

  const loadSpese = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Caricamento spese generali...');
      
      // Carica fatture di acquisto (= spese aziendali)
      const [fattureAcquisto, fornitori] = await Promise.all([
        apiService.getFatture('acquisto'),
        apiService.getFornitori()
      ]);
      
      console.log('📄 Fatture acquisto caricate:', fattureAcquisto.length);
      
      // Mappa fatture con nomi fornitori
      const speseMappate = fattureAcquisto.map((fattura: any) => {
        const fornitore = fornitori.find((f: any) => f.id === fattura.fornitore_id);
        return {
          id: fattura.id,
          numero: fattura.numero,
          data: fattura.data,
          scadenza: fattura.scadenza,
          totale: fattura.totale || 0,
          stato: fattura.stato || 'emessa',
          fornitore_nome: fornitore?.nome || 'Fornitore sconosciuto',
          note: fattura.note
        };
      });
      
      setFatture(speseMappate);
      
      // Calcola statistiche
      const stats = {
        totale_spese: speseMappate.reduce((sum, s) => sum + s.totale, 0),
        spese_pagate: speseMappate.filter(s => s.stato === 'pagata').length,
        spese_da_pagare: speseMappate.filter(s => s.stato === 'emessa').length,
        spese_scadute: speseMappate.filter(s => {
          if (!s.scadenza || s.stato === 'pagata') return false;
          return new Date(s.scadenza) < new Date();
        }).length
      };
      
      setStatistiche(stats);
      
      console.log('✅ Spese generali caricate:', {
        fatture: speseMappate.length,
        totale: stats.totale_spese,
        da_pagare: stats.spese_da_pagare
      });
      
    } catch (err: any) {
      console.error('❌ Errore caricamento spese:', err);
      setError('Errore nel caricamento delle spese: ' + (err.message || err));
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

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'pagata': return 'success';
      case 'emessa': return 'warning';
      case 'scaduta': return 'error';
      default: return 'default';
    }
  };

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'pagata': return 'Pagata';
      case 'emessa': return 'Da Pagare';
      case 'scaduta': return 'Scaduta';
      default: return stato;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        💰 Spese Generali
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Visualizzazione delle fatture di acquisto come spese aziendali
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {fatture.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6">
              📋 Nessuna spesa registrata
            </Typography>
            <Typography variant="body2">
              Le spese verranno automaticamente visualizzate qui quando inserisci fatture di acquisto nella sezione "Inserimento Fattura".
            </Typography>
            <Typography variant="body2">
              <strong>Come funziona:</strong> Ogni fattura di acquisto diventa automaticamente una spesa aziendale in questa sezione.
            </Typography>
          </Stack>
        </Alert>
      ) : (
        <>
          {/* Statistiche riassuntive */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Totale Spese
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {formatCurrency(statistiche.totale_spese)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {fatture.length} fatture
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
                      Pagate
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {statistiche.spese_pagate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Spese saldate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <WarningIcon color="warning" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Da Pagare
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {statistiche.spese_da_pagare}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In sospeso
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
                      Scadute
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {statistiche.spese_scadute}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Urgenti
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabella spese */}
          <Paper>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon />
                <Typography variant="h6" fontWeight={600}>
                  📋 Dettaglio Spese (Fatture Acquisto)
                </Typography>
              </Stack>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fattura</TableCell>
                    <TableCell>Fornitore</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Scadenza</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fatture.map((spesa) => (
                    <TableRow key={spesa.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <BusinessIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {spesa.numero}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {spesa.fornitore_nome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(spesa.data).toLocaleDateString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {spesa.scadenza ? (
                          <Typography variant="body2">
                            {new Date(spesa.scadenza).toLocaleDateString('it-IT')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non specificata
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(spesa.totale)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatoLabel(spesa.stato)}
                          color={getStatoColor(spesa.stato) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {spesa.note || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
} 