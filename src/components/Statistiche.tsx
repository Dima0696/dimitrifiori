import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Stack, Divider, Avatar, Button,
  useTheme, alpha
} from '@mui/material';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InventoryIcon from '@mui/icons-material/Inventory';
import EuroIcon from '@mui/icons-material/Euro';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import BusinessIcon from '@mui/icons-material/Business';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { apiService } from '../lib/apiService';

interface StatisticheData {
  // Magazzino
  totaleGiacenze: number;
  valoreMagazzino: number;
  valoreVendita: number;
  margineAssoluto: number;
  marginePercentuale: number;
  varietaAttive: number;
  varietaEsaurite: number;
  scortaMinima: number;
  
  // Vendite
  totaleVendite: number;
  fattureVendita: number;
  clientiAttivi: number;
  ricavoMedio: number;
  
  // Acquisti
  totaleAcquisti: number;
  fattureAcquisto: number;
  fornitoriAttivi: number;
  costoMedio: number;
  
  // Top performers
  topVarieta: Array<{
    nome: string;
    gruppo: string;
    quantita: number;
    valore: number;
    margine: number;
  }>;
  
  topClienti: Array<{
    nome: string;
    fatture: number;
    totale: number;
  }>;
  
  topFornitori: Array<{
    nome: string;
    fatture: number;
    totale: number;
  }>;
}

export default function Statistiche() {
  const theme = useTheme();
  const [statistiche, setStatistiche] = useState<StatisticheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistiche();
  }, []);

  const loadStatistiche = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica tutti i dati necessari in parallelo
      const [giacenze, fatture, clienti, fornitori] = await Promise.all([
        apiService.getGiacenze(),
        apiService.getFatture(),
        apiService.getClienti(),
        apiService.getFornitori()
      ]);

      // Calcola statistiche magazzino
      const giacenzeAttive = giacenze.filter(g => g.quantita > 0);
      const totaleGiacenze = giacenzeAttive.reduce((sum, g) => sum + g.quantita, 0);
      const valoreMagazzino = giacenzeAttive.reduce((sum, g) => sum + (g.quantita * g.prezzo_acquisto), 0);
      const valoreVendita = giacenzeAttive.reduce((sum, g) => sum + (g.quantita * (g.prezzo_vendita || 0)), 0);
      const margineAssoluto = valoreVendita - valoreMagazzino;
      const marginePercentuale = valoreMagazzino > 0 ? (margineAssoluto / valoreMagazzino * 100) : 0;

      // Calcola statistiche vendite
      const fattureVendita = fatture.filter(f => f.tipo === 'vendita');
      const totaleVendite = fattureVendita.reduce((sum, f) => sum + f.totale, 0);
      const clientiUnici = [...new Set(fattureVendita.map(f => f.cliente_id))];
      const ricavoMedio = fattureVendita.length > 0 ? totaleVendite / fattureVendita.length : 0;

      // Calcola statistiche acquisti
      const fattureAcquisto = fatture.filter(f => f.tipo === 'acquisto');
      const totaleAcquisti = fattureAcquisto.reduce((sum, f) => sum + f.totale, 0);
      const fornitoriUnici = [...new Set(fattureAcquisto.map(f => f.fornitore_id))];
      const costoMedio = fattureAcquisto.length > 0 ? totaleAcquisti / fattureAcquisto.length : 0;

      // Top varietà per valore
      const topVarieta = giacenzeAttive
        .map(g => ({
          nome: g.varieta_nome || 'N/A',
          gruppo: g.gruppo_nome || 'N/A',
          quantita: g.quantita,
          valore: g.quantita * g.prezzo_acquisto,
          margine: g.quantita * ((g.prezzo_vendita || 0) - g.prezzo_acquisto)
        }))
        .sort((a, b) => b.valore - a.valore)
        .slice(0, 3);

      // Top clienti per fatturato
      const clientiStats = clientiUnici.map(clienteId => {
        const fattureCliente = fattureVendita.filter(f => f.cliente_id === clienteId);
        const cliente = clienti.find(c => c.id === clienteId);
        return {
          nome: cliente ? `${cliente.nome} ${cliente.cognome}`.trim() || cliente.ragione_sociale : 'Cliente sconosciuto',
          fatture: fattureCliente.length,
          totale: fattureCliente.reduce((sum, f) => sum + f.totale, 0)
        };
      }).sort((a, b) => b.totale - a.totale).slice(0, 3);

      // Top fornitori per spesa
      const fornitoriStats = fornitoriUnici.map(fornitoreId => {
        const fattureFornitore = fattureAcquisto.filter(f => f.fornitore_id === fornitoreId);
        const fornitore = fornitori.find(f => f.id === fornitoreId);
        return {
          nome: fornitore ? fornitore.nome : 'Fornitore sconosciuto',
          fatture: fattureFornitore.length,
          totale: fattureFornitore.reduce((sum, f) => sum + f.totale, 0)
        };
      }).sort((a, b) => b.totale - a.totale).slice(0, 3);

      setStatistiche({
        // Magazzino
        totaleGiacenze,
        valoreMagazzino,
        valoreVendita,
        margineAssoluto,
        marginePercentuale,
        varietaAttive: giacenzeAttive.length,
        varietaEsaurite: giacenze.filter(g => g.quantita === 0).length,
        scortaMinima: giacenzeAttive.filter(g => g.quantita <= 10).length,
        
        // Vendite
        totaleVendite,
        fattureVendita: fattureVendita.length,
        clientiAttivi: clientiUnici.length,
        ricavoMedio,
        
        // Acquisti
        totaleAcquisti,
        fattureAcquisto: fattureAcquisto.length,
        fornitoriAttivi: fornitoriUnici.length,
        costoMedio,
        
        // Top performers
        topVarieta,
        topClienti: clientiStats,
        topFornitori: fornitoriStats
      });

    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString('it-IT');

  // Componente compatto per KPI
  const KpiCard = ({ title, value, subtitle, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  }) => (
    <Card sx={{ 
      height: 140,
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} color={`${color}.main`} sx={{ lineHeight: 1.2, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 36, height: 36 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  // Componente compatto per sezioni
  const CompactCard = ({ title, children, height = 280 }: { 
    title: string; 
    children: React.ReactNode; 
    height?: number;
  }) => (
    <Paper sx={{ 
      height,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s' }
    }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>
      <Box flex={1} sx={{ overflow: 'hidden' }}>
        {children}
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">Caricamento statistiche...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!statistiche) {
    return <Alert severity="warning" sx={{ mb: 2 }}>Nessun dato disponibile</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header compatto */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            📊 Statistiche
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard completa • Dati in tempo reale
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadStatistiche}
          size="small"
        >
          Aggiorna
        </Button>
      </Stack>

      {/* KPI principali - 6 cards in 2 righe */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Valore Magazzino"
            value={formatCurrency(statistiche.valoreMagazzino)}
            subtitle={`${statistiche.varietaAttive} varietà`}
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Potenziale Vendita"
            value={formatCurrency(statistiche.valoreVendita)}
            subtitle={`+${formatCurrency(statistiche.margineAssoluto)}`}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Margine %"
            value={`${statistiche.marginePercentuale.toFixed(1)}%`}
            subtitle="Markup 60%"
            icon={<AssessmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Vendite Totali"
            value={formatCurrency(statistiche.totaleVendite)}
            subtitle={`${statistiche.fattureVendita} fatture`}
            icon={<ShoppingCartIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Clienti Attivi"
            value={statistiche.clientiAttivi}
            subtitle={`Media: ${formatCurrency(statistiche.ricavoMedio)}`}
            icon={<PeopleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            title="Fornitori"
            value={statistiche.fornitoriAttivi}
            subtitle={`Spesa: ${formatCurrency(statistiche.totaleAcquisti)}`}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Sezioni analitiche - 6 cards in griglia */}
      <Grid container spacing={2}>
        {/* Stato Magazzino */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="📦 Stato Magazzino">
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Attive</Typography>
                  <Chip label={statistiche.varietaAttive} color="success" size="small" />
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={85}
                  sx={{ height: 6, borderRadius: 3 }}
                  color="success"
                />
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Scorta Bassa</Typography>
                  <Chip label={statistiche.scortaMinima} color="warning" size="small" />
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={25}
                  sx={{ height: 6, borderRadius: 3 }}
                  color="warning"
                />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Esaurite</Typography>
                  <Chip label={statistiche.varietaEsaurite} color="error" size="small" />
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={15}
                  sx={{ height: 6, borderRadius: 3 }}
                  color="error"
                />
              </Box>

              <Divider />
              
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {formatNumber(statistiche.totaleGiacenze)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unità Totali
                </Typography>
              </Box>
            </Stack>
          </CompactCard>
        </Grid>

        {/* Performance Finanziarie */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="💰 Performance">
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="success.main" fontWeight={600}>ENTRATE</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {formatCurrency(statistiche.totaleVendite)}
                </Typography>
                <Typography variant="caption">
                  {statistiche.fattureVendita} fatture
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="error.main" fontWeight={600}>USCITE</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">
                  {formatCurrency(statistiche.totaleAcquisti)}
                </Typography>
                <Typography variant="caption">
                  {statistiche.fattureAcquisto} fatture
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="primary.main" fontWeight={600}>BILANCIO</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(statistiche.totaleVendite - statistiche.totaleAcquisti)}
                </Typography>
                <Typography variant="caption">
                  Utile operativo
                </Typography>
              </Box>
            </Stack>
          </CompactCard>
        </Grid>

        {/* Top Varietà */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="🌸 Top Varietà">
            <Stack spacing={1}>
              {statistiche.topVarieta.map((varieta, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: '0.8rem' }}>
                    {index + 1}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {varieta.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {varieta.gruppo}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatCurrency(varieta.valore)}
                    </Typography>
                    <Chip 
                      label={varieta.quantita} 
                      size="small" 
                      color={varieta.quantita > 50 ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </CompactCard>
        </Grid>

        {/* Top Clienti */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="👥 Top Clienti">
            <Stack spacing={1}>
              {statistiche.topClienti.map((cliente, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.05) }
                }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                    <PeopleIcon fontSize="small" />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {cliente.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cliente.fatture} fatture
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {formatCurrency(cliente.totale)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CompactCard>
        </Grid>

        {/* Top Fornitori */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="🏢 Top Fornitori">
            <Stack spacing={1}>
              {statistiche.topFornitori.map((fornitore, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05) }
                }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                    <BusinessIcon fontSize="small" />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {fornitore.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fornitore.fatture} fatture
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {formatCurrency(fornitore.totale)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CompactCard>
        </Grid>

        {/* Analisi Rapida */}
        <Grid xs={12} md={6} lg={4}>
          <CompactCard title="⚡ Analisi Rapida">
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>Stock Positivo</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((statistiche.varietaAttive / (statistiche.varietaAttive + statistiche.varietaEsaurite)) * 100).toFixed(0)}% varietà disponibili
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>Attenzione Scorte</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {statistiche.scortaMinima} varietà sotto soglia
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon color="primary" />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>Fattura Media</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vendita: {formatCurrency(statistiche.ricavoMedio)}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  MARGINE POTENZIALE
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {formatCurrency(statistiche.margineAssoluto)}
                </Typography>
              </Box>
            </Stack>
          </CompactCard>
        </Grid>
      </Grid>
    </Box>
  );
} 