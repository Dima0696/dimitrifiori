import React from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar';

const drawerWidth = 280;

export default function MainLayout({ children, title = 'Dashboard' }: { children: React.ReactNode, title?: string }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F6FA' }}>
      <CssBaseline />
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#F5F6FA', p: { xs: 2, md: 4 }, minHeight: '100vh', width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', color: '#23283B', boxShadow: '0 1px 8px 0 #E0E3EA', zIndex: theme.zIndex.drawer + 1, minHeight: 72 }}>
          <Toolbar sx={{ minHeight: 72, px: { xs: 1, md: 3 } }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
              {title}
            </Typography>
            {/* Qui puoi aggiungere breadcrumb, filtri, azioni future */}
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, pt: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
} 