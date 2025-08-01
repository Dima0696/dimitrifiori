import React from 'react';
import { 
  Box, CssBaseline, AppBar, Toolbar, Typography, IconButton, 
  useMediaQuery, useTheme, alpha, Paper, Avatar, Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
    }}>
      <CssBaseline />
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0,
          minHeight: '100vh', 
          width: { md: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AppBar 
            position="sticky" 
            elevation={0} 
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              color: theme.palette.text.primary,
              zIndex: theme.zIndex.drawer + 1, 
              minHeight: 80 
            }}
          >
            <Toolbar sx={{ minHeight: 80, px: { xs: 2, md: 4 } }}>
              {isMobile && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton 
                    color="inherit" 
                    edge="start" 
                    onClick={handleDrawerToggle} 
                    sx={{ 
                      mr: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                </motion.div>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  <DashboardIcon />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                    }}
                  >
                    DimitriFlor Management System
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label="Online"
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                />
              </Box>
            </Toolbar>
          </AppBar>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ flex: 1 }}>
            {children}
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
} 
