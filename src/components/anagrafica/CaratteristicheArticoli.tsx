import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PaletteIcon from '@mui/icons-material/Palette';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoIcon from '@mui/icons-material/Photo';
import HeightIcon from '@mui/icons-material/Height';
import InventoryIcon from '@mui/icons-material/Inventory';
import StarIcon from '@mui/icons-material/Star';
import ArticleIcon from '@mui/icons-material/Article';

import GestioneGruppi from './GestioneGruppi';
import GestioneColori from './GestioneColori';
import GestioneProvenienze from './GestioneProvenienze';
import GestioneFoto from './GestioneFoto';
import GestioneAltezze from './GestioneAltezze';
import GestioneImballaggi from './GestioneImballaggi';
import GestioneQualita from './GestioneQualita';

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
      id={`caratteristiche-tabpanel-${index}`}
      aria-labelledby={`caratteristiche-tab-${index}`}
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
    id: `caratteristiche-tab-${index}`,
    'aria-controls': `caratteristiche-tabpanel-${index}`,
  };
}

const CaratteristicheArticoli: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 500,
            color: 'grey.800',
            mb: 1,
            background: 'linear-gradient(45deg, #111827 30%, #6b7280 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Sistema 8 Caratteristiche
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'grey.600',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Gestisci tutte le caratteristiche per creare automaticamente gli articoli: 
          <strong style={{ color: '#1976d2' }}> Gruppo → Prodotto → Colore → Provenienza → Foto → Imballo → Altezza → Qualità</strong>
        </Typography>
      </Box>

        <Paper 
        elevation={0}
        sx={{ 
          width: '100%',
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'grey.300',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'grey.300' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="caratteristiche tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: 'grey.50',
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: 0,
                background: '#111827',
              },
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: '#6b7280',
                '&:hover': {
                  color: '#111827',
                  background: 'rgba(17, 24, 39, 0.06)',
                },
                '&.Mui-selected': {
                  color: '#111827',
                  fontWeight: 700,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                },
              },
            }}
          >
            <Tab 
              icon={<GroupIcon sx={{ fontSize: 22 }} />} 
              label="Gruppi" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<PaletteIcon sx={{ fontSize: 22 }} />} 
              label="Colori" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<HeightIcon sx={{ fontSize: 22 }} />} 
              label="Altezze" 
              {...a11yProps(2)} 
            />
            <Tab 
              icon={<LocationOnIcon sx={{ fontSize: 22 }} />} 
              label="Provenienze" 
              {...a11yProps(3)} 
            />
            <Tab 
              icon={<InventoryIcon sx={{ fontSize: 22 }} />} 
              label="Imballaggi" 
              {...a11yProps(4)} 
            />
            <Tab 
              icon={<PhotoIcon sx={{ fontSize: 22 }} />} 
              label="Foto" 
              {...a11yProps(5)} 
            />
            <Tab 
              icon={<StarIcon sx={{ fontSize: 22 }} />} 
              label="Qualità" 
              {...a11yProps(6)} 
            />
            <Tab 
              icon={<ArticleIcon sx={{ fontSize: 22 }} />} 
              label="Articoli" 
              {...a11yProps(7)} 
              disabled
              sx={{
                '&.Mui-disabled': {
                  color: 'grey.400'
                }
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <GestioneGruppi />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <GestioneColori />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <GestioneAltezze />
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <GestioneProvenienze />
        </TabPanel>
        
        <TabPanel value={value} index={4}>
          <GestioneImballaggi />
        </TabPanel>
        
        <TabPanel value={value} index={5}>
          <GestioneFoto />
        </TabPanel>
        
        <TabPanel value={value} index={6}>
          <GestioneQualita />
        </TabPanel>
        
        <TabPanel value={value} index={7}>
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Box 
              sx={{ 
                display: 'inline-flex',
                p: 3,
                borderRadius: '50%',
                bgcolor: 'grey.100',
                mb: 3
              }}
            >
              <ArticleIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'grey.600', 
                mb: 2, 
                fontWeight: 500 
              }}
            >
              Articoli Automatici
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'grey.500',
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Gli articoli vengono creati automaticamente quando carichi i documenti di acquisto.
              Questa sezione mostrerà tutti gli articoli generati dal sistema.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CaratteristicheArticoli;
