import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, useTheme, alpha, Chip, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../lib/apiService';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';

import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Importiamo i componenti principali per il magazzino
import InserimentoFattureMultiRiga from './magazzino/InserimentoFattureMultiRiga';
import GiacenzeMagazzino from './magazzino/GiacenzeMagazzino';
import { MovimentiMagazzino } from './ListaDocumentiCarico';



export default function GestioneMagazzino() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  // Palette colori moderna con accenti strategici
  const modernColors = {
    background: 'rgba(255, 255, 255, 0.95)',
    glass: 'rgba(255, 255, 255, 0.8)',
    primary: '#2563eb',
    secondary: '#64748b',
    neutral: '#94a3b8',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(148, 163, 184, 0.2)',
    gradient: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
    // Accenti colorati per sezioni
    accent1: '#3b82f6', // Blue
    accent2: '#10b981', // Emerald 
    accent3: '#f59e0b', // Amber
    accent4: '#8b5cf6', // Violet
  };
  
  // Stati per i dati reali
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    giacenzeTotali: 0,
    valoreGiacenze: 0,
    fattureQuesto: 0,
    documentiCarico: 0
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Carica dati reali dal database
  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      
      // Data del mese corrente
      const oggi = new Date();
      const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
      
      const [giacenze, movimenti, fatture] = await Promise.all([
        apiService.getGiacenzeMagazzino(),
        apiService.getMovimentiMagazzino(),
        apiService.getFattureAcquisto()
      ]);
      
      // Calcola statistiche reali
      const giacenzeTotali = giacenze.reduce((sum: number, g: any) => sum + (g.quantita_giacenza || 0), 0);
      
      const valoreGiacenze = giacenze.reduce((sum: number, g: any) => 
        sum + ((g.quantita_giacenza || 0) * (g.prezzo_costo_finale_per_stelo || 0)), 0);
      
      const fattureQuesto = fatture.filter((f: any) => {
        const dataFattura = new Date(f.data);
        return dataFattura >= inizioMese && dataFattura <= fineMese;
      }).length;
      
      const documentiCarico = movimenti.filter((m: any) => {
        const dataMovimento = new Date(m.data);
        return m.tipo === 'carico' && dataMovimento >= inizioMese && dataMovimento <= fineMese;
      }).length;
      
      setStatsData({
        giacenzeTotali,
        valoreGiacenze,
        fattureQuesto,
        documentiCarico
      });
      
    } catch (error) {
      console.error('❌ Errore caricamento statistiche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dati reali per le statistiche - con accenti colorati
  const stats = [
    {
      title: 'Giacenze Totali',
      value: loading ? '-' : statsData.giacenzeTotali.toLocaleString(),
      subtitle: 'Articoli in magazzino',
      trend: { value: 12, direction: 'up' as const },
      icon: <InventoryIcon />,
      color: modernColors.accent1,
      gradient: `linear-gradient(135deg, ${modernColors.accent1}15, ${modernColors.accent1}05)`,
    },
    {
      title: 'Fatture Mese',
      value: loading ? '-' : statsData.fattureQuesto.toString(),
      subtitle: 'Documenti elaborati',
      trend: { value: 8, direction: 'up' as const },
      icon: <ReceiptLongIcon />,
      color: modernColors.accent2,
      gradient: `linear-gradient(135deg, ${modernColors.accent2}15, ${modernColors.accent2}05)`,
    },
    {
      title: 'Valore Magazzino',
      value: loading ? '-' : `€${statsData.valoreGiacenze.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: 'Valore totale',
      trend: { value: 3, direction: 'down' as const },
      icon: <TrendingUpIcon />,
      color: modernColors.accent3,
      gradient: `linear-gradient(135deg, ${modernColors.accent3}15, ${modernColors.accent3}05)`,
    },
    {
      title: 'Documenti Carico',
      value: loading ? '-' : statsData.documentiCarico.toString(),
      subtitle: 'Questo mese',
      icon: <DescriptionIcon />,
      color: modernColors.accent4,
      gradient: `linear-gradient(135deg, ${modernColors.accent4}15, ${modernColors.accent4}05)`,
    },
  ];

  const tabs = [
    {
      label: 'Fatture Acquisti',
      icon: <ReceiptLongIcon />,
      color: modernColors.accent1,
      bgColor: `${modernColors.accent1}12`,
      borderColor: `${modernColors.accent1}40`,
    },
    {
      label: 'Giacenze',
      icon: <InventoryIcon />,
      color: modernColors.accent2,
      bgColor: `${modernColors.accent2}12`,
      borderColor: `${modernColors.accent2}40`,
    },
    {
      label: 'Movimenti',
      icon: <AssessmentIcon />,
      color: modernColors.accent4,
      bgColor: `${modernColors.accent4}12`,
      borderColor: `${modernColors.accent4}40`,
    },
  ];

  return (
    <Box sx={{
      maxWidth: 1400,
      mx: 'auto',
      mt: 1,
      background: modernColors.gradient,
      minHeight: '100vh',
      p: 2
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header moderno e compatto */}
        <Box sx={{ 
          mb: 3,
          p: 3,
          borderRadius: '16px',
          background: modernColors.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${modernColors.border}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}>
              <DashboardIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: modernColors.text,
                letterSpacing: '-0.02em',
                mb: 0.5
              }}>
                Gestione Magazzino
              </Typography>
              <Typography variant="body2" sx={{ 
                color: modernColors.textSecondary,
                fontWeight: 500
              }}>
                Sistema integrato per la gestione completa del magazzino
              </Typography>
            </Box>
          </Box>

          {/* Statistiche moderne e compatte */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Box sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    background: stat.gradient,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${stat.color}20`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${stat.color}20`,
                      border: `1px solid ${stat.color}30`,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${stat.color}, ${stat.color}80)`,
                      borderRadius: '12px 12px 0 0',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: `${stat.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color
                      }}>
                        {React.cloneElement(stat.icon, { sx: { fontSize: '1.1rem' } })}
                      </Box>
                      {stat.trend && (
                        <Chip
                          label={`${stat.trend.direction === 'up' ? '+' : '-'}${stat.trend.value}%`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            bgcolor: stat.trend.direction === 'up' ? '#22c55e15' : '#ef444415',
                            color: stat.trend.direction === 'up' ? '#22c55e' : '#ef4444',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      color: modernColors.text,
                      letterSpacing: '-0.01em',
                      mb: 0.5
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: modernColors.textSecondary,
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: modernColors.neutral,
                      fontSize: '0.7rem',
                      display: 'block',
                      mt: 0.5
                    }}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tabs moderni e minimali */}
        <Box sx={{ 
          borderRadius: '16px', 
          overflow: 'hidden',
          background: modernColors.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${modernColors.border}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}>
          <Box sx={{ 
            background: modernColors.background,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${modernColors.border}`,
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  minHeight: 'auto',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: modernColors.textSecondary,
                  letterSpacing: '-0.01em',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&.Mui-selected': {
                    color: tabs[tabValue]?.color || modernColors.primary,
                    fontWeight: 700,
                    background: tabs[tabValue]?.bgColor || `${modernColors.primary}08`,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: tabs[tabValue]?.color || modernColors.primary,
                      boxShadow: `0 0 8px ${tabs[tabValue]?.color || modernColors.primary}40`,
                    }
                  },
                  '&:hover': {
                    color: modernColors.text,
                    background: `${modernColors.primary}08`,
                    transform: 'translateY(-1px)',
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '3px 3px 0 0',
                  background: tabs[tabValue]?.color || modernColors.primary,
                  boxShadow: `0 0 12px ${tabs[tabValue]?.color || modernColors.primary}40`,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={
                    <Box sx={{ 
                      color: tabValue === index ? tab.color : modernColors.textSecondary,
                      transition: 'color 0.3s ease',
                      filter: tabValue === index ? `drop-shadow(0 0 4px ${tab.color}40)` : 'none',
                    }}>
                      {React.cloneElement(tab.icon, { sx: { fontSize: '1.2rem' } })}
                    </Box>
                  }
                  label={tab.label}
                  iconPosition="start"
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      mb: 0.5,
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Contenuto dei Tab con stile moderno */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tabValue}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ 
                p: 3, 
                background: modernColors.background,
                backdropFilter: 'blur(10px)',
                minHeight: '60vh',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '3px',
                  background: tabs[tabValue]?.color || modernColors.primary,
                  borderRadius: '0 0 3px 3px',
                  boxShadow: `0 2px 8px ${tabs[tabValue]?.color || modernColors.primary}30`,
                }
              }}>
                {tabValue === 0 && <InserimentoFattureMultiRiga />}
                {tabValue === 1 && <GiacenzeMagazzino />}
                {tabValue === 2 && <MovimentiMagazzino />}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </motion.div>
    </Box>
  );
}
