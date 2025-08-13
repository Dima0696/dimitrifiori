import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import { useLocation, useNavigate } from 'react-router-dom';

import CaratteristicheArticoli from './anagrafica/CaratteristicheArticoli';
// Clienti e Fornitori sono ora fuori da Anagrafica

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
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Redirect legacy query params ?tab=clienti / ?tab=fornitori alle nuove pagine
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const hash = (location.hash || '').replace('#', '').toLowerCase();

    if (tab === 'clienti' || hash === 'clienti') {
      navigate('/clienti', { replace: true });
    } else if (tab === 'fornitori' || hash === 'fornitori') {
      navigate('/fornitori', { replace: true });
    }
  }, [location.search, location.hash, navigate]);

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
        <Box sx={{ borderBottom: 1, borderColor: 'grey.300', background: 'linear-gradient(90deg, #111827 0%, #6b7280 100%)10' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="anagrafica tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 0,
                background: '#111827',
              },
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: '#6b7280',
                '&:hover': {
                  color: '#111827',
                  background: 'rgba(17, 24, 39, 0.06)',
                },
                '&.Mui-selected': {
                  color: '#111827',
                  fontWeight: 700,
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
            
            {/* Altre entità spostate in pagine dedicate */}
          </Tabs>
        </Box>

        {/* Header sezione iOS26 grigio/nero */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.25 }}>Anagrafica</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>Gestisci le caratteristiche base degli articoli</Typography>
        </Box>

        <TabPanel value={value} index={0}>
          <CaratteristicheArticoli />
        </TabPanel>
        
        {/* Nessuna tab aggiuntiva: Clienti e Fornitori sono su pagine dedicate */}
      </Paper>
    </Box>
  );
}
