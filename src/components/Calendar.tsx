import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, Tooltip, Divider, Alert, Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ChevronLeft, ChevronRight, Today, Add, Event,
  Edit, Delete, Close
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';

interface CalendarEvent {
  id: number;
  titolo: string;
  descrizione?: string;
  data_inizio: string;
  tipo?: string;
  created_at: string;
  updated_at: string;
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  showEvents?: boolean;
}

export default function Calendar({ onDateSelect, showEvents = true }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    type: 'appuntamento' as string
  });
  const [loading, setLoading] = useState(false);

  // Carica eventi dal database
  useEffect(() => {
    if (showEvents) {
      loadEvents();
    }
  }, [showEvents]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('🔄 Caricamento eventi calendario...');
      
      const eventi = await apiService.getEventi();
      setEvents(eventi);
      
      console.log('✅ Eventi caricati:', eventi.length);
    } catch (err: any) {
      console.error('❌ Errore caricamento eventi:', err);
      setEvents([]); // Inizializza con array vuoto
    } finally {
      setLoading(false);
    }
  };

  // Genera calendario per il mese corrente
  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Controlla se una data ha eventi
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.data_inizio === dateStr);
  };

  // Controlla se una data è oggi
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Controlla se una data è nel mese corrente
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  // Navigazione mesi
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Gestione eventi
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm({
      title: '',
      description: '',
      date: date.toISOString().split('T')[0],
      type: 'appuntamento'
    });
    setShowEventDialog(true);
    onDateSelect?.(date);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.date) return;

    try {
      setLoading(true);
      
      if (editingEvent) {
        // Per ora, non implementiamo l'aggiornamento (non disponibile nel JSON)
        console.log('⚠️ Aggiornamento eventi non ancora implementato');
      } else {
        // Crea nuovo evento
        await apiService.createEvento({
          titolo: eventForm.title,
          descrizione: eventForm.description,
          data_inizio: eventForm.date,
          tipo: eventForm.type
        });
        console.log('✅ Nuovo evento creato');
      }

      setShowEventDialog(false);
      setEditingEvent(null);
      resetEventForm();
      loadEvents();
    } catch (err: any) {
      console.error('❌ Errore salvataggio evento:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!window.confirm(`Eliminare l'evento "${event.titolo}"?`)) return;

    try {
      setLoading(true);
      // Per ora, non implementiamo l'eliminazione (non disponibile nel JSON)
      console.log('⚠️ Eliminazione eventi non ancora implementata');
      loadEvents();
    } catch (err: any) {
      console.error('❌ Errore eliminazione evento:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.titolo,
      description: event.descrizione || '',
      date: event.data_inizio,
      type: event.tipo || 'appuntamento'
    });
    setShowEventDialog(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      type: 'appuntamento'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'appuntamento': return 'primary';
      case 'consegna': return 'success';
      case 'riordino': return 'warning';
      case 'altro': return 'info';
      default: return 'default';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'appuntamento': return 'Appuntamento';
      case 'consegna': return 'Consegna';
      case 'riordino': return 'Riordino';
      case 'altro': return 'Altro';
      default: return type;
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Header calendario */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          Calendario
        </Typography>
        
        {/* Avviso se la collezione eventi non esiste */}
        {events.length === 0 && !loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Per abilitare il calendario, crea la collezione "eventidb" nel database Appwrite.
              <br />
              <strong>Attributi richiesti:</strong> title (String), description (String), date (String), type (String)
            </Typography>
          </Alert>
        )}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Mese precedente">
            <IconButton onClick={goToPreviousMonth} size="small">
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={goToToday}
            size="small"
          >
            Oggi
          </Button>
          <Tooltip title="Mese successivo">
            <IconButton onClick={goToNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Nome mese e anno */}
      <Typography variant="h6" textAlign="center" mb={2} color="text.secondary">
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Typography>

      {/* Griglia giorni della settimana */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <Grid key={day} sx={{ flex: 1 }}>
            <Box sx={{ 
              p: 1, 
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}>
              {day}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Griglia giorni */}
      <Grid container spacing={1}>
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);
          
          return (
            <Grid key={index} sx={{ flex: 1 }}>
              <Box
                onClick={() => handleDateClick(day)}
                sx={{
                  p: 1,
                  minHeight: 80,
                  border: '1px solid',
                  borderColor: isTodayDay ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: isTodayDay ? 'primary.50' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'scale(1.02)'
                  },
                  opacity: isCurrentMonthDay ? 1 : 0.5,
                  position: 'relative'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isTodayDay ? 700 : 500,
                    color: isTodayDay ? 'primary.main' : 'text.primary',
                    mb: 0.5
                  }}
                >
                  {day.getDate()}
                </Typography>
                
                {/* Eventi del giorno */}
                <Stack spacing={0.5}>
                  {dayEvents.slice(0, 2).map(event => (
                    <Chip
                      key={event.id}
                      label={event.titolo}
                      size="small"
                      color={getEventTypeColor(event.tipo || 'altro') as any}
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 20,
                        '& .MuiChip-label': { px: 1 }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayEvents.length - 2} altri
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialog per aggiungere/modificare evento */}
      <Dialog open={showEventDialog} onClose={() => setShowEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingEvent ? 'Modifica Evento' : 'Nuovo Evento'}
            </Typography>
            <IconButton onClick={() => setShowEventDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titolo"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />
            
            <TextField
              fullWidth
              label="Descrizione"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              multiline
              rows={3}
            />
            
            <TextField
              fullWidth
              label="Data"
              type="date"
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              select
              label="Tipo"
              value={eventForm.type}
              onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="appuntamento">Appuntamento</option>
              <option value="consegna">Consegna</option>
              <option value="riordino">Riordino</option>
              <option value="altro">Altro</option>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingEvent && (
            <Button
              color="error"
              onClick={() => handleDeleteEvent(editingEvent)}
              disabled={loading}
            >
              Elimina
            </Button>
          )}
          <Button onClick={() => setShowEventDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSaveEvent}
            variant="contained"
            disabled={loading || !eventForm.title || !eventForm.date}
          >
            {editingEvent ? 'Aggiorna' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 