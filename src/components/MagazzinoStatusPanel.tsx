import React, { useState, useEffect } from 'react';
import {
  Box, Chip, IconButton, Tooltip, Typography
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useMagazzinoEvent, useMagazzinoEmitter } from '../lib/magazzinoEvents';
import { apiService } from '../lib/apiService';

interface MagazzinoStatus {
  giacenze: number;
  movimenti: number;
  ultimoAggiornamento: Date | null;
  erroriSincronizzazione: number;
}

export default function MagazzinoStatusPanel() {
  const [status, setStatus] = useState<MagazzinoStatus>({
    giacenze: 0,
    movimenti: 0,
    ultimoAggiornamento: null,
    erroriSincronizzazione: 0
  });
  const [loading, setLoading] = useState(false);

  const emitter = useMagazzinoEmitter();

  // Listener per eventi di aggiornamento
  useMagazzinoEvent('fattura_creata', () => updateStatus());
  useMagazzinoEvent('giacenza_aggiornata', () => updateStatus());
  useMagazzinoEvent('movimento_creato', () => updateStatus());
  useMagazzinoEvent('distruzione_eseguita', () => updateStatus());
  useMagazzinoEvent('ricalcolo_giacenze', () => updateStatus());

  const updateStatus = async () => {
    try {
      setLoading(true);
      
      const [giacenze, movimenti] = await Promise.all([
        apiService.getGiacenze(),
        apiService.getMovimentiMagazzino()
      ]);

      setStatus({
        giacenze: giacenze.length,
        movimenti: movimenti.length,
        ultimoAggiornamento: new Date(),
        erroriSincronizzazione: 0
      });
    } catch (err) {
      console.error('Errore aggiornamento status:', err);
      setStatus(prev => ({
        ...prev,
        erroriSincronizzazione: prev.erroriSincronizzazione + 1
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateStatus();
  }, []);

  const handleForceSync = () => {
    emitter.emitRicalcoloGiacenze();
    updateStatus();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      mb: 2, 
      p: 1.5, 
      bgcolor: 'background.paper', 
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      {/* Icona stato */}
      {status.erroriSincronizzazione === 0 ? (
        <CheckCircleIcon color="success" fontSize="small" />
      ) : (
        <ErrorIcon color="error" fontSize="small" />
      )}

      {/* Metriche compatte */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InventoryIcon fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={600}>
            {status.giacenze}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">•</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingUpIcon fontSize="small" color="success" />
          <Typography variant="body2" fontWeight={600}>
            {status.movimenti}
          </Typography>
        </Box>
      </Box>

      {/* Timestamp */}
      {status.ultimoAggiornamento && (
        <Typography variant="caption" color="text.secondary">
          {status.ultimoAggiornamento.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Typography>
      )}

      {/* Pulsante sync */}
      <Tooltip title="Aggiorna stato">
        <IconButton 
          size="small" 
          onClick={handleForceSync} 
          disabled={loading}
          sx={{ ml: 'auto' }}
        >
          <SyncIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
} 