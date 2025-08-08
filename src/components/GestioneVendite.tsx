import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  Chip,
  Stack,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import AddCardIcon from '@mui/icons-material/AddCard';
import SummarizeIcon from '@mui/icons-material/Summarize';
import EventIcon from '@mui/icons-material/Event';
import { apiService, type OrdineVendita, type DdtVendita, type FatturaVendita, type NotaCreditoVendita, type Cliente } from '../lib/apiService';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <Box sx={{
      p: 2.5,
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${color}22`,
      position: 'relative'
    }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{subtitle || title}</Typography>
    </Box>
  );
}

export default function GestioneVendite() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ordini, setOrdini] = React.useState<OrdineVendita[]>([]);
  const [ddt, setDdt] = React.useState<DdtVendita[]>([]);
  const [fatture, setFatture] = React.useState<FatturaVendita[]>([]);
  const [scadenziario, setScadenziario] = React.useState<Array<{ fattura_id: number; numero_fattura: string; cliente_nome: string; totale: number; incassato: number; residuo: number; data_fattura: string }>>([]);
  const [noteCredito, setNoteCredito] = React.useState<NotaCreditoVendita[]>([]);
  const [clienti, setClienti] = React.useState<Cliente[]>([]);
  const [dialogIncasso, setDialogIncasso] = React.useState<{ open: boolean; fattura?: FatturaVendita | null; importo: string }>({ open: false, fattura: null, importo: '' });
  const [dialogOrdine, setDialogOrdine] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string; sconto: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0', sconto: '0' }] });
  const [dialogDDT, setDialogDDT] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
  const [dialogFattura, setDialogFattura] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });

  const colors = {
    primary: '#f59e0b',
    sales: '#7c3aed',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(148, 163, 184, 0.25)'
  };

  const loadAll = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [o, d, f, s, nc, cl] = await Promise.all([
        apiService.getOrdiniVendita(),
        apiService.getDDTVendita(),
        apiService.getFattureVendita(),
        apiService.getScadenziarioClienti(),
        apiService.getNoteCreditoVendita(),
        apiService.getClienti()
      ]);
      setOrdini(o);
      setDdt(d);
      setFatture(f);
      setScadenziario(s);
      setNoteCredito(nc);
      setClienti(cl);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dati vendite');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleGeneraFattura = async (id: number) => {
    try {
      setLoading(true);
      await apiService.generaFatturaVenditaDaDDT(id);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore generazione fattura');
    } finally {
      setLoading(false);
    }
  };

  const handleStampaDDT = async (id: number) => {
    try {
      const [{ ddt: d, righe }, gruppi, prodotti, colori, altezze, imballi] = await Promise.all([
        apiService.getDDTVenditaById(id),
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getAltezze(),
        apiService.getImballaggi()
      ]);
      const gMap = new Map(gruppi.map((x:any)=>[x.id, x.nome]));
      const pMap = new Map(prodotti.map((x:any)=>[x.id, x.nome]));
      const cMap = new Map(colori.map((x:any)=>[x.id, x.nome]));
      const aMap = new Map(altezze.map((x:any)=>[x.id, x.cm]));
      const iMap = new Map(imballi.map((x:any)=>[x.id, x.nome]));
      const w = window.open('', '_blank');
      if (!w) return;
      const rows = (righe || [])
        .map((r: any) => {
          const gruppo = gMap.get(r.gruppo_id) || '';
          const prodotto = pMap.get(r.prodotto_id) || '';
          const colore = cMap.get(r.colore_id) || '';
          const altezza = aMap.get(r.altezza_id) || '';
          const imballo = iMap.get(r.imballo_id) || '';
          const titolo = `${String(gruppo).toUpperCase()} - ${String(prodotto).toUpperCase()}`;
          const sotto = `${colore} • ${altezza}${altezza ? 'cm' : ''} • ${imballo}`;
          return `<tr>
            <td>
              <div style="font-weight:700">${titolo}</div>
              <div style="color:#64748b;font-size:12px">${sotto}</div>
            </td>
            <td>${r.quantita}</td>
            <td>${r.prezzo_unitario ?? r.prezzo_finale ?? ''}</td>
            <td>${r.iva_percentuale ?? 0}%</td>
          </tr>`;
        })
        .join('');
      w.document.write(`
        <html><head><title>DDT ${d.numero_ddt || d.id}</title>
        <style>
          body{font-family:Arial;padding:24px}
          h1{margin:0 0 8px}
          .muted{color:#64748b}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top}
          thead th{background:#f8fafc}
        </style>
        </head><body>
        <h1>DDT ${d.numero_ddt || d.id}</h1>
        <div class="muted">Data: ${d.data_ddt} • Cliente: ${d.cliente_nome || d.cliente_id || ''}</div>
        <div class="muted">Destinazione: ${d.destinazione || '-'} • Spedizioniere: ${d.spedizioniere || '-'}</div>
        <table>
          <thead><tr><th>Articolo</th><th>Qta</th><th>Prezzo</th><th>IVA</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload=()=>window.print()</script>
        </body></html>`);
      w.document.close();
    } catch (e) {
      alert('Errore stampa DDT');
    }
  };

  const handleEliminaFattura = async (id: number) => {
    if (!confirm('Eliminare la fattura selezionata?')) return;
    try {
      setLoading(true);
      await apiService.eliminaFatturaVendita(id);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore eliminazione fattura');
    } finally {
      setLoading(false);
    }
  };

  const handleApriIncasso = (f: FatturaVendita) => setDialogIncasso({ open: true, fattura: f, importo: String(f.totale - (f as any).incassato || 0) });
  const handleRegistraIncasso = async () => {
    if (!dialogIncasso.fattura) return;
    const importo = Number(dialogIncasso.importo || 0);
    if (!(importo > 0)) return;
    try {
      setLoading(true);
      await apiService.registraIncassoVendita({
        fattura_id: dialogIncasso.fattura.id,
        data_pagamento: new Date().toISOString().slice(0, 10),
        importo,
        metodo: 'bonifico',
        note: 'Incasso rapido'
      });
      setDialogIncasso({ open: false, fattura: null, importo: '' });
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore registrazione incasso');
    } finally { setLoading(false); }
  };
  const handleCreaOrdine = async () => {
    if (!dialogOrdine.cliente) return;
    const righePayload = dialogOrdine.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      sconto_percentuale: Number(r.sconto || 0)
    }));
    try {
      setLoading(true);
      await apiService.createOrdineVendita({
        cliente_id: dialogOrdine.cliente.id,
        data_ordine: dialogOrdine.data,
        stato: 'bozza',
        sconto_percentuale: 0,
        note: dialogOrdine.note
      } as any, righePayload as any);
      setDialogOrdine({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0', sconto: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione ordine'); } finally { setLoading(false); }
  };
  const handleCreaDDT = async () => {
    if (!dialogDDT.cliente) return;
    const righePayload = dialogDDT.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      prezzo_finale: Number(r.prezzo || 0)
    }));
    try {
      setLoading(true);
      await apiService.createDDTVendita({
        cliente_id: dialogDDT.cliente.id,
        data_ddt: dialogDDT.data,
        stato: 'da_fatturare',
        note: dialogDDT.note
      } as any, righePayload as any);
      setDialogDDT({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione DDT'); } finally { setLoading(false); }
  };
  const handleCreaFattura = async () => {
    if (!dialogFattura.cliente) return;
    const righePayload = dialogFattura.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      prezzo_finale: Number(r.prezzo || 0)
    }));
    try {
      setLoading(true);
      await apiService.createFatturaVendita({
        cliente_id: dialogFattura.cliente.id,
        data_fattura: dialogFattura.data,
        stato: 'non_pagata',
        imponibile: 0,
        iva: 0,
        totale: righePayload.reduce((s, r) => s + (r.quantita * r.prezzo_finale), 0),
        note: dialogFattura.note
      } as any, righePayload as any);
      setDialogFattura({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione fattura'); } finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.text }}>Gestione Vendite</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>Ordini, DDT, Fatture e Incassi</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/vendite/nuova-fattura')} variant="contained" sx={{
            bgcolor: colors.sales,
            borderRadius: 0,
            color: 'white',
            '&:hover': { bgcolor: '#6d28d9' }
          }}>Nuova Fattura</Button>
          <Button onClick={() => navigate('/vendite/nuovo-ddt')} variant="outlined" sx={{
            borderColor: colors.sales,
            color: colors.sales,
            borderRadius: 0,
            '&:hover': { borderColor: '#6d28d9', bgcolor: '#7c3aed14' }
          }}>Nuovo DDT</Button>
          <Button onClick={() => navigate('/vendite/nuovo-ordine')} variant="outlined" sx={{
            borderColor: colors.border,
            color: colors.text,
            borderRadius: 0,
            '&:hover': { bgcolor: '#00000007' }
          }}>Nuovo Ordine</Button>
          <Button onClick={() => navigate('/vendite/nuovo-reso')} variant="outlined" sx={{
            borderColor: colors.border,
            color: colors.text,
            borderRadius: 0,
            '&:hover': { bgcolor: '#00000007' }
          }} startIcon={<AssignmentReturnIcon />}>Reso/NC</Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><StatCard title="Ordini aperti" value={ordini.filter(o => o.stato !== 'annullato' && o.stato !== 'fatturato').length} color={colors.primary} /></Grid>
        <Grid item xs={12} md={3}><StatCard title="DDT da fatturare" value={ddt.filter(x => x.stato === 'da_fatturare').length} color="#0ea5e9" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Fatture" value={fatture.length} color="#10b981" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Residuo da incassare" value={scadenziario.reduce((s,x)=>s+(x.residuo||0),0).toFixed(2)} color="#ef4444" /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 0, border: `1px solid ${colors.border}` }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 1.75,
              minHeight: 'auto',
              fontWeight: 600,
              fontSize: '0.92rem',
              textTransform: 'none',
              color: colors.textSecondary,
              transition: 'all 0.25s ease',
              borderRight: `1px solid ${colors.border}`,
              borderRadius: 0,
              '&.Mui-selected': {
                color: colors.text,
                fontWeight: 700,
                background: `${colors.primary}14`,
                outline: `2px solid ${colors.primary}`,
                outlineOffset: '-2px'
              },
              '&:hover': { color: colors.text, background: `${colors.primary}10` }
            },
            '& .MuiTabs-indicator': { display: 'none' }
          }}
        >
          <Tab icon={<PointOfSaleIcon />} iconPosition="start" label="Preventivi/Ordini" />
          <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Picking & DDT" />
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Fatture" />
          <Tab icon={<PaidIcon />} iconPosition="start" label="Incassi" />
          <Tab icon={<AssignmentReturnIcon />} iconPosition="start" label="Resi / Note di credito" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {loading && <CircularProgress size={24} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {tab === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Ordini cliente</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordini.map(o => (
                    <TableRow key={o.id} hover>
                      <TableCell>{o.numero_ordine || o.id}</TableCell>
                      <TableCell>{o.data_ordine}</TableCell>
                      <TableCell>{o.cliente_nome || o.cliente_id}</TableCell>
                      <TableCell><Chip size="small" label={o.stato} sx={{ borderRadius: 0 }} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Apri">
                            <PointOfSaleIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Picking e DDT</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ddt.map(d => (
                    <TableRow key={d.id} hover>
                      <TableCell>{d.numero_ddt || d.id}</TableCell>
                      <TableCell>{d.data_ddt}</TableCell>
                      <TableCell>{d.cliente_nome || d.cliente_id}</TableCell>
                      <TableCell><Chip size="small" label={d.stato} sx={{ borderRadius: 0 }} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Stampa DDT" onClick={() => handleStampaDDT(d.id)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <Button size="small" variant="outlined" onClick={()=>navigate(`/vendite/nuovo-ddt?id=${d.id}`)} sx={{ borderRadius:0 }}>Apri</Button>
                          <IconButton size="small" title="Genera Fattura" onClick={() => handleGeneraFattura(d.id)} disabled={d.stato !== 'da_fatturare'}>
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Fatture vendita</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fatture.map(f => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.numero_fattura || f.id}</TableCell>
                      <TableCell>{f.data_fattura}</TableCell>
                      <TableCell>{f.cliente_nome || f.cliente_id}</TableCell>
                      <TableCell align="right">€ {Number(f.totale || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip size="small" label={f.stato} sx={{ borderRadius: 0 }} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Registra Incasso" onClick={() => handleApriIncasso(f)}>
                            <AddCardIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="PDF/Export" onClick={() => {
                            const w = window.open('', '_blank');
                            if (!w) return;
                            w.document.write(`<html><head><title>Fattura ${f.numero_fattura||f.id}</title></head><body><h1>Fattura ${f.numero_fattura||f.id}</h1><p>Cliente: ${f.cliente_nome||f.cliente_id}</p><p>Data: ${f.data_fattura}</p><p>Totale: € ${Number(f.totale||0).toFixed(2)}</p><script>window.onload=()=>window.print()</script></body></html>`);
                            w.document.close();
                          }}>
                            <SummarizeIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Invia Email" onClick={() => {
                            const subject = encodeURIComponent(`Fattura ${f.numero_fattura||f.id}`);
                            const body = encodeURIComponent(`Buongiorno,\n\nLe inviamo il riepilogo della fattura ${f.numero_fattura||f.id} del ${f.data_fattura}.\nTotale: € ${Number(f.totale||0).toFixed(2)}\n\nCordiali saluti.`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}>
                            <EmailIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Elimina" onClick={() => handleEliminaFattura(f.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Incassi</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N. Fattura</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell align="right">Incassato</TableCell>
                    <TableCell align="right">Residuo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scadenziario.map(r => (
                    <TableRow key={r.fattura_id} hover>
                      <TableCell>{r.numero_fattura}</TableCell>
                      <TableCell>{r.data_fattura}</TableCell>
                      <TableCell>{r.cliente_nome}</TableCell>
                      <TableCell align="right">€ {Number(r.totale || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">€ {Number(r.incassato || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">€ {Number(r.residuo || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 4 && (
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Resi e Note di credito</Typography>
                <Button size="small" variant="outlined" startIcon={<AssignmentReturnIcon />} onClick={()=>navigate('/vendite/nuovo-reso')} sx={{ borderRadius: 0 }}>Nuovo Reso/NC</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N. Nota</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {noteCredito.map(n => (
                    <TableRow key={n.id} hover>
                      <TableCell>{n.numero_nota || n.id}</TableCell>
                      <TableCell>{n.data_nota}</TableCell>
                      <TableCell>{n.cliente_nome || n.cliente_id}</TableCell>
                      <TableCell align="right">€ {Number(n.totale || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip size="small" label={n.stato} sx={{ borderRadius: 0 }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Fatturazione differita */}
      <Box sx={{ mt: 2, display: tab===1 ? 'block':'none' }}>
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${colors.border}` }}>
          <Stack direction={{ xs:'column', md:'row' }} spacing={1} alignItems={{ md:'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.text }}>Fatturazione differita</Typography>
            <TextField size="small" label="Anno" defaultValue={new Date().getFullYear()} id="diff-anno" />
            <TextField size="small" label="Mese (1-12)" defaultValue={new Date().getMonth()+1} id="diff-mese" />
            <Autocomplete size="small" options={clienti} getOptionLabel={(o)=>o.nome||''} onChange={(_,v:any)=>((window as any).__diffCliente=v)} renderInput={(p)=><TextField {...p} label="Cliente (opzionale)" />} sx={{ minWidth: 260 }} />
            <Button variant="outlined" startIcon={<EventIcon />} sx={{ borderRadius: 0 }} onClick={async()=>{
              const anno = Number((document.getElementById('diff-anno') as HTMLInputElement)?.value||0);
              const mese = Number((document.getElementById('diff-mese') as HTMLInputElement)?.value||0);
              const cliente = (window as any).__diffCliente; 
              try {
                await apiService.generaFattureDifferite(anno,mese,cliente?.id);
                await loadAll();
                alert('Fatture differite generate');
              } catch(e:any){ alert(e.message||'Errore fatturazione differita'); }
            }}>Genera fatture</Button>
          </Stack>
        </Paper>
      </Box>

      <Dialog open={dialogIncasso.open} onClose={() => setDialogIncasso({ open: false, fattura: null, importo: '' })}>
        <DialogTitle>Registra incasso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Fattura: {dialogIncasso.fattura?.numero_fattura}</Typography>
          <TextField
            fullWidth
            label="Importo"
            type="number"
            value={dialogIncasso.importo}
            onChange={(e) => setDialogIncasso(v => ({ ...v, importo: e.target.value }))}
            inputProps={{ step: '0.01', min: '0' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogIncasso({ open: false, fattura: null, importo: '' })}>Annulla</Button>
          <Button variant="contained" onClick={handleRegistraIncasso} sx={{ borderRadius: 0 }}>Conferma</Button>
        </DialogActions>
      </Dialog>

      {/* Nuovo Ordine */}
      <Dialog open={dialogOrdine.open} onClose={() => setDialogOrdine(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuovo Ordine</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogOrdine.cliente}
            onChange={(_, val) => setDialogOrdine(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogOrdine.data} onChange={(e)=>setDialogOrdine(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogOrdine.note} onChange={(e)=>setDialogOrdine(v=>({...v,note:e.target.value}))} />
          {dialogOrdine.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
              <TextField label="Sconto %" type="number" value={r.sconto} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], sconto: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogOrdine(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0', sconto:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogOrdine(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaOrdine} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Nuovo DDT */}
      <Dialog open={dialogDDT.open} onClose={() => setDialogDDT(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuovo DDT</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogDDT.cliente}
            onChange={(_, val) => setDialogDDT(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogDDT.data} onChange={(e)=>setDialogDDT(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogDDT.note} onChange={(e)=>setDialogDDT(v=>({...v,note:e.target.value}))} />
          {dialogDDT.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogDDT(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogDDT(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogDDT(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogDDT(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaDDT} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Nuova Fattura */}
      <Dialog open={dialogFattura.open} onClose={() => setDialogFattura(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuova Fattura</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogFattura.cliente}
            onChange={(_, val) => setDialogFattura(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogFattura.data} onChange={(e)=>setDialogFattura(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogFattura.note} onChange={(e)=>setDialogFattura(v=>({...v,note:e.target.value}))} />
          {dialogFattura.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogFattura(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogFattura(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogFattura(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogFattura(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaFattura} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


