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
  const [openOrdini, setOpenOrdini] = useState(false); // Chiuso by default per risparmiare spazio

  // Palette colori moderna per sidebar
  const sidebarColors = {
    background: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
    glass: 'rgba(255, 255, 255, 0.1)',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    accent: '#3b82f6',
    accentLight: 'rgba(59, 130, 246, 0.2)',
    hover: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.1)',
  };

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Magazzino', icon: <InventoryIcon />, path: '/magazzino' },
    { label: 'Gestione Acquisti', icon: <ShoppingCartIcon />, path: '/acquisti' },
    { label: 'Gestione Vendite', icon: <PointOfSaleIcon />, path: '/vendite' },
    { label: 'Gestione Fornitori', icon: <BusinessIcon />, path: '/fornitori' },
    { label: 'Gestione Clienti', icon: <PeopleIcon />, path: '/clienti' },
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
    <Box sx={{ 
      height: '100%', 
      background: sidebarColors.background,
      color: sidebarColors.text, 
      display: 'flex', 
      flexDirection: 'column', 
      p: 0,
      overflow: 'hidden', // Elimina scrollbar
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header compatto */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2.5, 
        pb: 2, 
        gap: 2,
        background: sidebarColors.glass,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${sidebarColors.border}`,
      }}>
        <Box sx={{ 
          width: 36, 
          height: 36, 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}>
          <Typography variant="h6" fontWeight={900} color="#fff">DF</Typography>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} color={sidebarColors.text} sx={{ fontSize: '1.1rem' }}>
            DimitriFlor
          </Typography>
          <Typography variant="caption" color={sidebarColors.textSecondary} sx={{ fontSize: '0.7rem' }}>
            Management System
          </Typography>
        </Box>
      </Box>

      {/* User info compatto */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 2.5, 
        py: 2,
        background: sidebarColors.glass,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${sidebarColors.border}`,
      }}>
        <Avatar sx={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
          color: '#fff', 
          width: 32, 
          height: 32, 
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          P
        </Avatar>
        <Box sx={{ ml: 1.5 }}>
          <Typography variant="body2" fontWeight={600} color={sidebarColors.text} sx={{ fontSize: '0.85rem' }}>
            Paolo Melone
          </Typography>
          <Typography variant="caption" color={sidebarColors.textSecondary} sx={{ fontSize: '0.7rem' }}>
            Admin
          </Typography>
        </Box>
      </Box>

      {/* Menu items compatti */}
      <List sx={{ 
        flex: 1, 
        pt: 1,
        overflow: 'hidden', // Previene scroll
        '&::-webkit-scrollbar': { display: 'none' }, // Nasconde scrollbar webkit
        scrollbarWidth: 'none', // Nasconde scrollbar Firefox
      }}>
        {menuItems.map((item) => (
          <ListItem disablePadding key={item.label} sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={{
                color: location.pathname === item.path ? sidebarColors.accent : sidebarColors.textSecondary,
                borderRadius: '12px',
                mx: 1.5,
                minHeight: 40, // Ridotto da 52 a 40
                px: 2,
                background: location.pathname === item.path ? sidebarColors.accentLight : 'transparent',
                fontWeight: location.pathname === item.path ? 600 : 500,
                '&:hover': { 
                  background: sidebarColors.hover, 
                  color: sidebarColors.text,
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
              }}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? sidebarColors.accent : sidebarColors.textSecondary, 
                minWidth: 32, // Ridotto
                fontSize: '1.2rem'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.85rem' // Font più piccolo
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Sezione Ordini compatta */}
        <ListItem disablePadding sx={{ mb: 0.5, mt: 1 }}>
          <ListItemButton
            onClick={() => setOpenOrdini(!openOrdini)}
            sx={{
              color: sidebarColors.textSecondary,
              borderRadius: '12px',
              mx: 1.5,
              minHeight: 40, // Ridotto
              px: 2,
              background: 'transparent',
              fontWeight: 600,
              '&:hover': { 
                background: sidebarColors.hover, 
                color: sidebarColors.text,
                transform: 'translateX(4px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ListItemIcon sx={{ color: sidebarColors.textSecondary, minWidth: 32 }}>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Ordini" 
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} 
            />
            {openOrdini ? <ExpandLess sx={{ fontSize: '1.2rem' }} /> : <ExpandMore sx={{ fontSize: '1.2rem' }} />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={openOrdini} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {ordiniItems.map((item) => (
              <ListItem disablePadding key={item.label} sx={{ mb: 0.5 }}>
                <ListItemButton
                  sx={{
                    color: location.pathname === item.path ? sidebarColors.accent : sidebarColors.textSecondary,
                    borderRadius: '12px',
                    mx: 1.5,
                    ml: 3, // Ridotto indentazione
                    minHeight: 36, // Più piccolo per sottomenu
                    px: 2,
                    background: location.pathname === item.path ? sidebarColors.accentLight : 'transparent',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    '&:hover': { 
                      background: sidebarColors.hover, 
                      color: sidebarColors.text,
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ 
                    color: location.pathname === item.path ? sidebarColors.accent : sidebarColors.textSecondary, 
                    minWidth: 28 // Più piccolo
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.8rem' // Più piccolo per sottomenu
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>

      {/* Footer compatto */}
      <Box sx={{ 
        p: 2, 
        pt: 1,
        background: sidebarColors.glass,
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${sidebarColors.border}`,
      }}>
        <Typography variant="caption" color={sidebarColors.textSecondary} sx={{ fontSize: '0.7rem' }}>
          © 2024 DimitriFlor
        </Typography>
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
        '& .MuiDrawer-paper': { 
          width: 260, 
          boxSizing: 'border-box', 
          background: sidebarColors.background,
          borderRight: `1px solid ${sidebarColors.border}`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.3)',
        },
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
        '& .MuiDrawer-paper': { 
          width: 260, 
          boxSizing: 'border-box', 
          background: sidebarColors.background,
          borderRight: `1px solid ${sidebarColors.border}`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden', // Elimina completamente lo scroll
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
} 
