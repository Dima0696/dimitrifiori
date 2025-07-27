import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GestioneFattureVendita from './GestioneFattureVendita';
import NuovaFatturaVendita from './NuovaFatturaVendita';
import ListaOrdiniVendita from './ListaOrdiniVendita';
import StatisticheVendite from './StatisticheVendite';

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
      id={`vendite-tabpanel-${index}`}
      aria-labelledby={`vendite-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vendite-tab-${index}`,
    'aria-controls': `vendite-tabpanel-${index}`,
  };
}

export default function GestioneVendite() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Gestione Vendite
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gestisci fatture di vendita, ordini e statistiche delle vendite
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="vendite tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongIcon />
                  Nuova Fattura
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongIcon />
                  Gestione Fatture
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedInIcon />
                  Ordini Vendita
                </Box>
              }
              {...a11yProps(2)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QueryStatsIcon />
                  Statistiche Vendite
                </Box>
              }
              {...a11yProps(3)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <NuovaFatturaVendita />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <GestioneFattureVendita />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <ListaOrdiniVendita />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <StatisticheVendite />
        </TabPanel>
      </Paper>
    </Box>
  );
} 