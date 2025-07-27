import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Tab, Tabs, 
  Paper, Stack, Alert, Divider
} from '@mui/material';
import {
  AccountBalance as ContabilitaIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  MonetizationOn as MoneyIcon,
  LocalShipping as TrasportoIcon,
  Assessment as TasseIcon,
  TrendingUp as ProfittiIcon,
  Business as FornitoriIcon,
  PointOfSale as VenditeIcon,
  ShowChart as AnalisiIcon
} from '@mui/icons-material';
import GestioneSpeseGenerali from './contabilita/GestioneSpeseGenerali';
import GestionePagamenti from './contabilita/GestionePagamenti';
import GestioneSpeseTrasportoComplete from './contabilita/GestioneSpeseTrasportoComplete';
import GestioneTasseComplete from './contabilita/GestioneTasseComplete';
import CalcoloProfittiPerditeComplete from './contabilita/CalcoloProfittiPerditeComplete';
import GestioneFornitoriContabiliComplete from './contabilita/GestioneFornitoriContabiliComplete';
import GestioneVenditeComplete from './contabilita/GestioneVenditeComplete';
import AnalisiFinanziariaComplete from './contabilita/AnalisiFinanziariaComplete';
import { apiService } from '../lib/apiService';
import { useMagazzinoEvent } from '../lib/magazzinoEvents';

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
      id={`contabilita-tabpanel-${index}`}
      aria-labelledby={`contabilita-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContabilitaReale() {
  const [currentTab, setCurrentTab] = useState(0);
  const [riassunto, setRiassunto] = useState({
    fatture_acquisto: 0,
    fatture_vendita: 0,
    importo_acquisti: 0,
    importo_vendite: 0,
    da_pagare: 0,
    da_incassare: 0
  });

  // Event listeners per aggiornamento dati
  useMagazzinoEvent('fattura_creata', () => {
    loadRiassunto();
  });

  useEffect(() => {
    loadRiassunto();
  }, []);

  const loadRiassunto = async () => {
    try {
      const [fattureAcquisto, fattureVendita] = await Promise.all([
        apiService.getFatture('acquisto'),
        apiService.getFatture('vendita')
      ]);

      const stats = {
        fatture_acquisto: fattureAcquisto.length,
        fatture_vendita: fattureVendita.length,
        importo_acquisti: fattureAcquisto.reduce((sum: number, f: any) => sum + (f.totale || 0), 0),
        importo_vendite: fattureVendita.reduce((sum: number, f: any) => sum + (f.totale || 0), 0),
        da_pagare: fattureAcquisto.filter((f: any) => f.stato === 'emessa').length,
        da_incassare: fattureVendita.filter((f: any) => f.stato === 'emessa').length
      };

      setRiassunto(stats);
    } catch (error) {
      console.error('Errore caricamento riassunto contabilità:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <ContabilitaIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h3" fontWeight={700} color="primary.main">
            💼 Contabilità
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestione finanziaria basata sui dati reali del tuo gestionale
          </Typography>
        </Box>
      </Stack>

      {/* Riassunto veloce */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          📊 Situazione Attuale
        </Typography>
        <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
          <Stack alignItems="center">
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {riassunto.fatture_acquisto}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fatture Acquisto
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(riassunto.importo_acquisti)}
            </Typography>
          </Stack>
          
          <Stack alignItems="center">
            <Typography variant="h4" fontWeight={700} color="success.main">
              {riassunto.fatture_vendita}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fatture Vendita
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(riassunto.importo_vendite)}
            </Typography>
          </Stack>
          
          <Stack alignItems="center">
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {riassunto.da_pagare}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Da Pagare
            </Typography>
          </Stack>
          
          <Stack alignItems="center">
            <Typography variant="h4" fontWeight={700} color="info.main">
              {riassunto.da_incassare}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Da Incassare
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {riassunto.fatture_acquisto === 0 && riassunto.fatture_vendita === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h6">
              🏁 Benvenuto nella Contabilità!
            </Typography>
            <Typography variant="body1">
              Questo modulo mostra i dati finanziari basati sulle fatture reali che inserisci nel gestionale.
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>
                <Typography variant="body2">
                  <strong>Spese Generali:</strong> Visualizza automaticamente le fatture di acquisto come spese aziendali
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Pagamenti/Incassi:</strong> Gestisci i pagamenti ai fornitori e gli incassi dai clienti
                </Typography>
              </li>
            </Box>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Per iniziare:</strong> Vai in "Inserimento Fattura" per aggiungere la tua prima fattura di acquisto.
            </Typography>
          </Stack>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<ReceiptIcon />} 
            label="Spese Generali" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Pagamenti/Incassi" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrasportoIcon />} 
            label="Spese Trasporto" 
            iconPosition="start"
          />
          <Tab 
            icon={<FornitoriIcon />} 
            label="Fornitori" 
            iconPosition="start"
          />
          <Tab 
            icon={<VenditeIcon />} 
            label="Vendite" 
            iconPosition="start"
          />
          <Tab 
            icon={<TasseIcon />} 
            label="Tasse" 
            iconPosition="start"
          />
          <Tab 
            icon={<ProfittiIcon />} 
            label="Profitti/Perdite" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalisiIcon />} 
            label="Analisi Finanziaria" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenuto tabs */}
      <TabPanel value={currentTab} index={0}>
        <GestioneSpeseGenerali />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <GestionePagamenti />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <GestioneSpeseTrasportoComplete />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <GestioneFornitoriContabiliComplete />
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        <GestioneVenditeComplete />
      </TabPanel>

      <TabPanel value={currentTab} index={5}>
        <GestioneTasseComplete />
      </TabPanel>

      <TabPanel value={currentTab} index={6}>
        <CalcoloProfittiPerditeComplete />
      </TabPanel>

      <TabPanel value={currentTab} index={7}>
        <AnalisiFinanziariaComplete />
      </TabPanel>
    </Box>
  );
} 