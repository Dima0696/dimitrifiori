import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Switch, Snackbar, Alert, Divider } from '@mui/material';
import { apiService } from '../lib/apiService';

 type Settings = {
  is_online: boolean;
  base_url: string | null;
  allow_guest: boolean;
  listino_default: 'L1' | 'L2' | 'L3';
  homepage_banner: string | null;
  theme_primary: string;
};

export default function Webshop() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    (async () => {
      try {
        const s = await apiService.getWebshopSettings();
        setSettings({
          is_online: !!s.is_online,
          base_url: s.base_url || '',
          allow_guest: !!s.allow_guest,
          listino_default: (s.listino_default || 'L1') as 'L1' | 'L2' | 'L3',
          homepage_banner: s.homepage_banner || '',
          theme_primary: s.theme_primary || '#f59e0b',
        });
      } catch (e) {
        setSnackbar({ open: true, message: 'Errore nel caricamento impostazioni', severity: 'error' });
      }
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiService.updateWebshopSettings({
        is_online: settings.is_online,
        base_url: settings.base_url || null,
        allow_guest: settings.allow_guest,
        listino_default: settings.listino_default,
        homepage_banner: settings.homepage_banner || null,
        theme_primary: settings.theme_primary,
      });
      setSnackbar({ open: true, message: 'Impostazioni salvate', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Errore nel salvataggio', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6">Webshop • Impostazioni</Typography>
          <Typography variant="body2" sx={{ color: 'grey.600' }}>Caricamento…</Typography>
          </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Webshop • Impostazioni Next.js</Typography>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>Controlla stato online, URL e preferenze di accesso</Typography>
        </Box>
          <Stack direction="row" gap={1}>
            {settings.base_url && settings.is_online && (
              <Button variant="outlined" onClick={() => window.open(settings.base_url as string, '_blank')}>Apri Webshop</Button>
            )}
            <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
                    </Stack>
                    </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'grey.200', mb: 2 }}>
        <Stack spacing={2}>
                          <FormControlLabel
            control={<Switch checked={settings.is_online} onChange={(e) => setSettings(s => s ? ({ ...s, is_online: e.target.checked }) : s)} />}
            label="Webshop online"
          />

          <TextField label="URL Webshop (Next.js su Vercel)" value={settings.base_url || ''} onChange={(e) => setSettings(s => s ? ({ ...s, base_url: e.target.value }) : s)} fullWidth />

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <FormControl fullWidth>
              <InputLabel>Listino di default</InputLabel>
              <Select label="Listino di default" value={settings.listino_default} onChange={(e) => setSettings(s => s ? ({ ...s, listino_default: e.target.value as any }) : s)}>
                <MenuItem value="L1">L1</MenuItem>
                <MenuItem value="L2">L2</MenuItem>
                <MenuItem value="L3">L3</MenuItem>
                </Select>
              </FormControl>
            <FormControlLabel
              control={<Switch checked={settings.allow_guest} onChange={(e) => setSettings(s => s ? ({ ...s, allow_guest: e.target.checked }) : s)} />}
              label="Consenti navigazione ospite (senza login)"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <TextField label="Colore tema (hex)" value={settings.theme_primary} onChange={(e) => setSettings(s => s ? ({ ...s, theme_primary: e.target.value }) : s)} fullWidth />
            <Box sx={{ width: 64, height: 40, borderRadius: 1, border: '1px solid #e5e7eb', bgcolor: settings.theme_primary }} />
          </Stack>

          <TextField label="Banner homepage (testo)" value={settings.homepage_banner || ''} onChange={(e) => setSettings(s => s ? ({ ...s, homepage_banner: e.target.value }) : s)} fullWidth multiline minRows={2} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: '1px dashed', borderColor: 'grey.300' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Istruzioni deploy Next.js</Typography>
        <Typography variant="body2" sx={{ color: 'grey.700' }}>
          1) Crea un progetto Next.js su Vercel collegando Supabase. 2) Imposta l'URL qui sopra. 3) Metti online con il toggle. 4) Questo gestionale controllerà tema e accesso.
                    </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ color: 'grey.600' }}>
          Nota: il listino di default e il tema verranno letti dal tuo sito Next.js tramite Supabase, per mostrare prezzi e stile coerenti.
              </Typography>
            </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 
