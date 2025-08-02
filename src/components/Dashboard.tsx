import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, Stack, Button, useTheme, alpha, IconButton
} from '@mui/material';

// Estendi l'interfaccia Window per il timer dashboard
declare global {
  interface Window {
    dashboardUpdateTimer?: NodeJS.Timeout | null;
  }
}
import {
  TrendingUp, TrendingDown, AttachMoney, ShoppingCart, 
  Inventory, Business, LocalShipping, Warning, AccessTime,
  CalendarMonth, AddTask, Receipt, Store
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import apiService from '../lib/apiService';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const isRefreshingRef = useRef(false); // Usa ref invece di state per evitare loop
  const theme = useTheme();

  // Palette colori sobria e professionale
  const modernColors = {
    primary: '#2563eb',
    secondary: '#64748b', 
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    neutral: '#6b7280',
    light: '#f1f5f9',
    gradient1: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    gradient2: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    gradient3: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    gradient4: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassDark: 'rgba(0, 0, 0, 0.05)',
  };
  
  // Stati per i grafici
  const [chartsData, setChartsData] = useState<{
    distribuzioneProdotti: any[];
    valoriCategorie: any[];
    movimentiTrend: any[];
  }>({
    distribuzioneProdotti: [],
    valoriCategorie: [],
    movimentiTrend: []
  });
  
  // Dati dashboard
  const [statistiche, setStatistiche] = useState<{
    fatture_acquisto: { totale: number; importo: number };
    fatture_vendita: { totale: number; importo: number };
    giacenze: { varietà: number; valore: number; scorta_minima: number };
    fornitori: { attivi: number; pagamenti_pendenti: number };
    clienti: { attivi: number; fatture_pendenti: number };
    movimenti_recenti: any[];
    fatture_recenti: any[];
    alert_sistema: { tipo: string; messaggio: string; azione: string }[];
  }>({
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

  const loadDashboardData = React.useCallback(async () => {
    // Prevenire chiamate multiple simultanee
    if (isRefreshingRef.current) {
      console.log('⏳ Dashboard: Aggiornamento già in corso, saltato');
      return;
    }

    try {
      isRefreshingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔄 Caricamento dati dashboard completo...');
      
      const [
        fattureAcquisto,
        giacenze,
        fornitori,
        clienti,
        movimenti
      ] = await Promise.all([
        apiService.getFattureAcquisto(),
        apiService.getGiacenzeMagazzino(),
        apiService.getFornitori(),
        apiService.getClienti(),
        apiService.getMovimentiMagazzino()
      ]);
      
      // Usa dati fittizi per vendite (fino alla implementazione)
      const fattureVendita: any[] = [];

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
        attivi: fornitori.length,
        pagamenti_pendenti: 0, // Calcolo semplificato
        importo_da_pagare: 0,
        importo_scaduto: 0
      };

      const stats_clienti = {
        attivi: clienti.length,
        fatture_pendenti: 0, // Calcolo semplificato
        importo_da_incassare: 0,
        importo_scaduto: 0
      };

      // Movimenti e fatture recenti (ultimi 10)
      const movimenti_recenti = movimenti
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      const fatture_recenti = [...fattureAcquisto, ...fattureVendita]
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 10);

      // Alert di sistema
      const alert_sistema: { tipo: string; messaggio: string; azione: string }[] = [];
      
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

      // CALCOLA DATI PER GRAFICI REALI
      console.log('📊 Calcolo dati grafici...');
      
      // 1. Distribuzione per gruppo (Pie Chart)
      const gruppiMap = new Map();
      giacenze.forEach((g: any) => {
        const gruppo = g.gruppo_nome || 'Sconosciuto';
        const quantita = g.quantita_giacenza || 0;
        const valore = quantita * (g.prezzo_costo_finale_per_stelo || 0);
        
        if (gruppiMap.has(gruppo)) {
          gruppiMap.set(gruppo, {
            ...gruppiMap.get(gruppo),
            quantita: gruppiMap.get(gruppo).quantita + quantita,
            valore: gruppiMap.get(gruppo).valore + valore
          });
        } else {
          gruppiMap.set(gruppo, { name: gruppo, quantita, valore });
        }
      });
      
      const distribuzioneProdotti = Array.from(gruppiMap.values())
        .filter(item => item.quantita > 0)
        .sort((a, b) => b.valore - a.valore);
      
      // 2. Valori per categoria (Bar Chart)
      const valoriCategorie = distribuzioneProdotti.slice(0, 8); // Top 8
      
      // 3. Trend movimenti ultimi 7 giorni (Line Chart)
      const oggi = new Date();
      const movimentiTrend: { giorno: string; carichi: number; scarichi: number; distruzioni: number; totale: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(oggi.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        
        const movimentiGiorno = movimenti.filter((m: any) => 
          m.data && m.data.startsWith(dataStr)
        );
        
        const carichi = movimentiGiorno.filter((m: any) => m.tipo === 'carico').length;
        const scarichi = movimentiGiorno.filter((m: any) => m.tipo === 'scarico').length;
        const distruzioni = movimentiGiorno.filter((m: any) => m.tipo === 'distruzione').length;
        
        movimentiTrend.push({
          giorno: data.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          carichi,
          scarichi,
          distruzioni,
          totale: carichi + scarichi + distruzioni
        });
      }
      
      setChartsData({
        distribuzioneProdotti,
        valoriCategorie,
        movimentiTrend
      });
      
      setLastUpdate(new Date());
      console.log('✅ Dashboard e grafici aggiornati con successo');
      
    } catch (err: any) {
      console.error('❌ Errore caricamento dashboard:', err);
      setError('Errore nel caricamento dei dati: ' + (err.message || err));
    } finally {
      setLoading(false);
      isRefreshingRef.current = false; // Reset flag per permettere nuovi aggiornamenti
    }
  }, []); // NESSUNA dipendenza per evitare loop

  // Debounced update function per evitare troppe chiamate - DOPO loadDashboardData
  const debouncedUpdate = React.useCallback(() => {
    // Usa un timer con useRef per evitare conflitti
    if (!window.dashboardUpdateTimer) {
      window.dashboardUpdateTimer = setTimeout(() => {
        window.dashboardUpdateTimer = null;
        if (!isRefreshingRef.current) {
          console.log('🔄 Dashboard: Aggiornamento debounced dopo eventi');
          loadDashboardData();
        }
      }, 3000); // Attende 3 secondi prima di aggiornare
    }
  }, [loadDashboardData]);

  // Cleanup del timer al dismount
  React.useEffect(() => {
    return () => {
      if (window.dashboardUpdateTimer) {
        clearTimeout(window.dashboardUpdateTimer);
        window.dashboardUpdateTimer = null;
      }
    };
  }, []);

  // Listener consolidati con debouncing - SOLO per eventi critici
  useMagazzinoEvent('fattura_creata', () => {
    console.log('🔄 Dashboard: Fattura creata');
    debouncedUpdate();
  });

  useMagazzinoEvent('movimento_creato', () => {
    console.log('🔄 Dashboard: Movimento creato');
    debouncedUpdate();
  });

  // Listener separato per aggiornamenti manuali immediati
  useMagazzinoEvent('ricalcolo_giacenze', () => {
    console.log('🔄 Dashboard: Ricalcolo giacenze richiesto');
    if (!isRefreshingRef.current) {
      loadDashboardData();
    }
  });

  // Caricamento iniziale - SOLO UNA VOLTA
  useEffect(() => {
    loadDashboardData();
  }, []); // Nessuna dipendenza per evitare loop

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Componente Orologio Compatto per Header
  const ModernCompactClock = React.memo(() => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Timer dell'orologio isolato dal resto della dashboard
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const timeString = currentTime.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateString = currentTime.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });

    return (
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          letterSpacing: '-0.02em',
          color: modernColors.primary,
          lineHeight: 1
        }}>
          {timeString}
        </Typography>
        <Typography variant="caption" sx={{ 
          color: modernColors.neutral,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '0.7rem',
          fontWeight: 500
        }}>
          {dateString}
        </Typography>
      </Box>
    );
  });

  // Widget Compatto e Sobrio
  const CompactWidget = ({ title, value, subtitle, icon, color, delay = 0 }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Box
        sx={{
          background: modernColors.glass,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          p: 3,
          border: `1px solid ${modernColors.neutral}20`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700, 
              letterSpacing: '-0.02em',
              mb: 0.5,
              color: modernColors.primary
            }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: modernColors.neutral,
              fontWeight: 500,
              fontSize: '0.85rem'
            }}>
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ 
            background: `${color}15`,
            borderRadius: '12px',
            p: 1.5,
            color: color
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ 
          color: modernColors.neutral,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {title}
        </Typography>
      </Box>
    </motion.div>
  );

  // Widget Calendario Completo
  const CalendarioWidget = React.memo(() => {
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = oggi.getMonth();
    
    // Calcola i giorni del mese
    const primoGiorno = new Date(anno, mese, 1);
    const ultimoGiorno = new Date(anno, mese + 1, 0);
    const giorniDelMese = ultimoGiorno.getDate();
    const giornoSettimanaPrimoGiorno = primoGiorno.getDay() || 7; // 1=lunedì, 7=domenica
    
    const promemoria = [
      { giorno: oggi.getDate(), task: 'Controllo giacenze', tipo: 'warning' },
      { giorno: oggi.getDate() + 1, task: 'Ordini fornitori', tipo: 'info' },
      { giorno: 15, task: 'Inventario mensile', tipo: 'primary' },
    ];

    const giorniSettimana = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            background: modernColors.glass,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 3,
            border: `1px solid ${modernColors.neutral}20`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 600,
            color: modernColors.primary,
            textAlign: 'center'
          }}>
            📅 {oggi.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </Typography>
          
          {/* Giorni della settimana */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 1, 
            mb: 1 
          }}>
            {giorniSettimana.map((giorno) => (
              <Typography
                key={giorno}
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: modernColors.neutral,
                  py: 1
                }}
              >
                {giorno}
              </Typography>
            ))}
          </Box>
          
          {/* Griglia calendario */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 1,
            mb: 3
          }}>
            {/* Spazi vuoti per i giorni prima del primo del mese */}
            {Array.from({ length: giornoSettimanaPrimoGiorno - 1 }).map((_, index) => (
              <Box key={`empty-${index}`} />
            ))}
            
            {/* Giorni del mese */}
            {Array.from({ length: giorniDelMese }).map((_, index) => {
              const giorno = index + 1;
              const isOggi = giorno === oggi.getDate();
              const hasPromemoria = promemoria.some(p => p.giorno === giorno);
              
              return (
                <Box
                  key={giorno}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: isOggi ? 600 : 500,
                    color: isOggi ? 'white' : modernColors.neutral,
                    background: isOggi ? modernColors.primary : 
                               hasPromemoria ? `${modernColors.warning}20` : 'transparent',
                    border: hasPromemoria && !isOggi ? `1px solid ${modernColors.warning}40` : 'none',
                    cursor: hasPromemoria ? 'pointer' : 'default',
                    position: 'relative',
                    '&:hover': hasPromemoria ? {
                      background: `${modernColors.warning}30`
                    } : {}
                  }}
                >
                  {giorno}
                  {hasPromemoria && !isOggi && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        bgcolor: modernColors.warning,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
          
          {/* Lista promemoria */}
          <Typography variant="caption" sx={{ 
            color: modernColors.neutral,
            fontWeight: 600,
            mb: 1,
            display: 'block'
          }}>
            PROMEMORIA
          </Typography>
          <Stack spacing={1}>
            {promemoria.slice(0, 2).map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  background: modernColors.light,
                  borderRadius: '8px',
                  border: `1px solid ${modernColors.neutral}15`,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: item.tipo === 'warning' ? modernColors.warning : 
                            item.tipo === 'info' ? modernColors.primary : modernColors.success,
                    mr: 1.5,
                  }}
                />
                <Typography variant="caption" sx={{ 
                  fontWeight: 500, 
                  fontSize: '0.75rem',
                  color: modernColors.neutral 
                }}>
                  {item.giorno}/{mese + 1} · {item.task}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </motion.div>
    );
  });

  // Collegamenti Rapidi Estesi
  const ModernQuickActions = () => {
    const actions = [
      { icon: <Store />, label: 'Giacenze', color: modernColors.success, url: '/magazzino' },
      { icon: <Receipt />, label: 'Fatture', color: modernColors.primary, url: '/magazzino' },
      { icon: <Business />, label: 'Anagrafica', color: modernColors.secondary, url: '/anagrafica' },
      { icon: <LocalShipping />, label: 'Movimenti', color: modernColors.warning, url: '/magazzino' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
          gap: 2 
        }}>
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box
                sx={{
                  background: modernColors.glass,
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  p: 3,
                  border: `1px solid ${action.color}20`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  '&:hover': {
                    background: `${action.color}10`,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  }
                }}
                onClick={() => window.location.href = action.url}
              >
                <Box sx={{ color: action.color, fontSize: 36, mb: 1 }}>
                  {action.icon}
                </Box>
                <Typography variant="body2" sx={{ 
                  color: modernColors.neutral,
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}>
                  {action.label}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      </motion.div>
    );
  };

  // Palette colori sobria per grafici
  const CHART_COLORS = [
    modernColors.primary,
    modernColors.success,
    modernColors.warning,
    modernColors.secondary,
    modernColors.neutral,
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
  ];

  // Grafico Compatto - Distribuzione Prodotti
  const CompactDistribuzioneChart = React.memo(() => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box
          sx={{
            background: modernColors.glass,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 3,
            border: `1px solid ${modernColors.neutral}20`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: 300,
          }}
        >
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: modernColors.primary,
            fontSize: '1rem'
          }}>
            📊 Distribuzione Gruppi
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartsData.distribuzioneProdotti}
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={25}
                fill="#8884d8"
                dataKey="valore"
                strokeWidth={1}
                stroke="#fff"
              >
                {chartsData.distribuzioneProdotti.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Tooltip 
                formatter={(value: any) => [`€${value.toFixed(2)}`, 'Valore']}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </motion.div>
    );
  });

  // Grafico Compatto - Top Categorie
  const CompactValoriChart = React.memo(() => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Box
          sx={{
            background: modernColors.glass,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 3,
            border: `1px solid ${modernColors.neutral}20`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: 300,
          }}
        >
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: modernColors.success,
            fontSize: '1rem'
          }}>
            💰 Top Categorie
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartsData.valoriCategorie.slice(0, 5)}
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={30}
                fill="#8884d8"
                dataKey="valore"
                strokeWidth={1}
                stroke="#fff"
              >
                {chartsData.valoriCategorie.slice(0, 5).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Tooltip 
                formatter={(value: any) => [`€${value.toFixed(2)}`, 'Valore']}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </motion.div>
    );
  });

  // Grafico Compatto - Movimenti
  const CompactMovimentiChart = React.memo(() => {
    // Calcola totali movimenti per il pie chart
    const movimentiData = React.useMemo(() => {
      const totali = chartsData.movimentiTrend.reduce(
        (acc, day) => ({
          carichi: acc.carichi + day.carichi,
          scarichi: acc.scarichi + day.scarichi,
          distruzioni: acc.distruzioni + day.distruzioni,
        }),
        { carichi: 0, scarichi: 0, distruzioni: 0 }
      );

      return [
        { name: 'Carichi', value: totali.carichi },
        { name: 'Scarichi', value: totali.scarichi },
        { name: 'Distruzioni', value: totali.distruzioni },
      ].filter(item => item.value > 0);
    }, [chartsData.movimentiTrend]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Box
          sx={{
            background: modernColors.glass,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 3,
            border: `1px solid ${modernColors.neutral}20`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: 300,
          }}
        >
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: modernColors.secondary,
            fontSize: '1rem'
          }}>
            📈 Movimenti (7gg)
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={movimentiData}
                cx="50%"
                cy="50%"
                outerRadius={55}
                innerRadius={20}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={1}
                stroke="#fff"
              >
                {movimentiData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? modernColors.success : index === 1 ? modernColors.warning : modernColors.error}
                  />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${value} operazioni`, 'Totale']}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </motion.div>
    );
  });

  if (loading && Object.keys(statistiche).length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      mt: 1,
      background: `linear-gradient(135deg, 
        rgba(248, 250, 252, 0.8) 0%, 
        rgba(241, 245, 249, 0.8) 100%)`,
      minHeight: '100vh',
      p: 2
    }}>
      {/* Header Unificato e Compatto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          p: 2,
          borderRadius: '12px',
          background: modernColors.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${modernColors.neutral}20`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: modernColors.primary,
              letterSpacing: '-0.02em'
            }}>
              🌸 DimitriFlor
            </Typography>
            <Typography variant="body2" sx={{ 
              color: modernColors.neutral,
              fontWeight: 500,
              opacity: 0.8
            }}>
              · Dashboard Magazzino
            </Typography>
          </Box>
          
          <ModernCompactClock />
        </Box>
      </motion.div>

      {/* Sezione Calendario e Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <CalendarioWidget />
        </Grid>
        <Grid item xs={12} md={7}>
          <Box sx={{ 
            background: modernColors.glass,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 3,
            border: `1px solid ${modernColors.neutral}20`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: modernColors.primary
            }}>
              🚀 Azioni Rapide
            </Typography>
            <ModernQuickActions />
          </Box>
        </Grid>
      </Grid>



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

      {/* Sezione Analytics Compatta - TIRATA PIÙ IN ALTO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            color: modernColors.primary,
            textAlign: 'center'
          }}
        >
          📊 Analytics Magazzino
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <CompactDistribuzioneChart />
          </Grid>
          <Grid item xs={12} md={4}>
            <CompactValoriChart />
          </Grid>
          <Grid item xs={12} md={4}>
            <CompactMovimentiChart />
          </Grid>
        </Grid>
      </motion.div>

      {/* Widget Compatti */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <CompactWidget
            title="ACQUISTI"
            value={statistiche.fatture_acquisto.totale}
            subtitle={formatCurrency(statistiche.fatture_acquisto.importo)}
            icon={<ShoppingCart sx={{ fontSize: 24 }} />}
            color={modernColors.primary}
            delay={0.1}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <CompactWidget
            title="VENDITE"
            value={statistiche.fatture_vendita.totale}
            subtitle={formatCurrency(statistiche.fatture_vendita.importo)}
            icon={<AttachMoney sx={{ fontSize: 24 }} />}
            color={modernColors.success}
            delay={0.2}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <CompactWidget
            title="MAGAZZINO"
            value={statistiche.giacenze.varietà}
            subtitle={`${formatCurrency(statistiche.giacenze.valore)} ${statistiche.giacenze.scorta_minima > 0 ? `· ⚠️ ${statistiche.giacenze.scorta_minima} minimi` : '· ✅ Ok'}`}
            icon={<Inventory sx={{ fontSize: 24 }} />}
            color={modernColors.warning}
            delay={0.3}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <CompactWidget
            title="NETWORK"
            value={statistiche.fornitori.attivi + statistiche.clienti.attivi}
            subtitle={`${statistiche.fornitori.attivi} fornitori · ${statistiche.clienti.attivi} clienti`}
            icon={<Business sx={{ fontSize: 24 }} />}
            color={modernColors.secondary}
            delay={0.4}
          />
        </Grid>
      </Grid>

      {/* Tabelle Compatte */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Box
              sx={{
                background: modernColors.glass,
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                p: 3,
                border: `1px solid ${modernColors.neutral}20`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 2, 
                fontWeight: 600,
                color: modernColors.primary,
                fontSize: '1rem'
              }}>
                📋 Fatture Recenti
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Numero</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Data</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Importo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistiche.fatture_recenti.slice(0, 4).map((fattura: any) => (
                      <TableRow key={fattura.id} sx={{ '&:hover': { bgcolor: modernColors.light } }}>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{fattura.numero}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={fattura.tipo}
                            sx={{
                              background: fattura.tipo === 'vendita' ? `${modernColors.success}20` : `${modernColors.primary}20`,
                              color: fattura.tipo === 'vendita' ? modernColors.success : modernColors.primary,
                              border: 'none',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(fattura.data).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{formatCurrency(fattura.totale)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box
              sx={{
                background: modernColors.glass,
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                p: 3,
                border: `1px solid ${modernColors.neutral}20`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 2, 
                fontWeight: 600,
                color: modernColors.success,
                fontSize: '1rem'
              }}>
                🚛 Movimenti Recenti
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Varietà</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: modernColors.neutral, fontSize: '0.8rem' }}>Qnt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistiche.movimenti_recenti.slice(0, 4).map((movimento: any) => (
                      <TableRow key={movimento.id} sx={{ '&:hover': { bgcolor: modernColors.light } }}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(movimento.data).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={movimento.tipo}
                            sx={{
                              background: movimento.tipo === 'carico' ? `${modernColors.success}20` : 
                                        movimento.tipo === 'scarico' ? `${modernColors.warning}20` : `${modernColors.error}20`,
                              color: movimento.tipo === 'carico' ? modernColors.success : 
                                     movimento.tipo === 'scarico' ? modernColors.warning : modernColors.error,
                              border: 'none',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{movimento.varieta_nome}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{movimento.quantita}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
} 
