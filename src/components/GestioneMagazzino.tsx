import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Divider
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteIcon from '@mui/icons-material/Delete';

import { SceltaInserimentoFattura, StoricoFattureAcquisto } from './InserimentoFattura';
import MovimentiMagazzino from './MovimentiMagazzino';
import CaricoMagazzinoSemplice from './CaricoMagazzinoSemplice';
import MagazzinoDistruzione from './MagazzinoDistruzione';
import MagazzinoStatusPanel from './MagazzinoStatusPanel';


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
        <Box sx={{ pt: 3 }}>
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
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Gestione Magazzino
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gestisci fatture acquisto, visualizza carico attuale e movimenti del magazzino
        </Typography>

        {/* Pannello di stato sincronizzazione */}
        <MagazzinoStatusPanel />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="magazzino tabs"
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
                  Fatture Acquisto
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon />
                  Storico Fatture
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon />
                  Carico Magazzino
                </Box>
              }
              {...a11yProps(2)}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QueryStatsIcon />
                  Query Magazzino
                </Box>
              }
              {...a11yProps(3)}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeleteIcon />
                  Distruzione
                </Box>
              }
              {...a11yProps(4)}
            />

          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <SceltaInserimentoFattura />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StoricoFattureAcquisto />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CaricoMagazzinoSemplice />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <MovimentiMagazzino />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <MagazzinoDistruzione />
        </TabPanel>


      </Paper>
    </Box>
  );
} 