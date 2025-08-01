import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Box, useTheme, useMediaQuery, IconButton, Divider, Collapse } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WidgetsIcon from '@mui/icons-material/Widgets';
import MenuIcon from '@mui/icons-material/Menu';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import BusinessIcon from '@mui/icons-material/Business';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar({ mobileOpen, onDrawerToggle }: { mobileOpen?: boolean, onDrawerToggle?: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 280;
  const location = useLocation();
  const navigate = useNavigate();
  const [openOrdini, setOpenOrdini] = useState(true);

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Magazzino', icon: <InventoryIcon />, path: '/magazzino' },
    { label: 'Gestione Acquisti', icon: <ShoppingCartIcon />, path: '/acquisti' },
    { label: 'Gestione Vendite', icon: <PointOfSaleIcon />, path: '/vendite' },
    { label: 'Gestione Fornitori', icon: <BusinessIcon />, path: '/fornitori' },
    { label: 'Lista Clienti', icon: <PeopleIcon />, path: '/clienti' },
    { label: 'Anagrafica', icon: <SettingsIcon />, path: '/anagrafica' },
    { label: 'Statistiche', icon: <AnalyticsIcon />, path: '/statistiche' },
    { label: 'Contabilità', icon: <AccountBalanceIcon />, path: '/contabilita' },
    { label: 'Gestione Immagini', icon: <PictureAsPdfIcon />, path: '/download-immagini' },
    { label: 'Webshop', icon: <WidgetsIcon />, path: '/webshop' },
  ];

  // Elementi della sezione Ordini
  const ordiniItems = [
    { label: 'Ordini Vendita', icon: <AssignmentIcon />, path: '/ordini-vendita' },
    { label: 'Ordini Acquisto', icon: <ShoppingCartIcon />, path: '/ordini-acquisto' },
    { label: 'Ordini Clienti Webshop', icon: <ShoppingBasketIcon />, path: '/ordini-clienti' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: '#ffffff', color: '#333333', display: 'flex', flexDirection: 'column', p: 0, borderRight: '1px solid #e0e0e0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2, gap: 2 }}>
        {/* Logo moderno */}
        <Box sx={{ width: 40, height: 40, bgcolor: '#2196F3', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h5" fontWeight={900} color="#fff">DF</Typography>
        </Box>
        <Typography variant="h6" fontWeight={700} color="#333333">DimitriFlor</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, pb: 2 }}>
        <Avatar sx={{ bgcolor: '#2196F3', color: '#fff', width: 40, height: 40, fontWeight: 700 }}>P</Avatar>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body1" fontWeight={600} color="#333333">Paolo Melone</Typography>
          <Typography variant="caption" color="#666666">Amministratore</Typography>
        </Box>
      </Box>
      <Divider sx={{ bgcolor: '#e0e0e0', my: 2 }} />
      <List sx={{ flex: 1, mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem disablePadding key={item.label} sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={{
                color: location.pathname === item.path ? '#2196F3' : '#666666',
                borderRadius: 2,
                mx: 2,
                minHeight: 52,
                px: 2.5,
                bgcolor: location.pathname === item.path ? '#f3f7ff' : 'transparent',
                fontWeight: location.pathname === item.path ? 600 : 500,
                '&:hover': { bgcolor: '#f5f5f5', color: '#333333' },
                transition: 'all 0.2s ease',
              }}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#2196F3' : '#666666', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 600 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ bgcolor: '#e0e0e0', my: 2 }} />

        {/* Sezione Ordini */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setOpenOrdini(!openOrdini)}
            sx={{
              color: '#666666',
              borderRadius: 2,
              mx: 2,
              minHeight: 52,
              px: 2.5,
              bgcolor: 'transparent',
              fontWeight: 600,
              '&:hover': { bgcolor: '#f5f5f5', color: '#333333' },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ color: '#666666', minWidth: 36 }}>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Ordini" primaryTypographyProps={{ fontWeight: 600 }} />
            {openOrdini ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={openOrdini} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {ordiniItems.map((item) => (
              <ListItem disablePadding key={item.label} sx={{ mb: 0.5 }}>
                <ListItemButton
                  sx={{
                    color: location.pathname === item.path ? '#2196F3' : '#666666',
                    borderRadius: 2,
                    mx: 2,
                    ml: 4,
                    minHeight: 52,
                    px: 2.5,
                    bgcolor: location.pathname === item.path ? '#f3f7ff' : 'transparent',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    '&:hover': { bgcolor: '#f5f5f5', color: '#333333' },
                    transition: 'all 0.2s ease',
                  }}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? '#2196F3' : '#666666', minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 600 : 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
      <Box sx={{ p: 3, pt: 0 }}>
        <Typography variant="caption" color="#999999">© 2024 DimitriFlor</Typography>
      </Box>
    </Box>
  );

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box', bgcolor: '#ffffff', borderRight: '1px solid #e0e0e0' },
      }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box', bgcolor: '#ffffff', borderRight: '1px solid #e0e0e0' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
} 
