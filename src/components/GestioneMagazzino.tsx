import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Card, CardContent, Alert,
  Container, Grid, useTheme, alpha, IconButton, Chip, Stack, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Importiamo i 3 componenti principali
import InserimentoFattureMultiRiga from './magazzino/InserimentoFattureMultiRiga';
import GiacenzeMagazzino from './magazzino/GiacenzeMagazzino';
import DistruzioneMagazzino from './magazzino/DistruzioneMagazzino';
import { MovimentiMagazzino } from './ListaDocumentiCarico';
import ModernCard from './ui/ModernCard';

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
      id={`magazzino-tabpanel-${index}`}
      aria-labelledby={`magazzino-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `magazzino-tab-${index}`,
    'aria-controls': `magazzino-tabpanel-${index}`,
  };
}

export default function GestioneMagazzino() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Dati di esempio per le statistiche
  const stats = [
    {
      title: 'Giacenze Totali',
      value: '2,847',
      subtitle: 'Articoli in magazzino',
      trend: { value: 12, direction: 'up' as const },
      icon: <InventoryIcon />,
      gradient: [theme.palette.primary.main, theme.palette.primary.dark],
    },
    {
      title: 'Fatture Mese',
      value: '156',
      subtitle: 'Documenti elaborati',
      trend: { value: 8, direction: 'up' as const },
      icon: <ReceiptLongIcon />,
      gradient: [theme.palette.success.main, theme.palette.success.dark],
    },
    {
      title: 'Valore Magazzino',
      value: '€89,342',
      subtitle: 'Valore totale',
      trend: { value: 3, direction: 'down' as const },
      icon: <TrendingUpIcon />,
      gradient: [theme.palette.warning.main, theme.palette.warning.dark],
    },
    {
      title: 'Documenti Carico',
      value: '89',
      subtitle: 'Questo mese',
      icon: <DescriptionIcon />,
      gradient: [theme.palette.secondary.main, theme.palette.secondary.dark],
    },
  ];

  const tabs = [
    {
      label: 'Inserimento Fattura',
      icon: <ReceiptLongIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Giacenze',
      icon: <InventoryIcon />,
      color: theme.palette.success.main,
    },
    {
      label: 'Distruzione',
      icon: <DeleteIcon />,
      color: theme.palette.error.main,
    },
    {
      label: 'Documenti Carico',
      icon: <DescriptionIcon />,
      color: theme.palette.info.main,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header con dashboard */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 56,
                height: 56,
              }}
            >
              <DashboardIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Gestione Magazzino
              </Typography>
              <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
                Sistema integrato per la gestione completa del magazzino
              </Typography>
            </Box>
          </Box>

          {/* Statistiche Dashboard */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ModernCard
                    title={stat.title}
                    subtitle={stat.subtitle}
                    value={stat.value}
                    trend={stat.trend}
                    icon={stat.icon}
                    gradient={stat.gradient}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tabs Moderni */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
          }}
        >
          <Box sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2.5,
                  minHeight: 'auto',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: theme.palette.text.secondary,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                  },
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={
                    <Box sx={{ color: tabValue === index ? tab.color : 'inherit' }}>
                      {tab.icon}
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

          {/* Contenuto dei Tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tabValue}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabPanel value={tabValue} index={0}>
                <InserimentoFattureMultiRiga />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <GiacenzeMagazzino />
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <DistruzioneMagazzino />
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <MovimentiMagazzino />
              </TabPanel>
            </motion.div>
          </AnimatePresence>
        </Paper>
      </motion.div>
    </Container>
  );
}
