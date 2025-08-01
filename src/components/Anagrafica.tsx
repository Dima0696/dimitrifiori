import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';

import CaratteristicheArticoli from './anagrafica/CaratteristicheArticoli';
import GestioneFornitori from './anagrafica/GestioneFornitori';
import GestioneClienti from './anagrafica/GestioneClienti';

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
      id={`anagrafica-tabpanel-${index}`}
      aria-labelledby={`anagrafica-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `anagrafica-tab-${index}`,
    'aria-controls': `anagrafica-tabpanel-${index}`,
  };
}

export default function Anagrafica() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0}
        sx={{ 
          width: '100%',
          borderRadius: 0,
          background: '#ffffff',
          border: '1px solid',
          borderColor: 'grey.300'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'grey.300' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="anagrafica tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 0,
                background: '#2196F3',
              },
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'grey.600',
                '&:hover': {
                  color: 'primary.main',
                  background: 'rgba(33, 150, 243, 0.04)',
                },
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600,
                },
              },
            }}
          >
            {/* Tab unificato per tutte le caratteristiche */}
            <Tab 
              icon={<CategoryIcon sx={{ fontSize: 24 }} />} 
              label="Caratteristiche Articoli" 
              {...a11yProps(0)} 
            />
            
            {/* Sezione Entità Commerciali */}
            <Tab 
              icon={<BusinessIcon sx={{ fontSize: 24 }} />} 
              label="Fornitori" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<PeopleIcon sx={{ fontSize: 24 }} />} 
              label="Clienti" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <CaratteristicheArticoli />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <GestioneFornitori />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <GestioneClienti />
        </TabPanel>
      </Paper>
    </Box>
  );
}
