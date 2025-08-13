import React from 'react';
import { Box, Paper, Typography, TextField, Grid, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress } from '@mui/material';
import { apiService } from '../../lib/apiService';
import RefreshIcon from '@mui/icons-material/Refresh';

type Movimento = {
  id: number;
  tipo: string;
  data: string;
  quantita: number;
  valore_totale?: number;
  ddt_numero?: string | null;
  fattura_numero?: string | null;
  cliente_nome?: string | null;
  fornitore_nome?: string | null;
  note?: string | null;
  created_at: string;
};

const colors = {
  text: '#1e293b',
  textSecondary: '#64748b',
  border: 'rgba(148, 163, 184, 0.25)'
};

function isAnnullamento(m: Movimento): boolean {
  const n = (m.note || '').toLowerCase();
  return n.includes('annullamento') || n.includes('rientro da annullamento') || n.includes('annullata');
}

const LogMovimenti: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Movimento[]>([]);
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');

  const load = React.useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const all = await apiService.getMovimentiMagazzino({});
      const filtered = (all as any[]).filter(m => isAnnullamento(m));
      setRows(filtered as any);
    } catch (e: any) {
      setError(e.message || 'Errore caricamento log movimenti');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const dateFiltered = rows.filter(r => {
    if (dateFrom && (r.data < dateFrom)) return false;
    if (dateTo && (r.data > dateTo)) return false;
    return true;
  });

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${colors.border}`, borderRadius: 0, mb: 2 }}>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.text }}>Log movimenti (annullamenti)</Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ borderRadius: 0 }}>Aggiorna</Button>
        </Box>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Data da" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Data a" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          </Grid>
        </Grid>
      </Paper>
      {loading && <CircularProgress size={24} />}
      {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
      <Paper elevation={0} sx={{ border: `1px solid ${colors.border}`, borderRadius: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Cliente/Fornitore</TableCell>
              <TableCell>Quantità</TableCell>
              <TableCell>Valore</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dateFiltered.map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(m.data).toLocaleDateString('it-IT')}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(m.created_at).toLocaleTimeString('it-IT')}</Typography>
                </TableCell>
                <TableCell>
                  {m.fattura_numero ? (
                    <Chip size="small" label={`Fattura ${m.fattura_numero}`} sx={{ borderRadius: 0 }} />
                  ) : m.ddt_numero ? (
                    <Chip size="small" label={`DDT ${m.ddt_numero}`} color="info" variant="outlined" sx={{ borderRadius: 0 }} />
                  ) : (
                    <Chip size="small" label="—" variant="outlined" sx={{ borderRadius: 0 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{m.cliente_nome || m.fornitore_nome || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>+{m.quantita}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{m.valore_totale ? `€ ${m.valore_totale.toFixed(2)}` : '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{m.note || '—'}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default LogMovimenti;


