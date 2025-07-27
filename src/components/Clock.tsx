import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { AccessTime, CalendarToday } from '@mui/icons-material';

export default function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: 200
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Ora */}
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography 
            variant="h5" 
            fontWeight={600}
            color="primary.main"
          >
            {formatTime(currentTime)}
          </Typography>
        </Box>

        {/* Separatore verticale */}
        <Box 
          sx={{ 
            width: 1, 
            height: 40, 
            backgroundColor: 'divider', 
            mx: 2 
          }} 
        />

        {/* Data */}
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography 
            variant="body1" 
            fontWeight={500}
            color="text.primary"
          >
            {formatShortDate(currentTime)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
} 